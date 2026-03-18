/* ─────────────────────────────────────────
   FORGE3D — Admin Panel JS
───────────────────────────────────────── */

const API = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : '/api';

let adminToken = localStorage.getItem('f3d_admin_token') || null;

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  if (adminToken) showAdminApp();
  else document.getElementById('loginScreen').style.display = 'flex';
});

/* ── AUTH ── */
async function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const err = document.getElementById('loginErr');
  err.style.display = 'none';
  if (!email || !password) { err.textContent = 'Fill all fields.'; err.style.display = 'block'; return; }
  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok || data.user?.role !== 'admin') {
      err.textContent = data.message || 'Access denied. Admin only.';
      err.style.display = 'block'; return;
    }
    adminToken = data.token;
    localStorage.setItem('f3d_admin_token', adminToken);
    showAdminApp();
  } catch { err.textContent = 'Server error.'; err.style.display = 'block'; }
}

function adminLogout() {
  adminToken = null;
  localStorage.removeItem('f3d_admin_token');
  location.reload();
}

function showAdminApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'block';
  loadDashboard();
  loadProducts();
  loadOrders();
  loadSiteTitle();
}

/* ── SECTIONS ── */
function showSection(name, el) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#section-dashboard,#section-products,#section-orders,#section-settings').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
}

/* ── DASHBOARD ── */
async function loadDashboard() {
  try {
    const [pr, or] = await Promise.all([
      aFetch(`${API}/products`),
      aFetch(`${API}/orders`)
    ]);
    const pd = await pr.json();
    const od = await or.json();
    const products = pd.products || [];
    const orders = od.orders || [];
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    document.getElementById('dashProducts').textContent = products.length;
    document.getElementById('dashOrders').textContent = orders.length;
    document.getElementById('dashRevenue').textContent = '₹' + revenue.toLocaleString('en-IN');
    const ur = await aFetch(`${API}/users/count`);
    const ud = await ur.json();
    document.getElementById('dashUsers').textContent = ud.count || 0;
    renderRecentOrders(orders.slice(0, 10));
  } catch {
    document.getElementById('dashProducts').textContent = 'Err';
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersTable');
  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No orders yet.</td></tr>'; return; }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td style="color:var(--text3);font-size:12px">#${o._id.slice(-8).toUpperCase()}</td>
      <td>${o.name || '-'}</td>
      <td>${(o.items||[]).length} item(s)</td>
      <td class="td-price">₹${(o.total||0).toLocaleString('en-IN')}</td>
      <td><span class="badge badge-status">${o.status || 'pending'}</span></td>
    </tr>
  `).join('');
}

/* ── PRODUCTS ── */
async function loadProducts() {
  const tbody = document.getElementById('productsTable');
  try {
    const r = await aFetch(`${API}/products`);
    const data = await r.json();
    const products = data.products || [];
    if (!products.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No products. Add your first one.</td></tr>'; return; }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img class="td-img" src="${p.image || '../frontend/assets/placeholder.svg'}" alt="${p.name}" onerror="this.src='../frontend/assets/placeholder.svg'" /></td>
        <td class="td-name">${p.name}</td>
        <td><span class="badge badge-cat">${p.category}</span></td>
        <td class="td-price">₹${(p.price||0).toLocaleString('en-IN')}</td>
        <td>${p.modelFile ? '<span style="color:var(--accent)">Yes</span>' : '<span style="color:var(--text3)">No</span>'}</td>
        <td>
          <div class="td-actions">
            <button class="btn-ghost" onclick="editProduct(${JSON.stringify(p).replace(/"/g,'&quot;')})">Edit</button>
            <button class="btn-danger" onclick="deleteProduct('${p._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading products.</td></tr>'; }
}

function openProductModal(product) {
  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalTitle').textContent = 'Add Product';
  document.getElementById('productId').value = '';
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pCategory').value = '3D Models';
  document.getElementById('pDesc').value = '';
  document.getElementById('pImage').value = '';
  document.getElementById('pModel').value = '';
}

function editProduct(p) {
  document.getElementById('productModal').classList.add('open');
  document.getElementById('modalTitle').textContent = 'Edit Product';
  document.getElementById('productId').value = p._id;
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pPrice').value = p.price || '';
  document.getElementById('pCategory').value = p.category || '3D Models';
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pImage').value = p.image || '';
  document.getElementById('pModel').value = p.modelFile || '';
}

function closeModal() { document.getElementById('productModal').classList.remove('open'); }

async function saveProduct() {
  const id = document.getElementById('productId').value;
  const name = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  if (!name || isNaN(price)) { showToast('Name and price are required.'); return; }
  const body = {
    name, price,
    category: document.getElementById('pCategory').value,
    description: document.getElementById('pDesc').value,
    image: document.getElementById('pImage').value,
    modelFile: document.getElementById('pModel').value
  };
  try {
    const url = id ? `${API}/products/${id}` : `${API}/products`;
    const method = id ? 'PUT' : 'POST';
    const r = await aFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const d = await r.json(); showToast(d.message || 'Error'); return; }
    closeModal();
    loadProducts();
    loadDashboard();
    showToast(id ? 'Product updated.' : 'Product added.');
  } catch { showToast('Server error.'); }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await aFetch(`${API}/products/${id}`, { method: 'DELETE' });
    loadProducts(); loadDashboard();
    showToast('Product deleted.');
  } catch { showToast('Error deleting product.'); }
}

/* ── ORDERS ── */
async function loadOrders() {
  const tbody = document.getElementById('ordersTable');
  try {
    const r = await aFetch(`${API}/orders`);
    const data = await r.json();
    const orders = data.orders || [];
    if (!orders.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No orders yet.</td></tr>'; return; }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td style="color:var(--text3);font-size:12px">#${o._id.slice(-8).toUpperCase()}</td>
        <td>${o.name || '-'}</td>
        <td style="color:var(--text2)">${o.email || '-'}</td>
        <td>${(o.items||[]).length} item(s)</td>
        <td class="td-price">₹${(o.total||0).toLocaleString('en-IN')}</td>
        <td><span class="badge badge-status">${o.status || 'pending'}</span></td>
        <td>
          <select class="form-input" style="padding:6px;font-size:12px;width:120px" onchange="updateOrderStatus('${o._id}',this.value)">
            <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
            <option value="processing" ${o.status==='processing'?'selected':''}>Processing</option>
            <option value="completed" ${o.status==='completed'?'selected':''}>Completed</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Error loading orders.</td></tr>'; }
}

async function updateOrderStatus(id, status) {
  try {
    await aFetch(`${API}/orders/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    showToast('Status updated.');
  } catch { showToast('Update failed.'); }
}

/* ── SETTINGS ── */
async function loadSiteTitle() {
  try {
    const r = await fetch(`${API}/settings/title`);
    const d = await r.json();
    document.getElementById('siteTitleInput').value = d.title || 'FORGE3D';
    document.getElementById('adminSiteTitle').textContent = d.title || 'FORGE3D';
  } catch {}
}

async function saveSiteTitle() {
  const title = document.getElementById('siteTitleInput').value.trim();
  if (!title) { showToast('Title cannot be empty.'); return; }
  try {
    await aFetch(`${API}/settings/title`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    document.getElementById('adminSiteTitle').textContent = title;
    showToast('Site title updated.');
  } catch { showToast('Error saving settings.'); }
}

/* ── HELPERS ── */
function aFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (adminToken) options.headers['Authorization'] = `Bearer ${adminToken}`;
  return fetch(url, options);
}

function showToast(msg) {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
