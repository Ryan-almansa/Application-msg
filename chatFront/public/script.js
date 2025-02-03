document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const userList = document.getElementById('user-list');

    let users = []; // Liste des utilisateurs initialement vide

    // Récupérer les utilisateurs depuis l'API
    async function fetchUsers() {
        try {
            const response = await fetch("http://192.168.65.113:20000/api/getUsers");
            if (!response.ok) throw new Error("Erreur lors de la récupération des utilisateurs.");
            const data = await response.json();
            users = data.users;
            updateUserList();
        } catch (error) {
            console.error("Erreur réseau :", error);
        }
    }

    // Récupérer les messages depuis l'API
    function fetchMessages() {
        fetch("http://192.168.65.113:20000/api/recuperation")
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des messages.");
            }
            return response.json();
        })
        .then(data => {
            messagesContainer.innerHTML = "";
            data.forEach(msg => {
                const messageElement = document.createElement("div");
                messageElement.classList.add("message");
                messageElement.innerHTML = `<strong>${msg.nom} ${msg.prenom}:</strong> ${msg.contenu} <span class="time">${msg.heure}</span>`;
                messagesContainer.appendChild(messageElement);
            });
        })
        .catch(error => {
            console.error("Erreur :", error);
        });
    }

    function updateUserList() {
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            userList.appendChild(li);
        });
    }

    function addMessage(content, isOwnMessage = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(isOwnMessage ? 'own-message' : 'other-message');
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.5s';
            messageDiv.style.opacity = '1';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    // Fonction qui actualise la page toutes les secondes
    function refreshPageContent() {
        fetchMessages();  // Rafraîchit les messages
        fetchUsers();     // Rafraîchit la liste des utilisateurs
    }

    // Actualisation automatique toutes les 1000 ms (1 seconde)
    setInterval(refreshPageContent, 1000);

    // Fonction pour envoyer un message
    async function sendMessage() {
        const message = messageInput.value.trim();

        if (message === '' || message.length < 2) {
            alert("Veuillez saisir un message d'au moins 2 caractères.");
            return;
        }

        sendButton.disabled = true;
        addMessage(message, true);
        messageInput.value = '';

        try {
            const response = await fetch("http://192.168.65.113:20000/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contenu: message,
                    idutilisateur: 1
                })
            });

            if (response.ok) {
                fetchMessages();  
            } else {
                alert("Erreur lors de l'envoi du message.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        } finally {
            sendButton.disabled = false;
        }
    }

    async function addUser(username) {
        if (!users.includes(username)) {
            try {
                const response = await fetch("http://192.168.65.113:20000/api/AddUser", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username })
                });

                if (!response.ok) throw new Error("Erreur lors de l'ajout de l'utilisateur.");

                users.push(username);
                updateUserList();
                addMessage(`${username} a rejoint le chat.`, false);
            } catch (error) {
                console.error("Erreur lors de l'ajout de l'utilisateur :", error);
            }
        }
    }

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    fetchUsers();
    fetchMessages();

    document.getElementById("messageForm").addEventListener("submit", async (e) => {
        e.preventDefault();

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

            const response = await fetch("http://192.168.65.113:20000/api/utilisateurs", {
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


