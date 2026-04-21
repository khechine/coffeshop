// Rachma Lite - Continuous Serial Tally (Grid Mode)
const state = {
    products: [],
    logs: {}, // productId -> Array of 'sale'|'loss'|'sale:PKG_ID'
    activeMode: 'sale',
    activeCategory: 'ALL',
    lastActiveId: null,
    transitioningIds: new Set(),
    soundEnabled: true,
    user: null
};

const SLOT_COUNT = 20;

function init() {
    loadUser();
    applyPermissions();
    state.products = getProducts();
    
    // Sync products in background and automatically update the UI
    const storeId = localStorage.getItem('rachma_store_id');
    if(storeId) syncProducts(storeId).then(() => {
        state.products = getProducts();
        renderCategoriesBar(); // Keep categories in sync
        renderProducts(); // Always re-render to reflect new packaging/products
    });
    state.logs = {}; // Critical: Clear memory before loading staff-specific logs
    loadState();
    renderModeSwitcher();
    renderCategoriesBar();
    renderProducts();
    updateCounters();
    initSoundToggle();
}

function saveState() {
    const key = getStaffLogKey();
    localStorage.setItem(key, JSON.stringify(state.logs));
    localStorage.setItem('rachma_sound_enabled', state.soundEnabled);
}

function loadState() {
    const key = getStaffLogKey();
    const saved = localStorage.getItem(key);
    if (saved) state.logs = JSON.parse(saved);
    const savedSound = localStorage.getItem('rachma_sound_enabled');
    if (savedSound !== null) state.soundEnabled = savedSound === 'true';
}

function renderModeSwitcher() {
    const saleBtn = document.getElementById('mode-sale');
    const lossBtn = document.getElementById('mode-loss');
    if (!saleBtn || !lossBtn) return;
    
    saleBtn.onclick = () => { 
        state.activeMode = 'sale'; 
        saleBtn.classList.add('active'); 
        lossBtn.classList.remove('active'); 
        haptic(10); 
    };
    lossBtn.onclick = () => { 
        state.activeMode = 'loss'; 
        lossBtn.classList.add('active'); 
        saleBtn.classList.remove('active'); 
        renderProducts(); // Refresh to hide inline packaging if any
        haptic(10); 
    };
}

function renderCategoriesBar() {
    const container = document.getElementById('categories-bar');
    if (!container) return;
    container.innerHTML = '';

    const categories = ['ALL', ...new Set(state.products.map(p => p.category))];

    categories.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = `cat-btn ${state.activeCategory === cat ? 'active' : ''}`;
        btn.innerText = cat;
        btn.onclick = () => { 
            state.activeCategory = cat; 
            renderCategoriesBar();
            renderProducts();
            haptic(5); 
        };
        container.appendChild(btn);
    });
}

function renderProducts() {
    const container = document.getElementById('product-list');
    if (!container) return;
    container.innerHTML = '';
    
    const allRows = [];
    state.products.forEach(p => {
        const productLogs = state.logs[p.id] || [];
        const fullRowsCount = Math.floor(productLogs.length / SLOT_COUNT);
        const remainingCount = productLogs.length % SLOT_COUNT;

        for (let i = 0; i < fullRowsCount; i++) {
            allRows.push({
                productId: p.id, name: p.name, category: p.category, icon: p.icon,
                data: productLogs.slice(i * SLOT_COUNT, (i + 1) * SLOT_COUNT),
                isFull: true, rowIndex: i + 1, product: p
            });
        }
        allRows.push({
            productId: p.id, name: p.name, category: p.category, icon: p.icon,
            data: [...productLogs.slice(fullRowsCount * SLOT_COUNT), ...Array(SLOT_COUNT - remainingCount).fill(null)],
            isFull: false, rowIndex: fullRowsCount + 1, product: p
        });
    });

    allRows.sort((a, b) => {
        if (a.isFull && !b.isFull) return -1;
        if (!a.isFull && b.isFull) return 1;
        if (a.isFull && b.isFull) return b.rowIndex - a.rowIndex || a.name.localeCompare(b.name);
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });

    allRows.forEach(row => {
        if (state.activeCategory !== 'ALL' && row.category !== state.activeCategory) return;
        if (row.isFull && !state.transitioningIds.has(row.productId)) return;

        // Optimized counting for complex log types
        const soldCount = row.data.filter(s => s && s.startsWith('sale')).length;
        const lostCount = row.data.filter(s => s === 'loss').length;

        const entry = document.createElement('div');
        entry.className = `product-entry ${row.isFull ? 'full anim-exit' : 'anim-enter'} ${row.productId === state.lastActiveId ? 'active-row' : ''}`;
        
        if (!row.isFull) {
            entry.onclick = () => handleAdd(row.productId);
            entry.oncontextmenu = (e) => { e.preventDefault(); handleUndo(row.productId); };
        }

        let packagingHtml = '';
        if (row.product.takeaway && !row.isFull && state.activeMode === 'sale' && row.product.packagings && row.product.packagings.length > 0) {
            packagingHtml = `
                <div class="inline-packaging-bar">
                    ${row.product.packagings.map(pkg => `
                        <div class="inline-pkg-btn" onclick="event.stopPropagation(); handleAdd('${row.productId}', '${pkg.id}')">
                            ${pkg.icon}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        entry.innerHTML = `
            <div class="product-meta">
                <div class="product-name-box">
                    <div class="product-name">${row.icon} ${row.name} ${row.isFull ? `<span style="font-size:10px; opacity:0.8;">(Lot ${row.rowIndex} 🔒)</span>` : ''}</div>
                </div>
                <div class="local-counters">
                    <div class="badge-count sale">${soldCount}</div>
                    <div class="badge-count loss">${lostCount}</div>
                </div>
            </div>
            ${packagingHtml}
            <div class="slots-grid">
                ${row.data.map(s => {
                    if (!s) return `<div class="slot"></div>`;
                    const isLoss = s === 'loss';
                    const pkgId = s.includes(':') ? s.split(':')[1] : null;
                    const pkg = pkgId ? ((row.product.packagings || []).find(p => p.id === pkgId) || CONFIG.PACKAGING[pkgId]) : null;
                    
                    return `
                        <div class="slot ${isLoss ? 'loss' : 'sale'}" 
                             ${pkg ? `data-pkg="${pkg.id}" data-pkg-icon="${pkg.icon}"` : ''}>
                        </div>`;
                }).join('')}
            </div>
        `;
        container.appendChild(entry);
    });
}

function handleAdd(productId, pkgId = null) {
    const product = state.products.find(p => p.id === productId);
    if (!state.logs[productId]) state.logs[productId] = [];
    
    // Determine log string
    let logType = state.activeMode;
    if (state.activeMode === 'sale' && pkgId && product.takeaway) {
        logType = `sale:${pkgId}`;
    }

    state.logs[productId].push(logType);
    state.lastActiveId = productId;
    
    recordSessionStart();

    if (state.logs[productId].length % SLOT_COUNT === 0) {
        state.transitioningIds.add(productId);
        setTimeout(() => {
            state.transitioningIds.delete(productId);
            renderProducts();
        }, 300);
    }

    saveState();
    renderProducts();
    updateCounters();
    haptic(10);
    playSound(state.activeMode);
}

function handleUndo(productId) {
    if (state.logs[productId] && state.logs[productId].length > 0) {
        state.logs[productId].pop();
        saveState();
        renderProducts();
        updateCounters();
        haptic(10);
    }
}

function updateCounters() {
    let totalSold = 0;
    Object.values(state.logs).forEach(log => {
        log.forEach(s => { if (s && s.startsWith('sale')) totalSold++; });
    });
    document.getElementById('count-sold').innerText = totalSold;
}

function haptic(ms) { if (window.navigator.vibrate) window.navigator.vibrate(ms); }

function initSoundToggle() {
    const btn = document.getElementById('btn-sound-toggle');
    if (!btn) return;
    const updateIcon = () => {
        btn.innerText = state.soundEnabled ? '🔊' : '🔇';
        btn.style.opacity = state.soundEnabled ? '1' : '0.5';
    };
    updateIcon();
    btn.onclick = () => {
        state.soundEnabled = !state.soundEnabled;
        updateIcon();
        saveState();
        haptic(10);
        if (state.soundEnabled) playSound('sale');
    };
}

function playSound(type) {
    if (!state.soundEnabled) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.05, now);

    if (type === 'sale') {
        [880, 1046, 1760].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.setValueAtTime(freq, now);
            osc.connect(g); g.connect(masterGain);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.3, now + 0.01);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now); osc.stop(now + 0.5);
        });
    } else {
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        noise.connect(filter); filter.connect(masterGain);
        masterGain.gain.setValueAtTime(0.05, now);
        masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        noise.start(now);
    }
}

window.onload = init;
