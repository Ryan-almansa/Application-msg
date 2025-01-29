document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const userList = document.getElementById('user-list');

    let users = []; // Liste des utilisateurs initialement vide

    // Récupérer les utilisateurs depuis l'API
    async function fetchUsers() {
        try {
            const response = await fetch("192.168.65.113:20000/api/getUsers");
            if (!response.ok) throw new Error("Erreur lors de la récupération des utilisateurs.");
            const data = await response.json();
            users = data.users; // Supposons que la réponse contient un tableau d'utilisateurs
            updateUserList();
        } catch (error) {
            console.error("Erreur réseau :", error);
        }
    }

    // Affichage des utilisateurs
    function updateUserList() {
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            userList.appendChild(li);
        });
    }

    // Ajout d'un message dans la zone des messages
    function addMessage(content, isOwnMessage = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(isOwnMessage ? 'own-message' : 'other-message');
        messageDiv.textContent = content;

        // Ajout du message avant animation
        messagesContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.5s';
            messageDiv.style.opacity = '1';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    function envoyerUnTruc() {
        const valeurNom = document.getElementById("message-input").value.trim(); 
      
        // Vérifier que les champs ne sont pas vides
        if (!valeurNom || !valeurPrenom) {
          alert("Veuillez entrer le nom et le prénom !");
          return;
        }
    fetch("http://192.168.65.113:20000/api/messages", {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ "Message": message,}) // Inclure nom et prénom
      })
        .then(response => {
          if (response.ok) {
            console.log("Message ajouté :", message,);
            alert("Message ajouté avec succès !");
            chargerListeMedecins(); // Recharger la liste après ajout
          } else {
            throw new Error("Erreur lors de l'ajout du message.");
          }
        })
        .catch(error => {
          console.error('Une erreur est survenue :', error);
          alert("Une erreur est survenue. Veuillez réessayer.");
        });
    }

    // Envoi d'un message avec vérification
    async function sendMessage() {
        const message = messageInput.value.trim();

        if (message === '' || message.length < 2) {
            alert("Veuillez saisir un message d'au moins 2 caractères.");
            return;
        }

        sendButton.disabled = true;
        addMessage(message, true);
        messageInput.value = '';

        // Ajouter le message dans la base de données
        try {
            const response = await fetch("http://localhost:20000/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contenu: message,
                    idutilisateur: 1  // Id de l'utilisateur actuel (ajuste cette partie)
                })
            });

            if (response.ok) {
                fetchMessages();  // Récupérer les messages après envoi
            } else {
                alert("Erreur lors de l'envoi du message.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        } finally {
            sendButton.disabled = false;
        }
    }

    // Ajouter un utilisateur via l'API
    async function addUser(username) {
        if (!users.includes(username)) {
            try {
                const response = await fetch("http://localhost:20000/api/AddUser", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username })
                });

                if (!response.ok) throw new Error("Erreur lors de l'ajout de l'utilisateur.");

                // Ajouter l'utilisateur localement après ajout réussi
                users.push(username);
                updateUserList();
                addMessage(`${username} a rejoint le chat.`, false);
            } catch (error) {
                console.error("Erreur lors de l'ajout de l'utilisateur :", error);
            }
        }
    }

    // Écouteur sur le bouton d'envoi
    sendButton.addEventListener('click', sendMessage);

    // Écouteur sur la touche "Enter" pour envoyer un message
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initialisation de la liste des utilisateurs
    fetchUsers();

    // Gestion de l'ajout d'un utilisateur (exemple avec un formulaire)
    document.getElementById("messageForm").addEventListener("submit", async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page

        const nom = document.getElementById("nom").value.trim();
        const prenom = document.getElementById("prenom").value.trim();

        if (!nom || !prenom) {
            alert("Veuillez remplir tous les champs !");
            return;
        }

        try {
            const sendButton = document.querySelector("#messageForm button");
            sendButton.textContent = "Envoi...";
            sendButton.disabled = true;

            const response = await fetch("http://localhost:20000/api/utilisateurs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nom: nom,
                    prenom: prenom
                })
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'envoi du message.");
            }

            const result = await response.text();
            alert(result);
            document.getElementById("messageForm").reset();
        } catch (error) {
            console.error("Erreur réseau :", error);
            alert("Impossible de contacter le serveur. Vérifiez votre connexion.");
        } finally {
            sendButton.textContent = "Envoyer";
            sendButton.disabled = false;
        }
    });
});
