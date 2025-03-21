const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
require('dotenv').config();

const app = express();
const port = 20000;
const parser = port.pipe(new Readline({ delimiter: '\n' }));

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

// ➤ 🔒 Route API pour allumer ou éteindre la LED
app.post('/api/led', (req, res) => {
    const { state } = req.body; // state = true (allumer) ou false (éteindre)

    if (state === true) {
        port.write("1\n"); // Envoie "1" à l'Arduino
        res.json({ message: "LED allumée" });
    } else if (state === false) {
        port.write("0\n"); // Envoie "0" à l'Arduino
        res.json({ message: "LED éteinte" });
    } else {
        res.status(400).json({ error: "État invalide, utilisez true ou false" });
    }
});

// ➤ 🔒
parser.on("data", (data) => {
    console.log("Message reçu de l'Arduino:", data);
});


cor
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
        AND date = CURDATE() 
        AND heure > SUBTIME(CURTIME(), '00:01:00')
    `;

    bddConnection.query(checkRateLimit, [idutilisateur], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result[0].count >= 5) {
            return res.status(429).json({ error: "Trop de messages envoyés, veuillez attendre." });
        }

        // Ajouter le message
        const query = "INSERT INTO message (contenu, idutilisateur, date, heure) VALUES (?, ?, CURDATE(), CURTIME())";
        bddConnection.query(query, [contenu, idutilisateur], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Message envoyé avec succès", id: result.insertId });
        });
    });
});

// ➤ Récupérer les messages
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













