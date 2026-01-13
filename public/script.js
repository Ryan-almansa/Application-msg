document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Script chargé. Mode Auto-Scroll activé.");

    // --- CONFIGURATION ---
    const API_URL = "http://172.29.19.42:20000"; 

    // --- ÉLÉMENTS DU DOM ---
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const categorySelector = document.getElementById("category-selector");
    const userList = document.getElementById('user-list'); // La zone pour la liste des utilisateurs
    
    // Éléments Connexion / Inscription
    const nomInput = document.getElementById("nom");
    const prenomInput = document.getElementById("prenom");
    const btnCreer = document.getElementById("creer");
    const btnConnexion = document.getElementById("connexion"); 

    // Éléments Catégorie
    const newCategoryInput = document.getElementById("new-category");
    const addCategoryButton = document.getElementById("add-category");

    // Variables globales
    let currentCategoryId = 1;

    // --- 1. CHARGEMENT DES CATÉGORIES ---
    async function fetchCategories() {
        try {
            const res = await fetch(`${API_URL}/api/categories`);
            if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
            const data = await res.json();
            
            if(categorySelector && data.categories) {
                const savedId = categorySelector.value;
                categorySelector.innerHTML = "";
                data.categories.forEach(cat => {
                    const opt = document.createElement("option");
                    opt.value = cat.idcategorie;
                    opt.textContent = cat.nom;
                    categorySelector.appendChild(opt);
                });
                
                if (savedId && data.categories.some(c => c.idcategorie == savedId)) {
                    categorySelector.value = savedId;
                    currentCategoryId = savedId;
                } else if(data.categories.length > 0) {
                    currentCategoryId = data.categories[0].idcategorie;
                }
                fetchMessages();
            }
        } catch (e) { console.error("❌ Erreur chargement catégories:", e); }
    }

    if(categorySelector) {
        categorySelector.addEventListener('change', (e) => {
            currentCategoryId = e.target.value;
            fetchMessages();
        });
    }

    // --- 2. GESTION DES MESSAGES (AVEC SCROLL) ---
    async function fetchMessages() {
        if (!messagesContainer) return;
        try {
            const res = await fetch(`${API_URL}/api/recuperation?categorie=${currentCategoryId}`);
            if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

            const data = await res.json();
            messagesContainer.innerHTML = "";
            const myId = localStorage.getItem("userId");

            data.forEach(msg => {
                const div = document.createElement("div");
                div.className = "message";
                if (msg.idutilisateur == myId) {
                   div.classList.add("own-message"); 
                   div.style.marginLeft = "auto";    
                }
                div.innerHTML = `
                    <strong style="color: #b39ddb;">${msg.nom} ${msg.prenom}</strong><br>
                    ${msg.contenu} 
                    <div style="text-align:right; font-size:0.7em; opacity:0.5; margin-top:4px;">${msg.heure}</div>
                `;
                messagesContainer.appendChild(div);
            });

            // --- AUTO-SCROLL MAGIQUE ---
            // On descend l'ascenseur tout en bas
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

        } catch (e) { console.error("❌ Erreur récup messages:", e); }
    }

    async function sendMessage() {
        const txt = messageInput.value.trim();
        const userId = localStorage.getItem("userId");

        if (!userId) return alert("Connecte-toi d'abord !");
        if (!txt) return;

        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contenu: txt,
                    idutilisateur: userId,
                    idCategorie: currentCategoryId
                })
            });
            if(res.ok) {
                messageInput.value = ""; 
                fetchMessages(); 
            }
        } catch (e) { console.error("❌ Erreur envoi:", e); }
    }

    // --- 3. GESTION LISTE UTILISATEURS (POUR LA GAUCHE) ---
    async function fetchUsers() {
        if (!userList) return;

        try {
            const res = await fetch(`${API_URL}/api/getutilisateur`);
            const data = await res.json();

            // On vide la liste pour la reconstruire
            userList.innerHTML = "";

            if (data.users) {
                data.users.forEach(user => {
                    const li = document.createElement('li');
                    
                    // Style direct pour être sûr que c'est joli
                    li.style.padding = "10px";
                    li.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
                    li.style.display = "flex";
                    li.style.alignItems = "center";
                    li.style.gap = "10px";
                    li.style.color = "white";

                    // On ajoute une icône utilisateur + le nom
                    li.innerHTML = `
                        <i class="fa-solid fa-user" style="color: #b39ddb;"></i>
                        <span>${user.nom} ${user.prenom}</span>
                    `;
                    
                    userList.appendChild(li);
                });
            }
        } catch (e) { console.error("Erreur chargement utilisateurs:", e); }
    }

    // --- 4. FONCTIONS CONNEXION / INSCRIPTION ---
    async function handleInscription(e) {
        e.preventDefault();
        const nom = nomInput.value.trim();
        const prenom = prenomInput.value.trim();
        if (!nom || !prenom) return alert("Remplis les champs !");

        try {
            const res = await fetch(`${API_URL}/api/addutilisateur`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom, prenom })
            });
            if(res.ok) {
                alert("Compte créé !");
                fetchUsers(); // Mise à jour immédiate de la liste
            } else { alert("Erreur création"); }
        } catch (err) { console.error(err); }
    }

    async function handleConnexion(e) {
        e.preventDefault();
        const nom = nomInput.value.trim();
        const prenom = prenomInput.value.trim();

        try {
            const res = await fetch(`${API_URL}/api/getutilisateur`);
            const data = await res.json();
            const user = data.users.find(u => 
                u.nom.toLowerCase() === nom.toLowerCase() && 
                u.prenom.toLowerCase() === prenom.toLowerCase()
            );
            
            if(user) {
                localStorage.setItem("userId", user.idutilisateur);
                alert(`Connecté : ${user.nom}`);
                document.getElementById("messageForm").style.display = "none"; 
                fetchMessages(); 
            } else { alert("Introuvable"); }
        } catch (err) { console.error(err); }
    }

    // --- 5. AJOUT CATÉGORIE ---
    async function addCategory(e) {
        if(e) e.preventDefault();
        const nomCat = newCategoryInput.value.trim();
        if (!nomCat) return alert("Nom vide !");

        try {
            const res = await fetch(`${API_URL}/api/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom: nomCat })
            });
            if (res.ok) {
                alert("Catégorie ajoutée !");
                newCategoryInput.value = "";
                fetchCategories();
            }
        } catch (err) { console.error(err); }
    }

    // --- 6. INITIALISATION ---
    if(btnCreer) btnCreer.addEventListener('click', handleInscription);
    if(btnConnexion) btnConnexion.addEventListener('click', handleConnexion);
    if(sendButton) sendButton.addEventListener('click', (e) => { e.preventDefault(); sendMessage(); });
    if(addCategoryButton) addCategoryButton.addEventListener('click', addCategory);
    if(messageInput) messageInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') { e.preventDefault(); sendMessage(); }});

    // Lancement initial
    fetchCategories();
    fetchUsers();

    // Boucle de mise à jour (Toutes les 2 secondes)
    setInterval(() => {
        fetchMessages();
        fetchUsers();
    }, 2000);
});