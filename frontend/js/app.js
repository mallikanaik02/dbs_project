// frontend/js/app.js — Core application, routing, utilities
'use strict';

const API = '/api';

// Safe Lucide helper: ensures app works smoothly even if offline or CDN is delayed
if (typeof window.lucide === 'undefined') {
  window.lucide = {
    createIcons: function() { /* fallback no-op */ }
  };
} else {
  const _origCreateIcons = window.lucide.createIcons;
  window.lucide.createIcons = function(opts) {
    try { _origCreateIcons(opts); } catch (e) { /* ignore icon render errors */ }
  };
}

// ═══ State ════════════════════════════════════════════════════
let currentPage = 'overview';
let modalResolve = null;
let confirmResolve = null;

// ═══ Page Registry ════════════════════════════════════════════
const pages = {
  overview:   { title: 'Overview',         subtitle: 'Dashboard summary & live statistics',  render: (c) => renderOverview(c) },
  books:      { title: 'Book Inventory',   subtitle: 'Manage your complete book collection',  render: (c) => renderBooks(c) },
  authors:    { title: 'Authors',          subtitle: 'Manage author profiles',                render: (c) => renderAuthors(c) },
  categories: { title: 'Categories',       subtitle: 'Manage book categories & genres',       render: (c) => renderCategories(c) },
  customers:  { title: 'Customers',        subtitle: 'Customer profiles & purchase history',  render: (c) => renderCustomers(c) },
  orders:     { title: 'Sales & Orders',   subtitle: 'Sales records & new sale creation',     render: (c) => renderOrders(c) },
  reports:    { title: 'Reports',          subtitle: 'Analytics & database-driven reports',   render: (c) => renderReports(c) },
};

// ═══ Router ═══════════════════════════════════════════════════
function navigate(page) {
  if (!pages[page]) return;
  currentPage = page;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Update header
  document.getElementById('pageTitle').textContent    = pages[page].title;
  document.getElementById('pageSubtitle').textContent = pages[page].subtitle;
  document.getElementById('headerActions').innerHTML  = '';

  // Render
  const content = document.getElementById('mainContent');
  content.innerHTML = loadingHTML('Loading...');
  pages[page].render(content);

  // Close mobile sidebar
  closeSidebar();
}

// ═══ API Helpers ═══════════════════════════════════════════════
async function apiFetch(endpoint, options = {}) {
  const url = API + endpoint;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.errors?.join(', ') || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function apiGet(endpoint)         { return apiFetch(endpoint); }
async function apiPost(endpoint, body)  { return apiFetch(endpoint, { method: 'POST', body }); }
async function apiPut(endpoint, body)   { return apiFetch(endpoint, { method: 'PUT',  body }); }
async function apiDelete(endpoint)      { return apiFetch(endpoint, { method: 'DELETE' }); }
async function apiPatch(endpoint, body) { return apiFetch(endpoint, { method: 'PATCH', body }); }

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) q.set(k, v); });
  const s = q.toString();
  return s ? '?' + s : '';
}

// ═══ Toast Notifications ═════════════════════════════════════
function showToast(message, type = 'info', duration = 3800) {
  const icons = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons({ elements: [toast] });

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

// ═══ Confirm Dialog ════════════════════════════════════════════
function showConfirm(message, title = 'Confirm Deletion', okLabel = 'Delete') {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    document.getElementById('confirmTitle').textContent   = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmOk').textContent      = okLabel;
    document.getElementById('confirmOverlay').classList.remove('hidden');
  });
}

function closeConfirm(result) {
  document.getElementById('confirmOverlay').classList.add('hidden');
  if (confirmResolve) { confirmResolve(result); confirmResolve = null; }
}

// ═══ Modal ════════════════════════════════════════════════════
function openModal(title, bodyHTML, footerHTML = '', size = '') {
  document.getElementById('modalTitle').textContent    = title;
  document.getElementById('modalBody').innerHTML       = bodyHTML;
  document.getElementById('modalFooter').innerHTML     = footerHTML;
  const modal = document.getElementById('modal');
  modal.className = 'modal' + (size ? ' modal-' + size : '');
  document.getElementById('modalOverlay').classList.remove('hidden');
  lucide.createIcons({ elements: [modal] });
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// ═══ HTML Helpers ══════════════════════════════════════════════
function loadingHTML(text = 'Loading...') {
  return `<div class="loading-overlay"><div class="spinner"></div><span class="loading-text">${text}</span></div>`;
}

function emptyStateHTML(icon, title, desc, actionHTML = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon"><i data-lucide="${icon}"></i></div>
      <div class="empty-state-title">${title}</div>
      <div class="empty-state-desc">${desc}</div>
      ${actionHTML}
    </div>`;
}

function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt(num, decimals = 2) {
  return Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(num) { return '₹' + fmt(num, 2); }

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function stockBadge(qty) {
  if (qty === 0) return `<span class="badge badge-red">Out of stock</span>`;
  if (qty <= 5)  return `<span class="badge badge-yellow">Low: ${qty}</span>`;
  return `<span class="stock-ok">${qty}</span>`;
}

function statusBadge(status) {
  const map = { Completed: 'badge-green', Cancelled: 'badge-red', Pending: 'badge-yellow' };
  return `<span class="badge ${map[status] || 'badge-grey'}">${escHtml(status)}</span>`;
}

function paymentBadge(method) {
  const map = { Cash: 'badge-grey', 'Credit Card': 'badge-blue', 'Debit Card': 'badge-sage', UPI: 'badge-green' };
  return `<span class="badge ${map[method] || 'badge-grey'}">${escHtml(method)}</span>`;
}

function renderPagination(containerId, { total, page, limit, totalPages }, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  let pageBtns = '';
  const maxVisible = 5;
  let startPage = Math.max(1, page - 2);
  let endPage   = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

  for (let p = startPage; p <= endPage; p++) {
    pageBtns += `<button class="page-btn${p === page ? ' active' : ''}" data-p="${p}">${p}</button>`;
  }

  container.innerHTML = `
    <span class="pagination-info">Showing ${total === 0 ? 0 : start}–${end} of ${total} records</span>
    <div class="pagination-controls">
      <button class="page-btn" data-p="${page - 1}" ${page <= 1 ? 'disabled' : ''}>
        <i data-lucide="chevron-left"></i>
      </button>
      ${pageBtns}
      <button class="page-btn" data-p="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>
        <i data-lucide="chevron-right"></i>
      </button>
    </div>`;

  lucide.createIcons({ elements: [container] });
  container.querySelectorAll('.page-btn[data-p]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.p);
      if (!isNaN(p) && p >= 1 && p <= totalPages && p !== page && !btn.disabled)
        onPageChange(p);
    });
  });
}

function exportCSV(data, filename, columns) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows   = data.map(row =>
    columns.map(c => {
      const v = row[c.key] ?? '';
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ═══ Overview / Dashboard ═════════════════════════════════════
async function renderOverview(container) {
  container.innerHTML = loadingHTML('Loading dashboard...');

  try {
    const [stats, monthly, catSales, topBooks, recentOrders, lowStock] = await Promise.all([
      apiGet('/dashboard/stats'),
      apiGet('/dashboard/monthly-revenue'),
      apiGet('/dashboard/category-sales'),
      apiGet('/dashboard/top-books'),
      apiGet('/dashboard/recent-orders'),
      apiGet('/dashboard/low-stock'),
    ]);

    // Header actions
    document.getElementById('headerActions').innerHTML = `
      <button class="btn btn-primary btn-sm" id="quickAddBook"><i data-lucide="plus"></i> Add Book</button>
      <button class="btn btn-accent btn-sm"  id="quickNewSale"><i data-lucide="shopping-bag"></i> New Sale</button>`;
    lucide.createIcons({ elements: [document.getElementById('headerActions')] });
    document.getElementById('quickAddBook').addEventListener('click', () => { navigate('books'); setTimeout(() => document.getElementById('btnAddBook')?.click(), 400); });
    document.getElementById('quickNewSale').addEventListener('click', () => { navigate('orders'); setTimeout(() => document.getElementById('btnNewSale')?.click(), 400); });

    container.innerHTML = `
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i data-lucide="book-open"></i></div>
          <div class="stat-label">Total Titles</div>
          <div class="stat-value">${stats.total_titles ?? 0}</div>
          <div class="stat-meta">${Number(stats.total_inventory ?? 0).toLocaleString()} units in stock</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i data-lucide="users"></i></div>
          <div class="stat-label">Customers</div>
          <div class="stat-value">${stats.total_customers ?? 0}</div>
          <div class="stat-meta">Registered accounts</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i data-lucide="shopping-bag"></i></div>
          <div class="stat-label">Total Orders</div>
          <div class="stat-value">${stats.total_orders ?? 0}</div>
          <div class="stat-meta">Completed sales</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i data-lucide="indian-rupee"></i></div>
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">${fmtCurrency(stats.total_revenue)}</div>
          <div class="stat-meta">Avg ${fmtCurrency(stats.avg_order_value)} / order</div>
        </div>
        <div class="stat-card accent-terracotta">
          <div class="stat-icon"><i data-lucide="alert-triangle"></i></div>
          <div class="stat-label">Low Stock</div>
          <div class="stat-value">${stats.low_stock_count ?? 0}</div>
          <div class="stat-meta">${stats.out_of_stock_count ?? 0} out of stock</div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">Monthly Revenue</div>
          <div class="chart-wrap"><canvas id="chartRevenue"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Sales by Category</div>
          <div class="chart-wrap"><canvas id="chartCategory"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Orders Over Time</div>
          <div class="chart-wrap"><canvas id="chartOrders"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Top-Selling Books</div>
          <div class="chart-wrap"><canvas id="chartTopBooks"></canvas></div>
        </div>
      </div>

      <!-- Bottom panels -->
      <div class="dash-bottom">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Recent Orders</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('orders')">View all</button>
          </div>
          <div class="panel-body">
            <div class="table-wrap">
              <table>
                <thead><tr>
                  <th>#</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th>
                </tr></thead>
                <tbody>
                  ${recentOrders.length ? recentOrders.map(o => `
                    <tr>
                      <td class="td-mono">#${o.order_id}</td>
                      <td>${escHtml(o.customer_name)}</td>
                      <td class="td-muted">${fmtDate(o.order_date)}</td>
                      <td class="fw-600">${fmtCurrency(o.total_amount)}</td>
                      <td>${statusBadge(o.status)}</td>
                    </tr>`).join('') : `<tr><td colspan="5">${emptyStateHTML('shopping-bag','No orders yet','Sales will appear here.')}</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Low Stock Alert</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('reports')">View report</button>
          </div>
          <div class="panel-body">
            ${lowStock.length ? `
            <div class="table-wrap"><table>
              <thead><tr><th>Book</th><th>Author</th><th>Stock</th></tr></thead>
              <tbody>
                ${lowStock.map(b => `
                  <tr>
                    <td>${escHtml(b.title)}</td>
                    <td class="td-muted">${escHtml(b.author_name)}</td>
                    <td>${stockBadge(b.stock_quantity)}</td>
                  </tr>`).join('')}
              </tbody>
            </table></div>` : emptyStateHTML('check-circle','All books well-stocked','No low-stock items.')}
          </div>
        </div>
      </div>`;

    lucide.createIcons({ elements: [container] });
    renderDashboardCharts(monthly, catSales, topBooks);
  } catch (err) {
    container.innerHTML = emptyStateHTML('wifi-off', 'Could not load dashboard', err.message);
    lucide.createIcons({ elements: [container] });
  }
}

function renderDashboardCharts(monthly, catSales, topBooks) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js library is not loaded');
    return;
  }
  const palette = ['#5C8C6E','#183A32','#C4603A','#8BAA95','#E8C9A0','#2D7A4F','#A05030','#4A7359'];

  // Revenue chart
  const ctxR = document.getElementById('chartRevenue')?.getContext('2d');
  if (ctxR) new Chart(ctxR, {
    type: 'bar',
    data: {
      labels: monthly.map(m => m.label),
      datasets: [{ label: 'Revenue (₹)', data: monthly.map(m => Number(m.revenue || 0)),
        backgroundColor: 'rgba(92,140,110,0.75)', borderRadius: 4, borderSkipped: false }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + Number(v).toLocaleString() } } } }
  });

  // Orders chart
  const ctxO = document.getElementById('chartOrders')?.getContext('2d');
  if (ctxO) new Chart(ctxO, {
    type: 'line',
    data: {
      labels: monthly.map(m => m.label),
      datasets: [{ label: 'Orders', data: monthly.map(m => m.orders),
        borderColor: '#183A32', backgroundColor: 'rgba(24,58,50,0.08)', tension: 0.4, fill: true, pointRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });

  // Category pie
  const ctxC = document.getElementById('chartCategory')?.getContext('2d');
  if (ctxC) new Chart(ctxC, {
    type: 'doughnut',
    data: {
      labels: catSales.filter(c => c.revenue > 0).map(c => c.category_name),
      datasets: [{ data: catSales.filter(c => c.revenue > 0).map(c => Number(c.revenue || 0)),
        backgroundColor: palette, borderWidth: 2, borderColor: '#fff' }]
    },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } } }
  });

  // Top books horizontal bar
  const ctxT = document.getElementById('chartTopBooks')?.getContext('2d');
  if (ctxT) new Chart(ctxT, {
    type: 'bar',
    data: {
      labels: topBooks.map(b => b.title.length > 20 ? b.title.substring(0,20)+'…' : b.title),
      datasets: [{ label: 'Units Sold', data: topBooks.map(b => b.total_sold),
        backgroundColor: palette.slice(0,topBooks.length), borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// ═══ Sidebar / Navigation ══════════════════════════════════════
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.querySelector('.sidebar-backdrop')?.classList.remove('show');
}

// ═══ Init ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Date
  const now = new Date();
  document.getElementById('headerDate').textContent =
    now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Nav links
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });

  // Mobile menu
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  document.body.appendChild(backdrop);

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    backdrop.classList.toggle('show');
  });
  backdrop.addEventListener('click', closeSidebar);

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Confirm
  document.getElementById('confirmOk').addEventListener('click', () => closeConfirm(true));
  document.getElementById('confirmCancel').addEventListener('click', () => closeConfirm(false));

  // Init Lucide
  lucide.createIcons();

  // Route from hash or default to overview
  const hash = window.location.hash.replace('#', '');
  navigate(pages[hash] ? hash : 'overview');
});

