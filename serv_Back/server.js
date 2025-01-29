const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
//il faut aussi ajouter dotenv
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

const port = 20000;

app.listen(port, () => {
    console.log(`Mon serveur est démarré sur le port ${port}`);
});

const bddConnection = mysql.createConnection({
    host: process.env.DB_HOST ,
    database: process.env.DB_NAME ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASS 
});

bddConnection.connect(err => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
        return;
    }
    console.log("Connexion réussie à la base de données");
});

app.get('/Route1', (req, res) => {
    bddConnection.query("SELECT * FROM Medecin", (err, results) => {
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        res.json(results);
    });
});

app.post('/AddMedecin', (req, res) => {
    if (!req.body.nom || !req.body.prenom) {
        return res.status(400).send({ error: "Nom et prénom sont requis" });
    }

    const query = `INSERT INTO Medecin (nom, prenom) VALUES (?, ?)`;
    bddConnection.query(query, [req.body.nom, req.body.prenom], (err, result) => {
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        res.send("Data inserted successfully");
    });
});

process.on('SIGINT', () => {
    bddConnection.end(err => {
        if (err) {
            console.error('Erreur lors de la fermeture de la connexion :', err.message);
        } else {
            console.log('Connexion à la base de données fermée.');
        }
        process.exit();
    });
});
