const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 20000;
const host = '0.0.0.0'; 

app.use(express.json());
app.use(cors());

// Servir les fichiers du dossier public
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Connexion BDD
const bddConnection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'Speaky', // Vérifie que c'est bien le nom dans phpMyAdmin
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || ''
});

bddConnection.connect(err => {
    if (err) console.error('❌ Erreur SQL:', err.message);
    else console.log("✅ Connecté à MySQL");
});

// --- API ROUTES ---

// 1. Inscription
app.post('/api/addutilisateur', (req, res) => {
    const { nom, prenom } = req.body;
    const check = "SELECT idutilisateur FROM utilisateur WHERE nom = ? AND prenom = ?";
    bddConnection.query(check, [nom, prenom], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length > 0) return res.status(409).json({ error: "Utilisateur existe déjà" });

        const insert = "INSERT INTO utilisateur (nom, prenom) VALUES (?, ?)";
        bddConnection.query(insert, [nom, prenom], (err, r) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Succès", id: r.insertId });
        });
    });
});

// 2. Connexion (Récupération liste pour check)
app.get('/api/getutilisateur', (req, res) => {
    bddConnection.query("SELECT * FROM utilisateur", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users: results });
    });
});

// 3. ENVOI DE MESSAGE (La correction est ici)
app.post('/api/messages', (req, res) => {
    console.log("📥 Reçu:", req.body); // Pour voir ce qui arrive
    const { contenu, idutilisateur, idCategorie } = req.body;
    
    // Sécurité : on force 1 si pas de catégorie, mais normalement le front l'envoie
    const catId = idCategorie || 1; 

    if (!contenu || !idutilisateur) {
        return res.status(400).json({ error: "Données manquantes (contenu ou user)" });
    }

    // IMPORTANT : idcategorie (sans underscore)
    const query = "INSERT INTO message (contenu, idutilisateur, date, heure, idcategorie) VALUES (?, ?, CURDATE(), CURTIME(), ?)";
    
    bddConnection.query(query, [contenu, idutilisateur, catId], (err, result) => {
        if (err) {
            console.error("❌ Erreur Insert Message:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log("✅ Message enregistré, ID:", result.insertId);
        res.json({ message: "Envoyé", id: result.insertId });
    });
});

// 4. RÉCUPÉRATION DES MESSAGES (Correction ici aussi)
app.get('/api/recuperation', (req, res) => {
    const idCat = req.query.categorie || 1;
    
    // IMPORTANT : m.idcategorie (sans underscore)
    const query = `
        SELECT m.id, m.contenu, m.heure, m.date, u.nom, u.prenom 
        FROM message m
        JOIN utilisateur u ON m.idutilisateur = u.idutilisateur
        WHERE m.idcategorie = ?
        ORDER BY m.date ASC, m.heure ASC
    `;
    // Note : J'ai mis ASC (Ascendant) pour avoir les messages du plus vieux au plus récent (conversation logique)
    
    bddConnection.query(query, [idCat], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 5. Catégories
app.get('/api/categories', (req, res) => {
    bddConnection.query('SELECT * FROM Categorie', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ categories: results });
    });
});

app.post('/api/categories', (req, res) => {
    const { nom } = req.body;
    bddConnection.query('INSERT INTO Categorie (nom) VALUES (?)', [nom], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, nom });
    });
});

app.listen(port, host, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
});