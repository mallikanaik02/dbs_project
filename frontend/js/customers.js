// frontend/js/customers.js
'use strict';

const customersState = { page: 1, limit: 15, search: '' };

async function renderCustomers(container) {
  document.getElementById('headerActions').innerHTML =
    `<button class="btn btn-primary" id="btnAddCustomer"><i data-lucide="user-plus"></i> Add Customer</button>`;
  lucide.createIcons({ elements: [document.getElementById('headerActions')] });

  container.innerHTML = `
    <div class="toolbar">
      <div class="search-wrap">
        <i data-lucide="search"></i>
        <input type="text" class="search-input" id="custSearch" placeholder="Search name, email, phone…" value="${escHtml(customersState.search)}">
      </div>
    </div>
    <div class="panel">
      <div id="custsTableContainer"></div>
      <div class="pagination" id="custsPagination"></div>
    </div>`;

  lucide.createIcons({ elements: [container] });

  let timer;
  document.getElementById('custSearch').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { customersState.search = e.target.value; customersState.page = 1; loadCustomersTable(); }, 320);
  });
  document.getElementById('btnAddCustomer').addEventListener('click', () => openCustomerForm(null));

  loadCustomersTable();
}

async function loadCustomersTable() {
  const c = document.getElementById('custsTableContainer');
  if (!c) return;
  c.innerHTML = loadingHTML();
  try {
    const qs   = buildQuery({ search: customersState.search, page: customersState.page, limit: customersState.limit });
    const data = await apiGet('/customers' + qs);
    renderCustomersTable(c, data);
    renderPagination('custsPagination', data, (p) => { customersState.page = p; loadCustomersTable(); });
  } catch (err) {
    c.innerHTML = emptyStateHTML('alert-circle', 'Error', err.message);
    lucide.createIcons({ elements: [c] });
  }
}

function renderCustomersTable(container, data) {
  if (!data.data?.length) {
    container.innerHTML = emptyStateHTML('users', 'No customers found', 'Add a customer to get started.');
    lucide.createIcons({ elements: [container] });
    return;
  }
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr>
        <th>Name</th><th>Email</th><th>Phone</th>
        <th>Orders</th><th>Total Spent</th><th>Registered</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${data.data.map(cu => `
          <tr data-id="${cu.customer_id}">
            <td><span class="fw-600">${escHtml(cu.customer_name)}</span></td>
            <td class="td-muted">${escHtml(cu.email)}</td>
            <td class="td-muted td-mono">${escHtml(cu.phone)}</td>
            <td><span class="badge badge-sage">${cu.total_orders}</span></td>
            <td class="fw-600">${fmtCurrency(cu.total_spent)}</td>
            <td class="td-muted">${fmtDate(cu.registration_date)}</td>
            <td>
              <div class="flex gap-8">
                <button class="btn-icon btn-view" data-id="${cu.customer_id}" title="View"><i data-lucide="eye"></i></button>
                <button class="btn-icon btn-edit" data-id="${cu.customer_id}" title="Edit"><i data-lucide="pencil"></i></button>
                <button class="btn-icon btn-delete" data-id="${cu.customer_id}" title="Delete"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;

  lucide.createIcons({ elements: [container] });

  container.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => viewCustomer(btn.dataset.id)));
  container.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => {
    const cu = data.data.find(x => x.customer_id == btn.dataset.id);
    openCustomerForm(cu);
  }));
  container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async () => {
    const cu = data.data.find(x => x.customer_id == btn.dataset.id);
    const ok = await showConfirm(`Delete customer "${cu.customer_name}"? Orders history will be preserved as walk-in.`);
    if (!ok) return;
    try {
      await apiDelete('/customers/' + btn.dataset.id);
      showToast('Customer deleted.', 'success');
      loadCustomersTable();
    } catch (err) { showToast(err.message, 'error'); }
  }));
}

async function viewCustomer(id) {
  try {
    const cu = await apiGet('/customers/' + id);
    const ordersHTML = cu.orders.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Date</th><th>Amount</th><th>Items</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>${cu.orders.map(o => `
            <tr><td class="td-mono">#${o.order_id}</td>
            <td>${fmtDate(o.order_date)}</td>
            <td class="fw-600">${fmtCurrency(o.total_amount)}</td>
            <td>${o.item_count}</td>
            <td>${paymentBadge(o.payment_method)}</td>
            <td>${statusBadge(o.status)}</td></tr>`).join('')}
          </tbody></table></div>`
      : emptyStateHTML('shopping-bag', 'No orders', 'This customer has not placed any orders.');

    openModal(escHtml(cu.customer_name), `
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Total Orders</div>
          <div class="stat-value">${cu.total_orders}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Spent</div>
          <div class="stat-value" style="font-size:20px">${fmtCurrency(cu.total_spent)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg Order</div>
          <div class="stat-value" style="font-size:20px">${fmtCurrency(cu.avg_order_value)}</div>
        </div>
      </div>
      <div class="detail-grid mb-16">
        <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${escHtml(cu.email)}</div></div>
        <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value td-mono">${escHtml(cu.phone)}</div></div>
        <div class="detail-item"><div class="detail-label">Address</div><div class="detail-value">${escHtml(cu.address) || '—'}</div></div>
        <div class="detail-item"><div class="detail-label">Registered</div><div class="detail-value">${fmtDate(cu.registration_date)}</div></div>
      </div>
      <div class="section-title mb-8">Order History</div>
      ${ordersHTML}`,
      `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`, 'lg');
  } catch (err) { showToast(err.message, 'error'); }
}

function openCustomerForm(cu) {
  const isEdit = !!cu;
  openModal(isEdit ? 'Edit Customer' : 'Add Customer', `
    <form id="custForm">
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input class="form-control" id="fCuName" type="text" value="${escHtml(cu?.customer_name)}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input class="form-control" id="fCuEmail" type="email" value="${escHtml(cu?.email)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Phone *</label>
          <input class="form-control" id="fCuPhone" type="tel" value="${escHtml(cu?.phone)}" placeholder="10-digit number" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Address</label>
        <input class="form-control" id="fCuAddr" type="text" value="${escHtml(cu?.address)}" placeholder="Optional">
      </div>
    </form>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" id="btnSaveCust">${isEdit ? 'Save Changes' : 'Add Customer'}</button>`);

  document.getElementById('btnSaveCust').addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveCust');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const payload = {
        customer_name: document.getElementById('fCuName').value.trim(),
        email:         document.getElementById('fCuEmail').value.trim(),
        phone:         document.getElementById('fCuPhone').value.trim(),
        address:       document.getElementById('fCuAddr').value.trim(),
      };
      if (isEdit) await apiPut('/customers/' + cu.customer_id, payload);
      else        await apiPost('/customers', payload);
      showToast(isEdit ? 'Customer updated.' : 'Customer added.', 'success');
      closeModal();
      loadCustomersTable();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.textContent = isEdit ? 'Save Changes' : 'Add Customer';
    }
  });
}

