// frontend/js/categories.js
'use strict';

async function renderCategories(container) {
  document.getElementById('headerActions').innerHTML =
    `<button class="btn btn-primary" id="btnAddCategory"><i data-lucide="plus"></i> Add Category</button>`;
  lucide.createIcons({ elements: [document.getElementById('headerActions')] });

  container.innerHTML = `
    <div class="toolbar">
      <div class="search-wrap">
        <i data-lucide="search"></i>
        <input type="text" class="search-input" id="catSearch" placeholder="Search categories…">
      </div>
    </div>
    <div class="panel">
      <div id="catsTableContainer"></div>
    </div>`;

  lucide.createIcons({ elements: [container] });

  let timer;
  document.getElementById('catSearch').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => loadCategoriesTable(e.target.value), 320);
  });
  document.getElementById('btnAddCategory').addEventListener('click', () => openCategoryForm(null));

  loadCategoriesTable('');
}

async function loadCategoriesTable(search = '') {
  const c = document.getElementById('catsTableContainer');
  if (!c) return;
  c.innerHTML = loadingHTML();
  try {
    const data = await apiGet('/categories' + buildQuery({ search }));
    renderCategoriesTable(c, data);
  } catch (err) {
    c.innerHTML = emptyStateHTML('alert-circle', 'Error', err.message);
    lucide.createIcons({ elements: [c] });
  }
}

function renderCategoriesTable(container, data) {
  if (!data.length) {
    container.innerHTML = emptyStateHTML('tag', 'No categories', 'Add a category to get started.');
    lucide.createIcons({ elements: [container] });
    return;
  }
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr>
        <th>#</th><th>Category</th><th>Description</th><th>Books</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${data.map((c, i) => `
          <tr>
            <td class="td-muted">${i+1}</td>
            <td><span class="fw-600">${escHtml(c.category_name)}</span></td>
            <td class="td-muted">${escHtml(c.description) || '—'}</td>
            <td><span class="badge badge-sage">${c.book_count} book${c.book_count!==1?'s':''}</span></td>
            <td>
              <div class="flex gap-8">
                <button class="btn-icon btn-view" data-id="${c.category_id}" title="View books"><i data-lucide="eye"></i></button>
                <button class="btn-icon btn-edit" data-id="${c.category_id}" title="Edit"><i data-lucide="pencil"></i></button>
                <button class="btn-icon btn-delete" data-id="${c.category_id}" title="Delete"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;

  lucide.createIcons({ elements: [container] });

  container.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => viewCategory(btn.dataset.id)));
  container.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => {
    const cat = data.find(c => c.category_id == btn.dataset.id);
    openCategoryForm(cat);
  }));
  container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async () => {
    const cat = data.find(c => c.category_id == btn.dataset.id);
    const ok = await showConfirm(`Delete category "${cat.category_name}"?`);
    if (!ok) return;
    try {
      await apiDelete('/categories/' + btn.dataset.id);
      showToast('Category deleted.', 'success');
      loadCategoriesTable(document.getElementById('catSearch')?.value || '');
    } catch (err) { showToast(err.message, 'error'); }
  }));
}

async function viewCategory(id) {
  try {
    const cat = await apiGet('/categories/' + id);
    const booksHTML = cat.books.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Title</th><th>Author</th><th>Price</th><th>Stock</th></tr></thead>
          <tbody>${cat.books.map(b => `
            <tr><td class="fw-600">${escHtml(b.title)}</td>
            <td>${escHtml(b.authors || b.author_name)}</td>
            <td>${fmtCurrency(b.price)}</td>
            <td>${stockBadge(b.stock_quantity)}</td></tr>`).join('')}
          </tbody></table></div>`
      : emptyStateHTML('book-open', 'No books', 'No books in this category yet.');

    openModal(escHtml(cat.category_name), `
      <p class="td-muted mb-16">${escHtml(cat.description) || '<em>No description.</em>'}</p>
      <div class="section-title mb-8">Books in this category (${cat.book_count})</div>
      ${booksHTML}`,
      `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`, 'lg');
  } catch (err) { showToast(err.message, 'error'); }
}

function openCategoryForm(cat) {
  const isEdit = !!cat;
  openModal(isEdit ? 'Edit Category' : 'Add Category', `
    <form id="catForm">
      <div class="form-group">
        <label class="form-label">Category Name *</label>
        <input class="form-control" id="fCName" type="text" value="${escHtml(cat?.category_name)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input class="form-control" id="fCDesc" type="text" value="${escHtml(cat?.description)}" placeholder="Short description…">
      </div>
    </form>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" id="btnSaveCat">${isEdit ? 'Save Changes' : 'Add Category'}</button>`);

  document.getElementById('btnSaveCat').addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveCat');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const payload = {
        category_name: document.getElementById('fCName').value.trim(),
        description:   document.getElementById('fCDesc').value.trim(),
      };
      if (isEdit) await apiPut('/categories/' + cat.category_id, payload);
      else        await apiPost('/categories', payload);
      showToast(isEdit ? 'Category updated.' : 'Category added.', 'success');
      closeModal();
      loadCategoriesTable('');
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.textContent = isEdit ? 'Save Changes' : 'Add Category';
    }
  });
}

