const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 20000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const bddConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    charset: 'utf8mb4'
});

bddConnection.connect(err => {
    if (err) console.error('❌ Erreur SQL :', err.message);
    else console.log("✅ Connecté à MySQL (Mode Pro SQL)");
});

const xpCooldowns = {};
const XP_COOLDOWN_TIME = 30000;

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token invalide" });
        req.user = user;
        next();
    });
}

// --- ROUTES ---

// 1. INSCRIPTION
app.post('/api/register', (req, res) => {
    const { nom, prenom, password } = req.body;
    if (!nom || !prenom || !password) return res.status(400).json({ error: "Tout remplir !" });
    const hashedPassword = bcrypt.hashSync(password, 8);
    const insert = "INSERT INTO utilisateur (nom, prenom, password, xp, coins) VALUES (?, ?, ?, 0, 100)";
    bddConnection.query(insert, [nom, prenom, hashedPassword], (err, r) => {
        if (err) return res.status(500).json({ error: "Erreur inscription" });
        res.json({ message: "Succès" });
    });
});

// 2. CONNEXION
app.post('/api/login', (req, res) => {
    const { nom, prenom, password } = req.body;
    const query = "SELECT * FROM utilisateur WHERE nom = ? AND prenom = ?";
    bddConnection.query(query, [nom, prenom], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "Inconnu" });
        const user = results[0];
        if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Mauvais mot de passe" });
        const token = jwt.sign({ id: user.idutilisateur, nom: user.nom }, process.env.JWT_SECRET, { expiresIn: '24h' });
        bddConnection.query("UPDATE utilisateur SET last_seen = NOW() WHERE idutilisateur = ?", [user.idutilisateur]);
        res.json({ auth: true, token: token, userId: user.idutilisateur, nom: user.nom });
    });
});

// 3. MES INFOS (Nouvelle version SQL PRO)
app.get('/api/me', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const sqlUser = "SELECT xp, coins, (FLOOR(xp / 100) + 1) as niveau FROM utilisateur WHERE idutilisateur = ?";
    
    // On récupère TOUT l'inventaire avec le statut équipé
    const sqlInv = "SELECT badge_name, is_equipped FROM inventory WHERE idutilisateur = ?";

    bddConnection.query(sqlUser, [userId], (err, userResult) => {
        if (err) return res.status(500).json({ error: "Erreur SQL" });
        
        bddConnection.query(sqlInv, [userId], (err, invResult) => {
            // Liste des items possédés (pour les colorer en vert)
            const owned = invResult.map(i => i.badge_name);
            // Liste des items équipés (is_equipped = 1)
            const equipped = invResult.filter(i => i.is_equipped === 1).map(i => i.badge_name);
            
            res.json({ 
                ...userResult[0], 
                inventory: owned,
                active_badges: equipped 
            });
        });
    });
});

// 4. MESSAGES + CHEAT CODE
app.post('/api/messages', authenticateToken, (req, res) => {
    const { contenu, image, idCategorie } = req.body;
    const userId = req.user.id;

    if (contenu === '/admin') {
        bddConnection.query("UPDATE utilisateur SET coins = coins + 10000 WHERE idutilisateur = ?", [userId], () => {
            return res.json({ message: "Cheat activé !", xp: 0, coins: 0, isCheat: true });
        });
        return;
    }
    // RESET : Commande pour vider son inventaire si bug
    if (contenu === '/reset') {
        bddConnection.query("UPDATE inventory SET is_equipped = 0 WHERE idutilisateur = ?", [userId], () => {
            return res.json({ message: "Inventaire déséquipé !", xp: 0, coins: 0, isCheat: true });
        });
        return;
    }

    const now = Date.now();
    let gainedXp = 0, gainedCoins = 0;

    if (!xpCooldowns[userId] || now - xpCooldowns[userId] > XP_COOLDOWN_TIME) {
        gainedXp = 10 + Math.floor(Math.random() * 5);
        gainedCoins = 5;
        xpCooldowns[userId] = now;
        bddConnection.query("UPDATE utilisateur SET xp = xp + ?, coins = coins + ?, last_seen = NOW() WHERE idutilisateur = ?", [gainedXp, gainedCoins, userId]);
    } else {
        bddConnection.query("UPDATE utilisateur SET last_seen = NOW() WHERE idutilisateur = ?", [userId]);
    }

    const query = "INSERT INTO message (contenu, image, idutilisateur, date, heure, idcategorie) VALUES (?, ?, ?, CURDATE(), CURTIME(), ?)";
    bddConnection.query(query, [contenu, image, userId, idCategorie || 1], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Envoyé", xp: gainedXp, coins: gainedCoins });
    });
});

// 5. LIRE MESSAGES (JOIN plus complexe pour récupérer les badges équipés)
app.get('/api/recuperation', (req, res) => {
    const idCat = req.query.categorie || 1;
    if (req.query.userId && req.query.userId !== 'null') bddConnection.query("UPDATE utilisateur SET last_seen = NOW() WHERE idutilisateur = ?", [req.query.userId]);
    
    // Requête avancée : On joint la table inventaire pour récupérer UNIQUEMENT les badges équipés
    const query = `
        SELECT m.id, m.contenu, m.image, m.heure, m.date, 
               u.nom, u.prenom, (FLOOR(u.xp / 100) + 1) as niveau, m.idutilisateur,
               (SELECT GROUP_CONCAT(badge_name) FROM inventory WHERE idutilisateur = u.idutilisateur AND is_equipped = 1) as active_badge
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

// 6. ACHETER
app.post('/api/shop/buy', authenticateToken, (req, res) => {
    const { badge, price } = req.body;
    const userId = req.user.id;

    bddConnection.query("SELECT coins FROM utilisateur WHERE idutilisateur = ?", [userId], (err, result) => {
        if (result[0].coins < price) return res.status(400).json({ error: "Pas assez d'argent !" });
        
        bddConnection.query("SELECT * FROM inventory WHERE idutilisateur = ? AND badge_name = ?", [userId, badge], (err, inv) => {
            if (inv && inv.length > 0) return res.status(400).json({ error: "Déjà possédé !" });
            
            bddConnection.query("UPDATE utilisateur SET coins = coins - ? WHERE idutilisateur = ?", [price, userId]);
            // is_equipped est 0 par défaut
            bddConnection.query("INSERT INTO inventory (idutilisateur, badge_name, is_equipped) VALUES (?, ?, 0)", [userId, badge], (err) => {
                res.json({ success: true, message: `Acheté !` });
            });
        });
    });
});

// 7. ÉQUIPER / DÉSÉQUIPER (La logique SQL propre)
app.post('/api/shop/equip', authenticateToken, (req, res) => {
    const { badge } = req.body;
    const userId = req.user.id;

    // 1. On récupère l'état actuel de cet objet
    bddConnection.query("SELECT is_equipped FROM inventory WHERE idutilisateur = ? AND badge_name = ?", [userId, badge], (err, result) => {
        if (!result || result.length === 0) return res.status(403).json({ error: "Tu ne l'as pas acheté !" });
        
        const isCurrentlyEquipped = result[0].is_equipped;

        if (isCurrentlyEquipped) {
            // S'il est équipé, on le déséquipe (facile)
            bddConnection.query("UPDATE inventory SET is_equipped = 0 WHERE idutilisateur = ? AND badge_name = ?", [userId, badge], () => {
                res.json({ success: true });
            });
        } else {
            // S'il n'est pas équipé, on vérifie si on a de la place (Max 3)
            bddConnection.query("SELECT COUNT(*) as count FROM inventory WHERE idutilisateur = ? AND is_equipped = 1", [userId], (err, countResult) => {
                if (countResult[0].count >= 3) return res.status(400).json({ error: "Déjà 3 badges équipés ! Déséquipes-en un." });
                
                // On active
                bddConnection.query("UPDATE inventory SET is_equipped = 1 WHERE idutilisateur = ? AND badge_name = ?", [userId, badge], () => {
                    res.json({ success: true });
                });
            });
        }
    });
});

// 8. UTILS
app.get('/api/getutilisateur', (req, res) => {
    const query = `SELECT idutilisateur, nom, prenom, (last_seen > NOW() - INTERVAL 15 SECOND) as en_ligne FROM utilisateur ORDER BY en_ligne DESC, nom ASC`;
    bddConnection.query(query, (err, results) => res.json({ users: results }));
});
app.get('/api/categories', (req, res) => bddConnection.query('SELECT * FROM Categorie', (e, r) => res.json({ categories: r })));
app.post('/api/categories', (req, res) => bddConnection.query('INSERT INTO Categorie (nom) VALUES (?)', [req.body.nom], (e, r) => res.json({ id: r.insertId })));

app.listen(port, '0.0.0.0', () => console.log(`🚀 Serveur SQL PRO lancé sur ${port}`));