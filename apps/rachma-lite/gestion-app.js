let currentTab = 'finance';
// storeId is already declared in gestion.html and available globally

// View state
let state = {
    products: [],
    categories: [],
    units: [],
    stock: [],
    suppliers: [],
    marketplace: { vendors: [], products: [], orders: [], page: 0, loading: false, hasMore: true },
    finance: { summary: null, expenses: [] },
    filters: {
        catalogue: '',
        stocks: '',
        marketplace: '',
        suppliers: ''
    }
};

// ═══════════════════════════════════════════════════════════
// CORE NAVIGATION & UI
// ═══════════════════════════════════════════════════════════

function switchMgmtTab(tabId) {
    currentTab = tabId;
    
    // Update active tab button
    document.querySelectorAll('.header-tab').forEach(btn => {
        const icon = btn.innerText;
        const mapping = {
            'catalogue': '📦',
            'stocks': '📊',
            'marketplace': '🛒',
            'suppliers': '🤝',
            'finance': '💰'
        };
        const isActive = icon === mapping[tabId];
        btn.classList.toggle('active', isActive);
    });

    // Update Page Title
    const titleMap = {
        'catalogue': '📦 Catalogue',
        'stocks': '📊 Gestion des Stocks',
        'marketplace': '🛒 Marché B2B',
        'suppliers': '🤝 Mes Fournisseurs',
        'finance': '💰 Finance & Performance'
    };
    document.getElementById('page-title').innerText = titleMap[tabId];

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
        case 'suppliers':
            openAddSupplierSheet();
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

        const [products, stock, summary, mktProducts, categories, expenses, units, suppliers] = await Promise.all([
            fetchData(`${CONFIG.API_URL}/management/products/${storeId}`),
            fetchData(`${CONFIG.API_URL}/management/stock/${storeId}`),
            fetchData(`${CONFIG.API_URL}/management/reports/summary/${storeId}`),
            fetchData(`${CONFIG.API_URL}/management/marketplace/products`),
            fetchData(`${CONFIG.API_URL}/management/categories/${storeId}`),
            fetchData(`${CONFIG.API_URL}/management/expenses/${storeId}?limit=10`),
            fetchData(`${CONFIG.API_URL}/management/units`),
            fetchData(`${CONFIG.API_URL}/management/suppliers/${storeId}`)
        ]);

        state.products = products || [];
        state.stock = stock || [];
        state.finance.summary = summary;
        state.finance.expenses = expenses || [];
        state.marketplace.products = mktProducts || [];
        state.categories = categories || [];
        state.units = units || [];
        state.suppliers = suppliers || [];

        // Check for low stock items for badge
        const lowStockCount = state.stock.filter(s => Number(s.quantity) <= Number(s.minThreshold)).length;
        updateStockBadge(lowStockCount);

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
    const viewport = document.getElementById('mgmt-viewport');
    if (viewport) {
        viewport.innerHTML = `
            <div class="loading-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; gap: 16px;">
                <div class="spinner"></div>
                <p class="item-meta">Chargement des données...</p>
            </div>`;
    }
}

function updateStockBadge(count) {
    const tabs = document.querySelectorAll('.header-tab');
    tabs.forEach(btn => {
        if (btn.innerText.includes('Stocks')) {
            const existingBadge = btn.querySelector('.tab-badge');
            if (existingBadge) existingBadge.remove();
            if (count > 0) {
                btn.innerHTML = `📊 Stocks <span class="tab-badge" style="background:#EF4444; color:white; font-size:9px; padding:2px 6px; border-radius:10px; margin-left:4px;">${count}</span>`;
            }
        }
    });
}

function handleSearch(tab, value) {
    state.filters[tab] = value.toLowerCase();
    
    // Partially update only the grid/list to keep focus on input
    const resultsContainer = document.getElementById(`${tab}-results`);
    if (resultsContainer) {
        if (tab === 'catalogue') renderCatalogueItems(resultsContainer);
        else if (tab === 'stocks') renderStockItems(resultsContainer);
        else if (tab === 'marketplace') renderMarketplaceItems(resultsContainer);
        else if (tab === 'suppliers') renderSupplierItems(resultsContainer);
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
                   value="${state.filters[tab] || ''}"
                   oninput="handleSearch('${tab}', this.value)"
                   style="width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-glass); background: rgba(255,255,255,0.03); color: white; font-size: 14px;">
        </div>
    `;
}

function renderView() {
    const viewport = document.getElementById('mgmt-viewport');
    if (!viewport) return;
    
    console.log("Rachma Management: Rendering view", currentTab);
    
    try {
        if (currentTab === 'catalogue') renderCatalogue(viewport);
        else if (currentTab === 'stocks') renderStocks(viewport);
        else if (currentTab === 'marketplace') renderMarketplace(viewport);
        else if (currentTab === 'suppliers') renderSuppliers(viewport);
        else if (currentTab === 'finance') renderFinance(viewport);
    } catch (e) {
        console.error("Rendering error", e);
        viewport.innerHTML = `<div class="error-state"><p>⚠️ Erreur d'affichage : ${e.message}</p></div>`;
    }
}

function renderCatalogue(container) {
    let html = ``;
    html += renderSearchHeader('catalogue', 'Rechercher un produit ou catégorie...');
    html += `<div id="catalogue-results"></div>`;
    container.innerHTML = html;
    renderCatalogueItems(document.getElementById('catalogue-results'));
}

function renderCatalogueItems(container) {
    const query = state.filters.catalogue || '';
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

function renderStocks(container) {
    let html = ``;
    html += renderSearchHeader('stocks', 'Rechercher un article ou fournisseur...');
    html += `<div id="stocks-results"></div>`;
    container.innerHTML = html;
    renderStockItems(document.getElementById('stocks-results'));
}

function renderStockItems(container) {
    const query = state.filters.stocks || '';
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

function renderFinance(container) {
    const sum = state.finance.summary;
    if (!sum) {
        container.innerHTML = `<div class="error-state"><p>Données financières indisponibles.</p></div>`;
        return;
    }

    // 1. Calculate Growth Trends
    const chart = sum.chart || [];
    const todayVal = chart.length > 0 ? chart[chart.length - 1].total : 0;
    const yesterdayVal = chart.length > 1 ? chart[chart.length - 2].total : 0;
    const growth = yesterdayVal > 0 ? ((todayVal - yesterdayVal) / yesterdayVal * 100).toFixed(0) : 0;
    const isUp = todayVal >= yesterdayVal;

    let html = `
        <div class="fin-kpi-grid">
            <div class="fin-card">
                <div class="fin-label">Ventes Jour</div>
                <div class="fin-value">${Number(todayVal).toFixed(3)} DT</div>
                <div class="fin-trend ${isUp ? 'up' : 'down'}">
                    ${isUp ? '↗' : '↘'} ${Math.abs(growth)}% vs hier
                </div>
            </div>
            <div class="fin-card accent">
                <div class="fin-label">Marge Mensuelle</div>
                <div class="fin-value" style="color:var(--success);">${Number(sum.month?.net || 0).toFixed(3)} DT</div>
                <div class="item-meta" style="font-size:9px; margin-top:8px;">Après dépenses</div>
            </div>
        </div>

        <div class="chart-container-premium">
            <div class="fin-label" style="margin-bottom:20px;">Activité (7 derniers jours)</div>
            ${renderFinanceChart(chart)}
        </div>

        <div class="chart-container-premium">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div class="fin-label" style="margin:0;">Répartition Dépenses</div>
                <button class="primary-btn" onclick="openAddExpenseSheet()" style="width:auto; padding:4px 10px; font-size:10px; margin:0; height:auto;">+ Saisir</button>
            </div>
            ${renderExpenseBreakdown(state.finance.expenses || [])}
        </div>

        <h3 style="margin: 32px 0 16px;">Journal des Dépenses</h3>
        <div id="expense-list">
            ${(state.finance.expenses || []).map(exp => `
                <div class="list-item" style="padding:16px;">
                    <div class="item-info">
                        <div class="item-name" style="font-size:13px;">${exp.category}</div>
                        <div class="item-meta" style="font-size:10px;">${exp.description || 'Sans description'}</div>
                    </div>
                    <div style="text-align:right;">
                        <div class="card-value" style="font-size:14px; color:var(--danger);">${Number(exp.amount).toFixed(3)} DT</div>
                        <div class="item-meta" style="font-size:10px;">${new Date(exp.date).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

function renderFinanceChart(data) {
    if (!data || data.length === 0) return '<p class="item-meta">Aucune donnée</p>';
    
    const max = Math.max(...data.map(d => d.total)) || 1;
    const height = 100;
    const width = 300;
    const step = width / (data.length - 1 || 1);
    
    // Create points for a smooth SVG path
    const points = data.map((d, i) => {
        const x = i * step;
        const y = height - (d.total / max * height);
        return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;
    const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

    return `
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; overflow:visible;">
            <defs>
                <linearGradient id="grad-finance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--success)" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="var(--success)" stop-opacity="0" />
                </linearGradient>
            </defs>
            <path d="${areaData}" fill="url(#grad-finance)" />
            <path d="${pathData}" fill="none" stroke="var(--success)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            ${data.map((d, i) => `
                <circle cx="${i * step}" cy="${height - (d.total / max * height)}" r="4" fill="var(--bg-main)" stroke="var(--success)" stroke-width="2" />
            `).join('')}
        </svg>
        <div style="display:flex; justify-content:space-between; margin-top:12px;">
            ${data.map(d => `<span style="font-size:8px; color:var(--text-muted);">${d.date.substring(8, 10)}</span>`).join('')}
        </div>
    `;
}

function renderExpenseBreakdown(expenses) {
    if (!expenses.length) return '<p class="item-meta">Aucune dépense enregistrée ce mois.</p>';
    
    const categories = {};
    let total = 0;
    expenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + Number(e.amount);
        total += Number(e.amount);
    });

    const sorted = Object.entries(categories).sort((a,b) => b[1] - a[1]);
    const colors = ['#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

    let html = `<div class="expense-breakdown-bar">`;
    sorted.forEach(([cat, amt], i) => {
        const percent = (amt / total * 100).toFixed(1);
        html += `<div class="expense-segment" style="width:${percent}%; background:${colors[i % colors.length]};"></div>`;
    });
    html += `</div>`;

    html += `<div class="legend-grid">`;
    sorted.slice(0, 5).forEach(([cat, amt], i) => {
        html += `
            <div class="legend-item">
                <div><span class="legend-dot" style="background:${colors[i % colors.length]};"></span>${cat}</div>
                <div style="color:white; font-weight:700;">${Number(amt).toFixed(3)} DT</div>
            </div>
        `;
    });
    html += `</div>`;

    return html;
}

function renderMarketplace(container) {
    let html = `
        <div class="mkt-banner">
            <div class="mkt-banner-badge">✦ MARKETPLACE PRO</div>
            <div class="mkt-banner-title">Coffeeshop B2B</div>
            <div class="mkt-banner-text">Les meilleurs prix pour votre établissement, livrés directement chez vous.</div>
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:10px;">
            <button class="header-tab" onclick="fetchMarketplaceOrders()" style="font-size:11px; padding:4px 8px; width:auto;">Mes Commandes</button>
            <button id="pwa-install-btn" class="header-tab pwa-btn" onclick="promptPwaInstall()" style="display:none; font-size:11px; padding:4px 10px; width:auto; border-color:var(--accent); color:var(--accent); background:rgba(16,185,129,0.1);">📲 Installer l'App</button>
        </div>
    `;
    
    html += renderSearchHeader('marketplace', 'Rechercher un fournisseur ou produit...');
    
    // Horizontal Sections
    html += `
        <div id="mkt-packs-section" class="mkt-section"></div>
        <div id="mkt-new-section" class="mkt-section"></div>
        <div id="mkt-featured-section" class="mkt-section"></div>
        
        <div class="mkt-section-title" style="margin-bottom:16px;">Tous les Produits</div>
        <div id="marketplace-results" class="mkt-carousel-container"></div>
        <div id="mkt-scroll-anchor" style="height:20px; margin-top:20px;"></div>
    `;
    
    container.innerHTML = html;

    // Attach Infinite Scroll Observer
    setTimeout(() => setupMktInfiniteScroll(), 100);

    renderMarketplaceItems(document.getElementById('marketplace-results'));
}

function getProductImage(p) {
    const emoji = p?.categoryId ? '\u2615' : '\ud83d\udce6';
    // Fallback always rendered underneath
    const fallback = `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(16,185,129,0.06);">
        <div style="font-size:28px;margin-bottom:4px;">${emoji}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Photo bient\u00f4t</div>
    </div>`;
    if (!p?.image) return fallback;
    // Img sits absolutely on top; if broken, onerror hides it revealing fallback
    return `${fallback}<img src="${p.image}" alt="product" onerror="this.style.display='none'" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
}

function renderMarketplaceItems(container) {
    if (!state.marketplace.products || state.marketplace.products.length === 0) {
        if (!state.marketplace.loading) container.innerHTML = `<p class="item-meta">Aucun produit disponible.</p>`;
        return;
    }

    const query = (state.filters.marketplace || '').toLowerCase();
    renderMktSections(state.marketplace.products);

    const filtered = state.marketplace.products.filter(p => {
        const name = (p.name || p.productStandard?.name || '').toLowerCase();
        const vendor = (p.vendor?.companyName || '').toLowerCase();
        return name.includes(query) || vendor.includes(query);
    });

    if (filtered.length === 0 && !state.marketplace.loading) {
        container.innerHTML = `<p class="item-meta">Aucun résultat trouvé.</p>`;
        return;
    }

    // Group products into pages of 4
    const pageSize = 4;
    const pages = [];
    for (let i = 0; i < filtered.length; i += pageSize) {
        pages.push(filtered.slice(i, i + pageSize));
    }

    let html = `<div class="mkt-carousel" id="mkt-carousel">`;
    pages.forEach((page, pageIndex) => {
        html += `<div class="mkt-carousel-page">`;
        page.forEach(p => {
            const name = p.name || p.productStandard?.name || 'Produit';
            const vendor = p.vendor?.companyName || 'Vendeur Pro';
            const price = Number(p.price).toFixed(3);
            html += `
                <div class="product-card-premium" onclick="openProductDetailSheet('${p.id}')">
                    <div class="product-image-container">
                        ${getProductImage(p)}
                        ${p.isFeatured ? '<div style="position:absolute; top:8px; right:8px;"><span class="mkt-badge-featured">✦ Featured</span></div>' : ''}
                    </div>
                    <div class="item-name" style="font-size:13px; height:34px; overflow:hidden;">${name}</div>
                    <div class="item-meta" style="font-size:11px;">${vendor}</div>
                    <div class="product-price">${price} DT</div>
                </div>
            `;
        });
        html += `</div>`;
    });
    html += `</div>`;

    // Dots indicator
    if (pages.length > 1) {
        html += `<div class="mkt-dots">${pages.map((_, i) => `<div class="mkt-dot${i === 0 ? ' active' : ''}" onclick="scrollMktToPage(${i})"></div>`).join('')}</div>`;
    }

    container.innerHTML = html;

    // Sync dots on scroll
    const carousel = document.getElementById('mkt-carousel');
    if (carousel) {
        carousel.addEventListener('scroll', () => {
            const pageW = carousel.clientWidth;
            const current = Math.round(carousel.scrollLeft / pageW);
            document.querySelectorAll('.mkt-dot').forEach((d, i) => d.classList.toggle('active', i === current));
        }, { passive: true });
    }
}

function scrollMktToPage(index) {
    const carousel = document.getElementById('mkt-carousel');
    if (!carousel) return;
    carousel.scrollTo({ left: index * carousel.clientWidth, behavior: 'smooth' });
}

function renderMktSections(products) {
    const packs = products.filter(p => (p.name?.toLowerCase().includes('pack') || p.description?.toLowerCase().includes('pack')));
    const featured = products.filter(p => p.isFeatured || p.isFlashSale);
    const newcomers = [...products].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

    renderHorizontalSection('mkt-packs-section', '📦 Packs & Bundles', packs);
    renderHorizontalSection('mkt-new-section', '✨ Nouveautés', newcomers);
    renderHorizontalSection('mkt-featured-section', '⭐ Sélection Pro', featured);
}

function renderHorizontalSection(id, title, items) {
    const container = document.getElementById(id);
    if (!container) return;
    
    if (!items.length) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    let html = `
        <div class="mkt-section-header">
            <div class="mkt-section-title">${title}</div>
            <div class="mkt-section-link">Voir tout</div>
        </div>
        <div class="horizontal-scroll">
    `;
    
    items.forEach(p => {
        const name = p.name || p.productStandard?.name || 'Produit';
        const price = Number(p.price).toFixed(3);
        html += `
            <div class="product-card-premium" onclick="openProductDetailSheet('${p.id}')" style="flex: 0 0 140px;">
                <div class="product-image-container" style="height:100px;">
                    ${getProductImage(p)}
                    ${p.isFeatured ? '<div style="position:absolute; top:6px; right:6px;"><span class="mkt-badge-featured" style="font-size:7px; padding:1px 4px;">✦</span></div>' : ''}
                </div>
                <div class="item-name" style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
                <div class="product-price" style="font-size:13px;">${price} DT</div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function renderSuppliers(container) {
    let html = ``;
    html += renderSearchHeader('suppliers', 'Rechercher par nom ou téléphone...');
    html += `<div id="suppliers-results"></div>`;
    container.innerHTML = html;
    renderSupplierItems(document.getElementById('suppliers-results'));
}

function renderSupplierItems(container) {
    const query = state.filters.suppliers || '';
    const filtered = (state.suppliers || []).filter(s => {
        const name = (s.name || '').toLowerCase();
        const contact = (s.contact || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        return name.includes(query) || contact.includes(query) || phone.includes(query);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p class="item-meta" style="margin-top:20px;">Aucun fournisseur trouvé.</p>`;
        return;
    }

    let html = '';
    filtered.forEach(s => {
        const stockCount = s._count?.stockItems || 0;
        html += `
            <div class="list-item" onclick="openEditSupplierSheet('${s.id}')">
                <div class="item-info">
                    <div class="item-name">${s.name}</div>
                    <div class="item-meta">${s.phone || 'Pas de téléphone'} ${s.contact ? `| ${s.contact}` : ''}</div>
                </div>
                <div style="text-align:right;">
                    <div class="card-value" style="font-size:16px;">${stockCount}</div>
                    <div class="item-meta" style="font-size:10px;">articles</div>
                </div>
            </div>
        `;
    });
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
    state.marketplace._lastOrders = orders; // Store for lookup

    // Sort: DELIVERED first (needs action), then active, then completed
    const priorities = { DELIVERED: 1, SHIPPED: 2, CONFIRMED: 3, PENDING: 4, STOCKED: 5, CANCELLED: 6 };
    orders.sort((a, b) => {
        const p1 = priorities[a.status] || 99;
        const p2 = priorities[b.status] || 99;
        if (p1 !== p2) return p1 - p2;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const STATUS_LABELS = {
        PENDING:   { label: '🕐 En attente',        cls: 'badge-low' },
        CONFIRMED: { label: '✅ Acceptée',           cls: 'badge-ok' },
        SHIPPED:   { label: '🚚 En livraison',       cls: 'badge-info' },
        DELIVERED: { label: '📦 À RÉCEPTIONNER',    cls: 'badge-warn' },
        STOCKED:   { label: '✔ Finalisée',           cls: 'badge-ok' },
        CANCELLED: { label: '❌ Annulée',            cls: 'badge-low' },
    };

    let activeFilter = state._orderFilter || 'ALL';
    let filtered = orders;
    if (activeFilter === 'ACTIVE') {
        filtered = orders.filter(o => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(o.status));
    } else if (activeFilter === 'DELIVERED') {
        filtered = orders.filter(o => o.status === 'DELIVERED');
    } else if (activeFilter === 'STOCKED') {
        filtered = orders.filter(o => o.status === 'STOCKED');
    }

    const countAll = orders.length;
    const countActive = orders.filter(o => ['PENDING','CONFIRMED','SHIPPED'].includes(o.status)).length;
    const countDelivered = orders.filter(o => o.status === 'DELIVERED').length;
    const countStocked = orders.filter(o => o.status === 'STOCKED').length;

    let html = `
        <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:15px; margin-bottom:15px; border-bottom:1px solid var(--border-glass);">
            <button style="border:none; border-radius:10px; font-weight:800; font-size:11px; padding:6px 12px; background:${activeFilter === 'ALL' ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}; color:${activeFilter === 'ALL' ? '#000' : 'var(--text-muted)'}; cursor:pointer;" onclick="setMarketplaceFilter('ALL')">📋 Toutes (${countAll})</button>
            <button style="border:none; border-radius:10px; font-weight:800; font-size:11px; padding:6px 12px; background:${activeFilter === 'ACTIVE' ? '#f59e0b' : 'rgba(255,255,255,0.05)'}; color:${activeFilter === 'ACTIVE' ? '#000' : 'var(--text-muted)'}; cursor:pointer;" onclick="setMarketplaceFilter('ACTIVE')">⚡ En cours (${countActive})</button>
            <button style="border:none; border-radius:10px; font-weight:800; font-size:11px; padding:6px 12px; background:${activeFilter === 'DELIVERED' ? '#10b981' : 'rgba(255,255,255,0.05)'}; color:${activeFilter === 'DELIVERED' ? '#fff' : 'var(--text-muted)'}; cursor:pointer;" onclick="setMarketplaceFilter('DELIVERED')">🎯 À recevoir (${countDelivered})</button>
            <button style="border:none; border-radius:10px; font-weight:800; font-size:11px; padding:6px 12px; background:${activeFilter === 'STOCKED' ? '#6366f1' : 'rgba(255,255,255,0.05)'}; color:${activeFilter === 'STOCKED' ? '#fff' : 'var(--text-muted)'}; cursor:pointer;" onclick="setMarketplaceFilter('STOCKED')">✅ Finalisées (${countStocked})</button>
        </div>
        <div style="padding-bottom:20px;">
    `;

    if (filtered.length === 0) {
        html += `<p style="text-align:center; color:var(--text-muted); padding:40px 0; font-style:italic;">Aucune commande dans cette catégorie.</p>`;
    }

    filtered.forEach(o => {
        const s = STATUS_LABELS[o.status] || { label: o.status, cls: 'badge-low' };
        const isDelivered = o.status === 'DELIVERED';
        html += `
            <div class="list-item" style="flex-direction:column; align-items:flex-start; gap:8px; margin-bottom:15px; background:${isDelivered ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isDelivered ? 'rgba(16,185,129,0.3)' : 'var(--border-glass)'}; border-radius:16px; padding:15px; position:relative; cursor:pointer;" onclick="viewMarketplaceOrderDetail('${o.id}')">
                ${isDelivered ? `<div style="width:100%; text-align:center; padding:6px; background:rgba(16,185,129,0.1); border-radius:8px; color:#10b981; font-size:11px; font-weight:900; margin-bottom:5px;">⚠️ ACTION REQUISE — Confirmez la réception</div>` : ''}
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <div class="item-name" style="font-weight:900;">Cmd #${o.id.substring(o.id.length - 6).toUpperCase()}</div>
                    <div class="item-badge ${s.cls}" style="font-size:9px; padding:3px 8px;">${s.label}</div>
                </div>
                <div class="item-meta" style="font-weight:700; color:var(--text);">${o.supplier?.name || o.vendor?.companyName || 'Fournisseur'}</div>
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-top:5px;">
                     <div style="display:flex; flex-direction:column; gap:2px;">
                        <div class="item-name" style="color:var(--accent); font-size:18px; font-weight:900;">${Number(o.total || 0).toFixed(3)} DT</div>
                        ${o.settlement ? `<div style="color:#ef4444; font-size:9px; font-weight:800;">Frais Marketplace: -${Number(o.settlement.commissionAmount).toFixed(3)} DT</div>` : ''}
                     </div>
                     <div style="text-align:right;">
                        <div class="item-meta" style="font-size:10px;">${new Date(o.createdAt).toLocaleDateString()}</div>
                        <div style="font-size:10px; color:var(--text-muted); font-weight:800; margin-top:2px;">Détails ➔</div>
                     </div>
                </div>
                ${isDelivered ? `
                <button class="primary-btn" style="padding: 12px; margin-top: 10px; width: 100%; font-size: 14px; font-weight:900; background:#10b981; border:none; border-radius:12px; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(16,185,129,0.3); cursor:pointer;" onclick="event.stopPropagation(); validerReceptionMarketplace('${o.id}')">
                    ✅ CONFIRMER LA RÉCEPTION
                </button>
                ` : ''}
            </div>
        `;
    });
    html += `</div>`;
    openSheet("Mes Commandes B2B", html);
}

function viewMarketplaceOrderDetail(orderId) {
    const o = state.marketplace._lastOrders?.find(ord => ord.id === orderId);
    if (!o) return;

    let itemsHtml = (o.items || []).map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding:12px 0;">
            <div style="flex:1;">
                <div style="color:#fff; font-weight:800; font-size:14px;">${item.stockItem?.name || item.name || 'Produit'}</div>
                <div style="color:var(--text-muted); font-size:11px; font-weight:700; margin-top:2px;">${item.quantity} x ${Number(item.price).toFixed(3)} DT</div>
            </div>
            <div style="color:var(--accent); font-weight:900; font-size:14px;">${(item.quantity * item.price).toFixed(3)} DT</div>
        </div>
    `).join('');

    let html = `
        <div style="padding-bottom:100px;">
            <div style="background:rgba(255,255,255,0.03); border-radius:15px; padding:15px; margin-bottom:20px; border:1px solid var(--border-glass);">
                <div style="color:var(--text-muted); font-size:10px; font-weight:800; text-transform:uppercase; margin-bottom:8px;">Fournisseur</div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:36px; height:36px; border-radius:10px; background:rgba(99,102,241,0.1); display:flex; align-items:center; justify-content:center; color:#6366f1;">🏢</div>
                    <div style="color:white; font-size:16px; font-weight:900;">${o.supplier?.name || o.vendor?.companyName || 'Fournisseur'}</div>
                </div>
            </div>

            <div style="color:var(--text-muted); font-size:10px; font-weight:900; text-transform:uppercase; margin-bottom:10px; margin-left:5px;">Articles commandés</div>
            <div style="background:rgba(255,255,255,0.02); border-radius:20px; padding:15px; border:1px solid var(--border-glass);">
                ${itemsHtml || '<p style="text-align:center; color:var(--text-muted); padding:20px;">Aucun article.</p>'}
            </div>

            <div style="margin-top:25px; padding:20px; background:rgba(255,255,255,0.05); border-radius:20px; border:1px dashed var(--border-glass);">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:var(--text-muted); font-weight:700;">Total commande</span>
                    <span style="color:#fff; font-weight:800;">${Number(o.total || 0).toFixed(3)} DT</span>
                </div>
                ${o.settlement ? `
                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <span style="color:#ef4444; font-weight:700;">Frais Marketplace</span>
                    <span style="color:#ef4444; font-weight:800;">-${Number(o.settlement.commissionAmount).toFixed(3)} DT</span>
                </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1); align-items:center;">
                    <span style="color:#fff; font-size:16px; font-weight:900;">Net à payer</span>
                    <span style="color:var(--accent); font-size:22px; font-weight:950;">${Number(o.total || 0).toFixed(3)} DT</span>
                </div>
            </div>

            <button class="primary-btn" style="margin-top:30px; background:rgba(255,255,255,0.05); color:var(--text); border:1px solid var(--border-glass);" onclick="fetchMarketplaceOrders()">
                ⬅ RETOUR À LA LISTE
            </button>
        </div>
    `;

    openSheet(`Cmd #${o.id.substring(o.id.length - 6).toUpperCase()}`, html);
}

function setMarketplaceFilter(filter) {
    state._orderFilter = filter;
    fetchMarketplaceOrders();
}

async function validerReceptionMarketplace(orderId) {
    if(!confirm("Avez-vous bien reçu toute la marchandise ? Le stock sera mis à jour.")) return;
    try {
        const res = await fetch(`${CONFIG.API_URL}/management/orders/${orderId}/receive`, { method: 'POST' });
        if(!res.ok) throw new Error("Erreur de validation");
        alert("Réception validée et stock augmenté !");
        closeSheet();
        fetchMarketplaceOrders();
    } catch(e) {
        alert("Impossible de valider la réception pour le moment.");
    }
}

// ═══════════════════════════════════════════════════════════
// FORM HANDLERS (SHEETS)
// ═══════════════════════════════════════════════════════════

let currentEditingRecipe = [];

function renderRecipeItems(prefix) {
    const container = document.getElementById(`${prefix}-recipe-container`);
    if (!container) return;

    if (currentEditingRecipe.length === 0) {
        container.innerHTML = `<p class="item-meta" style="font-style:italic;">Aucune matière associée.</p>`;
        return;
    }

    const stockOptions = (state.stock || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    container.innerHTML = currentEditingRecipe.map((item, index) => `
        <div class="recipe-item-row" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; margin-bottom: 10px; border: 1px solid var(--border-glass);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <select onchange="updateRecipeEntry(${index}, 'stockItemId', this.value)" style="flex: 1; margin-right: 8px; padding: 8px; font-size: 13px;">
                    <option value="">-- Choisir Matière --</option>
                    ${(state.stock || []).map(s => `<option value="${s.id}" ${s.id === item.stockItemId ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                <button onclick="removeRecipeEntry(${index}, '${prefix}')" style="background: var(--danger); border: none; color: white; width: 24px; height: 24px; border-radius: 12px; font-size: 12px;">×</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                    <label style="font-size: 10px; opacity: 0.7;">Quantité</label>
                    <input type="number" step="0.0001" value="${item.quantity}" oninput="updateRecipeEntry(${index}, 'quantity', this.value)" style="padding: 6px; font-size: 13px;">
                </div>
                <div>
                    <label style="font-size: 10px; opacity: 0.7;">Condition</label>
                    <select onchange="updateRecipeEntry(${index}, 'consumeType', this.value)" style="padding: 6px; font-size: 12px;">
                        <option value="BOTH" ${item.consumeType === 'BOTH' ? 'selected' : ''}>Les deux</option>
                        <option value="DINE_IN" ${item.consumeType === 'DINE_IN' ? 'selected' : ''}>Sur Place</option>
                        <option value="TAKEAWAY" ${item.consumeType === 'TAKEAWAY' ? 'selected' : ''}>À Emporter</option>
                    </select>
                </div>
            </div>
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" ${item.isPackaging ? 'checked' : ''} onchange="updateRecipeEntry(${index}, 'isPackaging', this.checked)" style="width: 16px; height: 16px;">
                <label style="font-size: 11px; margin: 0;">Emballage</label>
            </div>
        </div>
    `).join('');
}

function addRecipeEntry(prefix) {
    currentEditingRecipe.push({ stockItemId: '', quantity: 0, consumeType: 'BOTH', isPackaging: false });
    renderRecipeItems(prefix);
}

function removeRecipeEntry(index, prefix) {
    currentEditingRecipe.splice(index, 1);
    renderRecipeItems(prefix);
}

function updateRecipeEntry(index, field, value) {
    if (field === 'quantity') value = parseFloat(value) || 0;
    currentEditingRecipe[index][field] = value;
}

function openAddProductSheet() {
    currentEditingRecipe = [];
    const catOptions = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const unitOptions = state.units.map(u => `<option value="${u.id}" ${u.name === 'unité' ? 'selected' : ''}>${u.name}</option>`).join('');

    const html = `
        <h3 style="margin-bottom: 12px; font-size: 14px; opacity: 0.7;">Informations Générales</h3>
        <div class="form-group">
            <label>Nom du Produit</label>
            <input type="text" id="new-prod-name" placeholder="ex: Cappuccino Large">
        </div>
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; margin-bottom: 5px;">
            <div class="form-group">
                <label>Prix HT</label>
                <input type="number" id="new-prod-ht" step="0.001" placeholder="0.000" oninput="calculateFromHT('new')">
            </div>
            <div class="form-group">
                <label>TVA (%)</label>
                <select id="new-prod-tva" onchange="calculateFromHT('new')">
                    <option value="0.19">19%</option>
                    <option value="0.13">13%</option>
                    <option value="0.07">7%</option>
                    <option value="0">0%</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Prix TTC (Client)</label>
            <input type="number" id="new-prod-price" step="0.001" placeholder="0.000" oninput="calculateFromTTC('new')" style="font-weight: 800; border-color: var(--primary);">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
                <label>Catégorie</label>
                <select id="new-prod-cat">${catOptions}</select>
            </div>
            <div class="form-group">
                <label>Unité de Vente</label>
                <select id="new-prod-unit">${unitOptions}</select>
            </div>
        </div>

        <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 16px;">
            <label style="font-weight: 700; display: block; margin-bottom: 15px;">Visuels du Produit</label>
            <div style="display: grid; grid-template-columns: 0.5fr 1.5fr; gap: 12px;">
                <div class="form-group">
                    <label>Icône</label>
                    <input type="text" id="new-prod-icon" placeholder="📦" style="text-align: center; font-size: 20px;">
                </div>
                <div class="form-group">
                    <label>Photo Produit</label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <input type="file" id="new-prod-file" accept="image/*" capture="environment" onchange="previewProductImage('new')" style="font-size: 11px;">
                        <img id="new-prod-preview" src="" style="display: none; width: 100%; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-glass);">
                        <input type="hidden" id="new-prod-image">
                    </div>
                </div>
            </div>
            <hr style="border: 0; border-top: 1px solid var(--border-glass); margin: 15px 0;">
            <label style="font-weight: 700; display: block; margin-bottom: 10px;">Options Additionnelles</label>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <input type="checkbox" id="new-prod-takeaway" checked style="width: 20px; height: 20px;">
                <label style="margin: 0;">Disponible à emporter</label>
            </div>
        </div>

        <h3 style="margin: 20px 0 10px; font-size: 14px; opacity: 0.7;">Composition & Recette</h3>
        <div id="new-recipe-container"></div>
        <button class="header-tab" onclick="addRecipeEntry('new')" style="width: 100%; margin-top: 5px; background: rgba(255,255,255,0.05);">+ Ajouter une matière</button>

        <button class="primary-btn" onclick="submitAddProduct()" style="margin-top: 30px;">Enregistrer le Produit</button>
    `;
    openSheet("Ajouter un Produit", html);
    renderRecipeItems('new');
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

    currentEditingRecipe = p.recipe || [];

    const catOptions = (state.categories || []).map(c => 
        `<option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    const unitOptions = (state.units || []).map(u => 
        `<option value="${u.id}" ${u.id === p.unitId ? 'selected' : ''}>${u.name}</option>`
    ).join('');

    const tva = p.taxRate || 0.19;
    const ttc = Number(p.price || 0);
    const ht = ttc / (1 + Number(tva));

    const html = `
        <h3 style="margin-bottom: 12px; font-size: 14px; opacity: 0.7;">Informations Générales</h3>
        <div class="form-group">
            <label>Nom du Produit</label>
            <input type="text" id="edit-prod-name" value="${p.name}">
        </div>
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; margin-bottom: 5px;">
            <div class="form-group">
                <label>Prix HT</label>
                <input type="number" id="edit-prod-ht" step="0.001" value="${ht.toFixed(3)}" oninput="calculateFromHT('edit')">
            </div>
            <div class="form-group">
                <label>TVA</label>
                <select id="edit-prod-tva" onchange="calculateFromHT('edit')">
                    <option value="0.19" ${tva == 0.19 ? 'selected' : ''}>19%</option>
                    <option value="0.13" ${tva == 0.13 ? 'selected' : ''}>13%</option>
                    <option value="0.07" ${tva == 0.07 ? 'selected' : ''}>7%</option>
                    <option value="0" ${tva == 0 ? 'selected' : ''}>0%</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Prix TTC</label>
            <input type="number" id="edit-prod-price" step="0.001" value="${ttc.toFixed(3)}" oninput="calculateFromTTC('edit')" style="font-weight: 800; border-color: var(--primary);">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
                <label>Catégorie</label>
                <select id="edit-prod-cat">${catOptions}</select>
            </div>
            <div class="form-group">
                <label>Unité de Vente</label>
                <select id="edit-prod-unit">${unitOptions}</select>
            </div>
        </div>

        <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 16px;">
            <label style="font-weight: 700; display: block; margin-bottom: 15px;">Visuels du Produit</label>
            <div style="display: grid; grid-template-columns: 0.5fr 1.5fr; gap: 12px;">
                <div class="form-group">
                    <label>Icône</label>
                    <input type="text" id="edit-prod-icon" value="${p.icon || '📦'}" style="text-align: center; font-size: 20px;">
                </div>
                <div class="form-group">
                    <label>Photo Produit</label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <input type="file" id="edit-prod-file" accept="image/*" capture="environment" onchange="previewProductImage('edit')" style="font-size: 11px;">
                        <img id="edit-prod-preview" src="${p.image ? (p.image.startsWith('http') ? p.image : CONFIG.API_URL + p.image) : ''}" style="${p.image ? 'display: block;' : 'display: none;'} width: 100%; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-glass);">
                        <input type="hidden" id="edit-prod-image" value="${p.image || ''}">
                    </div>
                </div>
            </div>
            <hr style="border: 0; border-top: 1px solid var(--border-glass); margin: 15px 0;">
            <label style="font-weight: 700; display: block; margin-bottom: 12px;">Statut & Options</label>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="radio" name="prod-status" value="active" ${p.active ? 'checked' : ''} style="width: 20px; height: 20px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">Actif</div>
                        <div style="font-size: 11px; opacity: 0.6;">Visible sur POS</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="radio" name="prod-status" value="archived" ${!p.active ? 'checked' : ''} style="width: 20px; height: 20px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">Archivé</div>
                        <div style="font-size: 11px; opacity: 0.6;">Caché du POS</div>
                    </div>
                </div>
                <hr style="border: 0; border-top: 1px solid var(--border-glass); margin: 5px 0;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="edit-prod-takeaway" ${p.canBeTakeaway !== false ? 'checked' : ''} style="width: 20px; height: 20px;">
                    <label style="margin: 0;">Disponible à emporter</label>
                </div>
            </div>
        </div>

        <h3 style="margin: 20px 0 10px; font-size: 14px; opacity: 0.7;">Composition & Recette</h3>
        <div id="edit-recipe-container"></div>
        <button class="header-tab" onclick="addRecipeEntry('edit')" style="width: 100%; margin-top: 5px; background: rgba(255,255,255,0.05);">+ Ajouter une matière</button>

        <button class="primary-btn" onclick="submitEditProduct('${p.id}')" style="margin-top: 30px;">Mettre à Jour le Produit</button>
    `;
    openSheet("Modifier Produit", html);
    renderRecipeItems('edit');
}

// Helpers for real-time calculation
function calculateFromHT(prefix) {
    const ht = parseFloat(document.getElementById(`${prefix}-prod-ht`).value) || 0;
    const tva = parseFloat(document.getElementById(`${prefix}-prod-tva`).value);
    const ttc = ht * (1 + tva);
    document.getElementById(`${prefix}-prod-price`).value = ttc.toFixed(3);
}

function calculateFromTTC(prefix) {
    const ttc = parseFloat(document.getElementById(`${prefix}-prod-price`).value) || 0;
    const tva = parseFloat(document.getElementById(`${prefix}-prod-tva`).value);
    const ht = ttc / (1 + tva);
    document.getElementById(`${prefix}-prod-ht`).value = ht.toFixed(3);
}

function openAddStockSheet() {
    const unitOptions = state.units.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    const supplierOptions = state.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    const html = `
        <div class="form-group">
            <label>Nom de l'Article</label>
            <input type="text" id="new-stock-name" placeholder="ex: Sirop Vanille 1L">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
                <label>Unité</label>
                <select id="new-stock-unit">${unitOptions}</select>
            </div>
            <div class="form-group">
                <label>Coût Unitaire (DT)</label>
                <input type="number" id="new-stock-cost" step="0.001" placeholder="0.000">
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
                <label>Quantité Actuelle</label>
                <input type="number" id="new-stock-qty" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group">
                <label>Seuil d'Alerte</label>
                <input type="number" id="new-stock-min" step="0.01" placeholder="0.00">
            </div>
        </div>
        <div class="form-group">
            <label>Fournisseur Préféré</label>
            <select id="new-stock-supplier">
                <option value="">-- Mes Fournisseurs --</option>
                ${supplierOptions}
            </select>
        </div>
        <button class="primary-btn" onclick="submitAddStock()" style="margin-top: 20px;">Créer l'Article</button>
    `;
    openSheet("Nouvelle Matière Première", html);
}

function openEditStockSheet(id) {
    const s = state.stock.find(x => x.id === id);
    if (!s) return;

    const unitOptions = state.units.map(u => `<option value="${u.id}" ${u.id === s.unitId ? 'selected' : ''}>${u.name}</option>`).join('');
    const supplierOptions = state.suppliers.map(sup => `<option value="${sup.id}" ${sup.id === s.preferredSupplierId ? 'selected' : ''}>${sup.name}</option>`).join('');

    const html = `
        <div class="form-group">
            <label>Nom de l'Article</label>
            <input type="text" id="edit-stock-name" value="${s.name}">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
                <label>Unité</label>
                <select id="edit-stock-unit">${unitOptions}</select>
            </div>
            <div class="form-group">
                <label>Coût Unitaire (DT)</label>
                <input type="number" id="edit-stock-cost" step="0.001" value="${Number(s.cost || 0).toFixed(3)}">
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
                <label>Quantité Actuelle</label>
                <input type="number" id="edit-stock-qty" step="0.01" value="${Number(s.quantity).toFixed(2)}">
            </div>
            <div class="form-group">
                <label>Seuil d'Alerte</label>
                <input type="number" id="edit-stock-min" step="0.01" value="${Number(s.minThreshold).toFixed(2)}">
            </div>
        </div>
        <div class="form-group">
            <label>Fournisseur Préféré</label>
            <select id="edit-stock-supplier">
                <option value="">-- Mes Fournisseurs --</option>
                ${supplierOptions}
            </select>
        </div>
        <button class="primary-btn" onclick="submitEditStock('${s.id}')" style="margin-top: 20px;">Mettre à Jour l'Article</button>
    `;
    openSheet("Modifier l'Article", html);
}

// Visual Helpers
function previewProductImage(prefix) {
    const input = document.getElementById(`${prefix}-prod-file`);
    const preview = document.getElementById(`${prefix}-prod-preview`);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function uploadProductImage(prefix) {
    const input = document.getElementById(`${prefix}-prod-file`);
    if (!input.files || !input.files[0]) return null;

    const file = input.files[0];
    
    // 1. Compress Image
    const compressedFile = await compressImage(file, 800, 0.7);

    const formData = new FormData();
    formData.append('file', compressedFile, 'product.jpg');

    try {
        const res = await fetch(`${CONFIG.API_URL}/management/upload`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url;
    } catch (e) {
        console.error("Upload error", e);
        return null;
    }
}

function compressImage(file, maxWidth, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
        };
    });
}

// API Submission Mocks
async function submitAddProduct() {
    const name = document.getElementById('new-prod-name').value;
    const price = document.getElementById('new-prod-price').value;
    const tva = document.getElementById('new-prod-tva').value;
    const catId = document.getElementById('new-prod-cat').value;
    const unitId = document.getElementById('new-prod-unit').value;
    const canBeTakeaway = document.getElementById('new-prod-takeaway').checked;

    if (!name || !price) return Toast.show("Veuillez remplir tous les champs", "error");

    showLoading(); // Show loading during upload

    // 1. Upload image if selected
    const uploadedUrl = await uploadProductImage('new');
    const imageUrl = uploadedUrl || document.getElementById('new-prod-image').value || null;

    const res = await fetch(`${CONFIG.API_URL}/management/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name, 
            price: Number(price), 
            taxRate: Number(tva),
            categoryId: catId, 
            unitId,
            canBeTakeaway,
            icon: document.getElementById('new-prod-icon').value || '📦',
            image: imageUrl,
            storeId 
        })
    });

    if (res.ok) {
        const product = await res.json();
        // Submit recipe if items exist
        if (currentEditingRecipe.length > 0) {
            await fetch(`${CONFIG.API_URL}/management/products/${product.id}/recipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: currentEditingRecipe })
            });
        }
        closeSheet();
        Toast.show("Produit ajouté avec succès !");
        refreshData();
    }
}

async function submitAddExpense() {
    const category = document.getElementById('exp-cat').value;
    const amount = document.getElementById('exp-amount').value;
    const description = document.getElementById('exp-desc').value;

    if (!amount) return Toast.show("Veuillez saisir un montant", "error");

    const res = await fetch(`${CONFIG.API_URL}/management/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, category, amount: Number(amount), description })
    });

    if (res.ok) {
        closeSheet();
        Toast.show("Dépense enregistrée");
        refreshData();
    }
}

async function submitEditProduct(id) {
    const name = document.getElementById('edit-prod-name').value;
    const price = document.getElementById('edit-prod-price').value;
    const tva = document.getElementById('edit-prod-tva').value;
    const catId = document.getElementById('edit-prod-cat').value;
    const unitId = document.getElementById('edit-prod-unit').value;
    const canBeTakeaway = document.getElementById('edit-prod-takeaway').checked;
    const status = document.querySelector('input[name="prod-status"]:checked').value;
    const active = status === 'active';

    showLoading(); // Show loading during upload

    // 1. Upload image if selected
    const uploadedUrl = await uploadProductImage('edit');
    const imageUrl = uploadedUrl || document.getElementById('edit-prod-image').value;

    const res = await fetch(`${CONFIG.API_URL}/management/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name, 
            price: Number(price), 
            taxRate: Number(tva),
            categoryId: catId, 
            unitId,
            canBeTakeaway,
            icon: document.getElementById('edit-prod-icon').value || '📦',
            image: imageUrl,
            active 
        })
    });

    if (res.ok) {
        // ALWAYS update recipe (it might be empty now, which is a valid update)
        await fetch(`${CONFIG.API_URL}/management/products/${id}/recipe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: currentEditingRecipe })
        });
        
        closeSheet();
        Toast.show("Produit mis à jour");
        refreshData();
    }
}

async function submitEditStock(id) {
    const name = document.getElementById('edit-stock-name').value;
    const quantity = document.getElementById('edit-stock-qty').value;
    const minThreshold = document.getElementById('edit-stock-min').value;
    const cost = document.getElementById('edit-stock-cost').value;
    const unitId = document.getElementById('edit-stock-unit').value;
    const supplierId = document.getElementById('edit-stock-supplier').value;

    const res = await fetch(`${CONFIG.API_URL}/management/stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name,
            quantity: Number(quantity), 
            minThreshold: Number(minThreshold),
            cost: Number(cost),
            unitId,
            preferredSupplierId: supplierId || null
        })
    });

    if (res.ok) {
        closeSheet();
        Toast.show("Stock mis à jour");
        refreshData();
    }
}

async function submitAddStock() {
    const name = document.getElementById('new-stock-name').value;
    const quantity = document.getElementById('new-stock-qty').value;
    const minThreshold = document.getElementById('new-stock-min').value;
    const cost = document.getElementById('new-stock-cost').value;
    const unitId = document.getElementById('new-stock-unit').value;
    const supplierId = document.getElementById('new-stock-supplier').value;

    if (!name) return Toast.show("Le nom est requis", "error");

    const res = await fetch(`${CONFIG.API_URL}/management/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            storeId,
            name,
            quantity: Number(quantity || 0), 
            minThreshold: Number(minThreshold || 0),
            cost: Number(cost || 0),
            unitId: unitId || null,
            preferredSupplierId: supplierId || null
        })
    });

    if (res.ok) {
        closeSheet();
        Toast.show("Article de stock créé !");
        refreshData();
    }
}

function openAddSupplierSheet() {
    const html = `
        <div class="form-group">
            <label>Nom de l'Entreprise</label>
            <input type="text" id="new-supp-name" placeholder="ex: Brûlerie de Carthage">
        </div>
        <div class="form-group">
            <label>Personne de Contact</label>
            <input type="text" id="new-supp-contact" placeholder="ex: Ahmed">
        </div>
        <div class="form-group">
            <label>Téléphone</label>
            <input type="tel" id="new-supp-phone" placeholder="ex: 22 123 456">
        </div>
        <button class="primary-btn" onclick="submitAddSupplier()" style="margin-top:20px;">Enregistrer le Fournisseur</button>
    `;
    openSheet("Nouveau Fournisseur", html);
}

async function submitAddSupplier() {
    const name = document.getElementById('new-supp-name').value;
    const contact = document.getElementById('new-supp-contact').value;
    const phone = document.getElementById('new-supp-phone').value;

    if (!name) return Toast.show("Le nom est requis", "error");

    const res = await fetch(`${CONFIG.API_URL}/management/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, name, contact, phone })
    });

    if (res.ok) {
        closeSheet();
        Toast.show("Fournisseur ajouté !");
        refreshData();
    }
}

function openEditSupplierSheet(id) {
    const s = (state.suppliers || []).find(x => x.id === id);
    if (!s) return;

    const html = `
        <div class="form-group">
            <label>Nom de l'Entreprise</label>
            <input type="text" id="edit-supp-name" value="${s.name}">
        </div>
        <div class="form-group">
            <label>Personne de Contact</label>
            <input type="text" id="edit-supp-contact" value="${s.contact || ''}">
        </div>
        <div class="form-group">
            <label>Téléphone</label>
            <input type="tel" id="edit-supp-phone" value="${s.phone || ''}">
        </div>
        <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="primary-btn" onclick="submitEditSupplier('${s.id}')" style="flex:2;">Mettre à Jour</button>
            <button class="primary-btn" onclick="deleteSupplier('${s.id}')" style="flex:1; background: var(--danger);">Supprimer</button>
        </div>
    `;
    openSheet("Modifier Fournisseur", html);
}

async function submitEditSupplier(id) {
    const name = document.getElementById('edit-supp-name').value;
    const contact = document.getElementById('edit-supp-contact').value;
    const phone = document.getElementById('edit-supp-phone').value;

    const res = await fetch(`${CONFIG.API_URL}/management/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, phone })
    });

    if (res.ok) {
        closeSheet();
        Toast.show("Fournisseur mis à jour !");
        refreshData();
    }
}

async function deleteSupplier(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ?")) return;

    const res = await fetch(`${CONFIG.API_URL}/management/suppliers/${id}`, {
        method: 'DELETE'
    });

    if (res.ok) {
        closeSheet();
        Toast.show("Fournisseur supprimé");
        refreshData();
    }
}

function setupMktInfiniteScroll() {
    const anchor = document.getElementById('mkt-scroll-anchor');
    if (!anchor) return;

    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !state.marketplace.loading && state.marketplace.hasMore) {
            fetchMoreMktProducts();
        }
    }, { threshold: 0.1 });

    observer.observe(anchor);
}

async function fetchMoreMktProducts() {
    state.marketplace.loading = true;
    const nextPage = state.marketplace.page + 1;
    const skip = nextPage * 20;
    
    try {
        const res = await fetch(`${CONFIG.API_URL}/management/marketplace/products?skip=${skip}&take=20`);
        const newProducts = await res.json();
        
        if (newProducts.length < 20) state.marketplace.hasMore = false;
        
        state.marketplace.products = [...state.marketplace.products, ...newProducts];
        state.marketplace.page = nextPage;
        
        renderMarketplaceItems(document.getElementById('marketplace-results'));
    } catch (e) {
        console.error("Infinite scroll error", e);
    } finally {
        state.marketplace.loading = false;
    }
}

function openProductDetailSheet(productId) {
    const p = state.marketplace.products.find(x => x.id === productId);
    if (!p) return;

    const name = p.name || p.productStandard?.name || 'Produit';
    const price = Number(p.price).toFixed(3);
    const description = p.description || p.productStandard?.description || "Aucune description disponible pour ce produit.";
    const vendor = p.vendor?.companyName || 'Vendeur Pro';
    const city = p.vendor?.city ? ` · ${p.vendor.city}` : '';

    // Build gallery images
    const galleryImages = [];
    if (p.image) galleryImages.push(p.image);
    if (p.productStandard?.image && p.productStandard.image !== p.image) galleryImages.push(p.productStandard.image);

    // Each gallery slide: fallback div + img absolutely on top (hides itself on error)
    const makeGallerySlide = (img) => `
        <div style="position:relative;width:85%;height:220px;flex-shrink:0;border-radius:20px;overflow:hidden;background:rgba(16,185,129,0.06);">
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <div style="font-size:50px;">☕</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:6px;">Aucune photo disponible</div>
            </div>
            <img src="${img}" onerror="this.style.display='none'" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">
        </div>`;

    const galleryHtml = galleryImages.length
        ? galleryImages.map(makeGallerySlide).join('')
        : `<div style="width:85%;height:220px;flex-shrink:0;border-radius:20px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);display:flex;flex-direction:column;align-items:center;justify-content:center;">
               <div style="font-size:60px;">☕</div>
               <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:8px;">Aucune photo disponible</div>
           </div>`;

    // Suggestions based on category or vendor
    const suggestions = state.marketplace.products
        .filter(s => s.id !== p.id && (s.categoryId === p.categoryId || s.vendorId === p.vendorId))
        .slice(0, 6);

    let html = `
        <div class="product-gallery" style="display:flex; overflow-x:auto; gap:12px; margin-bottom:20px; scrollbar-width:none; -webkit-overflow-scrolling:touch;">
            ${galleryHtml}
        </div>
        
        <div style="margin-bottom:20px;">
            <div class="item-name" style="font-size:20px; margin-bottom:4px;">${name}</div>
            <div class="item-meta" style="font-size:13px; margin-bottom:12px;">Vendu par <span style="color:var(--accent); font-weight:600;">${vendor}</span>${city}</div>
            <div class="product-price" style="font-size:24px;">${price} DT <span style="font-size:13px; color:var(--text-muted); font-weight:400;">/ ${p.unit || 'unité'}</span></div>
        </div>

        <div class="mkt-section-title" style="font-size:13px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted);">Description</div>
        <p class="item-meta" style="font-size:13px; line-height:1.6; margin-bottom:24px;">${description}</p>

        <button class="primary-btn" onclick="handleOrderFromMkt('${p.id}')">🛒 Commander</button>

        ${user.role === 'SUPERADMIN' ? `
            <div class="admin-box">
                <div class="fin-label" style="color:var(--accent); margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                    🛡️ Administration Marketplace
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:12px; border-radius:12px;">
                    <div>
                        <div style="font-size:13px; font-weight:600; color:white;">Mise en avant</div>
                        <div style="font-size:10px; color:var(--text-muted);">Afficher dans "Sélection Pro"</div>
                    </div>
                    <label class="switch" style="position:relative; display:inline-block; width:40px; height:20px;">
                        <input type="checkbox" id="admin-featured-toggle" ${p.isFeatured ? 'checked' : ''} onchange="updateMarketplaceFeatured('${p.id}', this.checked)" style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${p.isFeatured ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; transition:.4s; border-radius:34px;">
                            <span style="position:absolute; content:''; height:16px; width:16px; left:2px; bottom:2px; background-color:white; transition:.4s; border-radius:50%; transform:${p.isFeatured ? 'translateX(20px)' : 'translateX(0)'};"></span>
                        </span>
                    </label>
                </div>
            </div>
        ` : ''}

        ${suggestions.length ? `
            <div class="mkt-section-title" style="font-size:13px; margin-top:32px; margin-bottom:16px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted);">Vous aimerez aussi</div>
            <div class="horizontal-scroll">
                ${suggestions.map(s => `
                    <div class="product-card-premium" onclick="openProductDetailSheet('${s.id}')" style="flex:0 0 120px;">
                        <div class="product-image-container" style="height:80px;">
                            ${getProductImage(s)}
                        </div>
                        <div class="item-name" style="font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name || s.productStandard?.name || 'Produit'}</div>
                        <div class="product-price" style="font-size:12px;">${Number(s.price).toFixed(3)} DT</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    openSheet("Détails du Produit", html);
}

async function handleOrderFromMkt(productId) {
    const p = state.marketplace.products.find(x => x.id === productId);
    if (!p) return;

    const html = `
        <div style="margin-bottom:20px;">
            <div class="item-name">${p.name}</div>
            <div class="item-meta">Vendu par ${p.vendor?.companyName || 'Fournisseur'}</div>
            <div class="card-value" style="font-size:16px; margin-top:8px;">${Number(p.price).toFixed(3)} DT / ${p.unit}</div>
        </div>
        <div class="form-group">
            <label>Quantité à commander</label>
            <input type="number" id="mkt-order-qty" value="1" min="1">
        </div>
        <button class="primary-btn" onclick="submitMktOrder('${productId}')">Confirmer la Commande</button>
    `;
    openSheet("Finaliser la Commande", html);
}

async function submitMktOrder(productId) {
    const p = state.marketplace.products.find(x => x.id === productId);
    const qty = document.getElementById('mkt-order-qty').value;
    
    const total = Number(p.price) * Number(qty);

    const res = await fetch(`${CONFIG.API_URL}/management/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            storeId,
            vendorId: p.vendorId,
            total,
            items: [{ name: p.name, quantity: Number(qty), price: Number(p.price) }]
        })
    });

    if (res.ok) {
        closeSheet();
        Toast.show("Commande envoyée au fournisseur ! ✅");
        refreshData();
    }
}

async function updateMarketplaceFeatured(productId, isFeatured) {
    console.log("Admin: Toggling featured status", productId, isFeatured);
    try {
        const res = await fetch(`${CONFIG.API_URL}/management/marketplace/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured })
        });
        
        if (res.ok) {
            Toast.show(`Produit ${isFeatured ? 'mis en avant' : 'retiré des sélections'} ! ⭐`);
            
            // Update local state and re-render sections
            const idx = state.marketplace.products.findIndex(x => x.id === productId);
            if (idx !== -1) {
                state.marketplace.products[idx].isFeatured = isFeatured;
                renderMktSections(state.marketplace.products);
                renderMarketplaceItems(document.getElementById('marketplace-results'));
            }
        } else {
            throw new Error(`HTTP ${res.status}`);
        }
    } catch (e) {
        console.error("Failed to update featured status", e);
        Toast.show("❌ Erreur lors de la mise à jour");
        // Revert toggle if possible (or user just sees it didn't change on next sheet open)
    }
}

// Initial Load
try {
    switchMgmtTab(currentTab); // Set initial title and active state
    refreshData();
} catch (e) {
    console.error("Critical initialization error", e);
}
