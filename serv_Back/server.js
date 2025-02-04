const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 20000;

app.use(express.json());
app.use(cors());

// Connexion à la base de données
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

// ====================== Routes API """"""""""""""""======================

// ➤ 1️⃣ Ajouter un utilisateur
app.post('/api/addutilisateur', (req, res) => {
    const { nom, prenom } = req.body;

    if (!nom || !prenom) {
        return res.status(400).json({ error: "Nom et prénom sont requis." });
    }

    const query = `INSERT INTO utilisateur (nom, prenom) VALUES (?, ?)`;

    bddConnection.query(query, [nom, prenom], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Utilisateur ajouté avec succès", id: result.insertId });
    });
});


// ➤ 2️⃣ Récupérer la liste des utilisateurs
app.get('/api/getutilisateur', (req, res) => {
    bddConnection.query("SELECT * FROM utilisateur", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            users: results.map(user => ({
                idutilisateur: user.idutilisateur, // ✅ Assure-toi que l'ID est inclus
                nom: user.nom,
                prenom: user.prenom
            }))
        });
    });
});



// ➤ 3️⃣ Ajouter un message
app.post('/api/messages', (req, res) => {
    const { contenu, idutilisateur } = req.body;
    if (!contenu || !idutilisateur) {
        return res.status(400).json({ error: "Contenu et id utilisateur sont requis" });
    }

    const query = "INSERT INTO message (contenu, idutilisateur, date, heure) VALUES (?, ?, CURDATE(), CURTIME())";
    bddConnection.query(query, [contenu, idutilisateur], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Message envoyé avec succès", id: result.insertId });
    });
});

// ➤ 4️⃣ Récupérer tous les messages
app.get('/api/recuperation', (req, res) => {
    const query = `
        SELECT message.id, message.contenu, message.date, message.heure, 
               utilisateur.nom, utilisateur.prenom 
        FROM message 
        JOIN utilisateur ON message.idutilisateur = utilisateur.idutilisateur
        ORDER BY message.date DESC, message.heure DESC
    `;

    bddConnection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
        
    });
});

// ====================== Gestion de la fermeture ======================

process.on('SIGINT', () => {
    bddConnection.end(err => {
        if (err) console.error('Erreur lors de la fermeture de la connexion :', err.message);
        else console.log('🛑 Connexion à la base de données fermée.');
        process.exit();
    });
});

// ====================== Lancement du serveur ======================

app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://192.168.65.113:${port}`);
});
