const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log('Serveur démarré sur le port : ' + port);
});

// Connexion à la base de données
const bddConnection = mysql.createConnection({
    host: "192.168.64.182", // IP du serveur MariaDB
    database: "Projet-msg", // Nom de la base
    user: "site1", // Utilisateur avec privilèges
    password: "site1" // Mot de passe de l'utilisateur
});

bddConnection.connect((err) => {
    if (err) throw err;
    console.log("Connecté à la base de données !");
});

// Route pour récupérer la liste des médecins
app.get('/Route1', (req, res) => {
    bddConnection.query("SELECT * FROM Medecin", (err, results) => {
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        res.json(results); // Renvoie automatiquement en JSON
    });
});

// Route pour ajouter un médecin
app.post('/AddMedecin', (req, res) => {
    const { nom, prenom } = req.body;

    if (!nom || !prenom) {
        return res.status(400).send({ error: "Les champs 'nom' et 'prenom' sont requis." });
    }

    const query = `INSERT INTO Medecin (nom, prenom) VALUES (?, ?)`;
    bddConnection.query(query, [nom, prenom], (err) => {
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        res.send({ message: "Médecin ajouté avec succès." });
    });
});