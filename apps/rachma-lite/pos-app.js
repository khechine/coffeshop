// Professional POS Logic
const state = {
    products: [],
    tableId: '...',
    cart: {}, // productId -> qty
    taxRate: 0.19 // 19% TVA
};

function init() {
    loadUser();
    applyPermissions();
    state.products = getProducts();
    state.tableId = localStorage.getItem('rachma_active_table') || 'T1';

    const storeId = localStorage.getItem('rachma_store_id');
    if(storeId) syncProducts(storeId).then(() => {
        const oldLen = state.products.length;
        state.products = getProducts();
        if(oldLen === 0 && state.products.length > 0) { renderProducts(); updateUI(); }
    });
    loadCart();
    renderProducts();
    updateUI();

    document.getElementById('btn-clear-pos').onclick = clearCart;
    document.getElementById('btn-print').onclick = printReceipt;
    document.getElementById('btn-validate').onclick = checkout;
}

function toggleCart(show) {
    const cart = document.querySelector('.pos-cart');
    if (show) cart.classList.add('active');
    else cart.classList.remove('active');
}

function loadCart() {
    const allCarts = JSON.parse(localStorage.getItem('rachma_table_carts') || '{}');
    state.cart = allCarts[state.tableId]?.items || {};
}

function saveCart() {
    const allCarts = JSON.parse(localStorage.getItem('rachma_table_carts') || '{}');
    const total = calculateTotal();
    allCarts[state.tableId] = { items: state.cart, total: total };
    localStorage.setItem('rachma_table_carts', JSON.stringify(allCarts));
}

function renderProducts() {
    const container = document.getElementById('pos-product-grid');
    container.innerHTML = '';
    
    const categories = [...new Set(state.products.map(p => p.category))];
    categories.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `<div class="category-header">${cat}</div>`;
        
        const grid = document.createElement('div');
        grid.style.display = 'flex';
        grid.style.flexWrap = 'wrap';
        grid.style.gap = '10px';
        grid.style.padding = '0 16px';

        state.products.filter(p => p.category === cat).forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'product-row';
            btn.onclick = () => addToCart(p.id);
            
            const iconContent = p.image 
                ? `<img src="${p.image}" alt="${p.name}">` 
                : `<span class="icon-fallback">${p.icon || '📦'}</span>`;

            btn.innerHTML = `
                <div class="product-image-container">
                    ${iconContent}
                </div>
                <div style="flex: 1; text-align: left;">
                    <div class="product-name" style="font-weight: 700; font-size: 14px;">${p.name}</div>
                    <div class="product-price" style="color: var(--primary); font-weight: 800; font-size: 12px; margin-top: 2px;">${Number(p.price).toFixed(3)} DT</div>
                </div>
            `;
            grid.appendChild(btn);
        });
        section.appendChild(grid);
        container.appendChild(section);
    });
}

function addToCart(id) {
    state.cart[id] = (state.cart[id] || 0) + 1;
    saveCart();
    updateUI();
}

function removeFromCart(id) {
    if (state.cart[id] > 0) {
        state.cart[id]--;
        if (state.cart[id] === 0) delete state.cart[id];
        saveCart();
        updateUI();
    }
}

function calculateTotal() {
    return Object.entries(state.cart).reduce((acc, [id, qty]) => {
        const p = state.products.find(prod => prod.id === id);
        return acc + (p.price * qty);
    }, 0);
}

function updateUI() {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = '';
    
    let subtotalTTC = 0;
    
    Object.entries(state.cart).forEach(([id, qty]) => {
        const p = state.products.find(prod => prod.id === id);
        subtotalTTC += p.price * qty;
        
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: 700;">${p.name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${qty} x ${p.price.toFixed(3)}</div>
            </div>
            <div style="font-weight: 800;">${(p.price * qty).toFixed(3)}</div>
            <button onclick="removeFromCart('${id}')" style="background: none; border: none; color: var(--danger); margin-left:10px;">×</button>
        `;
        cartContainer.appendChild(row);
    });

    const totalTax = subtotalTTC * (state.taxRate / (1 + state.taxRate));
    const totalHT = subtotalTTC - totalTax;

    document.getElementById('subtotal-ht').innerText = `${totalHT.toFixed(3)} DT`;
    document.getElementById('tax-amount').innerText = `${totalTax.toFixed(3)} DT`;
    document.getElementById('total-ttc').innerText = `${subtotalTTC.toFixed(3)} DT`;

    // Update Mobile Badge
    const badge = document.getElementById('cart-badge');
    const totalQty = Object.values(state.cart).reduce((a, b) => a + b, 0);
    if (totalQty > 0) {
        badge.innerText = totalQty;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function clearCart() {
    state.cart = {};
    saveCart();
    updateUI();
}

async function checkout() {
    if (Object.keys(state.cart).length === 0) return;
    printReceipt();
    await ModernModal.alert({ title: "Vente Encaissée", message: "La vente a été enregistrée et le ticket a été envoyé à l'impression.", icon: '💰' });
    clearCart();
    window.location.href = 'tables.html';
}

function printReceipt() {
    const printArea = document.getElementById('print-area');
    const date = new Date().toLocaleString();
    
    document.getElementById('print-date').innerText = date;
    document.getElementById('print-table').innerText = `TABLE ${state.tableId.replace('T','')}`;
    
    let itemsHtml = '';
    Object.entries(state.cart).forEach(([id, qty]) => {
        const p = state.products.find(prod => prod.id === id);
        itemsHtml += `<div style="display:flex; justify-content:space-between;">
            <span>${p.name} x${qty}</span>
            <span>${(p.price * qty).toFixed(3)}</span>
        </div>`;
    });
    document.getElementById('print-items').innerHTML = itemsHtml;
    
    const total = calculateTotal();
    document.getElementById('print-totals').innerHTML = `
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px;">
            <span>TOTAL TTC</span>
            <span>${total.toFixed(3)} DT</span>
        </div>
    `;

    window.print();
}

window.onload = init;
