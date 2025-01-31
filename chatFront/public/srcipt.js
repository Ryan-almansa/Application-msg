document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const userList = document.getElementById('user-list');

    let users = []; // Liste des utilisateurs initialement vide

    // Récupérer les utilisateurs depuis l'API
    async function fetchUsers() {
        try {
            const response = await fetch("http://192.168.65.113:20000/api/getUsers"); // Ajout de "http://"
            if (!response.ok) throw new Error("Erreur lors de la récupération des utilisateurs.");
            const data = await response.json();
            users = data.users; 
            updateUserList();
        } catch (error) {
            console.error("Erreur réseau :", error);
        }
    }

    // Récupérer les messages depuis l'API
    fetch("http://192.168.65.113:20000/api/recuperation")
    .then(response => {
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des messages.");
        }
        return response.json();
    })
    .then(data => {
        const messagesContainer = document.getElementById("chat-container"); // Zone où afficher les messages
        messagesContainer.innerHTML = ""; // On vide la zone avant d'ajouter les nouveaux messages
        
        data.forEach(msg => {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message"); // Ajout d'une classe CSS pour le style
            messageElement.innerHTML = `<strong>${msg.nom} ${msg.prenom}:</strong> ${msg.contenu} <span class="time">${msg.heure}</span>`;
            messagesContainer.appendChild(messageElement);
        });
    })
    .catch(error => {
        console.error("Erreur :", error);
    });


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

    // Correction de la fonction Message()
    function Message() {
        const message = messageInput.value.trim(); 

        if (!message) {
            alert("Veuillez entrer un message !");
            return;
        }

        fetch("http://192.168.65.113:20000/api/messages", {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({ "Message": message })
        })
        .then(response => {
            if (response.ok) {
                console.log("Message ajouté :", message);
                alert("Message ajouté avec succès !");
                fetchMessages(); // Correction : recharger les messages
            } else {
                throw new Error("Erreur lors de l'ajout du message.");
            }
        })
        .catch(error => {
            console.error('Une erreur est survenue :', error);
            alert("Une erreur est survenue. Veuillez réessayer.");
        });
    }

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
                fetchMessages();  // Correction : Appel à la fonction définie ci-dessus
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
    fetchMessages(); // Charger les messages au démarrage

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
