let currentTab = 'catalogue';
const storeId = localStorage.getItem('rachma_store_id');

// View state
let state = {
    products: [],
    categories: [],
    stock: [],
    marketplace: { vendors: [], products: [], orders: [] },
    finance: { summary: null, expenses: [] }
};

// ═══════════════════════════════════════════════════════════
// CORE NAVIGATION & UI
// ═══════════════════════════════════════════════════════════

function switchMgmtTab(tabId) {
    currentTab = tabId;
    
    // Update active tab button
    document.querySelectorAll('.header-tab').forEach(btn => {
        const isActive = btn.innerText.toLowerCase().includes(tabId.substring(0, 4));
        btn.classList.toggle('active', isActive);
    });

    // Update FAB
    const fab = document.getElementById('smart-fab');
    if (tabId === 'marketplace') {
        fab.style.display = 'none'; // Marketplace browsing has its own flow
    } else {
        fab.style.display = 'flex';
    }

    renderView();
}

function handleFabAction() {
    switch (currentTab) {
        case 'catalogue':
            openAddProductSheet();
            break;
        case 'stocks':
            openAddStockSheet();
            break;
        case 'finance':
            openAddExpenseSheet();
            break;
    }
}

// ═══════════════════════════════════════════════════════════
// BOTTOM SHEET FRAMEWORK
// ═══════════════════════════════════════════════════════════

function openSheet(title, html) {
    document.getElementById('sheet-title').innerText = title;
    document.getElementById('sheet-body').innerHTML = html;
    document.getElementById('bottom-sheet').classList.add('active');
}

function closeSheet() {
    document.getElementById('bottom-sheet').classList.remove('active');
}

// ═══════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════

async function refreshData() {
    if (!storeId) return;
    
    showLoading();
    try {
        const [prodRes, stockRes, finRes, mktRes] = await Promise.all([
            fetch(`${CONFIG.API_URL}/management/products/${storeId}`),
            fetch(`${CONFIG.API_URL}/management/stock/${storeId}`),
            fetch(`${CONFIG.API_URL}/management/reports/summary/${storeId}`),
            fetch(`${CONFIG.API_URL}/management/marketplace/products`)
        ]);

        state.products = await prodRes.json();
        state.stock = await stockRes.json();
        state.finance.summary = await finRes.json();
        state.marketplace.products = await mktRes.json();

        // Extra context
        const catRes = await fetch(`${CONFIG.API_URL}/management/categories/${storeId}`);
        state.categories = await catRes.json();

        renderView();
    } catch (e) {
        console.error("Fetch error", e);
        document.getElementById('mgmt-viewport').innerHTML = `<p class='error'>Erreur de connexion API.</p>`;
    }
}

function showLoading() {
    document.getElementById('mgmt-viewport').innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des dossiers...</p>
        </div>`;
}

// ═══════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════

function renderView() {
    const viewport = document.getElementById('mgmt-viewport');
    
    if (currentTab === 'catalogue') renderCatalogue(viewport);
    else if (currentTab === 'stocks') renderStocks(viewport);
    else if (currentTab === 'marketplace') renderMarketplace(viewport);
    else if (currentTab === 'finance') renderFinance(viewport);
}

function renderCatalogue(container) {
    let html = `<h2>Votre Catalogue</h2>`;
    html += `<div class="mgmt-grid">`;
    state.products.forEach(p => {
        html += `
            <div class="mgmt-card" onclick="openEditProductSheet('${p.id}')">
                <span class="card-icon">${p.icon || '📦'}</span>
                <div class="card-title">${p.category?.name || 'Général'}</div>
                <div class="card-value">${Number(p.price).toFixed(3)} DT</div>
                <div class="item-name">${p.name}</div>
                <div class="item-badge ${p.active ? 'badge-ok' : 'badge-low'}" style="margin-top:10px; display:inline-block;">
                    ${p.active ? 'ACTIF' : 'DÉSACTIVÉ'}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function renderStocks(container) {
    let html = `<h2>Gestion des Stocks</h2>`;
    state.stock.forEach(s => {
        const level = Number(s.quantity);
        const threshold = Number(s.minThreshold || 0);
        const isLow = level <= threshold;
        
        html += `
            <div class="list-item" onclick="openEditStockSheet('${s.id}')">
                <div class="item-info">
                    <div class="item-name">${s.name}</div>
                    <div class="item-meta">Seuil: ${threshold} | Unité: ${s.unit?.name || 'u'}</div>
                </div>
                <div style="text-align:right;">
                    <div class="card-value" style="font-size:18px;">${level.toFixed(2)}</div>
                    <div class="item-badge ${isLow ? 'badge-low' : 'badge-ok'}">${isLow ? 'ALERTE' : 'OK'}</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderFinance(container) {
    const sum = state.finance.summary;
    if (!sum) return;

    let html = `<h2>Performance Financière</h2>`;
    html += `
        <div class="mgmt-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:24px;">
            <div class="mgmt-card">
                <div class="card-title">Aujourd'hui</div>
                <div class="card-value">${sum.today.total.toFixed(3)}</div>
                <div class="item-meta">${sum.today.count} ventes</div>
            </div>
            <div class="mgmt-card" style="border-color: var(--accent);">
                <div class="card-title">Marge Mois</div>
                <div class="card-value" style="color:var(--accent);">${sum.month.net.toFixed(3)}</div>
                <div class="item-meta">Ventes - Dépenses</div>
            </div>
        </div>
        
        <h3>Dépenses Récentes</h3>
        <button class="primary-btn" onclick="openAddExpenseSheet()" style="background:var(--bg-surface); margin-bottom:16px;">Saisir une dépense</button>
        <div id="expense-list">
            <!-- Loading expenses logic if needed -->
        </div>
    `;
    container.innerHTML = html;
}

function renderMarketplace(container) {
    let html = `<h2>Marketplace B2B</h2>`;
    html += `<div class="mgmt-grid">`;
    state.marketplace.products.forEach(p => {
        html += `
            <div class="mgmt-card">
                <div class="card-title">${p.vendor?.companyName || 'Fournisseur'}</div>
                <div class="item-name">${p.name}</div>
                <div class="card-value" style="font-size:16px;">${Number(p.price).toFixed(3)} DT / ${p.unit}</div>
                <button class="primary-btn" style="margin-top:12px; padding:8px 12px; font-size:12px;" onclick="handleOrderFromMkt('${p.id}')">Commander</button>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// FORM HANDLERS (SHEETS)
// ═══════════════════════════════════════════════════════════

function openAddProductSheet() {
    const catOptions = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const html = `
        <div class="form-group">
            <label>Nom du Produit</label>
            <input type="text" id="new-prod-name" placeholder="ex: Cappuccino Large">
        </div>
        <div class="form-group">
            <label>Prix (DT)</label>
            <input type="number" id="new-prod-price" step="0.001" placeholder="0.000">
        </div>
        <div class="form-group">
            <label>Catégorie</label>
            <select id="new-prod-cat">${catOptions}</select>
        </div>
        <button class="primary-btn" onclick="submitAddProduct()">Enregistrer le Produit</button>
    `;
    openSheet("Ajouter un Produit", html);
}

function openAddExpenseSheet() {
    const html = `
        <div class="form-group">
            <label>Catégorie</label>
            <select id="exp-cat">
                <option value="ACHAT">📦 Achat Marchandise</option>
                <option value="LOYER">🏠 Loyer</option>
                <option value="STEG">⚡ Electricité / Gaz</option>
                <option value="EAU_SONEDE">💧 Eau</option>
                <option value="SALAIRE">👥 Salaires</option>
                <option value="CNSS">🏦 CNSS</option>
                <option value="AUTRE">➕ Autre</option>
            </select>
        </div>
        <div class="form-group">
            <label>Montant (DT)</label>
            <input type="number" id="exp-amount" step="0.001" placeholder="0.000">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="exp-desc" placeholder="Détails optionnels..."></textarea>
        </div>
        <button class="primary-btn" onclick="submitAddExpense()">Enregistrer la Dépense</button>
    `;
    openSheet("Nouvelle Dépense", html);
}

// API Submission Mocks
async function submitAddProduct() {
    const name = document.getElementById('new-prod-name').value;
    const price = document.getElementById('new-prod-price').value;
    const catId = document.getElementById('new-prod-cat').value;

    if (!name || !price) return ModernModal.alert({title:"Erreur", message:"Champs requis", icon:"❌"});

    const res = await fetch(`${CONFIG.API_URL}/management/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), categoryId: catId, storeId })
    });

    if (res.ok) {
        closeSheet();
        refreshData();
    }
}

async function submitAddExpense() {
    const category = document.getElementById('exp-cat').value;
    const amount = document.getElementById('exp-amount').value;
    const description = document.getElementById('exp-desc').value;

    if (!amount) return ModernModal.alert({title:"Erreur", message:"Veuillez saisir un montant", icon:"❌"});

    const res = await fetch(`${CONFIG.API_URL}/management/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, category, amount: Number(amount), description })
    });

    if (res.ok) {
        closeSheet();
        refreshData();
    }
}

// Init
refreshData();
