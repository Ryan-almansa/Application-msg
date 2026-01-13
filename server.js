const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 20000;
// --- MODIFICATION ICI ---
// On définit l'hôte explicitement
const host = '172.29.19.42'; 

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

// --------------------------------------------------------
// 🧑‍💻 ROUTES UTILISATEUR
// --------------------------------------------------------

// ➤ 🔒 Limiter l'ajout d'un utilisateur
app.post('/api/addutilisateur', (req, res) => {
    const { nom, prenom } = req.body;

    if (!nom || !prenom) {
        return res.status(400).json({ error: "Nom et prénom sont requis." });
    }

    // [AMÉLIORATION] Combinaison des requêtes de vérification
    const checkQuery = "SELECT idutilisateur FROM utilisateur WHERE nom = ? AND prenom = ?";
    bddConnection.query(checkQuery, [nom, prenom], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });

        if (users.length > 0) {
            return res.status(409).json({ error: "Utilisateur déjà existant." });
        }

        // Ajouter l'utilisateur
        const countQuery = "SELECT COUNT(*) AS count FROM utilisateur";
        bddConnection.query(countQuery, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result[0].count >= 100) {
                return res.status(403).json({ error: "Limite d'utilisateurs atteinte." });
            }

            const insertQuery = "INSERT INTO utilisateur (nom, prenom) VALUES (?, ?)";
            bddConnection.query(insertQuery, [nom, prenom], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Utilisateur ajouté avec succès", id: result.insertId });
            });
        });
    });
});

// ➤ 2️⃣ Récupérer la liste des utilisateurs
app.get('/api/getutilisateur', (req, res) => {
    // [AMÉLIORATION] Sélectionner uniquement les champs nécessaires et conserver l'ID
    bddConnection.query("SELECT idutilisateur, nom, prenom FROM utilisateur", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ users: results }); // Le mapping n'est plus nécessaire ici
    });
});


// ➤ 🔒 Ajouter un message
app.post('/api/messages', (req, res) => {
    const { contenu, idutilisateur } = req.body;
    // [RAPPEL NOM FK] Utiliser 'id' comme nom de colonne dans la BD
    const id = req.body.idCategorie || 1; // On récupère toujours du body 'idCategorie', mais on utilise 'id' pour la BD.

    if (!contenu || !idutilisateur) {
        return res.status(400).json({ error: "Contenu et id utilisateur sont requis" });
    }

    // Vérification de l'existence de l'utilisateur (robustesse)
    const checkUserQuery = "SELECT idutilisateur FROM utilisateur WHERE idutilisateur = ?";
    bddConnection.query(checkUserQuery, [idutilisateur], (err, userResult) => {
        if (err) return res.status(500).json({ error: err.message });
        if (userResult.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        // Vérification de la limite de messages
        const checkRateLimit = `
            SELECT COUNT(*) AS count 
            FROM message 
            WHERE idutilisateur = ? 
            AND id = ?  <-- UTILISATION DE id
            AND CONCAT(date, ' ', heure) > SUBTIME(NOW(), '00:01:00')
        `;

        // [CORRECTION] Utilisation de id dans la requête de limite de débit
        bddConnection.query(checkRateLimit, [idutilisateur, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result[0].count >= 5) {
                return res.status(429).json({ error: "Trop de messages envoyés, veuillez attendre 60 secondes." });
            }

            // Insertion avec id explicite
            // [CORRECTION] Utilisation de id dans la requête d'insertion
            const query = "INSERT INTO message (contenu, idutilisateur, date, heure, id) VALUES (?, ?, CURDATE(), CURTIME(), ?)";
            
            bddConnection.query(query, [contenu, idutilisateur, id], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Message envoyé avec succès", id: result.insertId });
            });
        });
    });
});

// ➤ Récupérer les messages (tous ou par catégorie)
app.get('/api/recuperation', (req, res) => {
    const id = req.query.categorie || 1; // [CORRECTION] Utilisation de id
    
    const query = `
        SELECT message.id, message.contenu, message.date, message.heure, 
               utilisateur.nom, utilisateur.prenom 
        FROM message 
        JOIN utilisateur ON message.idutilisateur = utilisateur.idutilisateur
        WHERE message.id = ?  <-- UTILISATION DE id
        ORDER BY message.date DESC, message.heure DESC
    `;

    // [CORRECTION] Utilisation de id dans les paramètres
    bddConnection.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// ➤ Récupérer les messages (tous ou par catégorie)
app.get('/api/recuperation', (req, res) => {
    const idcategorie = req.query.categorie || 1; // [CORRECTION] Utilisation de id_categorie
    
    const query = `
        SELECT message.id, message.contenu, message.date, message.heure, 
               utilisateur.nom, utilisateur.prenom 
        FROM message 
        JOIN utilisateur ON message.idutilisateur = utilisateur.idutilisateur
        WHERE message.id_categorie = ?
        ORDER BY message.date DESC, message.heure DESC
    `;

    // [CORRECTION] Utilisation de id_categorie dans les paramètres
    bddConnection.query(query, [idcategorie], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});



// --------------------------------------------------------
// 🏷️ ROUTES CATÉGORIE
// --------------------------------------------------------

// ➤ Récupérer toutes les catégories
app.get('/api/categories', (req, res) => {
    // [COHÉRENCE] Table 'Categorie' avec C majuscule (conforme à votre image)
    const query = 'SELECT idCategorie, nom FROM Categorie'; 
    bddConnection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur SQL:\n', err)
            return res.status(500).json({ error: err.message });
        }
        res.json({ categories: results });
    });
});

// ➤ Récupérer une catégorie par ID
app.get('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    // [CORRECTION/COHÉRENCE] La colonne ID est souvent 'idCategorie' ou 'id_categorie'. 
    // J'utilise le nom 'idCategorie' avec C majuscule ici, si ça ne marche pas,
    // c'est que la colonne dans la table Categorie est en minuscules (idcategorie) ou 'id_categorie'.
    const query = 'SELECT * FROM Categorie WHERE idCategorie = ?'; 
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
    
    // [AMÉLIORATION] Vérifier si le nom existe déjà avant d'insérer
    bddConnection.query('SELECT nom FROM Categorie WHERE nom = ?', [nom], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            return res.status(409).json({ error: "Cette catégorie existe déjà." });
        }

        const query = 'INSERT INTO Categorie (nom) VALUES (?)';
        bddConnection.query(query, [nom], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, nom });
        });
    });
});

// ➤ Mettre à jour une catégorie
app.put('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom de la catégorie est requis.' });
    
    // [CORRECTION/COHÉRENCE] Utilisation de 'idCategorie'
    const query = 'UPDATE Categorie SET nom = ? WHERE idCategorie = ?'; 
    bddConnection.query(query, [nom, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
        res.json({ message: 'Catégorie mise à jour avec succès' });
    });
});

// ➤ Supprimer une catégorie
app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    
    // [CORRECTION/COHÉRENCE] Utilisation de 'idCategorie'
    const query = 'DELETE FROM Categorie WHERE idCategorie = ?';
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

// On force le serveur à écouter UNIQUEMENT sur cette IP
app.listen(port, host, () => {
    console.log(`🚀 Serveur démarré de manière stricte sur http://${host}:${port}`);
});