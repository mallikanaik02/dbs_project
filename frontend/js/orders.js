// frontend/js/orders.js
'use strict';

const ordersState = {
  page: 1, limit: 15,
  search: '', status: '', payment_method: '',
  dateFrom: '', dateTo: '',
  sortBy: 'date', sortDir: 'DESC',
};

// Cart state for new sale
let cart = [];
let allBooksCache = [];

async function renderOrders(container) {
  document.getElementById('headerActions').innerHTML =
    `<button class="btn btn-primary" id="btnNewSale"><i data-lucide="plus"></i> New Sale</button>`;
  lucide.createIcons({ elements: [document.getElementById('headerActions')] });

  container.innerHTML = `
    <div class="toolbar">
      <div class="search-wrap">
        <i data-lucide="search"></i>
        <input type="text" class="search-input" id="orderSearch" placeholder="Search order ID or customer…">
      </div>
      <select class="filter-select" id="filterStatus">
        <option value="">All Status</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <select class="filter-select" id="filterPayment">
        <option value="">All Methods</option>
        <option value="Cash">Cash</option>
        <option value="Credit Card">Credit Card</option>
        <option value="Debit Card">Debit Card</option>
        <option value="UPI">UPI</option>
      </select>
      <input type="date" class="filter-select" id="filterDateFrom" title="From date">
      <input type="date" class="filter-select" id="filterDateTo"   title="To date">
      <button class="btn btn-ghost btn-sm" id="btnClearOrderFilters"><i data-lucide="x"></i></button>
    </div>
    <div class="panel">
      <div id="ordersTableContainer"></div>
      <div class="pagination" id="ordersPagination"></div>
    </div>`;

  lucide.createIcons({ elements: [container] });

  // Filter events
  let timer;
  document.getElementById('orderSearch').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { ordersState.search = e.target.value; ordersState.page = 1; loadOrdersTable(); }, 320);
  });
  ['filterStatus','filterPayment','filterDateFrom','filterDateTo'].forEach(id => {
    document.getElementById(id).addEventListener('change', (e) => {
      const key = { filterStatus:'status', filterPayment:'payment_method', filterDateFrom:'dateFrom', filterDateTo:'dateTo' }[id];
      ordersState[key] = e.target.value; ordersState.page = 1; loadOrdersTable();
    });
  });
  document.getElementById('btnClearOrderFilters').addEventListener('click', () => {
    Object.assign(ordersState, { search:'', status:'', payment_method:'', dateFrom:'', dateTo:'', page:1 });
    ['orderSearch','filterStatus','filterPayment','filterDateFrom','filterDateTo'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value='';
    });
    loadOrdersTable();
  });
  document.getElementById('btnNewSale').addEventListener('click', openNewSaleModal);

  loadOrdersTable();
}

async function loadOrdersTable() {
  const c = document.getElementById('ordersTableContainer');
  if (!c) return;
  c.innerHTML = loadingHTML();
  try {
    const qs   = buildQuery({ ...ordersState });
    const data = await apiGet('/orders' + qs);
    renderOrdersTable(c, data);
    renderPagination('ordersPagination', data, (p) => { ordersState.page = p; loadOrdersTable(); });
  } catch (err) {
    c.innerHTML = emptyStateHTML('alert-circle', 'Error', err.message);
    lucide.createIcons({ elements: [c] });
  }
}

function renderOrdersTable(container, data) {
  if (!data.data?.length) {
    container.innerHTML = emptyStateHTML('shopping-bag', 'No orders found', 'Create a new sale to get started.');
    lucide.createIcons({ elements: [container] });
    return;
  }
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr>
        <th>#</th><th>Customer</th><th>Date</th>
        <th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${data.data.map(o => `
          <tr data-id="${o.order_id}">
            <td class="td-mono fw-600">#${o.order_id}</td>
            <td>${escHtml(o.customer_name)}</td>
            <td class="td-muted">${fmtDateTime(o.order_date)}</td>
            <td>${o.item_count} item${o.item_count!==1?'s':''}</td>
            <td class="fw-600">${fmtCurrency(o.total_amount)}</td>
            <td>${paymentBadge(o.payment_method)}</td>
            <td>${statusBadge(o.status)}</td>
            <td>
              <div class="flex gap-8">
                <button class="btn-icon btn-view" data-id="${o.order_id}" title="View"><i data-lucide="eye"></i></button>
                ${o.status === 'Completed' ? `<button class="btn-icon btn-delete" data-id="${o.order_id}" title="Cancel Order"><i data-lucide="x-circle"></i></button>` : ''}
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;

  lucide.createIcons({ elements: [container] });

  container.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => viewOrder(btn.dataset.id)));
  container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async () => {
    const o = data.data.find(x => x.order_id == btn.dataset.id);
    const ok = await showConfirm(`Cancel Order #${o.order_id}? Stock will be restored.`, 'Cancel Order', 'Yes, Cancel');
    if (!ok) return;
    try {
      await apiPatch('/orders/' + btn.dataset.id + '/cancel');
      showToast('Order cancelled and stock restored.', 'info');
      loadOrdersTable();
    } catch (err) { showToast(err.message, 'error'); }
  }));
}

async function viewOrder(id) {
  try {
    const o = await apiGet('/orders/' + id);
    openModal(`Order #${o.order_id}`, `
      <div class="order-detail-section">
        <div class="order-detail-section-title">Order Information</div>
        <div class="detail-grid">
          <div class="detail-item"><div class="detail-label">Customer</div><div class="detail-value">${escHtml(o.customer_name)}</div></div>
          <div class="detail-item"><div class="detail-label">Date</div><div class="detail-value">${fmtDateTime(o.order_date)}</div></div>
          <div class="detail-item"><div class="detail-label">Payment</div><div class="detail-value">${paymentBadge(o.payment_method)}</div></div>
          <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value">${statusBadge(o.status)}</div></div>
          ${o.email ? `<div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${escHtml(o.email)}</div></div>` : ''}
          ${o.phone ? `<div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value td-mono">${escHtml(o.phone)}</div></div>` : ''}
        </div>
      </div>
      <div class="order-detail-section">
        <div class="order-detail-section-title">Items Purchased</div>
        <div class="table-wrap"><table>
          <thead><tr><th>Book</th><th>Author</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${o.items.map(i => `
              <tr>
                <td class="fw-600">${escHtml(i.title)}</td>
                <td class="td-muted">${escHtml(i.author_name)}</td>
                <td>${i.quantity}</td>
                <td>${fmtCurrency(i.unit_price)}</td>
                <td class="fw-600">${fmtCurrency(i.subtotal)}</td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div style="text-align:right;padding-top:12px;border-top:1px solid var(--border)">
        <span style="font-size:14px;color:var(--text-muted)">Total Amount: </span>
        <span style="font-family:var(--font-heading);font-size:22px;font-weight:800;color:var(--accent)">${fmtCurrency(o.total_amount)}</span>
      </div>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`, 'lg');
  } catch (err) { showToast(err.message, 'error'); }
}

// ═══ New Sale Modal ════════════════════════════════════════════
async function openNewSaleModal() {
  cart = [];
  let customers = [];
  try { customers = await apiGet('/customers?limit=200'); customers = customers.data; } catch {}

  openModal('New Sale', buildSaleHTML(customers), `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" id="btnCompleteSale" disabled><i data-lucide="check"></i> Complete Sale</button>`, 'xl');

  // Book search
  let booksTimer;
  const bookSearchInput = document.getElementById('saleBookSearch');
  const resultsDiv      = document.getElementById('saleBookResults');

  bookSearchInput.addEventListener('input', async (e) => {
    clearTimeout(booksTimer);
    const q = e.target.value.trim();
    if (q.length < 2) { resultsDiv.innerHTML = ''; resultsDiv.classList.add('hidden'); return; }
    booksTimer = setTimeout(async () => {
      try {
        const data = await apiGet('/books?search=' + encodeURIComponent(q) + '&limit=10');
        if (!data.data?.length) { resultsDiv.innerHTML = '<div class="book-result-item td-muted">No books found.</div>'; }
        else {
          resultsDiv.innerHTML = data.data.map(b => `
            <div class="book-result-item" data-book='${JSON.stringify({book_id:b.book_id,title:b.title,author_name:(b.authors || b.author_name || ''),price:b.price,stock_quantity:b.stock_quantity})}'>
              <div>
                <div class="book-result-title">${escHtml(b.title)}</div>
                <div class="book-result-meta">${escHtml(b.authors || b.author_name)} · <span class="book-result-stock ${b.stock_quantity===0?'stock-out':b.stock_quantity<=5?'stock-low':''}">${b.stock_quantity} in stock</span></div>
              </div>
              <span class="book-result-price">${fmtCurrency(b.price)}</span>
            </div>`).join('');
        }
        resultsDiv.classList.remove('hidden');
      } catch {}
    }, 280);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#saleBookSearch') && !e.target.closest('#saleBookResults'))
      resultsDiv.classList.add('hidden');
  });

  resultsDiv.addEventListener('click', (e) => {
    const item = e.target.closest('.book-result-item');
    if (!item || !item.dataset.book) return;
    const book = JSON.parse(item.dataset.book);
    if (book.stock_quantity === 0) { showToast('This book is out of stock.', 'warning'); return; }
    addToCart(book);
    bookSearchInput.value = '';
    resultsDiv.classList.add('hidden');
  });

  document.getElementById('btnCompleteSale').addEventListener('click', completeSale);
}

function buildSaleHTML(customers) {
  return `
    <div class="sale-layout">
      <div>
        <div class="form-group">
          <label class="form-label">Customer</label>
          <select class="form-control" id="saleCustomer">
            <option value="">Walk-in Customer</option>
            ${customers.map(c => `<option value="${c.customer_id}">${escHtml(c.customer_name)} — ${escHtml(c.email)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Payment Method</label>
          <select class="form-control" id="salePayment">
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Search & Add Books</label>
          <div style="position:relative">
            <div class="search-wrap" style="max-width:100%">
              <i data-lucide="search"></i>
              <input type="text" class="search-input" id="saleBookSearch" placeholder="Type book title or author…" style="max-width:100%">
            </div>
            <div class="book-search-results hidden" id="saleBookResults"></div>
          </div>
        </div>
      </div>
      <div class="cart-panel" id="cartPanel">
        <div class="cart-header"><div class="cart-title">Order Summary</div></div>
        <div class="cart-items" id="cartItems">
          <div class="empty-state" style="padding:32px"><div class="td-muted" style="font-size:13px">Add books to begin</div></div>
        </div>
        <div class="cart-footer" id="cartFooter">
          <div class="cart-total-row cart-grand-total">
            <span class="cart-total-label">Total</span>
            <span class="cart-total-value" id="cartTotal">${fmtCurrency(0)}</span>
          </div>
        </div>
      </div>
    </div>`;
}

function addToCart(book) {
  const existing = cart.find(i => i.book_id === book.book_id);
  if (existing) {
    if (existing.quantity >= book.stock_quantity) {
      showToast(`Only ${book.stock_quantity} in stock.`, 'warning'); return;
    }
    existing.quantity++;
  } else {
    cart.push({ ...book, quantity: 1 });
  }
  updateCartUI();
}

function updateCartUI() {
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const btn       = document.getElementById('btnCompleteSale');
  if (!cartItems) return;

  if (!cart.length) {
    cartItems.innerHTML = `<div class="empty-state" style="padding:32px"><div class="td-muted" style="font-size:13px">Add books to begin</div></div>`;
    if (cartTotal) cartTotal.textContent = fmtCurrency(0);
    if (btn) btn.disabled = true;
    return;
  }

  cartItems.innerHTML = cart.map((item, idx) => `
    <div class="cart-item" data-idx="${idx}">
      <div class="cart-item-info">
        <div class="cart-item-title">${escHtml(item.title)}</div>
        <div class="cart-item-meta">${escHtml(item.author_name)} · ${fmtCurrency(item.price)} each</div>
        <div class="cart-qty">
          <button class="qty-btn" data-action="dec" data-idx="${idx}">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-idx="${idx}">+</button>
        </div>
      </div>
      <div>
        <div class="cart-item-price">${fmtCurrency(item.price * item.quantity)}</div>
        <button class="cart-remove" data-idx="${idx}" style="margin-top:8px;display:block">
          <i data-lucide="x"></i>
        </button>
      </div>
    </div>`).join('');

  lucide.createIcons({ elements: [cartItems] });

  // Quantity controls
  cartItems.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx    = parseInt(btn.dataset.idx);
      const action = btn.dataset.action;
      if (action === 'inc') {
        if (cart[idx].quantity >= cart[idx].stock_quantity) {
          showToast(`Only ${cart[idx].stock_quantity} in stock.`, 'warning'); return;
        }
        cart[idx].quantity++;
      } else {
        cart[idx].quantity--;
        if (cart[idx].quantity <= 0) cart.splice(idx, 1);
      }
      updateCartUI();
    });
  });

  cartItems.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.splice(parseInt(btn.dataset.idx), 1);
      updateCartUI();
    });
  });

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  if (cartTotal) cartTotal.textContent = fmtCurrency(total);
  if (btn) btn.disabled = cart.length === 0;
}

async function completeSale() {
  const btn = document.getElementById('btnCompleteSale');
  if (!cart.length) return;
  btn.disabled = true; btn.textContent = 'Processing…';

  try {
    const payload = {
      customer_id:    document.getElementById('saleCustomer')?.value || null,
      payment_method: document.getElementById('salePayment')?.value || 'Cash',
      items: cart.map(i => ({ book_id: i.book_id, quantity: i.quantity })),
    };
    const order = await apiPost('/orders', payload);
    showToast(`Sale #${order.order_id} completed! Total: ${fmtCurrency(order.total_amount)}`, 'success', 5000);
    closeModal();
    cart = [];
    loadOrdersTable();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Complete Sale';
    lucide.createIcons({ elements: [btn] });
  }
}

