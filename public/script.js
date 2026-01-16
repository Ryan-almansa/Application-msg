// --- CONFIGURATION BOUTIQUE ---
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

// J'ai RE-ACTIVÉ la console pour qu'on puisse voir les erreurs (F12)
// console.log = function() {}; 

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = `http://${window.location.hostname}:20000`;

    // Elements DOM
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const categorySelector = document.getElementById("category-selector");
    const userList = document.getElementById('user-list');
    const authContainer = document.getElementById('auth-container');
    const inputContainer = document.getElementById('input-container');
    const logoutBtn = document.getElementById('logout-btn');
    const offlineOverlay = document.getElementById('offline-overlay');

    // Stats & Shop
    const levelContainer = document.getElementById('level-container');
    const myLevelSpan = document.getElementById('my-level');
    const xpProgress = document.getElementById('xp-progress');
    const shopCoinsDisplay = document.getElementById('shop-coins-display');
    const shopModal = document.getElementById('shop-modal');
    const openShopBtn = document.getElementById('open-shop-btn');
    const closeShopBtn = document.getElementById('close-shop');
    const shopItemsContainer = document.getElementById('shop-items-container');

    // Auth
    const nomInput = document.getElementById("nom");
    const prenomInput = document.getElementById("prenom");
    const passInput = document.getElementById("password");
    const btnCreer = document.getElementById("creer");
    const btnConnexion = document.getElementById("connexion");

    const imageInput = document.getElementById('image-input');
    const previewContainer = document.getElementById('preview-container');
    const fileNameSpan = document.getElementById('file-name');
    const cancelImgBtn = document.getElementById('cancel-img');
    const newCategoryInput = document.getElementById("new-category");
    const addCategoryButton = document.getElementById("add-category");
    
    let currentBase64Image = null;
    let currentCategoryId = 1;
    let myToken = localStorage.getItem("token");
    let myUserId = localStorage.getItem("userId");
    
    let myInventory = []; 
    let myEquippedBadges = [];

    // --- 1. BOUTIQUE ---
    function renderShop() {
        if(!shopItemsContainer) return;
        shopItemsContainer.innerHTML = '';
        
        SHOP_ITEMS.forEach(item => {
            const div = document.createElement('div');
            
            // Vérification stricte
            const isOwned = myInventory.includes(item.icon);
            const isEquipped = myEquippedBadges.includes(item.icon);
            
            div.className = `shop-item ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
            
            // IMPORTANT : On passe l'item au clic
            div.onclick = function() { handleShopClick(item); };

            let statusText = `<span class="badge-price">${item.price} <i class="fa-solid fa-coins"></i></span>`;
            
            if (isEquipped) statusText = `<span class="status-text equipped">ÉQUIPÉ ✅</span>`;
            else if (isOwned) statusText = `<span class="status-text owned">ACQUIS (Cliquer)</span>`;

            div.innerHTML = `
                <span class="badge-icon">${item.icon}</span>
                <span class="badge-name">${item.name}</span>
                ${statusText}
            `;
            shopItemsContainer.appendChild(div);
        });
    }

    async function handleShopClick(item) {
        // On rafraichit les stats AVANT de décider pour être sûr
        await updateStats();
        
        const isOwned = myInventory.includes(item.icon);

        if (!isOwned) {
            // --- ACHAT ---
            if(!confirm(`Acheter ${item.name} pour ${item.price} pièces ?`)) return;
            
            try {
                const res = await fetch(`${API_URL}/api/shop/buy`, {
                    method: "POST", 
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${myToken}` },
                    body: JSON.stringify({ badge: item.icon, price: item.price })
                });
                const data = await res.json();
                
                if(res.ok) { 
                    alert("Achat réussi !"); 
                    await updateStats(); 
                } else {
                    alert("Erreur achat : " + data.error);
                }
            } catch(e) {
                alert("Erreur connexion : " + e.message);
            }
        } else {
            // --- ÉQUIPER ---
            try {
                const res = await fetch(`${API_URL}/api/shop/equip`, {
                    method: "POST", 
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${myToken}` },
                    body: JSON.stringify({ badge: item.icon })
                });
                const data = await res.json();
                
                if(res.ok) {
                    await updateStats(); // Mise à jour visuelle immédiate
                } else {
                    alert("Erreur équipement : " + data.error);
                }
            } catch(e) {
                alert("Erreur connexion : " + e.message);
            }
        }
    }

    // --- 2. GESTION DONNÉES ---
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
                
                // Nettoyage des données reçues
                myInventory = data.inventory || [];
                myEquippedBadges = data.active_badge ? data.active_badge.split(',').filter(b => b && b.trim() !== "") : [];
                
                renderShop();
            }
        } catch(e) {
            console.error("Erreur updateStats:", e);
        }
    }

    // --- UI & RESTE DU CODE ---
    function updateUI() {
        if(myToken) {
            authContainer.style.display = 'none'; inputContainer.style.display = 'flex';
            if(logoutBtn) logoutBtn.style.display = 'flex';
            if(levelContainer) levelContainer.style.display = 'flex';
            fetchCategories(); fetchUsers(); updateStats();
        } else {
            authContainer.style.display = 'block'; inputContainer.style.display = 'none';
            if(logoutBtn) logoutBtn.style.display = 'none';
            if(levelContainer) levelContainer.style.display = 'none';
        }
    }
    updateUI();

    async function fetchMessages() {
        if (!messagesContainer || !myToken) return;
        try {
            const res = await fetch(`${API_URL}/api/recuperation?categorie=${currentCategoryId}`);
            if(offlineOverlay) offlineOverlay.classList.add('hidden');
            if (!res.ok) return;
            const data = await res.json();
            messagesContainer.innerHTML = "";
            data.forEach(msg => {
                const div = document.createElement("div"); div.className = "message";
                if (msg.idutilisateur == myUserId) { div.classList.add("own-message"); div.style.marginLeft = "auto"; }
                
                let badgesHtml = '';
                if (msg.active_badge) { 
                    msg.active_badge.split(',').filter(b => b !== "").forEach(b => { 
                        badgesHtml += `<span class="user-badge">${b}</span>`; 
                    }); 
                }
                div.innerHTML = `<div class="msg-header">${badgesHtml} <strong>${msg.nom}</strong> <span class="user-lvl">Lvl ${msg.niveau}</span></div>${msg.contenu ? `<span>${msg.contenu}</span>` : ''}${msg.image ? `<img src="${msg.image}" class="msg-image">` : ''}<div class="msg-time">${msg.heure}</div>`;
                messagesContainer.appendChild(div);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch(e) { if(offlineOverlay) offlineOverlay.classList.remove('hidden'); }
    }

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
                else { if(data.xp>0) updateStats(); fetchMessages(); }
            }
        } catch(e) {}
    }

    // Listeners
    async function handleRegister(e) { e.preventDefault(); if(btnCreer.disabled)return; const nom=nomInput.value.trim(), prenom=prenomInput.value.trim(), password=passInput.value.trim(); if(!nom||!prenom||!password)return alert("Tout remplir"); btnCreer.disabled=true; try{const r=await fetch(`${API_URL}/api/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nom,prenom,password})});if(r.ok)alert("Compte créé");else alert("Erreur");}catch(e){}finally{btnCreer.disabled=false} }
    async function handleLogin(e) { e.preventDefault(); if(btnConnexion.disabled)return; const nom=nomInput.value.trim(), prenom=prenomInput.value.trim(), password=passInput.value.trim(); btnConnexion.disabled=true; try{const r=await fetch(`${API_URL}/api/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nom,prenom,password})});const d=await r.json();if(r.ok){localStorage.setItem("token",d.token);localStorage.setItem("userId",d.userId);myToken=d.token;myUserId=d.userId;updateUI();fetchMessages();}else alert(d.error);}catch(e){}finally{btnConnexion.disabled=false} }

    if(openShopBtn) openShopBtn.addEventListener('click', () => { updateStats(); shopModal.classList.remove('hidden'); });
    if(closeShopBtn) closeShopBtn.addEventListener('click', () => shopModal.classList.add('hidden'));
    
    if(btnCreer) btnCreer.addEventListener('click', handleRegister);
    if(btnConnexion) btnConnexion.addEventListener('click', handleLogin);
    if(sendButton) sendButton.addEventListener('click', sendMessage);
    if(logoutBtn) logoutBtn.addEventListener('click', ()=>{localStorage.clear();window.location.reload()});
    if(messageInput) messageInput.addEventListener('keypress', e=>{if(e.key==='Enter'){e.preventDefault();sendMessage()}});
    if(categorySelector) categorySelector.addEventListener('change', e=>{currentCategoryId=e.target.value;fetchMessages()});

    async function fetchCategories(){try{const r=await fetch(`${API_URL}/api/categories`);const d=await r.json();if(categorySelector){categorySelector.innerHTML="";d.categories.forEach(c=>{const o=document.createElement("option");o.value=c.idcategorie;o.textContent=c.nom;categorySelector.appendChild(o)});if(currentCategoryId===1&&d.categories.length>0)currentCategoryId=d.categories[0].idcategorie;fetchMessages()}}catch(e){}}
    async function fetchUsers(){if(!userList)return;try{const r=await fetch(`${API_URL}/api/getutilisateur`);const d=await r.json();userList.innerHTML="";d.users.forEach(u=>{let o=(u.en_ligne===1)||(u.idutilisateur==myUserId);const l=document.createElement('li');l.innerHTML=`<span class="status-dot ${o?"online":"offline"}"></span> ${u.nom}`;userList.appendChild(l)})}catch(e){}}
    if(imageInput) imageInput.addEventListener('change', function(){const f=this.files[0];if(f){const r=new FileReader();r.onload=(e)=>{currentBase64Image=e.target.result;if(previewContainer){previewContainer.style.display='block';fileNameSpan.textContent=f.name}};r.readAsDataURL(f)}});
    if(cancelImgBtn) cancelImgBtn.addEventListener('click', ()=>{currentBase64Image=null;imageInput.value="";previewContainer.style.display='none'});
    
    setInterval(()=>{ if(myToken){fetchMessages();fetchUsers();updateStats();} }, 2000);
});