// frontend/js/authors.js
'use strict';

const authorsState = { page: 1, limit: 15, search: '' };

async function renderAuthors(container) {
  container.innerHTML = loadingHTML();
  document.getElementById('headerActions').innerHTML =
    `<button class="btn btn-primary" id="btnAddAuthor"><i data-lucide="plus"></i> Add Author</button>`;
  lucide.createIcons({ elements: [document.getElementById('headerActions')] });

  container.innerHTML = `
    <div class="toolbar">
      <div class="search-wrap">
        <i data-lucide="search"></i>
        <input type="text" class="search-input" id="authorSearch" placeholder="Search authors…" value="${escHtml(authorsState.search)}">
      </div>
    </div>
    <div class="panel">
      <div id="authorsTableContainer"></div>
      <div class="pagination" id="authorsPagination"></div>
    </div>`;

  lucide.createIcons({ elements: [container] });

  let timer;
  document.getElementById('authorSearch').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { authorsState.search = e.target.value; authorsState.page = 1; loadAuthorsTable(); }, 320);
  });
  document.getElementById('btnAddAuthor').addEventListener('click', () => openAuthorForm(null));

  loadAuthorsTable();
}

async function loadAuthorsTable() {
  const c = document.getElementById('authorsTableContainer');
  if (!c) return;
  c.innerHTML = loadingHTML();
  try {
    const qs   = buildQuery({ search: authorsState.search, page: authorsState.page, limit: authorsState.limit });
    const data = await apiGet('/authors' + qs);
    renderAuthorsTable(c, data);
    renderPagination('authorsPagination', data, (p) => { authorsState.page = p; loadAuthorsTable(); });
  } catch (err) {
    c.innerHTML = emptyStateHTML('alert-circle', 'Error', err.message);
    lucide.createIcons({ elements: [c] });
  }
}

function renderAuthorsTable(container, data) {
  if (!data.data?.length) {
    container.innerHTML = emptyStateHTML('feather', 'No authors found', 'Add an author to get started.');
    lucide.createIcons({ elements: [container] });
    return;
  }
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr>
        <th>#</th><th>Author Name</th><th>Books</th><th>Biography</th><th>Added</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${data.data.map((a, i) => `
          <tr data-id="${a.author_id}">
            <td class="td-muted">${((data.page-1)*data.limit)+i+1}</td>
            <td><span class="fw-600">${escHtml(a.author_name)}</span></td>
            <td><span class="badge badge-sage">${a.book_count} book${a.book_count!==1?'s':''}</span></td>
            <td class="td-muted" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${escHtml(a.biography?.substring(0,100)) || '<em>No biography</em>'}${a.biography?.length>100?'…':''}
            </td>
            <td class="td-muted">${fmtDate(a.created_at)}</td>
            <td>
              <div class="flex gap-8">
                <button class="btn-icon btn-view" data-id="${a.author_id}" title="View books"><i data-lucide="eye"></i></button>
                <button class="btn-icon btn-edit" data-id="${a.author_id}" title="Edit"><i data-lucide="pencil"></i></button>
                <button class="btn-icon btn-delete" data-id="${a.author_id}" title="Delete"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;

  lucide.createIcons({ elements: [container] });

  container.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => viewAuthor(btn.dataset.id)));
  container.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => {
    const a = data.data.find(x => x.author_id == btn.dataset.id);
    openAuthorForm(a);
  }));
  container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async () => {
    const a = data.data.find(x => x.author_id == btn.dataset.id);
    const ok = await showConfirm(`Delete author "${a.author_name}"?`);
    if (!ok) return;
    try {
      await apiDelete('/authors/' + btn.dataset.id);
      showToast('Author deleted.', 'success');
      loadAuthorsTable();
    } catch (err) { showToast(err.message, 'error'); }
  }));
}

async function viewAuthor(id) {
  try {
    const a = await apiGet('/authors/' + id);
    const booksHTML = a.books.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Title</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
          <tbody>${a.books.map(b => `
            <tr><td class="fw-600">${escHtml(b.title)}</td>
            <td>${escHtml(b.category_name)}</td>
            <td>${fmtCurrency(b.price)}</td>
            <td>${stockBadge(b.stock_quantity)}</td></tr>`).join('')}
          </tbody></table></div>`
      : emptyStateHTML('book-open', 'No books', 'No books by this author yet.');

    openModal(escHtml(a.author_name), `
      <div class="mb-16">
        <div class="detail-label mb-8">Biography</div>
        <p style="font-size:14px;color:var(--text-muted);line-height:1.7">${escHtml(a.biography) || '<em>No biography available.</em>'}</p>
      </div>
      <div class="section-title mb-8">Books (${a.book_count})</div>
      ${booksHTML}`,
      `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`, 'lg');
  } catch (err) { showToast(err.message, 'error'); }
}

function openAuthorForm(author) {
  const isEdit = !!author;
  openModal(isEdit ? 'Edit Author' : 'Add Author', `
    <form id="authorForm">
      <div class="form-group">
        <label class="form-label">Author Name *</label>
        <input class="form-control" id="fAName" type="text" value="${escHtml(author?.author_name)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Biography</label>
        <textarea class="form-control" id="fABio" rows="4" placeholder="Short biography…">${escHtml(author?.biography)}</textarea>
      </div>
    </form>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" id="btnSaveAuthor">${isEdit ? 'Save Changes' : 'Add Author'}</button>`);

  document.getElementById('btnSaveAuthor').addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveAuthor');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const payload = {
        author_name: document.getElementById('fAName').value.trim(),
        biography:   document.getElementById('fABio').value.trim(),
      };
      if (isEdit) await apiPut('/authors/' + author.author_id, payload);
      else        await apiPost('/authors', payload);
      showToast(isEdit ? 'Author updated.' : 'Author added.', 'success');
      closeModal();
      loadAuthorsTable();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.textContent = isEdit ? 'Save Changes' : 'Add Author';
    }
  });
}

