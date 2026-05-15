// Tables Management Logic
const state = {
    totalTables: 50,
    tableCarts: {} // tableId -> { items: [], total: 0 }
};

function init() {
    loadUser();
    applyPermissions();
    loadTableData();
    renderTables();
}

function loadTableData() {
    const saved = localStorage.getItem('rachma_table_carts');
    if (saved) state.tableCarts = JSON.parse(saved);
}

function renderTables() {
    const container = document.getElementById('tables-container');
    container.innerHTML = '';

    for (let i = 1; i <= state.totalTables; i++) {
        const tableId = `T${i}`;
        const cart = state.tableCarts[tableId];
        const isActive = cart && cart.total > 0;

        const card = document.createElement('div');
        card.className = `table-card ${isActive ? 'active' : ''}`;
        card.onclick = () => openTable(tableId);

        card.innerHTML = `
            <div class="num">${i}</div>
            <div class="status">${isActive ? cart.total.toFixed(3) + ' DT' : 'Libre'}</div>
        `;
        container.appendChild(card);
    }
}

function openTable(id) {
    localStorage.setItem('rachma_active_table', id);
    window.location.href = 'pos.html';
}

window.onload = init;
