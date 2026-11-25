// frontend/js/books.js — Book Inventory page
'use strict';

// ═══ State ════════════════════════════════════════════════════
const booksState = {
  page: 1, limit: 15,
  search: '', category_id: '', author_id: '',
  minPrice: '', maxPrice: '', stock: '',
  sortBy: 'title', sortDir: 'ASC',
};

async function renderBooks(container) {
  container.innerHTML = loadingHTML('Loading inventory...');

  // Header action
  document.getElementById('headerActions').innerHTML =
    `<button class="btn btn-primary" id="btnAddBook"><i data-lucide="plus"></i> Add Book</button>`;
  lucide.createIcons({ elements: [document.getElementById('headerActions')] });

  // Load dropdowns
  let authors = [], categories = [];
  try {
    [authors, categories] = await Promise.all([apiGet('/authors/all'), apiGet('/categories')]);
  } catch (err) {
    container.innerHTML = emptyStateHTML('wifi-off', 'Failed to load', err.message);
    lucide.createIcons({ elements: [container] });
    return;
  }

  container.innerHTML = `
    <div class="toolbar">
      <div class="search-wrap">
        <i data-lucide="search"></i>
        <input type="text" class="search-input" id="bookSearch" placeholder="Search title, ISBN, author…" value="${escHtml(booksState.search)}">
      </div>
      <select class="filter-select" id="filterCategory">
        <option value="">All Categories</option>
        ${categories.map(c => `<option value="${c.category_id}" ${booksState.category_id==c.category_id?'selected':''}>${escHtml(c.category_name)}</option>`).join('')}
      </select>
      <select class="filter-select" id="filterAuthor">
        <option value="">All Authors</option>
        ${authors.map(a => `<option value="${a.author_id}" ${booksState.author_id==a.author_id?'selected':''}>${escHtml(a.author_name)}</option>`).join('')}
      </select>
      <select class="filter-select" id="filterStock">
        <option value="">All Stock</option>
        <option value="in"  ${booksState.stock==='in'  ?'selected':''}>In Stock</option>
        <option value="low" ${booksState.stock==='low' ?'selected':''}>Low Stock (≤5)</option>
        <option value="out" ${booksState.stock==='out' ?'selected':''}>Out of Stock</option>
      </select>
      <input type="number" class="filter-select" id="filterMinPrice" placeholder="Min ₹" style="width:80px" value="${escHtml(booksState.minPrice)}">
      <input type="number" class="filter-select" id="filterMaxPrice" placeholder="Max ₹" style="width:80px" value="${escHtml(booksState.maxPrice)}">
      <button class="btn btn-ghost btn-sm" id="btnClearFilters"><i data-lucide="x"></i> Clear</button>
    </div>
    <div class="panel">
      <div id="booksTableContainer"></div>
      <div class="pagination" id="booksPagination"></div>
    </div>`;

  lucide.createIcons({ elements: [container] });

  // Events
  let searchTimer;
  document.getElementById('bookSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { booksState.search = e.target.value; booksState.page = 1; loadBooksTable(authors, categories); }, 320);
  });
  document.getElementById('filterCategory').addEventListener('change', (e) => { booksState.category_id = e.target.value; booksState.page = 1; loadBooksTable(authors, categories); });
  document.getElementById('filterAuthor').addEventListener('change',   (e) => { booksState.author_id   = e.target.value; booksState.page = 1; loadBooksTable(authors, categories); });
  document.getElementById('filterStock').addEventListener('change',    (e) => { booksState.stock       = e.target.value; booksState.page = 1; loadBooksTable(authors, categories); });
  document.getElementById('filterMinPrice').addEventListener('change', (e) => { booksState.minPrice    = e.target.value; booksState.page = 1; loadBooksTable(authors, categories); });
  document.getElementById('filterMaxPrice').addEventListener('change', (e) => { booksState.maxPrice    = e.target.value; booksState.page = 1; loadBooksTable(authors, categories); });
  document.getElementById('btnClearFilters').addEventListener('click', () => {
    Object.assign(booksState, { search: '', category_id: '', author_id: '', minPrice: '', maxPrice: '', stock: '', page: 1 });
    document.getElementById('bookSearch').value  = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterAuthor').value   = '';
    document.getElementById('filterStock').value    = '';
    document.getElementById('filterMinPrice').value = '';
    document.getElementById('filterMaxPrice').value = '';
    loadBooksTable(authors, categories);
  });
  document.getElementById('btnAddBook').addEventListener('click', () => openBookForm(null, authors, categories, () => loadBooksTable(authors, categories)));

  loadBooksTable(authors, categories);
}

async function loadBooksTable(authors, categories) {
  const tableContainer = document.getElementById('booksTableContainer');
  if (!tableContainer) return;
  tableContainer.innerHTML = loadingHTML();

  try {
    const qs = buildQuery({ ...booksState });
    const data = await apiGet('/books' + qs);
    renderBooksTable(tableContainer, data, authors, categories);
    renderPagination('booksPagination', data, (p) => { booksState.page = p; loadBooksTable(authors, categories); });
  } catch (err) {
    tableContainer.innerHTML = emptyStateHTML('alert-circle', 'Error loading books', err.message);
    lucide.createIcons({ elements: [tableContainer] });
  }
}

function renderBooksTable(container, data, authors, categories) {
  if (!data.data?.length) {
    container.innerHTML = emptyStateHTML('book-open', 'No books found', 'Try adjusting your filters or add a new book.');
    lucide.createIcons({ elements: [container] });
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th class="sortable" data-sort="isbn">ISBN</th>
          <th class="sortable" data-sort="title">Title</th>
          <th class="sortable" data-sort="author">Author</th>
          <th>Category</th>
          <th class="sortable" data-sort="price">Price</th>
          <th class="sortable" data-sort="stock">Stock</th>
          <th class="sortable" data-sort="year">Year</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          ${data.data.map(b => `
            <tr data-id="${b.book_id}">
              <td class="td-mono">${escHtml(b.isbn)}</td>
              <td><span class="fw-600">${escHtml(b.title)}</span>
                ${b.publisher ? `<div class="td-muted fs-12">${escHtml(b.publisher)}</div>` : ''}
              </td>
              <td>${escHtml(b.authors)}</td>
              <td><span class="badge badge-sage">${escHtml(b.category_name)}</span></td>
              <td class="fw-600">${fmtCurrency(b.price)}</td>
              <td>${stockBadge(b.stock_quantity)}</td>
              <td class="td-muted">${b.publication_year || '—'}</td>
              <td>
                <div class="flex gap-8">
                  <button class="btn-icon btn-view" data-id="${b.book_id}" title="View"><i data-lucide="eye"></i></button>
                  <button class="btn-icon btn-edit" data-id="${b.book_id}" title="Edit"><i data-lucide="pencil"></i></button>
                  <button class="btn-icon btn-delete" data-id="${b.book_id}" title="Delete"><i data-lucide="trash-2"></i></button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  lucide.createIcons({ elements: [container] });

  // Sort headers
  container.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const sort = th.dataset.sort;
      if (booksState.sortBy === sort) {
        booksState.sortDir = booksState.sortDir === 'ASC' ? 'DESC' : 'ASC';
      } else {
        booksState.sortBy = sort; booksState.sortDir = 'ASC';
      }
      booksState.page = 1;
      loadBooksTable(authors, categories);
    });
  });

  // Actions
  container.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => viewBook(btn.dataset.id)));
  container.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', async () => {
    const book = data.data.find(b => b.book_id == btn.dataset.id);
    openBookForm(book, authors, categories, () => loadBooksTable(authors, categories));
  }));
  container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async () => {
    const book = data.data.find(b => b.book_id == btn.dataset.id);
    const ok = await showConfirm(`Delete "${book.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await apiDelete('/books/' + btn.dataset.id);
      showToast('Book deleted successfully.', 'success');
      loadBooksTable(authors, categories);
    } catch (err) { showToast(err.message, 'error'); }
  }));
}

async function viewBook(id) {
  try {
    const b = await apiGet('/books/' + id);
    openModal(`${escHtml(b.title)}`, `
      <div class="detail-grid">
        <div class="detail-item"><div class="detail-label">ISBN</div><div class="detail-value td-mono">${escHtml(b.isbn)}</div></div>
        <div class="detail-item"><div class="detail-label">Author(s)</div><div class="detail-value">${escHtml(b.authors)}</div></div>
        <div class="detail-item"><div class="detail-label">Category</div><div class="detail-value"><span class="badge badge-sage">${escHtml(b.category_name)}</span></div></div>
        <div class="detail-item"><div class="detail-label">Price</div><div class="detail-value fw-600">${fmtCurrency(b.price)}</div></div>
        <div class="detail-item"><div class="detail-label">Stock</div><div class="detail-value">${stockBadge(b.stock_quantity)}</div></div>
        <div class="detail-item"><div class="detail-label">Publication Year</div><div class="detail-value">${b.publication_year || '—'}</div></div>
        <div class="detail-item"><div class="detail-label">Publisher</div><div class="detail-value">${escHtml(b.publisher) || '—'}</div></div>
        <div class="detail-item"><div class="detail-label">Added</div><div class="detail-value">${fmtDate(b.created_at)}</div></div>
      </div>`,
      `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`);
  } catch (err) { showToast(err.message, 'error'); }
}

function openBookForm(book, authors, categories, onSaved) {
  const isEdit = !!book;
  const bodyHTML = `
    <form id="bookForm" autocomplete="off">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ISBN *</label>
          <input class="form-control" id="fIsbn" type="text" value="${escHtml(book?.isbn)}" placeholder="978-…" required>
          <div class="form-error" id="eIsbn"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Publication Year</label>
          <input class="form-control" id="fYear" type="number" min="1000" max="${new Date().getFullYear()}" value="${book?.publication_year || ''}" placeholder="2024">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Title *</label>
        <input class="form-control" id="fTitle" type="text" value="${escHtml(book?.title)}" required>
        <div class="form-error" id="eTitle"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Author *</label>
          <select class="form-control" id="fAuthor" required>
            <option value="">Select author…</option>
            ${authors.map(a => `<option value="${a.author_id}" ${book?.author_id==a.author_id?'selected':''}>${escHtml(a.author_name)}</option>`).join('')}
          </select>
          <div class="form-error" id="eAuthor"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Category *</label>
          <select class="form-control" id="fCategory" required>
            <option value="">Select category…</option>
            ${categories.map(c => `<option value="${c.category_id}" ${book?.category_id==c.category_id?'selected':''}>${escHtml(c.category_name)}</option>`).join('')}
          </select>
          <div class="form-error" id="eCategory"></div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Price (₹) *</label>
          <input class="form-control" id="fPrice" type="number" min="0.01" step="0.01" value="${book?.price || ''}" required>
          <div class="form-error" id="ePrice"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Stock Quantity *</label>
          <input class="form-control" id="fStock" type="number" min="0" value="${book?.stock_quantity ?? ''}" required>
          <div class="form-error" id="eStock"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Publisher</label>
        <input class="form-control" id="fPublisher" type="text" value="${escHtml(book?.publisher)}" placeholder="Publisher name">
      </div>
    </form>`;

  openModal(isEdit ? 'Edit Book' : 'Add New Book', bodyHTML, `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" id="btnSaveBook">${isEdit ? 'Save Changes' : 'Add Book'}</button>`, '');

  document.getElementById('btnSaveBook').addEventListener('click', async () => {
    const payload = {
      isbn:             document.getElementById('fIsbn').value.trim(),
      title:            document.getElementById('fTitle').value.trim(),
      author_id:        document.getElementById('fAuthor').value,
      category_id:      document.getElementById('fCategory').value,
      price:            document.getElementById('fPrice').value,
      stock_quantity:   document.getElementById('fStock').value,
      publication_year: document.getElementById('fYear').value,
      publisher:        document.getElementById('fPublisher').value.trim(),
    };
    // Clear errors
    ['Isbn','Title','Author','Category','Price','Stock'].forEach(f => document.getElementById('e'+f).textContent = '');

    const btn = document.getElementById('btnSaveBook');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      if (isEdit) await apiPut('/books/' + book.book_id, payload);
      else        await apiPost('/books', payload);
      showToast(isEdit ? 'Book updated successfully.' : 'Book added successfully.', 'success');
      closeModal();
      onSaved();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.textContent = isEdit ? 'Save Changes' : 'Add Book';
    }
  });
}

