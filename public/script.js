// --- CONFIGURATION ---
const SHOP_ITEMS = [
    { icon: '👑', name: 'Roi',      price: 500 },
    { icon: '🔥', name: 'Feu',      price: 200 },
    { icon: '🚀', name: 'Pilote',   price: 100 },
    { icon: '💎', name: 'Diamant',  price: 1000 },
    { icon: '😎', name: 'Cool',     price: 50 },
    { icon: '👽', name: 'Alien',    price: 300 },
    { icon: '💻', name: 'Hacker',   price: 1500 },
    { icon: '🛡️', name: 'Gardien',  price: 750 }
];

// On cache les logs pour faire pro
console.log = function() {}; console.warn = function() {}; console.error = function() {};

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = `http://${window.location.hostname}:20000`;

    // --- ELEMENTS DOM ---
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const scrollDownBtn = document.getElementById('scroll-down-btn');
    const categorySelector = document.getElementById("category-selector");
    const userList = document.getElementById('user-list');
    const authContainer = document.getElementById('auth-container');
    const inputContainer = document.getElementById('input-container');
    const logoutBtn = document.getElementById('logout-btn');
    const offlineOverlay = document.getElementById('offline-overlay');
    const bannedOverlay = document.getElementById('banned-overlay');

    // Stats
    const levelContainer = document.getElementById('level-container');
    const myLevelSpan = document.getElementById('my-level');
    const xpProgress = document.getElementById('xp-progress');
    const shopCoinsDisplay = document.getElementById('shop-coins-display');
    const shopModal = document.getElementById('shop-modal');
    const openShopBtn = document.getElementById('open-shop-btn');
    const closeShopBtn = document.getElementById('close-shop');
    const shopItemsContainer = document.getElementById('shop-items-container');

    // Auth Inputs
    const nomInput = document.getElementById("nom");
    const prenomInput = document.getElementById("prenom");
    const passInput = document.getElementById("password");
    const btnCreer = document.getElementById("creer");
    const btnConnexion = document.getElementById("connexion");

    // Images
    const imageInput = document.getElementById('image-input');
    const previewContainer = document.getElementById('preview-container');
    const fileNameSpan = document.getElementById('file-name');
    const cancelImgBtn = document.getElementById('cancel-img');
    const newCategoryInput = document.getElementById("new-category");
    const addCategoryButton = document.getElementById("add-category");
    
    // Variables Globales
    let currentBase64Image = null;
    let currentCategoryId = 1;
    let myToken = localStorage.getItem("token");
    let myUserId = localStorage.getItem("userId");
    // Récupération intelligente du statut Admin
    let amIAdmin = localStorage.getItem("isAdmin") === "1";
    
    let myInventory = []; 
    let myEquippedBadges = [];

    // ----------------------------------------------------
    // --- 1. SYSTÈME ADMIN (Ban & Déban) ---
    // ----------------------------------------------------

    // Bannir (Menu de droite)
    async function banUser(targetId, targetName) {
        if(!confirm(`⚠️ BANNIR DÉFINITIVEMENT ${targetName} ?`)) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/ban`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${myToken}` },
                body: JSON.stringify({ targetId })
            });
            const data = await res.json();
            alert(data.message || data.error);
            fetchUsers();
        } catch(e) { alert("Erreur Ban"); }
    }

    // Débannir Rapide (Bouton dans le chat Ticket)
    function fastDeban(pseudo) {
        if(confirm(`✅ DÉBANNIR ${pseudo} et supprimer son ticket ?`)) {
            // Astuce : On envoie la commande /deban via le chat
            const oldVal = messageInput.value;
            messageInput.value = `/deban ${pseudo}`;
            sendMessage().then(() => {
                messageInput.value = oldVal; // On remet le texte d'avant
                alert(`Utilisateur ${pseudo} débanni !`);
            });
        }
    }

    // Affichage des utilisateurs à droite
    async function fetchUsers() {
        if(!userList) return;
        try {
            const r = await fetch(`${API_URL}/api/getutilisateur`);
            const d = await r.json();
            userList.innerHTML = "";
            d.users.forEach(u => {
                const li = document.createElement('li');
                let statusClass = u.en_ligne ? "online" : "offline";
                let banBtn = "";
                
                // Bouton BAN visible seulement pour l'admin
                if(amIAdmin && u.idutilisateur != myUserId) {
                    banBtn = `<button class="ban-btn" style="background:red; font-size:0.6rem; padding:2px 5px; margin-left:auto; border:none; color:white; cursor:pointer;">BAN</button>`;
                }
                
                let nameDisplay = u.is_banned ? `<s style="color:red">${u.nom}</s>` : u.nom;
                li.innerHTML = `<span class="status-dot ${statusClass}"></span> ${nameDisplay} ${banBtn}`;
                
                if(banBtn) { li.querySelector('.ban-btn').onclick = () => banUser(u.idutilisateur, u.nom); }
                userList.appendChild(li);
            });
        } catch(e){}
    }

    // ----------------------------------------------------
    // --- 2. MESSAGERIE & SCROLL ---
    // ----------------------------------------------------

    // Scroll Intelligent
    let isUserAtBottom = true;
    if(messagesContainer) {
        messagesContainer.addEventListener('scroll', () => {
            const threshold = 100;
            const position = messagesContainer.scrollTop + messagesContainer.clientHeight;
            const height = messagesContainer.scrollHeight;
            if (height - position <= threshold) { isUserAtBottom = true; scrollDownBtn.classList.add('hidden'); } 
            else { isUserAtBottom = false; scrollDownBtn.classList.remove('hidden'); }
        });
    }
    if(scrollDownBtn) scrollDownBtn.addEventListener('click', () => scrollToBottom(true));
    
    function scrollToBottom(force = false) {
        if (!messagesContainer) return;
        if (force) { isUserAtBottom = true; scrollDownBtn.classList.add('hidden'); messagesContainer.scrollTop = messagesContainer.scrollHeight; }
        else if (isUserAtBottom) { messagesContainer.scrollTop = messagesContainer.scrollHeight; }
    }

    // Récupération des messages
    async function fetchMessages() {
        if (!messagesContainer || !myToken) return;
        try {
            const res = await fetch(`${API_URL}/api/recuperation?categorie=${currentCategoryId}`);
            if(offlineOverlay) offlineOverlay.classList.add('hidden');
            if (!res.ok) return;

            const data = await res.json();
            const previousScrollTop = messagesContainer.scrollTop; // Sauvegarde position
            messagesContainer.innerHTML = "";
            
            data.forEach(msg => {
                const div = document.createElement("div"); div.className = "message";
                if (msg.idutilisateur == myUserId) { div.classList.add("own-message"); div.style.marginLeft = "auto"; }
                
                let badgesHtml = '';
                if (msg.active_badge) { msg.active_badge.split(',').filter(b => b).forEach(b => { badgesHtml += `<span class="user-badge">${b}</span>`; }); }
                
                // --- AJOUT SPECIAL ADMIN : Bouton DEBAN dans le chat ---
                let ticketAction = "";
                // Si on est dans la catégorie TICKETS (999) et qu'on est Admin
                if(currentCategoryId == 999 && amIAdmin && msg.idutilisateur != myUserId && msg.contenu.includes("[TICKET]")) {
                    // On extrait le pseudo du ticket si possible, sinon on prend le nom de l'envoyeur
                    ticketAction = `<button class="deban-btn" style="background:#00e676; border:none; border-radius:3px; font-size:0.7rem; margin-left:10px; cursor:pointer; color:black; font-weight:bold;">[DÉBANNIR]</button>`;
                }

                div.innerHTML = `<div class="msg-header">${badgesHtml} <strong>${msg.nom}</strong> <span class="user-lvl">Lvl ${msg.niveau}</span> ${ticketAction}</div>${msg.contenu ? `<span>${msg.contenu}</span>` : ''}${msg.image ? `<img src="${msg.image}" class="msg-image">` : ''}<div class="msg-time">${msg.heure}</div>`;
                
                // Activation du bouton Déban
                if(ticketAction) {
                    // Le nom de l'user banni est soit l'envoyeur, soit dans le message.
                    // Ici on prend le nom de l'envoyeur du message (le banni)
                    div.querySelector('.deban-btn').onclick = () => fastDeban(msg.nom);
                }

                messagesContainer.appendChild(div);
            });

            // Gestion du scroll
            if (isUserAtBottom) { messagesContainer.scrollTop = messagesContainer.scrollHeight; } 
            else { messagesContainer.scrollTop = previousScrollTop; }

        } catch(e) { if(offlineOverlay) offlineOverlay.classList.remove('hidden'); }
    }

    // Envoi de message
    async function sendMessage() {
        if(!myToken) return alert("Pas connecté");
        const txt = messageInput.value.trim(); const img = currentBase64Image;
        if (!txt && !img) return;
        
        messageInput.value = ""; currentBase64Image = null; imageInput.value = ""; if(previewContainer) previewContainer.style.display='none';
        
        try {
            const res = await fetch(`${API_URL}/api/messages`, {method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${myToken}`},body:JSON.stringify({contenu:txt,image:img,idCategorie:currentCategoryId})});
            const data = await res.json(); 
            if(res.ok) { 
                if(data.isCheat) { alert(data.message); updateStats(); }
                else { if(data.xp>0) updateStats(); scrollToBottom(true); fetchMessages(); }
            }
        } catch(e) {}
    }

    // Catégories (Cache les tickets pour les non-admins)
    async function fetchCategories(){
        try{
            const r=await fetch(`${API_URL}/api/categories`);
            const d=await r.json();
            if(categorySelector){
                categorySelector.innerHTML="";
                d.categories.forEach(c=>{
                    // CACHER LA CATÉGORIE 999 SI PAS ADMIN
                    if(c.idcategorie === 999 && !amIAdmin) return; 

                    const o=document.createElement("option");
                    o.value=c.idcategorie;
                    o.textContent=c.nom;
                    if(c.idcategorie == currentCategoryId) o.selected = true;
                    categorySelector.appendChild(o);
                });
            }
        }catch(e){}
    }

    // ----------------------------------------------------
    // --- 3. BOUTIQUE & STATS ---
    // ----------------------------------------------------
    function renderShop() {
        if(!shopItemsContainer) return;
        shopItemsContainer.innerHTML = '';
        SHOP_ITEMS.forEach(item => {
            const div = document.createElement('div');
            const isOwned = myInventory.includes(item.icon);
            const isEquipped = myEquippedBadges.includes(item.icon);
            div.className = `shop-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
            div.onclick = () => handleShopClick(item);
            let statusText = `<span class="badge-price">${item.price} <i class="fa-solid fa-coins"></i></span>`;
            if (isEquipped) statusText = `<span class="status-text equipped">ÉQUIPÉ ✅</span>`;
            else if (isOwned) statusText = `<span class="status-text owned">ACQUIS</span>`;
            div.innerHTML = `<span class="badge-icon">${item.icon}</span><span class="badge-name">${item.name}</span>${statusText}`;
            shopItemsContainer.appendChild(div);
        });
    }

    async function handleShopClick(item) {
        const isOwned = myInventory.includes(item.icon);
        if (!isOwned) {
            if(!confirm(`Acheter ${item.name} pour ${item.price} pièces ?`)) return;
            try {
                const res = await fetch(`${API_URL}/api/shop/buy`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${myToken}` }, body: JSON.stringify({ badge: item.icon, price: item.price }) });
                const data = await res.json(); if(res.ok) { alert(data.message); updateStats(); } else alert(data.error);
            } catch(e) {}
        } else {
            try {
                const res = await fetch(`${API_URL}/api/shop/equip`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${myToken}` }, body: JSON.stringify({ badge: item.icon }) });
                const data = await res.json(); if(res.ok) updateStats(); else alert(data.error);
            } catch(e) {}
        }
    }

    async function updateStats() {
        if(!myToken) return;
        try {
            const res = await fetch(`${API_URL}/api/me`, { headers: { "Authorization": `Bearer ${myToken}` } });
            const data = await res.json();
            if(data) {
                if(myLevelSpan) myLevelSpan.textContent = data.niveau || 1;
                let xp = data.xp || 0; let progress = xp % 100;
                if(xpProgress) xpProgress.style.width = `${progress}%`;
                if(shopCoinsDisplay) shopCoinsDisplay.textContent = data.coins || 0;
                myInventory = data.inventory || [];
                myEquippedBadges = data.active_badges || [];
                renderShop();
            }
        } catch(e) {}
    }

    // ----------------------------------------------------
    // --- 4. AUTH & UI ---
    // ----------------------------------------------------
    async function handleRegister(e) { 
        e.preventDefault(); if(btnCreer.disabled)return; 
        const nom=nomInput.value.trim(), prenom=prenomInput.value.trim(), password=passInput.value.trim(); 
        if(!nom||!prenom||!password)return alert("Tout remplir"); btnCreer.disabled=true; 
        try{
            const r=await fetch(`${API_URL}/api/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nom,prenom,password})});
            if(r.ok) alert("Compte créé !");
            else { const d = await r.json(); alert(d.message || "Erreur"); }
        }catch(e){}finally{btnCreer.disabled=false} 
    }
    
    async function handleLogin(e) { 
        e.preventDefault(); if(btnConnexion.disabled)return; 
        const nom=nomInput.value.trim(), prenom=prenomInput.value.trim(), password=passInput.value.trim(); 
        btnConnexion.disabled=true; 
        try {
            const r=await fetch(`${API_URL}/api/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nom,prenom,password})});
            const d=await r.json();
            if(r.ok){
                localStorage.setItem("token",d.token); localStorage.setItem("userId",d.userId);
                // Sauvegarde statut Admin
                localStorage.setItem("isAdmin", d.isAdmin);
                myToken=d.token; myUserId=d.userId; 
                amIAdmin = d.isAdmin === 1;
                updateUI(); fetchMessages();
            } else {
                if(d.error === "BANNED_IP" || d.error === "BANNED_ACCOUNT") { 
                    authContainer.style.display = 'none'; 
                    bannedOverlay.classList.remove('hidden'); 
                } else alert(d.message || d.error);
            }
        }catch(e){}finally{btnConnexion.disabled=false} 
    }

    // Envoi Ticket (Ecran Banni)
    document.getElementById('send-ticket-btn').addEventListener('click', async () => {
        const msg = document.getElementById('ticket-msg').value; const pseudo = document.getElementById("nom").value;
        if(!msg) return alert("Message vide");
        await fetch(`${API_URL}/api/ticket`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message: msg, pseudo: pseudo }) });
        alert("Ticket envoyé aux admins !"); document.getElementById('ticket-msg').value = "";
    });
    
    // Bouton fermer overlay ban
    document.getElementById('close-banned').addEventListener('click', () => { window.location.reload(); });

    function updateUI() {
        if(myToken) {
            authContainer.style.display = 'none'; inputContainer.style.display = 'flex';
            if(logoutBtn) logoutBtn.style.display = 'flex'; if(levelContainer) levelContainer.style.display = 'flex';
            fetchCategories(); fetchUsers(); updateStats();
        } else {
            authContainer.style.display = 'block'; inputContainer.style.display = 'none';
            if(logoutBtn) logoutBtn.style.display = 'none'; if(levelContainer) levelContainer.style.display = 'none';
        }
    }

    // ----------------------------------------------------
    // --- 5. MUSIQUE (AVEC TON FICHIER) ---
    // ----------------------------------------------------
    const PLAYLIST = [
        { title: "Cyberpunk City", src: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Kai_Engel/Satin/Kai_Engel_-_04_-_Sentinel.mp3" },
        { title: "Chill Vibes",    src: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3" },
        { title: "Retro Gaming",   src: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Rolemusic/The_Pirate_And_The_Dancer/Rolemusic_-_04_-_The_Pirate_And_The_Dancer.mp3" },
        { title: "Night Drive",    src: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Elisions.mp3" },
        { title: "Teddy un p'tit +", src: "asset/Teddylegénieincompris.mp3" }
    ];

    const audioPlayer = new Audio();
    let currentTrackIndex = 0;
    let isPlaying = false;
    const playPauseBtn = document.getElementById('play-pause');
    const nextBtn = document.getElementById('next-track');
    const prevBtn = document.getElementById('prev-track');
    const trackNameSpan = document.getElementById('track-name');
    const musicContainer = document.getElementById('music-player');

    function loadTrack(index) { if (index < 0) index = PLAYLIST.length - 1; if (index >= PLAYLIST.length) index = 0; currentTrackIndex = index; audioPlayer.src = PLAYLIST[index].src; trackNameSpan.textContent = PLAYLIST[index].title; }
    function togglePlay() { if (isPlaying) { audioPlayer.pause(); playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; trackNameSpan.textContent = "Pause"; musicContainer.classList.remove("playing"); } else { audioPlayer.play().catch(e => console.log(e)); playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; trackNameSpan.textContent = PLAYLIST[currentTrackIndex].title; musicContainer.classList.add("playing"); } isPlaying = !isPlaying; }
    function nextTrack() { currentTrackIndex++; if (currentTrackIndex >= PLAYLIST.length) currentTrackIndex = 0; loadTrack(currentTrackIndex); if(isPlaying) audioPlayer.play(); }
    function prevTrack() { currentTrackIndex--; if (currentTrackIndex < 0) currentTrackIndex = PLAYLIST.length - 1; loadTrack(currentTrackIndex); if(isPlaying) audioPlayer.play(); }
    audioPlayer.addEventListener('ended', nextTrack);
    if(playPauseBtn) { loadTrack(0); playPauseBtn.addEventListener('click', togglePlay); nextBtn.addEventListener('click', nextTrack); prevBtn.addEventListener('click', prevTrack); trackNameSpan.addEventListener('click', nextTrack); trackNameSpan.style.cursor = "pointer"; }

    // ----------------------------------------------------
    // --- 6. INITIALISATION ---
    // ----------------------------------------------------
    if(openShopBtn) openShopBtn.addEventListener('click', () => { updateStats(); shopModal.classList.remove('hidden'); });
    if(closeShopBtn) closeShopBtn.addEventListener('click', () => shopModal.classList.add('hidden'));
    if(btnCreer) btnCreer.addEventListener('click', handleRegister);
    if(btnConnexion) btnConnexion.addEventListener('click', handleLogin);
    if(sendButton) sendButton.addEventListener('click', sendMessage);
    if(logoutBtn) logoutBtn.addEventListener('click', ()=>{localStorage.clear();window.location.reload()});
    if(messageInput) messageInput.addEventListener('keypress', e=>{if(e.key==='Enter'){e.preventDefault();sendMessage()}});
    if(categorySelector) categorySelector.addEventListener('change', e=>{currentCategoryId=e.target.value;fetchMessages()});
    if(imageInput) imageInput.addEventListener('change', function(){const f=this.files[0];if(f){const r=new FileReader();r.onload=(e)=>{currentBase64Image=e.target.result;if(previewContainer){previewContainer.style.display='block';fileNameSpan.textContent=f.name}};r.readAsDataURL(f)}});
    if(cancelImgBtn) cancelImgBtn.addEventListener('click', ()=>{currentBase64Image=null;imageInput.value="";previewContainer.style.display='none'});
    
    // Boucle de mise à jour (2 sec)
    setInterval(()=>{ if(myToken){fetchMessages();fetchUsers();updateStats();} }, 2000);
    
    // Anti-inspecteur (Optionnel)
    document.addEventListener('contextmenu', e=>e.preventDefault());
    document.addEventListener('keydown', e=>{if(e.key==='F12'||(e.ctrlKey&&e.shiftKey&&e.key==='I'))e.preventDefault()});

    updateUI();
});