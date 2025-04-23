const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const axios = require('axios');
const arduinoIP = "192.168.64.140"; // Adresse IP de l'Arduino sur le réseau   
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
app.post('/api/led', async (req, res) => {
    const { color } = req.body; // Ex: { "color": "red" }
    console.log("caca couleur caca ")

    if (!["red", "green", "blue"].includes(color)) {
        return res.status(400).json({ error: "Couleur invalide" });
    }
    const url = `${arduinoIP}/color=${color}`;
    console.log("caca couleur caca ")

    try {
        await axios.get(url);
        res.json({ message: `LED RGB changée en ${color}` });
    } catch (error) {
        res.status(500).json({ error: "Erreur de connexion avec l'Arduino" });
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



// ➤ 🔒 Limiter l'ajout de messages (5 par minute max)
app.post('/api/messages', (req, res) => {
    const { contenu, idutilisateur } = req.body;

    if (!contenu || !idutilisateur) {
        return res.status(400).json({ error: "Contenu et id utilisateur sont requis" });
    }

    // Vérifier le nombre de messages envoyés par l'utilisateur dans la dernière minute
    const checkRateLimit = `
        SELECT COUNT(*) AS count 
        FROM message 
        WHERE idutilisateur = ? 
        AND idCategorie = 1
        AND date = CURDATE() 
        AND heure > SUBTIME(CURTIME(), '00:01:00')
    `;

    bddConnection.query(checkRateLimit, [idutilisateur], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result[0].count >= 5) {
            return res.status(429).json({ error: "Trop de messages envoyés, veuillez attendre." });
        }

        // Ajouter le message
        const query = "INSERT INTO message (contenu, idutilisateur, date, heure,idCategorie) VALUES (?, ?, CURDATE(), CURTIME(),1)";
        bddConnection.query(query, [contenu, idutilisateur], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Message envoyé avec succès", id: result.insertId });
        });
    });
});

// ➤ 🔒 Limiter l'ajout de messages (5 par minute max)
app.post('/api/addMessageByCategorieId', (req, res) => {
    const { contenu, idutilisateur , idCategorie} = req.body;

    if (!contenu || !idutilisateur) {
        return res.status(400).json({ error: "Contenu et id utilisateur sont requis" });
    }

    // Vérifier le nombre de messages envoyés par l'utilisateur dans la dernière minute
    const checkRateLimit = `
        SELECT COUNT(*) AS count 
        FROM message 
        WHERE idutilisateur = ? 
        AND idCategorie = ?
        AND date = CURDATE() 
        AND heure > SUBTIME(CURTIME(), '00:01:00')
    `;

    bddConnection.query(checkRateLimit, [idutilisateur,idCategorie], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result[0].count >= 5) {
            return res.status(429).json({ error: "Trop de messages envoyés, veuillez attendre." });
        }

        // Ajouter le message
        const query = "INSERT INTO message (contenu, idutilisateur, date, heure,idCategorie) VALUES (?, ?, CURDATE(), CURTIME(),?)";
        bddConnection.query(query, [contenu, idutilisateur,idCategorie], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Message envoyé avec succès", id: result.insertId });
        });
    });
});



app.get('/api/recuperation', (req, res) => {
    const query = `
        SELECT message.id, message.contenu, message.date, message.heure, 
               utilisateur.nom, utilisateur.prenom 
        FROM message 
        JOIN utilisateur ON message.idutilisateur = utilisateur.idutilisateur
        WHERE idCategorie = 1
        ORDER BY message.date DESC, message.heure DESC
    `;

    bddConnection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ➤ Récupérer les messages par catégoruy
app.get('/api/recuperationByCategorieId', (req, res) => {
    const { idCategorie } = req.body;
    
    if (!idCategorie) {
        return res.status(400).json({ error: 'L\'id de la catégorie est requis.' });
    }

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
    bddConnection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ➤ Récupérer une catégorie par ID
app.get('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Categorie WHERE id = ?';
    bddConnection.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
        res.json(results[0]);
    });
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
    
    const query = 'UPDATE Categorie SET nom = ? WHERE id = ?';
    bddConnection.query(query, [nom, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
        res.json({ message: 'Catégorie mise à jour avec succès' });
    });
});

// ➤ Supprimer une catégorie
app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM Categorie WHERE id = ?';
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