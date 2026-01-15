document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Script Secure chargé.");
    const API_URL = `http://${window.location.hostname}:20000`;

    // DOM Elements
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const categorySelector = document.getElementById("category-selector");
    const userList = document.getElementById('user-list');
    const authContainer = document.getElementById('auth-container');
    const inputContainer = document.getElementById('input-container');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Auth inputs
    const nomInput = document.getElementById("nom");
    const prenomInput = document.getElementById("prenom");
    const passInput = document.getElementById("password"); // Nouveau champ
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
    let myToken = localStorage.getItem("token"); // Récupère le token stocké
    let myUserId = localStorage.getItem("userId");

    // UI MANAGER
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

    // 1. INSCRIPTION
    async function handleRegister(e) {
        e.preventDefault();
        const nom = nomInput.value.trim();
        const prenom = prenomInput.value.trim();
        const password = passInput.value.trim();

        if(!nom || !prenom || !password) return alert("Tout remplir !");

        try {
            const res = await fetch(`${API_URL}/api/register`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom, prenom, password })
            });
            const data = await res.json();
            if(res.ok) alert("Compte créé ! Tu peux te connecter.");
            else alert(data.error);
        } catch(e) { console.error(e); }
    }

    // 2. CONNEXION
    async function handleLogin(e) {
        e.preventDefault();
        const nom = nomInput.value.trim();
        const prenom = prenomInput.value.trim();
        const password = passInput.value.trim();

        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom, prenom, password })
            });
            const data = await res.json();

            if(res.ok) {
                // Stockage du Token
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
        } catch(e) { console.error(e); }
    }

    if(logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    });

    // MESSAGERIE
    async function fetchMessages() {
        if (!messagesContainer || !myToken) return;
        try {
            let url = `${API_URL}/api/recuperation?categorie=${currentCategoryId}&userId=${myUserId}`;
            const res = await fetch(url);
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
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch(e) { console.error(e); }
    }

    async function sendMessage() {
        if(!myToken) return alert("Pas connecté");
        const txt = messageInput.value.trim();
        
        if (!txt && !currentBase64Image) return;

        try {
            const res = await fetch(`${API_URL}/api/messages`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}` // ENVOI DU TOKEN
                },
                body: JSON.stringify({
                    contenu: txt,
                    image: currentBase64Image,
                    idCategorie: currentCategoryId
                })
            });
            
            if(res.ok) {
                messageInput.value = "";
                currentBase64Image = null;
                imageInput.value = "";
                previewContainer.style.display = 'none';
                fetchMessages();
            }
        } catch(e) { console.error(e); }
    }

    // UTILS
    async function fetchCategories() {
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
    }

    // Gestion Images
    if(imageInput) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentBase64Image = e.target.result;
                    previewContainer.style.display = 'block';
                    fileNameSpan.textContent = file.name;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if(cancelImgBtn) cancelImgBtn.addEventListener('click', () => {
        currentBase64Image = null; imageInput.value=""; previewContainer.style.display='none';
    });

    // Events
    if(btnCreer) btnCreer.addEventListener('click', handleRegister);
    if(btnConnexion) btnConnexion.addEventListener('click', handleLogin);
    if(sendButton) sendButton.addEventListener('click', sendMessage);
    if(addCategoryButton) addCategoryButton.addEventListener('click', addCategory);
    if(messageInput) messageInput.addEventListener('keypress', (e) => { if(e.key==='Enter') sendMessage(); });
    if(categorySelector) categorySelector.addEventListener('change', (e) => { currentCategoryId=e.target.value; fetchMessages(); });

    setInterval(() => {
        if(myToken) { fetchMessages(); fetchUsers(); }
    }, 2000);
});