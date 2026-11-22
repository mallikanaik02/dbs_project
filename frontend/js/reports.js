// frontend/js/reports.js
'use strict';

let activeReport  = 'summary';
let reportCharts  = {};

const reportTabs = [
  { id: 'summary',    label: 'Sales Summary'    },
  { id: 'monthly',    label: 'Monthly Sales'     },
  { id: 'top-books',  label: 'Top Books'         },
  { id: 'categories', label: 'Category Sales'    },
  { id: 'customers',  label: 'Customer Spending' },
  { id: 'inventory',  label: 'Inventory'         },
  { id: 'low-stock',  label: 'Low Stock'         },
  { id: 'authors',    label: 'Authors'           },
  { id: 'subquery1',  label: 'Above Avg Price'   },
  { id: 'subquery2',  label: 'Unsold Books'      },
];

async function renderReports(container) {
  document.getElementById('headerActions').innerHTML = '';
  container.innerHTML = `
    <div class="report-nav" id="reportNav">
      ${reportTabs.map(t => `<button class="report-tab${t.id===activeReport?' active':''}" data-tab="${t.id}">${escHtml(t.label)}</button>`).join('')}
    </div>
    <div id="reportContent"></div>`;

  container.querySelectorAll('.report-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeReport = btn.dataset.tab;
      container.querySelectorAll('.report-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === activeReport));
      loadReport(activeReport);
    });
  });

  loadReport(activeReport);
}

async function loadReport(reportId) {
  // Destroy old charts
  Object.values(reportCharts).forEach(c => { try { c.destroy(); } catch {} });
  reportCharts = {};

  const content = document.getElementById('reportContent');
  if (!content) return;

  switch (reportId) {
    case 'summary':    return loadSummaryReport(content);
    case 'monthly':    return loadMonthlyReport(content);
    case 'top-books':  return loadTopBooksReport(content);
    case 'categories': return loadCategoryReport(content);
    case 'customers':  return loadCustomerReport(content);
    case 'inventory':  return loadInventoryReport(content);
    case 'low-stock':  return loadLowStockReport(content);
    case 'authors':    return loadAuthorReport(content);
    case 'subquery1':  return loadAboveAvgReport(content);
    case 'subquery2':  return loadUnsoldReport(content);
  }
}

// ── Report 1: Sales Summary ───────────────────────────────────
async function loadSummaryReport(container) {
  container.innerHTML = filterBarHTML(['dateFrom','dateTo']) + `<div id="rBody"></div>`;
  attachFilterEvents(container, async (params) => {
    const rBody = document.getElementById('rBody');
    rBody.innerHTML = loadingHTML();
    try {
      const data = await apiGet('/reports/summary' + buildQuery(params));
      rBody.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px">
          ${statCard('Total Revenue',     fmtCurrency(data.total_revenue), 'indian-rupee')}
          ${statCard('Total Orders',      data.total_orders,                'shopping-bag')}
          ${statCard('Avg Order Value',   fmtCurrency(data.avg_order_value),'trending-up')}
          ${statCard('Units Sold',        data.total_units_sold,            'package')}
        </div>`;
      lucide.createIcons({ elements: [rBody] });
    } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
  });
}

// ── Report 2: Monthly Sales ───────────────────────────────────
async function loadMonthlyReport(container) {
  container.innerHTML = filterBarHTML(['dateFrom','dateTo']) + `
    <div class="chart-card mb-16"><div class="chart-title">Monthly Revenue & Orders</div>
      <div class="chart-wrap" style="height:280px"><canvas id="chartMonthly"></canvas></div>
    </div>
    <div class="panel" id="rBody"></div>`;

  attachFilterEvents(container, async (params) => {
    const rBody = document.getElementById('rBody');
    rBody.innerHTML = loadingHTML();
    try {
      const data = await apiGet('/reports/monthly-sales' + buildQuery(params));
      if (!data.length) { rBody.innerHTML = emptyStateHTML('bar-chart-2','No data','No sales in this period.'); return; }

      // Chart
      const ctx = document.getElementById('chartMonthly')?.getContext('2d');
      if (reportCharts.monthly) reportCharts.monthly.destroy();
      if (typeof Chart !== 'undefined' && ctx) reportCharts.monthly = new Chart(ctx, {
        data: {
          labels: data.map(d => d.month_label),
          datasets: [
            { type:'bar',  label:'Revenue (₹)', data: data.map(d => Number(d.revenue||0)), backgroundColor: 'rgba(92,140,110,0.75)', borderRadius:4, yAxisID:'y' },
            { type:'line', label:'Orders',       data: data.map(d => d.order_count), borderColor:'#C4603A', backgroundColor:'transparent', tension:0.4, pointRadius:4, yAxisID:'y1' }
          ]
        },
        options: { responsive:true, maintainAspectRatio:false,
          scales: {
            y:  { beginAtZero:true, ticks:{ callback: v => '₹'+Number(v).toLocaleString() }, position:'left' },
            y1: { beginAtZero:true, ticks:{ stepSize:1 }, position:'right', grid:{ drawOnChartArea:false } }
          }
        }
      });

      rBody.innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>Month</th><th>Orders</th><th>Units Sold</th><th>Revenue</th><th>Avg Order</th></tr></thead>
          <tbody>
            ${data.map(d => `<tr>
              <td class="fw-600">${escHtml(d.month_label)}</td>
              <td>${d.order_count}</td><td>${d.total_units_sold}</td>
              <td class="fw-600">${fmtCurrency(d.revenue)}</td>
              <td>${fmtCurrency(d.avg_order_value)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${csvBtn(data, 'monthly-sales', [
          {key:'month_label',label:'Month'},{key:'order_count',label:'Orders'},
          {key:'total_units_sold',label:'Units'},{key:'revenue',label:'Revenue'},{key:'avg_order_value',label:'Avg Order'}
        ])}`;
    } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
  });
}

// ── Report 3: Top Books ───────────────────────────────────────
async function loadTopBooksReport(container) {
  container.innerHTML = filterBarHTML(['dateFrom','dateTo','minSold']) + `<div class="panel" id="rBody"></div>`;
  attachFilterEvents(container, async (params) => {
    const rBody = document.getElementById('rBody');
    rBody.innerHTML = loadingHTML();
    try {
      const data = await apiGet('/reports/top-books' + buildQuery({...params, limit:20}));
      if (!data.length) { rBody.innerHTML = emptyStateHTML('book-open','No data','No sales data available.'); return; }
      rBody.innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Title</th><th>Author</th><th>Category</th><th>Units Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            ${data.map((b,i) => `<tr>
              <td class="td-muted">${i+1}</td>
              <td class="fw-600">${escHtml(b.title)}</td>
              <td>${escHtml(b.author_name)}</td>
              <td><span class="badge badge-sage">${escHtml(b.category_name)}</span></td>
              <td class="fw-600">${b.total_sold}</td>
              <td class="fw-600">${fmtCurrency(b.total_revenue)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${csvBtn(data, 'top-books', [
          {key:'title',label:'Title'},{key:'author_name',label:'Author'},
          {key:'category_name',label:'Category'},{key:'total_sold',label:'Units Sold'},{key:'total_revenue',label:'Revenue'}
        ])}`;
    } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
  });
}

// ── Report 4: Category Sales ──────────────────────────────────
async function loadCategoryReport(container) {
  container.innerHTML = filterBarHTML(['dateFrom','dateTo','minRevenue']) + `
    <div class="chart-card mb-16" style="max-width:500px">
      <div class="chart-title">Revenue by Category</div>
      <div class="chart-wrap" style="height:260px"><canvas id="chartCatSales"></canvas></div>
    </div>
    <div class="panel" id="rBody"></div>`;

  attachFilterEvents(container, async (params) => {
    const rBody = document.getElementById('rBody');
    rBody.innerHTML = loadingHTML();
    try {
      const data = await apiGet('/reports/category-sales' + buildQuery(params));
      const palette = ['#5C8C6E','#183A32','#C4603A','#8BAA95','#E8C9A0','#2D7A4F','#A05030','#4A7359'];
      const ctx = document.getElementById('chartCatSales')?.getContext('2d');
      if (reportCharts.catSales) reportCharts.catSales.destroy();
      if (typeof Chart !== 'undefined' && ctx) reportCharts.catSales = new Chart(ctx, {
        type: 'pie',
        data: { labels: data.map(c=>c.category_name), datasets: [{ data: data.map(c=>Number(c.total_revenue||0)), backgroundColor: palette, borderWidth:2, borderColor:'#fff' }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ font:{size:11}, boxWidth:14 } } } }
      });

      rBody.innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>Category</th><th>Books</th><th>Units Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            ${data.map(c => `<tr>
              <td class="fw-600">${escHtml(c.category_name)}</td>
              <td>${c.book_count}</td><td>${c.total_units_sold}</td>
              <td class="fw-600">${fmtCurrency(c.total_revenue)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${csvBtn(data,'category-sales',[{key:'category_name',label:'Category'},{key:'book_count',label:'Books'},{key:'total_units_sold',label:'Units'},{key:'total_revenue',label:'Revenue'}])}`;
    } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
  });
}

// ── Report 5: Customer Spending ───────────────────────────────
async function loadCustomerReport(container) {
  container.innerHTML = filterBarHTML(['dateFrom','dateTo','minOrders']) + `<div class="panel" id="rBody"></div>`;
  attachFilterEvents(container, async (params) => {
    const rBody = document.getElementById('rBody');
    rBody.innerHTML = loadingHTML();
    try {
      const data = await apiGet('/reports/customer-spending' + buildQuery(params));
      if (!data.length) { rBody.innerHTML = emptyStateHTML('users','No data','No customers match this filter.'); return; }
      rBody.innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>Customer</th><th>Email</th><th>Orders</th><th>Total Spent</th><th>Avg Order</th><th>Last Order</th></tr></thead>
          <tbody>
            ${data.map(c => `<tr>
              <td class="fw-600">${escHtml(c.customer_name)}</td>
              <td class="td-muted">${escHtml(c.email)}</td>
              <td>${c.total_orders}</td>
              <td class="fw-600">${fmtCurrency(c.total_spent)}</td>
              <td>${fmtCurrency(c.avg_order_value)}</td>
              <td class="td-muted">${fmtDate(c.last_order_date)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${csvBtn(data,'customer-spending',[{key:'customer_name',label:'Customer'},{key:'email',label:'Email'},{key:'total_orders',label:'Orders'},{key:'total_spent',label:'Total Spent'},{key:'avg_order_value',label:'Avg Order'}])}`;
    } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
  });
}

// ── Report 6: Inventory ───────────────────────────────────────
async function loadInventoryReport(container) {
  container.innerHTML = filterBarHTML(['category']) + `<div class="panel" id="rBody"></div>`;

  // Load categories for filter
  try {
    const cats = await apiGet('/categories');
    const sel  = container.querySelector('select[data-filter="category"]');
    if (sel) {
      sel.innerHTML = `<option value="">All Categories</option>` +
        cats.map(c=>`<option value="${c.category_id}">${escHtml(c.category_name)}</option>`).join('');
    }
  } catch {}

  attachFilterEvents(container, async (params) => {
    const rBody = document.getElementById('rBody');
    rBody.innerHTML = loadingHTML();
    try {
      const data = await apiGet('/reports/inventory' + buildQuery({ category_id: params.category }));
      if (!data.length) { rBody.innerHTML = emptyStateHTML('package','No books','No inventory data.'); return; }
      const totalValue = data.reduce((s,b) => s + Number(b.stock_value||0), 0);
      rBody.innerHTML = `
        <div style="padding:12px 16px;font-size:13px;color:var(--text-muted);border-bottom:1px solid var(--border-light)">
          Total inventory value: <strong style="color:var(--accent)">${fmtCurrency(totalValue)}</strong> across ${data.length} titles
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Price</th><th>Stock</th><th>Stock Value</th><th>Year</th></tr></thead>
          <tbody>
            ${data.map(b => `<tr>
              <td class="fw-600">${escHtml(b.title)}</td>
              <td>${escHtml(b.author_name)}</td>
              <td><span class="badge badge-sage">${escHtml(b.category_name)}</span></td>
              <td>${fmtCurrency(b.price)}</td>
              <td>${stockBadge(b.stock_quantity)}</td>
              <td>${fmtCurrency(b.stock_value)}</td>
              <td class="td-muted">${b.publication_year||'—'}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${csvBtn(data,'inventory',[{key:'title',label:'Title'},{key:'author_name',label:'Author'},{key:'category_name',label:'Category'},{key:'price',label:'Price'},{key:'stock_quantity',label:'Stock'},{key:'stock_value',label:'Stock Value'}])}`;
    } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
  });
}

// ── Report 7: Low Stock ───────────────────────────────────────
async function loadLowStockReport(container) {
  container.innerHTML = `
    <div class="report-filters">
      <label>Stock threshold:</label>
      <input type="number" class="filter-select" id="thresholdInput" value="5" min="0" max="100" style="width:80px">
      <button class="btn btn-outline btn-sm" id="btnApplyThreshold"><i data-lucide="filter"></i> Apply</button>
    </div>
    <div class="panel" id="rBody"></div>`;
  lucide.createIcons({ elements: [container] });

  async function fetchLowStock() {
    const rBody = document.getElementById('rBody');
    rBody.innerHTML = loadingHTML();
    const threshold = document.getElementById('thresholdInput')?.value || 5;
    try {
      const data = await apiGet('/reports/low-stock?threshold=' + threshold);
      if (!data.length) { rBody.innerHTML = emptyStateHTML('check-circle','All well-stocked','No books below threshold.'); return; }
      rBody.innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Stock</th><th>Price</th><th>Stock Value</th></tr></thead>
          <tbody>
            ${data.map(b => `<tr>
              <td class="fw-600">${escHtml(b.title)}</td>
              <td>${escHtml(b.author_name)}</td>
              <td>${escHtml(b.category_name)}</td>
              <td>${stockBadge(b.stock_quantity)}</td>
              <td>${fmtCurrency(b.price)}</td>
              <td>${fmtCurrency(b.stock_value)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${csvBtn(data,'low-stock',[{key:'title',label:'Title'},{key:'author_name',label:'Author'},{key:'stock_quantity',label:'Stock'},{key:'price',label:'Price'}])}`;
    } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
  }

  document.getElementById('btnApplyThreshold').addEventListener('click', fetchLowStock);
  fetchLowStock();
}

// ── Report 8: Authors ─────────────────────────────────────────
async function loadAuthorReport(container) {
  container.innerHTML = `<div class="panel" id="rBody"></div>`;
  const rBody = document.getElementById('rBody');
  rBody.innerHTML = loadingHTML();
  try {
    const data = await apiGet('/reports/author-report');
    rBody.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Author</th><th>Books</th><th>Units Sold</th><th>Revenue</th></tr></thead>
        <tbody>
          ${data.map((a,i) => `<tr>
            <td class="td-muted">${i+1}</td>
            <td class="fw-600">${escHtml(a.author_name)}</td>
            <td>${a.book_count}</td>
            <td>${a.total_sold}</td>
            <td class="fw-600">${fmtCurrency(a.total_revenue)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
      ${csvBtn(data,'author-report',[{key:'author_name',label:'Author'},{key:'book_count',label:'Books'},{key:'total_sold',label:'Units Sold'},{key:'total_revenue',label:'Revenue'}])}`;
  } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
}

// ── Report: Above Average Price (SUBQUERY demo) ───────────────
async function loadAboveAvgReport(container) {
  container.innerHTML = `
    <div class="panel" style="margin-bottom:16px;padding:14px 16px">
      <div class="section-title">SQL Concept: Scalar Subquery</div>
      <code style="font-size:12px;color:var(--text-muted);display:block;margin-top:6px">WHERE b.price > (SELECT AVG(price) FROM Books)</code>
    </div>
    <div class="panel" id="rBody"></div>`;
  const rBody = document.getElementById('rBody');
  rBody.innerHTML = loadingHTML();
  try {
    const data = await apiGet('/reports/above-average-price');
    if (!data.length) { rBody.innerHTML = emptyStateHTML('book-open','No data',''); return; }
    const avg = data[0].avg_price;
    rBody.innerHTML = `
      <div style="padding:10px 16px;font-size:13px;border-bottom:1px solid var(--border-light)">
        Average book price: <strong>${fmtCurrency(avg)}</strong> — showing ${data.length} books above this price
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Price</th><th>vs. Average</th><th>Stock</th></tr></thead>
        <tbody>
          ${data.map(b => `<tr>
            <td class="fw-600">${escHtml(b.title)}</td>
            <td>${escHtml(b.author_name)}</td>
            <td><span class="badge badge-sage">${escHtml(b.category_name)}</span></td>
            <td class="fw-600">${fmtCurrency(b.price)}</td>
            <td style="color:var(--terracotta)">+${fmtCurrency(b.price - avg)} above avg</td>
            <td>${stockBadge(b.stock_quantity)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
}

// ── Report: Unsold Books (NOT IN subquery demo) ───────────────
async function loadUnsoldReport(container) {
  container.innerHTML = `
    <div class="panel" style="margin-bottom:16px;padding:14px 16px">
      <div class="section-title">SQL Concept: NOT IN Subquery</div>
      <code style="font-size:12px;color:var(--text-muted);display:block;margin-top:6px">WHERE b.book_id NOT IN (SELECT DISTINCT book_id FROM Order_Items)</code>
    </div>
    <div class="panel" id="rBody"></div>`;
  const rBody = document.getElementById('rBody');
  rBody.innerHTML = loadingHTML();
  try {
    const data = await apiGet('/reports/unsold-books');
    if (!data.length) { rBody.innerHTML = emptyStateHTML('check-circle','All books have been sold','Every title has at least one sale.'); return; }
    rBody.innerHTML = `
      <div style="padding:10px 16px;font-size:13px;border-bottom:1px solid var(--border-light)">
        ${data.length} book${data.length!==1?'s':''} have never been sold
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>ISBN</th><th>Title</th><th>Author</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
        <tbody>
          ${data.map(b => `<tr>
            <td class="td-mono">${escHtml(b.isbn)}</td>
            <td class="fw-600">${escHtml(b.title)}</td>
            <td>${escHtml(b.author_name)}</td>
            <td><span class="badge badge-sage">${escHtml(b.category_name)}</span></td>
            <td>${fmtCurrency(b.price)}</td>
            <td>${stockBadge(b.stock_quantity)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (err) { rBody.innerHTML = emptyStateHTML('alert-circle','Error',err.message); }
}

// ═══ Helpers ══════════════════════════════════════════════════
function statCard(label, value, icon) {
  return `<div class="stat-card">
    <div class="stat-icon"><i data-lucide="${icon}"></i></div>
    <div class="stat-label">${escHtml(label)}</div>
    <div class="stat-value" style="font-size:22px">${escHtml(String(value))}</div>
  </div>`;
}

function csvBtn(data, filename, columns) {
  return `<div style="padding:12px 16px;text-align:right">
    <button class="btn btn-outline btn-sm" onclick='exportCSV(${JSON.stringify(data)},"${filename}.csv",${JSON.stringify(columns)})'>
      <i data-lucide="download"></i> Export CSV
    </button>
  </div>`;
}

function filterBarHTML(fields) {
  let html = `<div class="report-filters">`;
  if (fields.includes('dateFrom'))  html += `<label>From:</label><input type="date" class="filter-select" data-filter="dateFrom">`;
  if (fields.includes('dateTo'))    html += `<label>To:</label><input type="date" class="filter-select" data-filter="dateTo">`;
  if (fields.includes('minSold'))   html += `<label>Min units sold:</label><input type="number" class="filter-select" data-filter="minSold" min="1" placeholder="e.g. 2" style="width:90px">`;
  if (fields.includes('minRevenue'))html += `<label>Min revenue (₹):</label><input type="number" class="filter-select" data-filter="minRevenue" min="0" placeholder="e.g. 50" style="width:100px">`;
  if (fields.includes('minOrders')) html += `<label>Min orders:</label><input type="number" class="filter-select" data-filter="minOrders" min="1" placeholder="e.g. 2" style="width:90px">`;
  if (fields.includes('category'))  html += `<label>Category:</label><select class="filter-select" data-filter="category"><option value="">All</option></select>`;
  html += `<button class="btn btn-outline btn-sm" id="btnApplyFilter"><i data-lucide="filter"></i> Apply</button>
           <button class="btn btn-ghost btn-sm"    id="btnResetFilter"><i data-lucide="x"></i> Reset</button>
  </div>`;
  return html;
}

function attachFilterEvents(container, loader) {
  const apply = () => {
    const params = {};
    container.querySelectorAll('[data-filter]').forEach(el => {
      params[el.dataset.filter] = el.value;
    });
    loader(params);
  };
  container.querySelector('#btnApplyFilter')?.addEventListener('click', apply);
  container.querySelector('#btnResetFilter')?.addEventListener('click', () => {
    container.querySelectorAll('[data-filter]').forEach(el => el.value = '');
    loader({});
  });
  // Auto-apply on load
  lucide.createIcons({ elements: [container] });
  apply();
}

