// Total Rachma Report Logic
const state = {
    products: [],
    logs: {}
};

const SLOT_COUNT = 20;

function init() {
    const user = loadUser();
    applyPermissions();
    state.products = getProducts();
    
    const storeId = localStorage.getItem('rachma_store_id');
    if(storeId) syncProducts(storeId).then(() => {
        const oldLen = state.products.length;
        state.products = getProducts();
        if(oldLen === 0 && state.products.length > 0) {
            renderSummary();
            renderFullDetails();
            renderArchive();
        }
    });

    loadState();
    renderSummary();
    renderFullDetails();
    renderPackagingConsumption(); // Added: Packaging totals
    renderArchive();
    displaySessionInfo(user);
    
    document.getElementById('btn-session-reset').onclick = resetSession;
}

function loadState() {
    const key = getStaffLogKey();
    const saved = localStorage.getItem(key);
    // Explicitly reset logs if nothing found for this user
    state.logs = saved ? JSON.parse(saved) : {};
}

function renderPackagingConsumption() {
    const container = document.getElementById('packaging-consumption-list');
    if (!container) return;
    container.innerHTML = '';
    
    const pkgTotals = {};
    
    // Aggregate usage across all product logs
    Object.values(state.logs).forEach(log => {
        log.forEach(entry => {
            if (entry && entry.startsWith('sale:')) {
                const pkgId = entry.split(':')[1];
                pkgTotals[pkgId] = (pkgTotals[pkgId] || 0) + 1;
            }
        });
    });

    const entries = Object.entries(pkgTotals);
    if (entries.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 30px; color:var(--text-muted); font-size:12px; font-weight:700;">AUCUN EMBALLAGE UTILISÉ</div>`;
        return;
    }

    entries.forEach(([pkgId, count]) => {
        const pkg = CONFIG.PACKAGING[pkgId];
        if (!pkg) return;
        
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.innerHTML = `
            <div class="detail-info">
                <div class="detail-name">${pkg.icon} ${pkg.name}</div>
                <div class="detail-cat">Consommé cette session</div>
            </div>
            <div class="detail-badges">
                <div class="badge-pill sale">${count} Unité${count > 1 ? 's' : ''}</div>
            </div>
        `;
        container.appendChild(row);
    });
}

function renderFullDetails() {
    const container = document.getElementById('session-details-list');
    if (!container) return;
    container.innerHTML = '';
    
    let hasData = false;
    
    state.products.forEach(p => {
        const logs = state.logs[p.id] || [];
        if (logs.length === 0) return;
        
        hasData = true;
        const sCount = logs.filter(t => t && t.startsWith('sale')).length;
        const lCount = logs.filter(t => t === 'loss').length;
        
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.innerHTML = `
            <div class="detail-info">
                <div class="detail-name">${p.name}</div>
                <div class="detail-cat">${p.category}</div>
            </div>
            <div class="detail-badges">
                ${sCount > 0 ? `<div class="badge-pill sale">${sCount} Vendu${sCount > 1 ? 's' : ''}</div>` : ''}
                ${lCount > 0 ? `<div class="badge-pill loss">${lCount} Perte${lCount > 1 ? 's' : ''}</div>` : ''}
            </div>
        `;
        container.appendChild(row);
    });
    
    if (!hasData) {
        container.innerHTML = `<div style="text-align:center; padding: 30px; color:var(--text-muted); font-size:12px; font-weight:700;">AUCUNE VENTE DÉTECTÉE</div>`;
    }
}

function displaySessionInfo(user) {
    if (document.getElementById('report-user-name')) {
        document.getElementById('report-user-name').innerText = user.name;
    }
    
    // Dynamic Session ID
    const sid = getSessionId();
    if (document.getElementById('dynamic-session-id')) {
        document.getElementById('dynamic-session-id').innerText = sid;
    }
    
    const startKey = getSessionStartKey();
    const startTimeStr = localStorage.getItem(startKey);
    if (startTimeStr) {
        const start = new Date(startTimeStr);
        document.getElementById('session-start-time').innerText = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function renderSummary() {
    let totalSaleQty = 0;
    let totalLossQty = 0;
    let totalValuation = 0;
    
    Object.entries(state.logs).forEach(([pid, items]) => {
        const product = state.products.find(p => p.id === pid);
        if (!product) return;
        
        items.forEach(type => {
            if (type && type.startsWith('sale')) {
                totalSaleQty++;
                totalValuation += product.price;
            } else if (type === 'loss') {
                totalLossQty++;
            }
        });
    });
    
    document.getElementById('grand-total-dt').innerText = `${totalValuation.toFixed(3)} DT`;
    document.getElementById('total-qty-sale').innerText = totalSaleQty;
    document.getElementById('total-qty-loss').innerText = totalLossQty;
}

function renderArchive() {
    const container = document.getElementById('archive-list');
    container.innerHTML = '';
    
    const productGroups = {};
    state.products.forEach(p => {
        const productLogs = state.logs[p.id] || [];
        const fullRowsCount = Math.floor(productLogs.length / SLOT_COUNT);
        
        if (fullRowsCount > 0) {
            productGroups[p.id] = {
                name: p.name,
                lots: []
            };
            for (let i = 0; i < fullRowsCount; i++) {
                productGroups[p.id].lots.push({
                    rowIndex: i + 1,
                    data: productLogs.slice(i * SLOT_COUNT, (i + 1) * SLOT_COUNT)
                });
            }
        }
    });

    const groupedIds = Object.keys(productGroups);
    if (groupedIds.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--text-muted); font-size:13px; font-weight:700;">AUCUN LOT TERMINÉ POUR LE MOMENT</div>`;
        return;
    }

    groupedIds.forEach(pid => {
        const group = productGroups[pid];
        const totalSold = group.lots.reduce((acc, lot) => acc + lot.data.filter(s => s && s.startsWith('sale')).length, 0);
        const totalLost = group.lots.reduce((acc, lot) => acc + lot.data.filter(s => s === 'loss').length, 0);

        const entry = document.createElement('div');
        entry.className = 'product-entry full';
        
        let gridsHtml = group.lots.map(lot => `
            <div style="margin-bottom: 12px;">
                <div style="font-size:9px; color:var(--text-muted); margin-bottom:4px">LOT ${lot.rowIndex} 🔒</div>
                <div class="slots-grid">
                    ${lot.data.map(s => {
                        let cls = '';
                        if (s === 'loss') cls = 'loss';
                        else if (s && s.startsWith('sale')) cls = 'sale';
                        return `<div class="slot ${cls}"></div>`;
                    }).join('')}
                </div>
            </div>
        `).join('');

        entry.innerHTML = `
            <div class="product-meta" style="border-bottom: 1px solid var(--border-glass); padding-bottom: 12px; margin-bottom: 12px;">
                <div class="product-name-box">
                    <div class="product-name">${group.name}</div>
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">TOTAL TERMINÉ : ${group.lots.length} LOTS</div>
                </div>
                <div class="local-counters">
                    <div class="badge-count sale">Vendus: ${totalSold}</div>
                    <div class="badge-count loss">Pertes: ${totalLost}</div>
                </div>
            </div>
            ${gridsHtml}
        `;
        container.appendChild(entry);
    });
}

async function resetSession() {
    const user = JSON.parse(localStorage.getItem('rachma_user'));
    const storeId = localStorage.getItem('rachma_store_id');
    const logKey = getStaffLogKey();
    const startKey = getSessionStartKey();
    const sid = getSessionId();

    // Summary calculation
    let totalQty = 0;
    let totalDT = 0;
    let totalLoss = 0;
    const syncItems = [];

    Object.entries(state.logs).forEach(([pid, items]) => {
        const product = state.products.find(p => p.id === pid);
        if (!product) return;
        const sCount = items.filter(t => t && t.startsWith('sale')).length;
        const lCount = items.filter(t => t === 'loss').length;
        if (sCount > 0) {
            totalQty += sCount;
            totalDT += (sCount * product.price);
            syncItems.push({ productId: pid, quantity: sCount, price: product.price });
        }
        totalLoss += lCount;
    });

    const summaryMsg = `
        👤 Agent: ${user.name}
        📑 Session: ${sid}
        💰 Chiffre: ${totalDT.toFixed(3)} DT
        📦 Articles: ${totalQty}
        ⚠️ Pertes: ${totalLoss}
        
        Voulez-vous synchroniser et clôturer cette session ?
    `;

    const ok = await ModernModal.confirm({
        title: "SYNCHRONISATION & CLÔTURE",
        message: summaryMsg,
        icon: '📊',
        confirmText: "OUI, SYNCHRONISER"
    });

    if (!ok) return;

    if (syncItems.length === 0 && totalLoss === 0) {
        localStorage.removeItem(logKey);
        localStorage.removeItem(startKey);
        await ModernModal.alert({ title: "Session Vide", message: "Aucune donnée à enregistrer.", icon: 'ℹ️' });
        window.location.href = 'index.html';
        return;
    }

    try {
        // Sync with central API
        const response = await fetch(`${CONFIG.API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeId: storeId,
                baristaId: user.id || 'STAFF_RACHMA',
                total: totalDT,
                mode: 'RACHMA',
                sessionId: sid,
                items: syncItems
            })
        });

        if (response.ok) {
            localStorage.removeItem(logKey);
            localStorage.removeItem(startKey);
            await ModernModal.alert({ 
                title: "Session Archivée", 
                message: `Clôture réussie pour ${user.name}.\nID: ${sid}\nChiffre: ${totalDT.toFixed(3)} DT.`,
                icon: '✅'
            });
            window.location.href = 'index.html';
        } else {
            throw new Error("API Error");
        }
    } catch (err) {
        const force = await ModernModal.confirm({
            title: "Erreur Sync",
            message: "Le serveur est injoignable. Voulez-vous TOUT EFFACER sans synchroniser (DÉCONSEILLÉ) ?",
            icon: '⚠️',
            confirmText: "Forcer l'effacement",
            cancelText: "Réessayer plus tard"
        });
        if (force) {
            localStorage.removeItem(logKey);
            localStorage.removeItem(startKey);
            window.location.href = 'index.html';
        }
    }
}

window.onload = init;
