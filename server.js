const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs'); // Pour crypter les MDP
const jwt = require('jsonwebtoken'); // Pour les tokens
require('dotenv').config();

const app = express();
const port = process.env.PORT || 20000;

// Config pour accepter les images (taille max 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Connexion BDD (Utilise les infos du fichier .env)
const bddConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});

bddConnection.connect(err => {
    if (err) console.error('❌ Erreur SQL (.env incorrect ?):', err.message);
    else console.log("✅ Connecté à MySQL");
});

// --- SÉCURITÉ : Vérification du Token ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer LE_TOKEN"

    if (!token) return res.status(401).json({ error: "Token manquant" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token invalide" });
        req.user = user;
        next();
    });
}

// --- API ROUTES ---

// 1. INSCRIPTION (Nouveau compte)
app.post('/api/register', (req, res) => {
    const { nom, prenom, password } = req.body;
    if (!nom || !prenom || !password) return res.status(400).json({ error: "Tout remplir !" });

    // On crypte le mot de passe
    const hashedPassword = bcrypt.hashSync(password, 8);

    const insert = "INSERT INTO utilisateur (nom, prenom, password) VALUES (?, ?, ?)";
    bddConnection.query(insert, [nom, prenom, hashedPassword], (err, r) => {
        if (err) return res.status(500).json({ error: "Erreur ou utilisateur déjà pris" });
        res.json({ message: "Succès" });
    });
});

// 2. CONNEXION (Login)
app.post('/api/login', (req, res) => {
    const { nom, prenom, password } = req.body;

    const query = "SELECT * FROM utilisateur WHERE nom = ? AND prenom = ?";
    bddConnection.query(query, [nom, prenom], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "Inconnu" });

        const user = results[0];
        // On vérifie le mot de passe crypté
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: "Mauvais mot de passe" });
        }

        // On génère le Token secret
        const token = jwt.sign({ id: user.idutilisateur, nom: user.nom }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Mise à jour "En ligne"
        bddConnection.query("UPDATE utilisateur SET last_seen = NOW() WHERE idutilisateur = ?", [user.idutilisateur]);

        res.json({ auth: true, token: token, userId: user.idutilisateur, nom: user.nom });
    });
});

// 3. ENVOYER MESSAGE (Protégé)
app.post('/api/messages', authenticateToken, (req, res) => {
    const { contenu, image, idCategorie } = req.body;
    const userId = req.user.id; // L'ID vient du Token (sécurisé)
    
    // On met à jour la présence
    bddConnection.query("UPDATE utilisateur SET last_seen = NOW() WHERE idutilisateur = ?", [userId]);

    const query = "INSERT INTO message (contenu, image, idutilisateur, date, heure, idcategorie) VALUES (?, ?, ?, CURDATE(), CURTIME(), ?)";
    bddConnection.query(query, [contenu, image, userId, idCategorie || 1], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Envoyé" });
    });
});

// 4. LIRE MESSAGES
app.get('/api/recuperation', (req, res) => {
    const idCat = req.query.categorie || 1;
    // Petit hack pour mettre à jour la présence quand on lit les messages
    if(req.query.userId && req.query.userId !== 'null') {
         bddConnection.query("UPDATE utilisateur SET last_seen = NOW() WHERE idutilisateur = ?", [req.query.userId]);
    }

    const query = `
        SELECT m.id, m.contenu, m.image, m.heure, m.date, u.nom, u.prenom, m.idutilisateur
        FROM message m
        JOIN utilisateur u ON m.idutilisateur = u.idutilisateur
        WHERE m.idcategorie = ?
        ORDER BY m.date ASC, m.heure ASC
    `;
    bddConnection.query(query, [idCat], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 5. QUI EST EN LIGNE ?
app.get('/api/getutilisateur', (req, res) => {
    const query = `
        SELECT idutilisateur, nom, prenom, 
        (last_seen > NOW() - INTERVAL 15 SECOND) as en_ligne 
        FROM utilisateur ORDER BY en_ligne DESC, nom ASC
    `;
    bddConnection.query(query, (err, results) => res.json({ users: results }));
});

// 6. CATÉGORIES
app.get('/api/categories', (req, res) => {
    bddConnection.query('SELECT * FROM Categorie', (err, results) => res.json({ categories: results }));
});
app.post('/api/categories', (req, res) => {
    bddConnection.query('INSERT INTO Categorie (nom) VALUES (?)', [req.body.nom], (err, r) => res.json({ id: r.insertId }));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Speaky Sécurisé lancé sur le port ${port}`);
});