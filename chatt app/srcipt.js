document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const userList = document.getElementById('user-list');

    // Liste des utilisateurs (simulation)
    let users = ['Utilisateur 1', 'Utilisateur 2', 'Utilisateur 3'];

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

    // Envoi d'un message avec vérification
    function sendMessage() {
        const message = messageInput.value.trim();

        if (message === '' || message.length < 2) {
            alert("Veuillez saisir un message d'au moins 2 caractères.");
            return;
        }

        sendButton.disabled = true;
        addMessage(message, true);
        messageInput.value = '';

        setTimeout(() => {
            sendButton.disabled = false;
        }, 1000);
    }

    // Ajout d'un utilisateur
    function addUser(username) {
        if (!users.includes(username)) {
            users.push(username);
            updateUserList();
            addMessage(`${username} a rejoint le chat.`, false);
        }
    }

    // Suppression d'un utilisateur
    function removeUser(username) {
        const index = users.indexOf(username);
        if (index !== -1) {
            users.splice(index, 1);
            updateUserList();
            addMessage(`${username} a quitté le chat.`, false);
        }
    }

    // Simulation de l'ajout et suppression d'utilisateurs
    setTimeout(() => {
        addUser('Nouvel Utilisateur');
    }, 5000);

    setTimeout(() => {
        removeUser('Utilisateur 1');
    }, 10000);

    // Écouteur sur le bouton d'envoi
    sendButton.addEventListener('click', sendMessage);

    // Écouteur sur la touche "Enter" pour envoyer un message
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initialisation de la liste des utilisateurs
    updateUserList();
});

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

        const response = await fetch("http://localhost:20000/AddMedecin", {
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