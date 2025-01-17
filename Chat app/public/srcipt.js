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

        // Animation d'apparition du message
        messageDiv.style.opacity = '0';
        messagesContainer.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.5s';
            messageDiv.style.opacity = '1';
        }, 10);

        // Défilement automatique vers le bas
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Envoi d'un message
    function sendMessage() {
        const message = messageInput.value.trim();
        
        if (message === '') {
            return; // Ne rien faire si le champ est vide
        }

        // Ajoute le message à la zone des messages
        addMessage(message, true);
        
        // Efface l'input
        messageInput.value = '';
    }

    // Ajout d'un utilisateur (pour tester)
    function addUser(username) {
        if (!users.includes(username)) {
            users.push(username);
            updateUserList();
            addMessage(`${username} a rejoint le chat.`, false);
        }
    }

    // Suppression d'un utilisateur (pour tester)
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
