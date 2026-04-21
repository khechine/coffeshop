let currentTab = 'catalogue';
// storeId is already declared in gestion.html and available globally

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
    console.log("Rachma Management: Refreshing data for store", storeId);

    try {
        // Individual fetchers to allow partial failures
        const fetchData = async (url) => {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (e) {
                console.warn(`Failed to fetch ${url}:`, e);
                return null;
            }
        };

        const [products, stock, summary, mktProducts, categories] = await Promise.all([
            fetchData(`${CONFIG.API_URL}/management/products/${storeId}`),
            fetchData(`${CONFIG.API_URL}/management/stock/${storeId}`),
            fetchData(`${CONFIG.API_URL}/management/reports/summary/${storeId}`),
            fetchData(`${CONFIG.API_URL}/management/marketplace/products`),
            fetchData(`${CONFIG.API_URL}/management/categories/${storeId}`)
        ]);

        state.products = products || [];
        state.stock = stock || [];
        state.finance.summary = summary;
        state.marketplace.products = mktProducts || [];
        state.categories = categories || [];

        renderView();
    } catch (e) {
        console.error("Critical error in refreshData", e);
        document.getElementById('mgmt-viewport').innerHTML = `
            <div class="error-state">
                <p>⚠️ Erreur de chargement.</p>
                <button class="primary-btn" onclick="refreshData()">Réessayer</button>
            </div>
        `;
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
    if (!viewport) return;
    
    console.log("Rachma Management: Rendering view", currentTab);
    
    try {
        if (currentTab === 'catalogue') renderCatalogue(viewport);
        else if (currentTab === 'stocks') renderStocks(viewport);
        else if (currentTab === 'marketplace') renderMarketplace(viewport);
        else if (currentTab === 'finance') renderFinance(viewport);
    } catch (e) {
        console.error("Rendering error", e);
        viewport.innerHTML = `<div class="error-state"><p>⚠️ Erreur d'affichage : ${e.message}</p></div>`;
    }
}

function renderCatalogue(container) {
    let html = `<h2>Votre Catalogue</h2>`;
    if (!state.products || state.products.length === 0) {
        html += `<p class="item-meta">Aucun produit trouvé.</p>`;
        container.innerHTML = html;
        return;
    }
    
    html += `<div class="mgmt-grid">`;
    state.products.forEach(p => {
        const price = Number(p.price || 0).toFixed(3);
        const catName = p.category ? p.category.name : 'Général';
        html += `
            <div class="mgmt-card" onclick="openEditProductSheet('${p.id}')">
                <span class="card-icon">${p.icon || '📦'}</span>
                <div class="card-title">${catName}</div>
                <div class="card-value">${price} DT</div>
                <div class="item-name">${p.name || 'Produit sans nom'}</div>
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
    if (!state.stock || state.stock.length === 0) {
        html += `<p class="item-meta">Aucun article en stock trouvé.</p>`;
        container.innerHTML = html;
        return;
    }

    state.stock.forEach(s => {
        const level = Number(s.quantity || 0);
        const threshold = Number(s.minThreshold || 0);
        const isLow = level <= threshold;
        
        html += `
            <div class="list-item" onclick="openEditStockSheet('${s.id}')">
                <div class="item-info">
                    <div class="item-name">${s.name || 'Article sans nom'}</div>
                    <div class="item-meta">Seuil: ${threshold} | Unité: ${s.unit ? s.unit.name : 'u'}</div>
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
    if (!sum) {
        container.innerHTML = `<div class="error-state"><p>Données financières indisponibles.</p></div>`;
        return;
    }

    let html = `<h2>Performance Financière</h2>`;
    const todayTotal = Number(sum.today?.total || 0).toFixed(3);
    const monthNet = Number(sum.month?.net || 0).toFixed(3);

    html += `
        <div class="mgmt-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:24px;">
            <div class="mgmt-card">
                <div class="card-title">Aujourd'hui</div>
                <div class="card-value">${todayTotal}</div>
                <div class="item-meta">${sum.today?.count || 0} ventes</div>
            </div>
            <div class="mgmt-card" style="border-color: var(--accent);">
                <div class="card-title">Marge Mois</div>
                <div class="card-value" style="color:var(--accent);">${monthNet}</div>
                <div class="item-meta">Ventes - Dépenses</div>
            </div>
        </div>
        
        <h3>Dépenses Récentes</h3>
        <button class="primary-btn" onclick="openAddExpenseSheet()" style="background:var(--bg-surface); margin-bottom:16px;">Saisir une dépense</button>
        <div id="expense-list">
            <!-- Liste des dépenses en cours... -->
        </div>
    `;
    container.innerHTML = html;
}

function renderMarketplace(container) {
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h2>Marketplace B2B</h2>
                    <button class="header-tab" onclick="fetchMarketplaceOrders()" style="font-size:11px; padding:4px 8px;">Mes Commandes</button>
                </div>`;
    
    if (!state.marketplace.products || state.marketplace.products.length === 0) {
        html += `<p class="item-meta">Chargement du marché...</p>`;
    }

    html += `<div class="mgmt-grid">`;
    (state.marketplace.products || []).forEach(p => {
        const price = Number(p.price || 0).toFixed(3);
        html += `
            <div class="mgmt-card">
                <div class="card-title">${p.vendor ? p.vendor.companyName : 'Fournisseur'}</div>
                <div class="item-name">${p.name || 'Produit'}</div>
                <div class="card-value" style="font-size:16px;">${price} DT / ${p.unit || 'u'}</div>
                <button class="primary-btn" style="margin-top:12px; padding:8px 12px; font-size:12px;" onclick="handleOrderFromMkt('${p.id}')">Commander</button>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

async function fetchMarketplaceOrders() {
    const orders = await (async (url) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`Failed to fetch ${url}:`, e);
            return null;
        }
    })(`${CONFIG.API_URL}/management/orders/${storeId}`);
    
    if (!orders) return;

    let html = `<div style="padding-bottom:20px;">`;
    orders.forEach(o => {
        const statusClass = o.status === 'DELIVERED' ? 'badge-ok' : 'badge-low';
        html += `
            <div class="list-item" style="flex-direction:column; align-items:flex-start; gap:8px;">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <div class="item-name">Cmd #${o.id.substring(0,6)}</div>
                    <div class="item-badge ${statusClass}">${o.status}</div>
                </div>
                <div class="item-meta">${o.supplier?.name || o.vendor?.companyName || 'Fournisseur'} • ${Number(o.total).toFixed(3)} DT</div>
                <div class="item-meta" style="font-size:10px;">${new Date(o.createdAt).toLocaleDateString()}</div>
            </div>
        `;
    });
    html += `</div>`;
    openSheet("Historique Commandes", html);
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

function openEditProductSheet(id) {
    const p = state.products.find(x => x.id === id);
    if (!p) return;

    const catOptions = (state.categories || []).map(c => 
        `<option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const html = `
        <div class="form-group">
            <label>Nom du Produit</label>
            <input type="text" id="edit-prod-name" value="${p.name}">
        </div>
        <div class="form-group">
            <label>Prix (DT)</label>
            <input type="number" id="edit-prod-price" step="0.001" value="${Number(p.price || 0).toFixed(3)}">
        </div>
        <div class="form-group">
            <label>Catégorie</label>
            <select id="edit-prod-cat">${catOptions}</select>
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="edit-prod-active" ${p.active ? 'checked' : ''} style="width:20px; height:20px;">
            <label style="margin:0;">Produit Actif</label>
        </div>
        <button class="primary-btn" onclick="submitEditProduct('${p.id}')">Mettre à Jour</button>
    `;
    openSheet("Modifier Produit", html);
}

function openEditStockSheet(id) {
    const s = state.stock.find(x => x.id === id);
    if (!s) return;

    const html = `
        <div class="item-name" style="margin-bottom:15px;">${s.name}</div>
        <div class="form-group">
            <label>Quantité actuelle (${s.unit?.name || ''})</label>
            <input type="number" id="edit-stock-qty" step="0.01" value="${Number(s.quantity).toFixed(2)}">
        </div>
        <div class="form-group">
            <label>Seuil d'alerte</label>
            <input type="number" id="edit-stock-min" step="0.01" value="${Number(s.minThreshold).toFixed(2)}">
        </div>
        <button class="primary-btn" onclick="submitEditStock('${s.id}')">Mettre à Jour le Stock</button>
    `;
    openSheet("Ajuster Stock", html);
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

async function submitEditProduct(id) {
    const name = document.getElementById('edit-prod-name').value;
    const price = document.getElementById('edit-prod-price').value;
    const catId = document.getElementById('edit-prod-cat').value;
    const active = document.getElementById('edit-prod-active').checked;

    const res = await fetch(`${CONFIG.API_URL}/management/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), categoryId: catId, active })
    });

    if (res.ok) {
        closeSheet();
        refreshData();
    }
}

async function submitEditStock(id) {
    const quantity = document.getElementById('edit-stock-qty').value;
    const minThreshold = document.getElementById('edit-stock-min').value;

    const res = await fetch(`${CONFIG.API_URL}/management/stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(quantity), minThreshold: Number(minThreshold) })
    });

    if (res.ok) {
        closeSheet();
        refreshData();
    }
}

async function handleOrderFromMkt(productId) {
    const p = state.marketplace.products.find(x => x.id === productId);
    if (!p) return;

    const ok = await ModernModal.confirm({
        title: "Passer Commande",
        message: `Commander ${p.name} auprès de ${p.vendor?.companyName} ?`,
        icon: '🛒'
    });

    if (ok) {
        const res = await fetch(`${CONFIG.API_URL}/management/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeId,
                vendorId: p.vendorId,
                total: Number(p.price),
                items: [{ name: p.name, quantity: 1, price: Number(p.price) }]
            })
        });

        if (res.ok) {
            ModernModal.alert({title:"Commande Réussie", message:"Votre fournisseur a été notifié.", icon:"✅"});
            refreshData();
        }
    }
}

// Initial Load
try {
    refreshData();
} catch (e) {
    console.error("Critical initialization error", e);
}
