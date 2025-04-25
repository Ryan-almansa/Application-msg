const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 20000;

app.use(express.json());
app.use(cors());

const bddConnection = mysql.createConnection({
    host: process.env.DB_HOST,  
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});

bddConnection.connect(err => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
        return;
    }
    console.log("✅ Connexion réussie à la base de données");
});
  

// ➤ API pour allumer ou éteindre les LEDs
app.post('/api/red', async (req, res) => {
    try{
        await fetch('http://192.168.65.140/led/red');
        res.json({success: isValid, message});
    }
    catch(err){
        console.log("err")
    }
});











// ➤ 🔒 Limiter l'ajout d'un utilisateur
app.post('/api/addutilisateur', (req, res) => {
    const { nom, prenom } = req.body;

    if (!nom || !prenom) {
        return res.status(400).json({ error: "Nom et prénom sont requis." });
    }

    // Vérifier le nombre d'utilisateurs déjà inscrits
    bddConnection.query("SELECT COUNT(*) AS count FROM utilisateur", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result[0].count >= 100) {
            return res.status(403).json({ error: "Limite d'utilisateurs atteinte." });
        }

        // Vérifier si l'utilisateur existe déjà
        const checkQuery = "SELECT * FROM utilisateur WHERE nom = ? AND prenom = ?";
        bddConnection.query(checkQuery, [nom, prenom], (err, users) => {
            if (err) return res.status(500).json({ error: err.message });

            if (users.length > 0) {
                return res.status(409).json({ error: "Utilisateur déjà existant." });
            }

            // Ajouter l'utilisateur
            const query = "INSERT INTO utilisateur (nom, prenom) VALUES (?, ?)";
            bddConnection.query(query, [nom, prenom], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Utilisateur ajouté avec succès", id: result.insertId });
            });
        });
    });
});

// ➤ 2️⃣ Récupérer la liste des utilisateurs
app.get('/api/getutilisateur', (req, res) => {
    bddConnection.query("SELECT * FROM utilisateur", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            users: results.map(user => ({
                idutilisateur: user.idutilisateur,
                nom: user.nom,
                prenom: user.prenom
            }))
        });
    });
});

// ➤ 🔒 Ajouter un message à la catégorie par défaut
app.post('/api/messages', (req, res) => {
    // Extraction avec valeur par défaut - la catégorie 1 sera utilisée si non spécifiée
    const { contenu, idutilisateur } = req.body;
    const idCategorie = req.body.idCategorie || 1; // Valeur par défaut = 1

    if (!contenu || !idutilisateur) {
        return res.status(400).json({ error: "Contenu et id utilisateur sont requis" });
    }

    // Vérification de la limite de messages
    const checkRateLimit = `
        SELECT COUNT(*) AS count 
        FROM message 
        WHERE idutilisateur = ? 
        AND idCategorie = ?
        AND date = CURDATE() 
        AND heure > SUBTIME(CURTIME(), '00:01:00')
    `;

    bddConnection.query(checkRateLimit, [idutilisateur, idCategorie], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result[0].count >= 5) {
            return res.status(429).json({ error: "Trop de messages envoyés, veuillez attendre." });
        }

        // Insertion avec idCategorie explicite
        const query = "INSERT INTO message (contenu, idutilisateur, date, heure, idCategorie) VALUES (?, ?, CURDATE(), CURTIME(), ?)";
        
        bddConnection.query(query, [contenu, idutilisateur, idCategorie], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Message envoyé avec succès", id: result.insertId });
        });
    });
});

// ➤ Récupérer les messages (tous ou par catégorie)
app.get('/api/recuperation', (req, res) => {
    const idCategorie = req.query.categorie || 1; // Utiliser la catégorie par défaut si non spécifiée
    
    const query = `
        SELECT message.id, message.contenu, message.date, message.heure, 
               utilisateur.nom, utilisateur.prenom 
        FROM message 
        JOIN utilisateur ON message.idutilisateur = utilisateur.idutilisateur
        WHERE message.idCategorie = ?
        ORDER BY message.date DESC, message.heure DESC
    `;

    bddConnection.query(query, [idCategorie], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ➤ Récupérer toutes les catégories
app.get('/api/categories', (req, res) => {
    const query = 'SELECT * FROM Categorie';
    try{
        bddConnection.query(query, (err, results) => {
            if (err) {
                console.error('Erreur SQL:\n', err)
                return res.status(500).json({ error: err.message });
            }
            res.json({ categories: results });
        });
    } catch (err) {
        console.error(err);
    }
});

// ➤ Récupérer une catégorie par ID
app.get('/api/categories/:id', (req, res) => {
    try{
        const { id } = req.params;
    const query = 'SELECT * FROM Categorie WHERE idcategorie = ?';
    bddConnection.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
        res.json(results[0]);
    });
    }catch(err)
    {
        console.error(err);
    }
    
});

// ➤ Ajouter une nouvelle catégorie
app.post('/api/categories', (req, res) => {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom de la catégorie est requis.' });
    
    const query = 'INSERT INTO Categorie (nom) VALUES (?)';
    bddConnection.query(query, [nom], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, nom });
    });
});

// ➤ Mettre à jour une catégorie
app.put('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom de la catégorie est requis.' });
    
    const query = 'UPDATE Categorie SET nom = ? WHERE idcategorie = ?';
    bddConnection.query(query, [nom, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
        res.json({ message: 'Catégorie mise à jour avec succès' });
    });
});

// ➤ Supprimer une catégorie
app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM Categorie WHERE idcategorie = ?';
    bddConnection.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
        res.json({ message: 'Catégorie supprimée avec succès' });
    });
});

// Gestion de la fermeture propre
process.on('SIGINT', () => {
    bddConnection.end(err => {
        if (err) console.error('Erreur lors de la fermeture de la connexion :', err.message);
        else console.log('🛑 Connexion à la base de données fermée.');
        process.exit();
    });
});

app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://192.168.65.113:${port}`);
});