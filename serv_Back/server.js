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

//---------------------------------------------------------------------------------------------------------//
// Partie Arduino : Envoi de commande HTTP à l'Arduino
const arduinoIP = "http://192.168.1.100"; // Remplacer par l'IP de ton Arduino

const colorCommands = {
    rouge: "led_red",  // LED rouge
    vert: "led_green",  // LED verte
    bleu: "led_blue",  // LED bleue
    off: "led_off"  // Éteindre la LED
};

// Endpoint pour contrôler les LEDs
app.post('/api/led', async (req, res) => {
    const { color } = req.body;  // Récupération de la couleur de la LED

    // Vérification que la couleur envoyée est valide
    if (!colorCommands[color]) {
        return res.status(400).json({ error: "Couleur invalide (rouge, vert, bleu, off)" });
    }

    try {
        // Envoi de la commande à l'Arduino via une requête HTTP
        const response = await axios.get(`${arduinoIP}/${colorCommands[color]}`);
        res.json({ message: `LED ${color} activée`, response: response.data });
    } catch (error) {
        // Si la communication avec l'Arduino échoue
        res.status(500).json({ error: "Erreur de communication avec l'Arduino", details: error.message });
    }
});

//---------------------------------------------------------------------------------------------------------//
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
