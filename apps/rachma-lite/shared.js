const CONFIG = {
    API_URL: "https://api.coffeeshop.elkassa.com",
    TAX_RATE: 0.19,
    PACKAGING: {
        CUP_PF: { id: 'CUP_PF', name: 'Gobelet PF', icon: '🥤' },
        BOX_PF: { id: 'BOX_PF', name: 'Paquet Gâteau PF', icon: '🥡' }
    }
};

const ModernModal = {
    init() {
        if (document.getElementById('modal-overlay')) return;
        const html = `
            <div id="modal-overlay" class="modal-overlay">
                <div class="modal-card">
                    <div id="modal-icon" class="modal-icon">⚠️</div>
                    <div id="modal-title" class="modal-title">Attention</div>
                    <div id="modal-body" class="modal-body">Description here...</div>
                    <div class="modal-actions">
                        <button id="modal-cancel" class="modal-btn modal-btn-cancel">Annuler</button>
                        <button id="modal-confirm" class="modal-btn modal-btn-confirm">Confirmer</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirm({ title, message, icon = '⚠️', confirmText = 'Confirmer', cancelText = 'Annuler' }) {
        this.init();
        return new Promise((resolve) => {
            const overlay = document.getElementById('modal-overlay');
            const titleEl = document.getElementById('modal-title');
            const bodyEl = document.getElementById('modal-body');
            const iconEl = document.getElementById('modal-icon');
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');

            titleEl.innerText = title;
            bodyEl.innerText = message;
            iconEl.innerText = icon;
            confirmBtn.innerText = confirmText;
            cancelBtn.innerText = cancelText;

            overlay.classList.add('active');

            const cleanup = (val) => {
                overlay.classList.remove('active');
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
                resolve(val);
            };

            confirmBtn.onclick = () => cleanup(true);
            cancelBtn.onclick = () => cleanup(false);
        });
    },

    alert({ title, message, icon = '✅' }) {
        this.init();
        return new Promise((resolve) => {
            const overlay = document.getElementById('modal-overlay');
            const titleEl = document.getElementById('modal-title');
            const bodyEl = document.getElementById('modal-body');
            const iconEl = document.getElementById('modal-icon');
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');

            titleEl.innerText = title;
            bodyEl.innerText = message;
            iconEl.innerText = icon;
            confirmBtn.innerText = "OK";
            cancelBtn.style.display = 'none';

            overlay.classList.add('active');

            confirmBtn.onclick = () => {
                overlay.classList.remove('active');
                cancelBtn.style.display = 'block';
                resolve();
            };
        });
    }
};

function loadUser() {
    const savedUser = localStorage.getItem('rachma_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (document.getElementById('user-name')) {
            document.getElementById('user-name').innerText = user.name;
        }
        return user;
    } else if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('pairing.html')) {
        window.location.href = 'login.html';
    }
}

function applyPermissions() {
    const savedUser = localStorage.getItem('rachma_user');
    if (!savedUser) return;
    const user = JSON.parse(savedUser);
    const perms = user.permissions || [];
    
    // Hide Tables tab if user lacks POS/TABLES perms
    const hasPosAccess = perms.includes('POS') || perms.includes('TABLES');
    const tablesTab = document.getElementById('tab-tables');
    
    if (tablesTab && !hasPosAccess) {
        tablesTab.style.display = 'none';
        if (window.location.pathname.includes('tables.html')) {
            window.location.href = 'index.html';
        }
    }
}

function getStaffLogKey() {
    const user = JSON.parse(localStorage.getItem('rachma_user') || '{}');
    return user.id ? `rachma_logs_${user.id}` : 'rachma_inventory_logs';
}

function getSessionStartKey() {
    const user = JSON.parse(localStorage.getItem('rachma_user') || '{}');
    return user.id ? `rachma_start_${user.id}` : 'rachma_session_start';
}

function recordSessionStart() {
    const key = getSessionStartKey();
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, new Date().toISOString());
    }
}

function getSessionId() {
    const user = JSON.parse(localStorage.getItem('rachma_user') || '{}');
    const startTimeStr = localStorage.getItem(getSessionStartKey()) || new Date().toISOString();
    const datePart = new Date(startTimeStr).toLocaleDateString([], { day:'2-digit', month:'2-digit' }).replace('/', '');
    const userPart = user.name ? user.name.substring(0, 3).toUpperCase() : 'UNK';
    return `RID-${userPart}-${datePart}`;
}

async function handleLogout() {
    const ok = await ModernModal.confirm({
        title: "Changer d'utilisateur",
        message: "Voulez-vous fermer votre session actuelle ?",
        icon: '👤'
    });
    if (ok) {
        localStorage.removeItem('rachma_user');
        window.location.href = 'login.html';
    }
}

async function handleUnpair() {
    const ok = await ModernModal.confirm({
        title: "Oublier ce terminal",
        message: "Cette action va désactiver ce terminal de la boutique. Vous devrez rescanner le QR Code.",
        icon: '🚫',
        confirmText: "Oublier"
    });
    if (ok) {
        localStorage.clear();
        window.location.href = 'pairing.html';
    }
}

async function syncProducts(storeId) {
    if (!storeId) return;
    try {
        const res = await fetch(`${CONFIG.API_URL}/products?storeId=${storeId}`);
        if (res.ok) {
            const rawProducts = await res.json();
            const products = rawProducts.map(p => {
                let icon = '📦';
                const cat = p.categoryName || '';
                if (cat.includes('Café') || cat.includes('Cafe') || cat.includes('Coffee')) icon = '☕';
                else if (cat.includes('Boisson') || cat.includes('Drink')) icon = '🥤';
                else if (cat.includes('Thé') || cat.includes('Tea')) icon = '🍃';
                else if (cat.includes('Viennoiserie') || cat.includes('Food') || cat.includes('Pâtisserie')) icon = '🥐';
                else if (cat.includes('Chicha')) icon = '💨';

                return {
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    category: cat || 'Général',
                    icon: icon,
                    takeaway: p.takeaway ?? true,
                    packagings: p.packagings || []
                };
            });
            localStorage.setItem('rachma_products', JSON.stringify(products));
        }
    } catch(e) {
        console.error("Error syncing products", e);
    }
}

function getProducts() {
    const cached = localStorage.getItem('rachma_products');
    if (cached) return JSON.parse(cached);
    return []; // Return empty if not synced
}
