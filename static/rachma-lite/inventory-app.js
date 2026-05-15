// Inventory & Loss Simulation Logic - Continuous Serial Tally
const state = {
    products: [],
    logs: {}, // productId -> Array of 'sale'|'loss'
    activeMode: 'sale',
    lastActiveId: null,
    transitioningIds: new Set(), // IDs currently animating out
    soundEnabled: true
};

const SLOT_COUNT = 20;

function init() {
    state.products = getProducts();
    
    const storeId = localStorage.getItem('rachma_store_id');
    if(storeId) syncProducts(storeId).then(() => {
        const oldLen = state.products.length;
        state.products = getProducts();
        if(oldLen === 0 && state.products.length > 0) renderProducts();
    });

    loadState();
    renderModeSwitcher();
    renderProducts();
    updateCounters();
    initSoundToggle();
}

function saveState() {
    localStorage.setItem('rachma_inventory_logs', JSON.stringify(state.logs));
    localStorage.setItem('rachma_sound_enabled', state.soundEnabled);
}

function loadState() {
    const saved = localStorage.getItem('rachma_inventory_logs');
    if (saved) state.logs = JSON.parse(saved);
    
    const savedSound = localStorage.getItem('rachma_sound_enabled');
    if (savedSound !== null) state.soundEnabled = savedSound === 'true';
}

function renderModeSwitcher() {
    const saleBtn = document.getElementById('mode-sale');
    const lossBtn = document.getElementById('mode-loss');
    saleBtn.onclick = () => { state.activeMode = 'sale'; saleBtn.classList.add('active'); lossBtn.classList.remove('active'); haptic(); };
    lossBtn.onclick = () => { state.activeMode = 'loss'; lossBtn.classList.add('active'); saleBtn.classList.remove('active'); haptic(); };
}

function renderProducts() {
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    
    // 1. Generate Rows (Plates)
    const allRows = [];
    state.products.forEach(p => {
        const productLogs = state.logs[p.id] || [];
        const fullRowsCount = Math.floor(productLogs.length / SLOT_COUNT);
        const remainingCount = productLogs.length % SLOT_COUNT;

        // Add Full Rows
        for (let i = 0; i < fullRowsCount; i++) {
            allRows.push({
                productId: p.id,
                name: p.name,
                category: p.category,
                data: productLogs.slice(i * SLOT_COUNT, (i + 1) * SLOT_COUNT),
                isFull: true,
                rowIndex: i + 1
            });
        }

        // Add Working Row (even if empty, to allow clicking)
        allRows.push({
            productId: p.id,
            name: p.name,
            category: p.category,
            data: [...productLogs.slice(fullRowsCount * SLOT_COUNT), ...Array(SLOT_COUNT - remainingCount).fill(null)],
            isFull: false,
            rowIndex: fullRowsCount + 1
        });
    });

    // 2. Sort Rows: Full rows move to the top
    allRows.sort((a, b) => {
        if (a.isFull && !b.isFull) return -1;
        if (!a.isFull && b.isFull) return 1;
        
        // If both are full, sort by row index (desc) or keep original
        if (a.isFull && b.isFull) {
             return b.rowIndex - a.rowIndex || a.name.localeCompare(b.name);
        }
        
        // Working rows: recently active first OR category order
        if (a.productId === state.lastActiveId) return -1;
        if (b.productId === state.lastActiveId) return 1;
        
        return a.category.localeCompare(b.category);
    });

    // 3. Render
    allRows.forEach(row => {
        // ONLY RENDER WORKING ROWS (OR FULL ROWS IN TRANSITION)
        if (row.isFull && !state.transitioningIds.has(row.productId)) return;

        const soldCount = row.data.filter(s => s === 'sale').length;
        const lostCount = row.data.filter(s => s === 'loss').length;

        const entry = document.createElement('div');
        entry.className = `product-entry ${row.isFull ? 'full anim-exit' : 'anim-enter'} ${row.productId === state.lastActiveId ? 'active-row' : ''}`;
        
        // Global click handler: always adds to the logs of that product
        if (!row.isFull) {
            entry.onclick = () => handleAdd(row.productId);
            entry.oncontextmenu = (e) => { e.preventDefault(); handleUndo(row.productId); };
        }

        entry.innerHTML = `
            <div class="product-meta">
                <div class="product-name-box">
                    <div class="product-name">${row.name} ${row.isFull ? `<span style="font-size:10px; opacity:0.8;">(Lot ${row.rowIndex} 🔒)</span>` : ''}</div>
                </div>
                <div class="local-counters">
                    <div class="badge-count sale">Vendus: ${soldCount}</div>
                    <div class="badge-count loss">Pertes: ${lostCount}</div>
                </div>
            </div>
            <div class="slots-grid">
                ${row.data.map(s => `<div class="slot ${s || ''}"></div>`).join('')}
            </div>
        `;
        
        container.appendChild(entry);
    });
}

function handleAdd(productId) {
    if (!state.logs[productId]) state.logs[productId] = [];
    state.logs[productId].push(state.activeMode);
    state.lastActiveId = productId;
    
    // Check if a lot was just completed
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
    haptic();
    playSound(state.activeMode);
}

function handleUndo(productId) {
    if (state.logs[productId] && state.logs[productId].length > 0) {
        state.logs[productId].pop();
        saveState();
        renderProducts();
        updateCounters();
        haptic();
    }
}

function updateCounters() {
    let totalSold = 0;
    let totalLost = 0;
    Object.values(state.logs).forEach(log => {
        log.forEach(s => {
            if (s === 'sale') totalSold++;
            if (s === 'loss') totalLost++;
        });
    });
    document.getElementById('count-sold').innerText = totalSold;
    document.getElementById('count-lost').innerText = totalLost;
}

function haptic() { if (window.navigator.vibrate) window.navigator.vibrate(10); }

function initSoundToggle() {
    const btn = document.getElementById('btn-sound-toggle');
    const updateIcon = () => {
        btn.innerText = state.soundEnabled ? '🔊' : '🔇';
        btn.style.opacity = state.soundEnabled ? '1' : '0.5';
    };
    
    updateIcon();
    
    btn.onclick = () => {
        state.soundEnabled = !state.soundEnabled;
        updateIcon();
        saveState();
        haptic();
        
        // Browsers require a user gesture to enable audio context
        if (state.soundEnabled) {
            sounds.sale.play().then(() => {
                sounds.sale.pause();
                sounds.sale.currentTime = 0;
            }).catch(e => {});
        }
    };
}

// High-fidelity Audio Feedback (Synthesized for 100% reliability)
function playSound(type) {
    if (!state.soundEnabled) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.1, now);

    if (type === 'sale') {
        // --- REALISTIC CASHIER CHIME ---
        // Multiple oscillators for a rich metallic "Ding"
        [880, 1046, 1760].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = i === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.connect(g);
            g.connect(masterGain);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.3, now + 0.01);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.5);
        });
    } else {
        // --- CLEAN PAPER SLIDE ---
        // Filtered white noise for a subtle rustle
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
        
        noise.connect(filter);
        filter.connect(masterGain);
        masterGain.gain.setValueAtTime(0.05, now);
        masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        noise.start(now);
    }
}

window.onload = init;
