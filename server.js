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
    host: process.env.DB_HOST, database: process.env.DB_NAME,
    user: process.env.DB_USER, password: process.env.DB_PASS,
    charset: 'utf8mb4'
});

bddConnection.connect(err => {
    if (err) console.error('❌ Erreur SQL :', err.message);
    else console.log("✅ Connecté MySQL (Mode Admin Final)");
});

const xpCooldowns = {};
const XP_COOLDOWN_TIME = 30000;
const getIp = (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress;

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token invalide" });
        bddConnection.query("SELECT is_banned FROM utilisateur WHERE idutilisateur = ?", [user.id], (err, result) => {
            if (result && result[0] && result[0].is_banned) return res.status(403).json({ error: "TU ES BANNI" });
            req.user = user; next();
        });
    });
}

// --- ROUTES ---
app.post('/api/register', (req, res) => {
    const userIp = getIp(req);
    bddConnection.query("SELECT * FROM ban_list WHERE ip_address = ?", [userIp], (err, bans) => {
        if (bans.length > 0) return res.status(403).json({ error: "BANNED_IP", message: "Ton IP est bannie." });
        const { nom, prenom, password } = req.body;
        if (!nom || !prenom || !password) return res.status(400).json({ error: "Tout remplir !" });
        const hashedPassword = bcrypt.hashSync(password, 8);
        const insert = "INSERT INTO utilisateur (nom, prenom, password, xp, coins) VALUES (?, ?, ?, 0, 100)";
        bddConnection.query(insert, [nom, prenom, hashedPassword], (err, r) => {
            if (err) return res.status(500).json({ error: "Erreur inscription" });
            res.json({ message: "Succès" });
        });
    });
});

app.post('/api/login', (req, res) => {
    const userIp = getIp(req);
    bddConnection.query("SELECT * FROM ban_list WHERE ip_address = ?", [userIp], (err, bans) => {
        if (bans.length > 0) return res.status(403).json({ error: "BANNED_IP", message: "Ton IP est bannie." });
        const { nom, prenom, password } = req.body;
        const query = "SELECT * FROM utilisateur WHERE nom = ? AND prenom = ?";
        bddConnection.query(query, [nom, prenom], (err, results) => {
            if (err || results.length === 0) return res.status(404).json({ error: "Inconnu" });
            const user = results[0];
            if (user.is_banned) return res.status(403).json({ error: "BANNED_ACCOUNT", message: "Ce compte est banni." });
            if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Mauvais mot de passe" });
            bddConnection.query("UPDATE utilisateur SET last_seen = NOW(), last_ip = ? WHERE idutilisateur = ?", [userIp, user.idutilisateur]);
            const token = jwt.sign({ id: user.idutilisateur, nom: user.nom, isAdmin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({ auth: true, token: token, userId: user.idutilisateur, nom: user.nom, isAdmin: user.is_admin });
        });
    });
});

// ADMIN ROUTES
app.post('/api/admin/ban', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Pas Admin" });
    const { targetId } = req.body;
    bddConnection.query("SELECT last_ip FROM utilisateur WHERE idutilisateur = ?", [targetId], (err, result) => {
        const targetIp = result[0]?.last_ip;
        bddConnection.query("UPDATE utilisateur SET is_banned = 1 WHERE idutilisateur = ?", [targetId]);
        if (targetIp) bddConnection.query("INSERT INTO ban_list (ip_address, reason) VALUES (?, 'Admin Ban')", [targetIp]);
        res.json({ message: "Utilisateur BANNI" });
    });
});

// --- NOUVEAU : SUPPRIMER UN MESSAGE (POUR CLORE UN TICKET) ---
app.delete('/api/admin/message/:id', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Pas Admin" });
    bddConnection.query("DELETE FROM message WHERE id = ?", [req.params.id], () => {
        res.json({ success: true, message: "Ticket clos (Message supprimé)" });
    });
});

app.post('/api/ticket', (req, res) => {
    const { message, pseudo } = req.body;
    const userIp = getIp(req);
    bddConnection.query("INSERT INTO tickets (ip_address, pseudo_tentative, message) VALUES (?, ?, ?)", [userIp, pseudo, message]);
    bddConnection.query("SELECT idutilisateur FROM utilisateur WHERE nom = ?", [pseudo], (err, resUser) => {
        let userId = 0; if(resUser && resUser.length > 0) userId = resUser[0].idutilisateur;
        const chatMsg = `[TICKET] ${message}`;
        bddConnection.query("INSERT INTO message (contenu, idutilisateur, date, heure, idcategorie) VALUES (?, ?, CURDATE(), CURTIME(), 999)", [chatMsg, userId], () => {
            res.json({ message: "Ticket envoyé." });
        });
    });
});

app.post('/api/messages', authenticateToken, (req, res) => {
    const { contenu, image, idCategorie } = req.body;
    const userId = req.user.id;
    if (req.user.isAdmin) {
        if (contenu === '/admin') { bddConnection.query("UPDATE utilisateur SET coins = coins + 10000, xp = xp + 500 WHERE idutilisateur = ?", [userId], () => res.json({ message: "Cheat !", xp: 0, coins: 0, isCheat: true })); return; }
        if (contenu === '/reset') { bddConnection.query("UPDATE inventory SET is_equipped = 0 WHERE idutilisateur = ?", [userId], () => res.json({ message: "Reset !", xp: 0, coins: 0, isCheat: true })); return; }
        if (contenu.startsWith('/deban ')) {
            const targetPseudo = contenu.split(' ')[1];
            if(targetPseudo) {
                bddConnection.query("SELECT idutilisateur, last_ip FROM utilisateur WHERE nom = ?", [targetPseudo], (err, resUser) => {
                    if(!resUser.length) return res.json({ message: "Introuvable.", isCheat: true });
                    const uid = resUser[0].idutilisateur; const uip = resUser[0].last_ip;
                    bddConnection.query("UPDATE utilisateur SET is_banned = 0 WHERE idutilisateur = ?", [uid]);
                    if(uip) bddConnection.query("DELETE FROM ban_list WHERE ip_address = ?", [uip]);
                    return res.json({ message: `✅ ${targetPseudo} DÉBANNI !`, isCheat: true });
                }); return;
            }
        }
    }
    const now = Date.now();
    let gainedXp = 0, gainedCoins = 0;
    if (!xpCooldowns[userId] || now - xpCooldowns[userId] > XP_COOLDOWN_TIME) {
        gainedXp = 10 + Math.floor(Math.random() * 5); gainedCoins = 5; xpCooldowns[userId] = now;
        bddConnection.query("UPDATE utilisateur SET xp = xp + ?, coins = coins + ?, last_seen = NOW() WHERE idutilisateur = ?", [gainedXp, gainedCoins, userId]);
    } else bddConnection.query("UPDATE utilisateur SET last_seen = NOW() WHERE idutilisateur = ?", [userId]);
    bddConnection.query("INSERT INTO message (contenu, image, idutilisateur, date, heure, idcategorie) VALUES (?, ?, ?, CURDATE(), CURTIME(), ?)", [contenu, image, userId, idCategorie || 1], (err, result) => res.json({ message: "Envoyé", xp: gainedXp, coins: gainedCoins }));
});

app.get('/api/me', authenticateToken, (req, res) => {
    const userId = req.user.id;
    bddConnection.query("SELECT xp, coins, (FLOOR(xp / 100) + 1) as niveau FROM utilisateur WHERE idutilisateur = ?", [userId], (err, userResult) => {
        bddConnection.query("SELECT badge_name, is_equipped FROM inventory WHERE idutilisateur = ?", [userId], (err, invResult) => {
            const owned = invResult.map(i => i.badge_name);
            const equipped = invResult.filter(i => i.is_equipped === 1).map(i => i.badge_name);
            res.json({ ...userResult[0], inventory: owned, active_badges: equipped });
        });
    });
});
app.get('/api/recuperation', (req, res) => {
    const idCat = req.query.categorie || 1;
    if (req.query.userId && req.query.userId !== 'null') bddConnection.query("UPDATE utilisateur SET last_seen = NOW() WHERE idutilisateur = ?", [req.query.userId]);
    const query = `SELECT m.id, m.contenu, m.image, m.heure, m.date, u.nom, u.prenom, (FLOOR(u.xp / 100) + 1) as niveau, m.idutilisateur, u.is_admin, (SELECT GROUP_CONCAT(badge_name) FROM inventory WHERE idutilisateur = u.idutilisateur AND is_equipped = 1) as active_badge FROM message m JOIN utilisateur u ON m.idutilisateur = u.idutilisateur WHERE m.idcategorie = ? ORDER BY m.date ASC, m.heure ASC`;
    bddConnection.query(query, [idCat], (err, results) => res.json(results));
});
app.post('/api/shop/buy', authenticateToken, (req, res) => {
    const { badge, price } = req.body; const userId = req.user.id;
    bddConnection.query("SELECT coins FROM utilisateur WHERE idutilisateur = ?", [userId], (err, result) => {
        if (result[0].coins < price) return res.status(400).json({ error: "Pas assez d'argent !" });
        bddConnection.query("SELECT * FROM inventory WHERE idutilisateur = ? AND badge_name = ?", [userId, badge], (err, inv) => {
            if (inv && inv.length > 0) return res.status(400).json({ error: "Déjà possédé !" });
            bddConnection.query("UPDATE utilisateur SET coins = coins - ? WHERE idutilisateur = ?", [price, userId]);
            bddConnection.query("INSERT INTO inventory (idutilisateur, badge_name, is_equipped) VALUES (?, ?, 0)", [userId, badge], (err) => res.json({ success: true, message: `Acheté !` }));
        });
    });
});
app.post('/api/shop/equip', authenticateToken, (req, res) => {
    const { badge } = req.body; const userId = req.user.id;
    bddConnection.query("SELECT is_equipped FROM inventory WHERE idutilisateur = ? AND badge_name = ?", [userId, badge], (err, result) => {
        if (!result || result.length === 0) return res.status(403).json({ error: "Pas acheté !" });
        if (result[0].is_equipped) { bddConnection.query("UPDATE inventory SET is_equipped = 0 WHERE idutilisateur = ? AND badge_name = ?", [userId, badge], () => res.json({ success: true })); }
        else { bddConnection.query("SELECT COUNT(*) as count FROM inventory WHERE idutilisateur = ? AND is_equipped = 1", [userId], (err, c) => { if (c[0].count >= 3) return res.status(400).json({ error: "Max 3 badges !" }); bddConnection.query("UPDATE inventory SET is_equipped = 1 WHERE idutilisateur = ? AND badge_name = ?", [userId, badge], () => res.json({ success: true })); }); }
    });
});
app.get('/api/getutilisateur', (req, res) => {
    bddConnection.query(`SELECT idutilisateur, nom, prenom, is_banned, (last_seen > NOW() - INTERVAL 15 SECOND) as en_ligne FROM utilisateur ORDER BY en_ligne DESC, nom ASC`, (err, results) => res.json({ users: results }));
});
app.get('/api/categories', (req, res) => bddConnection.query('SELECT * FROM Categorie', (e, r) => res.json({ categories: r })));
app.post('/api/categories', (req, res) => bddConnection.query('INSERT INTO Categorie (nom) VALUES (?)', [req.body.nom], (e, r) => res.json({ id: r.insertId })));

app.listen(port, '0.0.0.0', () => console.log(`🚀 Serveur lancer ${port}`));