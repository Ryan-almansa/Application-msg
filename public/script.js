// --- 1. SÉCURITÉ MAXIMUM (Console Muette) ---
// On écrase les fonctions de la console AVANT tout le reste
console.log = function() {};
console.warn = function() {};
console.error = function() {};
console.info = function() {};
// (Optionnel) Bloque aussi le clear pour empêcher de voir si ça a été vidé
console.clear = function() {};

document.addEventListener('DOMContentLoaded', () => {
    // Note: Ce log ne s'affichera pas car on a tué la console juste au-dessus !
    // console.log("✅ Script Secure chargé."); 
    
    const API_URL = `http://${window.location.hostname}:20000`;

    // --- DOM Elements ---
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const categorySelector = document.getElementById("category-selector");
    const userList = document.getElementById('user-list');
    const authContainer = document.getElementById('auth-container');
    const inputContainer = document.getElementById('input-container');
    const logoutBtn = document.getElementById('logout-btn');
    const offlineOverlay = document.getElementById('offline-overlay');

    // Auth inputs
    const nomInput = document.getElementById("nom");
    const prenomInput = document.getElementById("prenom");
    const passInput = document.getElementById("password");
    const btnCreer = document.getElementById("creer");
    const btnConnexion = document.getElementById("connexion");

    // Autres
    const newCategoryInput = document.getElementById("new-category");
    const addCategoryButton = document.getElementById("add-category");
    const imageInput = document.getElementById('image-input');
    const previewContainer = document.getElementById('preview-container');
    const fileNameSpan = document.getElementById('file-name');
    const cancelImgBtn = document.getElementById('cancel-img');
    
    let currentBase64Image = null;
    let currentCategoryId = 1;
    let myToken = localStorage.getItem("token");
    let myUserId = localStorage.getItem("userId");

    // --- UI MANAGER ---
    function updateUI() {
        if(myToken) {
            authContainer.style.display = 'none';
            inputContainer.style.display = 'flex';
            if(logoutBtn) logoutBtn.style.display = 'block';
            fetchCategories();
            fetchUsers();
        } else {
            authContainer.style.display = 'block';
            inputContainer.style.display = 'none';
            if(logoutBtn) logoutBtn.style.display = 'none';
        }
    }
    updateUI();

    // --- 1. INSCRIPTION (Corrigé : Anti-Double Compte) ---
    async function handleRegister(e) {
        e.preventDefault();
        
        // Si le bouton est déjà désactivé, on ne fait rien (Anti-Spam)
        if (btnCreer.disabled) return;

        const nom = nomInput.value.trim();
        const prenom = prenomInput.value.trim();
        const password = passInput.value.trim();

        if(!nom || !prenom || !password) return alert("Tout remplir !");

        // 🔒 ON VERROUILLE LE BOUTON
        btnCreer.disabled = true;
        btnCreer.textContent = "Chargement...";

        try {
            const res = await fetch(`${API_URL}/api/register`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom, prenom, password })
            });
            const data = await res.json();
            if(res.ok) alert("Compte créé ! Tu peux te connecter.");
            else alert(data.error);
        } catch(e) { 
            // console.error(e); // Console désactivée
        } finally {
            // 🔓 ON DÉVERROUILLE QUOI QU'IL ARRIVE
            btnCreer.disabled = false;
            btnCreer.textContent = "S'inscrire";
        }
    }

    // --- 2. CONNEXION (Sécurisé aussi) ---
    async function handleLogin(e) {
        e.preventDefault();
        if (btnConnexion.disabled) return;

        const nom = nomInput.value.trim();
        const prenom = prenomInput.value.trim();
        const password = passInput.value.trim();

        btnConnexion.disabled = true;
        btnConnexion.textContent = "...";

        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom, prenom, password })
            });
            const data = await res.json();

            if(res.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userId", data.userId);
                myToken = data.token;
                myUserId = data.userId;
                
                alert("Bienvenue " + data.nom);
                updateUI();
                fetchMessages();
            } else {
                alert(data.error);
            }
        } catch(e) { 
            // console.error(e); 
        } finally {
            btnConnexion.disabled = false;
            btnConnexion.textContent = "Se connecter";
        }
    }

    if(logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    });

    // --- MESSAGERIE ---
    async function fetchMessages() {
        if (!messagesContainer || !myToken) return;
        
        try {
            let url = `${API_URL}/api/recuperation?categorie=${currentCategoryId}&userId=${myUserId}`;
            const res = await fetch(url);
            
            // Gestion Overlay (Serveur ON)
            if (offlineOverlay) offlineOverlay.classList.add('hidden');

            if (!res.ok) return;

            const data = await res.json();
            
            messagesContainer.innerHTML = "";
            data.forEach(msg => {
                const div = document.createElement("div");
                div.className = "message";
                if (msg.idutilisateur == myUserId) {
                   div.classList.add("own-message"); 
                   div.style.marginLeft = "auto";    
                }
                let content = `<strong style="color:#b39ddb;">${msg.nom} ${msg.prenom}</strong><br>`;
                if(msg.contenu) content += `<span>${msg.contenu}</span>`;
                if(msg.image) content += `<img src="${msg.image}" class="msg-image">`;
                content += `<div style="text-align:right; font-size:0.7em; opacity:0.5;">${msg.heure}</div>`;
                div.innerHTML = content;
                messagesContainer.appendChild(div);
            });

        } catch(e) { 
            // Gestion Overlay (Serveur OFF)
            if (offlineOverlay) offlineOverlay.classList.remove('hidden');
        }
    }

    // --- ENVOI DE MESSAGE (Corrigé : Anti-Double Envoi) ---
    async function sendMessage() {
        if(!myToken) return alert("Pas connecté");
        
        const txt = messageInput.value.trim();
        // On sauvegarde l'image actuelle dans une variable locale
        const imgToSend = currentBase64Image; 
        
        if (!txt && !imgToSend) return;

        // ✅ CORRECTION VITALE : On vide l'interface TOUT DE SUITE
        // Avant même d'envoyer la requête.
        messageInput.value = "";
        currentBase64Image = null;
        imageInput.value = "";
        if(previewContainer) previewContainer.style.display = 'none';

        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}`
                },
                body: JSON.stringify({
                    contenu: txt,
                    image: imgToSend, // On envoie la copie sauvegardée
                    idCategorie: currentCategoryId
                })
            });
            
            if(res.ok) {
                fetchMessages();
            }
        } catch(e) { 
            // Erreur silencieuse
        }
    }

    // --- UTILS ---
    async function fetchCategories() {
        try {
            const res = await fetch(`${API_URL}/api/categories`);
            const data = await res.json();
            if(categorySelector && data.categories) {
                categorySelector.innerHTML = "";
                data.categories.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.idcategorie; opt.textContent = c.nom;
                    categorySelector.appendChild(opt);
                });
                if(data.categories.length > 0 && currentCategoryId === 1) currentCategoryId = data.categories[0].idcategorie;
                fetchMessages();
            }
        } catch(e) {}
    }

    async function addCategory() {
        const nom = newCategoryInput.value;
        if(!nom) return;
        await fetch(`${API_URL}/api/categories`, {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({nom})
        });
        newCategoryInput.value=""; fetchCategories();
    }

    async function fetchUsers() {
        if(!userList) return;
        try {
            const res = await fetch(`${API_URL}/api/getutilisateur`);
            const data = await res.json();
            userList.innerHTML = "";
            data.users.forEach(u => {
                let isOnline = (u.en_ligne === 1) || (u.idutilisateur == myUserId);
                const statusClass = isOnline ? "online" : "offline";
                const li = document.createElement('li');
                li.innerHTML = `<span class="status-dot ${statusClass}"></span> ${u.nom} ${u.prenom}`;
                userList.appendChild(li);
            });
        } catch(e) {}
    }

    // Gestion Images
    if(imageInput) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentBase64Image = e.target.result;
                    if(previewContainer) {
                        previewContainer.style.display = 'block';
                        fileNameSpan.textContent = file.name;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if(cancelImgBtn) cancelImgBtn.addEventListener('click', () => {
        currentBase64Image = null; imageInput.value=""; previewContainer.style.display='none';
    });

    // --- SÉCURITÉ CLIENT SUPPLÉMENTAIRE ---

    // 1. Désactiver le clic droit
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // 2. Désactiver les raccourcis clavier (F12, Inspecter)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
           (e.ctrlKey && e.shiftKey && e.key === 'I') || 
           (e.ctrlKey && e.shiftKey && e.key === 'J') || 
           (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            return false;
        }
    });

    // 3. Le piège (Debugger Loop)
    // Cela rend l'inspection pénible en arrêtant le script si la console est ouverte
    setInterval(() => {
        (function(){}).constructor("debugger")();
    }, 1000);


    // --- EVENTS LISTENERS ---
    if(btnCreer) btnCreer.addEventListener('click', handleRegister);
    if(btnConnexion) btnConnexion.addEventListener('click', handleLogin);
    if(sendButton) sendButton.addEventListener('click', sendMessage);
    if(addCategoryButton) addCategoryButton.addEventListener('click', addCategory);
    
    // Correction Touche Entrée (Anti-saut de ligne + Envoi)
    if(messageInput) messageInput.addEventListener('keypress', (e) => { 
        if(e.key === 'Enter') { 
            e.preventDefault(); 
            sendMessage(); 
        } 
    });
    
    if(categorySelector) categorySelector.addEventListener('change', (e) => { currentCategoryId=e.target.value; fetchMessages(); });

    // Boucle principale
    setInterval(() => {
        if(myToken) { fetchMessages(); fetchUsers(); }
    }, 2000);
});