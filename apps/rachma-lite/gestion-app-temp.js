    });
}

function showLoading() {
    document.getElementById('mgmt-viewport').innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des dossiers...</p>
        </div>`;
}

function handleSearch(tab, value) {
    state.filters[tab] = value.toLowerCase();
    
    // Partially update only the grid/list to keep focus on input
    const resultsContainer = document.getElementById(`${tab}-results`);
    if (resultsContainer) {
        if (tab === 'catalogue') renderCatalogueItems(resultsContainer);
        else if (tab === 'stocks') renderStockItems(resultsContainer);
        else if (tab === 'marketplace') renderMarketplaceItems(resultsContainer);
    } else {
        renderView();
    }
}

function renderSearchHeader(tab, placeholder) {
    return `
        <div class="search-bar-container" style="margin-bottom: 20px;">
            <input type="text" 
                   class="search-input" 
                   placeholder="${placeholder}" 
                   value="${state.filters[tab]}"
                   oninput="handleSearch('${tab}', this.value)"
                   style="width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-glass); background: rgba(255,255,255,0.03); color: white; font-size: 14px;">
        </div>
    `;
}

// ═════════════════════════�function renderCatalogue(container) {
    let html = `<h2>Votre Catalogue</h2>`;
    html += renderSearchHeader('catalogue', 'Rechercher un produit ou catégorie...');
    html += `<div id="catalogue-results"></div>`;
    container.innerHTML = html;
    renderCatalogueItems(document.getElementById('catalogue-results'));
}

function renderCatalogueItems(container) {
    const query = state.filters.catalogue;
    const filtered = state.products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const catName = (p.category?.name || '').toLowerCase();
        return name.includes(query) || catName.includes(query);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p class="item-meta" style="margin-top:20px;">Aucun produit ne correspond à votre recherche.</p>`;
        return;
    }
    
    let html = `<div class="mgmt-grid">`;
    filtered.forEach(p => {
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
>function renderStocks(container) {
    let html = `<h2>Gestion des Stocks</h2>`;
    html += renderSearchHeader('stocks', 'Rechercher un article ou fournisseur...');
    html += `<div id="stocks-results"></div>`;
    container.innerHTML = html;
    renderStockItems(document.getElementById('stocks-results'));
}

function renderStockItems(container) {
    const query = state.filters.stocks;
    const filtered = state.stock.filter(s => {
        const name = (s.name || '').toLowerCase();
        const supplierName = (s.preferredSupplier?.name || '').toLowerCase();
        return name.includes(query) || supplierName.includes(query);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p class="item-meta" style="margin-top:20px;">Aucun article trouvé.</p>`;
        return;
    }

    let html = '';
    filtered.forEach(s => {
        const level = Number(s.quantity || 0);
        const threshold = Number(s.minThreshold || 0);
        const isLow = level <= threshold;
        
        html += `
            <div class="list-item" onclick="openEditStockSheet('${s.id}')">
                <div class="item-info">
                    <div class="item-name">${s.name || 'Article sans nom'}</div>
                    <div class="item-meta">
                        ${s.preferredSupplier ? `🚚 ${s.preferredSupplier.name} | ` : ''}
                        Seuil: ${threshold} ${s.unit?.name || 'u'}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div class="card-value" style="font-size:18px;">${level.toFixed(2)}</div>
                    <div class="item-meta" style="font-size:10px; margin-top:2px;">Coût: ${Number(s.cost || 0).toFixed(3)} DT</div>
                    <div class="item-badge ${isLow ? 'badge-low' : 'badge-ok'}" style="margin-top:4px;">${isLow ? 'ALERTE' : 'OK'}</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}
   html += `
            <div class="list-item" onclick="openEditStockSheet('${s.id}')">
                <div class="item-info">
                    <div class="item-name">${s.name || 'Article sans nom'}</div>
                    <div class="item-meta">
                        ${s.preferredSupplier ? `🚚 ${s.preferredSupplier.name} | ` : ''}
                        Seuil: ${threshold} ${s.unit?.name || 'u'}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div class="card-value" style="font-size:18px;">${level.toFixed(2)}</div>
                    <div class="item-meta" style="font-size:10px; margin-top:2px;">Coût: ${Number(s.cost || 0).toFixed(3)} DT</div>
                    <div class="item-badge ${isLow ? 'badge-low' : 'badge-ok'}" style="margin-top:4px;">${isLow ? 'ALERTE' : 'OK'}</div>
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
        
        <h3>Ventes (7 derniers jours)</h3>
        <div class="simple-chart" style="display:flex; align-items:flex-end; gap:8px; height:120px; padding:10px 0; margin-bottom:30px;">
            ${(sum.chart || []).map(d => {
                const max = Math.max(...sum.chart.map(x => x.total)) || 1;
                const height = (d.total / max) * 100;
                return `
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <div style="width:100%; height:${height}px; background:rgba(16, 185, 129, 0.4); border-radius:4px 4px 0 0; min-height:2px;"></div>
                        <span style="font-size:8px; color:var(--text-muted);">${d.date.substring(8, 10)}</span>
                    </div>
                `;
            }).join('')}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3>Dépenses Récentes</h3>
            <button class="primary-btn" onclick="openAddExpenseSheet()" style="width:auto; padding:6px 12px; font-size:11px; margin:0;">Saisir</button>
        </div>
        <div id="expense-list">
            ${(state.finance.expenses || []).map(exp => `
                <div class="list-item" style="padding:12px; margin-bottom:6px;">
                    <div class="item-info">
                        <div class="item-name">${exp.category}</div>
                        <div class="item-meta" style="font-size:10px;">${exp.description || ''}</div>
                    </div>
                    <div style="text-align:right;">
                        <div class="card-value" style="font-size:14px;">-${Number(exp.amount).toFixed(3)}</div>
                        <div class="item-meta" style="font-size:9px;">${new Date(exp.date).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    container.innerHTML = html;
}

function renderMarketplace(container) {
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h2>Marketplace B2B</h2>
                    <button class="header-tab" onclick="fetchMarketplaceOrders()" style="font-size:11px; padding:4px 8px;">Mes Commandes</button>
                </div>`;
    
    html += renderSearchHeader('marketplace', 'Rechercher un fournisseur ou produit...');
    html += `<div id="marketplace-results"></div>`;
    container.innerHTML = html;
    renderMarketplaceItems(document.getElementById('marketplace-results'));
}

function renderMarketplaceItems(container) {
    if (!state.marketplace.products || state.marketplace.products.length === 0) {
        container.innerHTML = `<p class="item-meta">Chargement du marché...</p>`;
        return;
    }

    const query = state.filters.marketplace;
    const filtered = state.marketplace.products.filter(p => {
        const vendorName = (p.vendor?.companyName || '').toLowerCase();
        const prodName = (p.name || '').toLowerCase();
        return prodName.includes(query) || vendorName.includes(query);
    });

    let html = `<div class="mgmt-grid">`;
    filtered.forEach(p => {
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
