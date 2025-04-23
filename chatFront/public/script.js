document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const userList = document.getElementById('user-list');
    const creerBtn = document.getElementById("creer");
    const connexionBtn = document.getElementById("connexion");
    const categorySelector = document.getElementById("category-selector");  
    const newCategoryInput = document.getElementById("new-category");
    const addCategoryBtn = document.getElementById("add-category");
    
    // Vérifier si les éléments de catégorie existent
    const hasCategoryElements = categorySelector && newCategoryInput && addCategoryBtn;
    if (!hasCategoryElements && (categorySelector || newCategoryInput || addCategoryBtn)) {
        console.error("Certains éléments de la gestion des catégories sont manquants dans le HTML.");
    }

    // Variables globales
    let currentCategoryId = null;
    let users = [];

    // Récupérer les utilisateurs depuis l'API
    async function fetchUsers() {
        try {
            const response = await fetch("http://192.168.65.113:20000/api/getutilisateur");
            if (!response.ok) throw new Error("Erreur lors de la récupération des utilisateurs.");
            const data = await response.json();
            users = data.users;
            updateUserList();
        } catch (error) {
            console.error("Erreur réseau lors de la récupération des utilisateurs:", error);
        }
    }

    // Mettre à jour la liste des utilisateurs dans l'interface
    function updateUserList() {
        if (!userList) return;
        
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = `${user.nom} ${user.prenom}`;
            userList.appendChild(li);
        });
    }

    // Récupérer les catégories depuis l'API
    async function fetchCategories() {
        if (!categorySelector) return;
        
        try {
            const response = await fetch("http://192.168.65.113:20000/api/categories");
            if (!response.ok) throw new Error("Erreur lors de la récupération des catégories.");
            
            const data = await response.json();
            categorySelector.innerHTML = "";
            
            if (data.categories && data.categories.length > 0) {
                data.categories.forEach(cat => {
                    const option = document.createElement("option");
                    option.value = cat.idcategorie;
                    option.textContent = cat.nom;
                    categorySelector.appendChild(option);
                });
                
                currentCategoryId = data.categories[0].idcategorie;
                fetchMessages(); // Recharger les messages pour cette catégorie
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des catégories:", error);
        }
    }

    // Ajouter une nouvelle catégorie
    async function addCategory() {
        if (!newCategoryInput) return;
        
        const newCatName = newCategoryInput.value.trim();
        if (!newCatName) {
            alert("Nom de catégorie vide");
            return;
        }

        try {
            const response = await fetch("http://192.168.65.113:20000/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom: newCatName })
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.nom || "Catégorie ajoutée avec succès");
                newCategoryInput.value = "";
                fetchCategories(); // Recharge après ajout
            } else {
                alert(data.error || "Erreur lors de l'ajout");
            }
        } catch (err) {
            console.error("Erreur ajout catégorie:", err);
        }
    }

    // Récupérer les messages depuis l'API
    function fetchMessages() {
        if (!messagesContainer) return;
        
        const categoryParam = currentCategoryId ? `?categorie=${currentCategoryId}` : '';
        
        fetch(`http://192.168.65.113:20000/api/recuperation${categoryParam}`)
            .then(response => {
                if (!response.ok) throw new Error("Erreur lors de la récupération des messages.");
                return response.json();
            })
            .then(data => {
                messagesContainer.innerHTML = "";
                if (Array.isArray(data)) {
                    data.forEach(msg => {
                        const messageElement = document.createElement("div");
                        messageElement.classList.add("message");
                        messageElement.innerHTML = `<strong>${msg.nom} ${msg.prenom}:</strong> ${msg.contenu} <span class="time">${msg.heure}</span>`;
                        messagesContainer.appendChild(messageElement);
                    });
                }
            })
            .catch(error => {
                console.error("Erreur lors de la récupération des messages:", error);
            });
    }

    // Ajouter un message à l'interface
    function addMessage(content, isOwnMessage = false) {
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(isOwnMessage ? 'own-message' : 'other-message');
        messageDiv.textContent = content;
        messageDiv.style.opacity = '0'; // Commence invisible pour l'animation
        messagesContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.5s';
            messageDiv.style.opacity = '1';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 10);
    }

    // Fonction qui actualise la page régulièrement
    function refreshPageContent() {
        fetchMessages();  // Rafraîchit les messages
        fetchUsers();     // Rafraîchit la liste des utilisateurs
    }

    // Envoyer un message
    async function sendMessage() {
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
    
        if (message === '' || message.length < 2) {
            alert("Veuillez saisir un message d'au moins 2 caractères.");
            return;
        }
    
        if (sendButton) sendButton.disabled = true;
        addMessage(message, true);
        messageInput.value = '';
    
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                alert("Utilisateur non connecté.");
                return;
            }
    
            const requestBody = {
                contenu: message,
                idutilisateur: userId,
                // Toujours inclure une valeur pour idCategorie
                idCategorie: currentCategoryId || 1  // Utilise 1 comme catégorie par défaut
            };
    
            const response = await fetch("http://192.168.65.113:20000/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                fetchMessages();
            } else {
                const errorData = await response.json();
                alert("Erreur lors de l'envoi du message: " + (errorData.error || ''));
            }
        } catch (error) {
            console.error("Erreur réseau lors de l'envoi du message:", error);
            alert("Erreur de connexion au serveur.");
        } finally {
            if (sendButton) sendButton.disabled = false;
        }
    }

    // Créer un nouvel utilisateur
    async function createUser(event) {
        event.preventDefault();
        
        const nomInput = document.getElementById("nom");
        const prenomInput = document.getElementById("prenom");
        
        if (!nomInput || !prenomInput) return;
        
        const nom = nomInput.value.trim();
        const prenom = prenomInput.value.trim();

        if (!nom || !prenom) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        try {
            const response = await fetch("http://192.168.65.113:20000/api/addutilisateur", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom, prenom })
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message || "Utilisateur créé avec succès");
                fetchUsers(); // Rafraîchir la liste des utilisateurs
            } else {
                alert("Erreur: " + (data.error || "Erreur inconnue"));
            }
        } catch (error) {
            console.error("Erreur lors de l'ajout d'un utilisateur:", error);
            alert("Erreur de connexion au serveur.");
        }
    }

    // Connexion utilisateur
    async function connectUser(event) {
        event.preventDefault();
        
        const nomInput = document.getElementById("nom");
        const prenomInput = document.getElementById("prenom");
        
        if (!nomInput || !prenomInput) return;
        
        const nomSaisi = nomInput.value.trim();
        const prenomSaisi = prenomInput.value.trim();

        if (!nomSaisi || !prenomSaisi) {
            alert("Veuillez saisir votre nom et prénom.");
            return;
        }

        try {
            const response = await fetch("http://192.168.65.113:20000/api/getutilisateur");
            const data = await response.json();

            if (response.ok && data.users) {
                const utilisateur = data.users.find(user =>
                    user.nom.toLowerCase() === nomSaisi.toLowerCase() &&
                    user.prenom.toLowerCase() === prenomSaisi.toLowerCase()
                );

                if (utilisateur) {
                    localStorage.setItem("userId", utilisateur.idutilisateur);
                    alert(`Connexion réussie : Bienvenue ${utilisateur.nom} ${utilisateur.prenom} !`);
                } else {
                    alert("Nom ou prénom incorrect.");
                }
            } else {
                alert("Erreur: " + (data.error || "Erreur inconnue"));
            }
        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
            alert("Erreur de connexion au serveur.");
        }
    }

    // Générer une couleur aléatoire
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Contrôler les LEDs
    function toggleLED(color, state) {
        fetch("http://192.168.65.113:20000/api/led", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ color: color, state: state })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => console.log("Réponse serveur LED:", data))
        .catch(error => console.error("Erreur LED:", error));
    }

    // Initialisation des écouteurs d'événements
    function initEventListeners() {
        // Bouton d'envoi de message
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }
        
        // Entrée clavier pour envoyer un message
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }
        
        // Gestion des catégories
        if (categorySelector) {
            categorySelector.addEventListener("change", (e) => {
                currentCategoryId = e.target.value;
                fetchMessages();
            });
        }
        
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener("click", addCategory);
        }
        
        // Gestion des utilisateurs
        if (creerBtn) {
            creerBtn.addEventListener("click", createUser);
        }
        
        if (connexionBtn) {
            connexionBtn.addEventListener("click", connectUser);
        }
        
        // Bouton de changement de couleur
        const colorButton = document.getElementById('colorButton');
        if (colorButton) {
            colorButton.addEventListener('click', () => {
                document.body.style.backgroundColor = getRandomColor();
            });
        }
        
        // Boutons LED
        const greenButton = document.getElementById("send-message");
        if (greenButton) {
            greenButton.addEventListener("click", () => {
                console.log("Bouton vert cliqué");
                toggleLED("green", true);
            });
        }
        
        const redButton = document.querySelector(".Rouge");
        if (redButton) {
            redButton.addEventListener("click", () => {
                console.log("Bouton rouge cliqué");
                toggleLED("red", true);
            });
        }
        
        const blueButton = document.querySelector(".Bleu");
        if (blueButton) {
            blueButton.addEventListener("click", () => {
                console.log("Bouton bleu cliqué");
                toggleLED("blue", true);
            });
        }
        
        // Boutons d'envoi de message de couleur
        const messageButtons = document.querySelectorAll('.send-message');
        messageButtons.forEach(button => {
            button.addEventListener('click', () => {
                const span = button.querySelector('span');
                if (!span) return;
                
                const color = span.textContent;
                const message = `La ${color} est allumée`;
                
                const chatContainer = document.getElementById('input-container');
                if (!chatContainer) return;
                
                const messageElement = document.createElement('div');
                messageElement.textContent = message;
                messageElement.style.padding = '8px';
                messageElement.style.margin = '4px 0';
                messageElement.style.borderRadius = '5px';
                messageElement.style.color = '#fff';
                
                chatContainer.appendChild(messageElement);
                
                // Supprime le message après 5 secondes
                setTimeout(() => {
                    if (chatContainer.contains(messageElement)) {
                        chatContainer.removeChild(messageElement);
                    }
                }, 5000);
            });
        });
    }

    // Initialisation de l'application
    function init() {
        initEventListeners();
        
        // Charger les données initiales
        if (hasCategoryElements) {
            fetchCategories();
        } else {
            fetchMessages();
        }
        fetchUsers();
        
        // Actualisation automatique
        setInterval(refreshPageContent, 1000);
    }

    // Lancer l'initialisation
    init();
});