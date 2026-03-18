/* ─────────────────────────────────────────
   FORGE3D — Frontend App
───────────────────────────────────────── */

const API = window.location.hostname === 'localhost'
  ? 'https://project-dsx7.onrender.com/api'
  : '/api';

/* ── STATE ── */
let cart = JSON.parse(localStorage.getItem('f3d_cart') || '[]');
let token = localStorage.getItem('f3d_token') || null;
let user = JSON.parse(localStorage.getItem('f3d_user') || 'null');
let allProducts = [];
let activeCategory = 'all';
let threeScene = null;

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  loadSiteTitle();
  updateCartUI();
  updateAuthUI();
  initHeroCanvas();
  loadFeatured();
  loadProductCount();
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#userBtn') && !e.target.closest('#userMenu')) {
      document.getElementById('userMenu').classList.remove('open');
    }
  });
});

/* ── SITE TITLE ── */
async function loadSiteTitle() {
  try {
    const r = await fetch(`${API}/settings/title`);
    const d = await r.json();
    if (d.title) {
      document.getElementById('siteTitle').textContent = d.title;
      document.getElementById('footerTitle').textContent = d.title;
      document.title = `${d.title} — Premium Digital Assets`;
    }
  } catch {}
}

/* ── PAGES ── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) { page.classList.add('active'); window.scrollTo(0, 0); }
  if (name === 'shop') { loadShop(); }
  if (name === 'orders') { loadOrders(); }
  document.getElementById('userMenu').classList.remove('open');
}

/* ── HERO CANVAS (particle animation) ── */
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  function resize() { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
  window.addEventListener('resize', resize);
  resize();
  for (let i = 0; i < 80; i++) {
    particles.push({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.5+0.3, vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, a: Math.random()*0.5+0.1 });
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,10,10,0.1)';
    ctx.fillRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(200,255,0,${p.a})`;
      ctx.fill();
    });
    particles.forEach((a, i) => {
      for (let j = i+1; j < particles.length; j++) {
        const b = particles[j];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(200,255,0,${0.06*(1-d/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── PRODUCTS ── */
async function loadFeatured() {
  try {
    const r = await fetch(`${API}/products?limit=4`);
    const data = await r.json();
    renderProductCards(data.products || [], 'featuredGrid');
  } catch { document.getElementById('featuredGrid').innerHTML = '<p class="no-products">Unable to load products. Please start the backend server.</p>'; }
}

async function loadProductCount() {
  try {
    const r = await fetch(`${API}/products`);
    const d = await r.json();
    const count = (d.products || []).length;
    animateCount('statProducts', count);
  } catch {}
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  let n = 0;
  const step = Math.ceil(target/40);
  const t = setInterval(() => { n = Math.min(n+step, target); el.textContent = n+'+'; if(n>=target) clearInterval(t); }, 40);
}

async function loadShop() {
  const grid = document.getElementById('shopGrid');
  grid.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    const r = await fetch(`${API}/products`);
    const data = await r.json();
    allProducts = data.products || [];
    applyFilters();
  } catch {
    grid.innerHTML = '<p class="no-products">Unable to connect to server. Ensure backend is running.</p>';
  }
}

function applyFilters() {
  let products = [...allProducts];
  if (activeCategory !== 'all') products = products.filter(p => p.category === activeCategory);
  const min = parseFloat(document.getElementById('priceMin')?.value) || 0;
  const max = parseFloat(document.getElementById('priceMax')?.value) || Infinity;
  products = products.filter(p => p.price >= min && p.price <= max);
  const sort = document.getElementById('sortSelect')?.value || 'newest';
  if (sort === 'price-asc') products.sort((a,b) => a.price - b.price);
  else if (sort === 'price-desc') products.sort((a,b) => b.price - a.price);
  else products.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('productCount').textContent = `${products.length} product${products.length!==1?'s':''}`;
  renderProductCards(products, 'shopGrid');
}

function setCategory(btn, cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

function filterAndGo(cat) {
  activeCategory = cat;
  showPage('shop');
  setTimeout(() => {
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.cat === cat);
    });
    applyFilters();
  }, 100);
}

function renderProductCards(products, containerId) {
  const grid = document.getElementById(containerId);
  if (!products.length) { grid.innerHTML = '<p class="no-products">No products found.</p>'; return; }
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="openProduct('${p._id}')">
      <div class="product-card-img">
        <img src="${p.image || '/assets/placeholder.svg'}" alt="${p.name}" loading="lazy" onerror="this.src='/assets/placeholder.svg'" />
        ${p.modelFile ? '<span class="has-3d">3D</span>' : ''}
      </div>
      <div class="product-card-body">
        <div class="product-cat">${p.category || 'Asset'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || ''}</div>
        <div class="product-footer">
          <div class="product-price">₹${formatPrice(p.price)}</div>
          <button class="product-add-btn" onclick="event.stopPropagation();addToCart('${p._id}')" title="Add to cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function openProduct(id) {
  showPage('product');
  const panel = document.getElementById('productDetail');
  panel.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    const r = await fetch(`${API}/products/${id}`);
    const p = await r.json();
    renderProductDetail(p);
  } catch { panel.innerHTML = '<p style="padding:40px;color:var(--text3)">Product not found.</p>'; }
}

function renderProductDetail(p) {
  const panel = document.getElementById('productDetail');
  const hasModel = !!p.modelFile;
  panel.innerHTML = `
    <div class="product-info-panel">
      <div class="detail-back" onclick="history.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back
      </div>
      <div class="product-info-cat">${p.category || 'Asset'}</div>
      <h1 class="product-info-name">${p.name}</h1>
      <div class="product-info-price">₹${formatPrice(p.price)}</div>
      <p class="product-info-desc">${p.description || 'No description provided.'}</p>
      <div class="product-actions">
        <button class="btn-primary" onclick="addToCart('${p._id}');toggleCart()">Add to Cart</button>
        <button class="btn-ghost" onclick="buyNow('${p._id}')">Buy Now</button>
      </div>
    </div>
    <div class="viewer-container">
      ${hasModel
        ? `<canvas id="threeCanvas"></canvas>`
        : `<img class="viewer-img" src="${p.image || '/assets/placeholder.svg'}" alt="${p.name}" onerror="this.src='/assets/placeholder.svg'" />`
      }
    </div>
  `;
  if (hasModel) initThreeViewer(p.modelFile);
}

/* ── THREE.JS VIEWER ── */
function initThreeViewer(modelUrl) {
  const canvas = document.getElementById('threeCanvas');
  if (!canvas || !window.THREE) return;
  if (threeScene) { threeScene.renderer.dispose(); }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 3);
  const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 5, 5);
  const accentLight = new THREE.PointLight(0xc8ff00, 0.8, 10);
  accentLight.position.set(-3, 2, 2);
  scene.add(ambLight, dirLight, accentLight);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.05;
  controls.enablePan = false;
  const loader = new THREE.GLTFLoader();
  loader.load(modelUrl, (gltf) => {
    const obj = gltf.scene;
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    obj.position.sub(center);
    camera.position.set(0, 0, size * 1.5);
    camera.near = size * 0.01; camera.far = size * 100;
    camera.updateProjectionMatrix();
    controls.maxDistance = size * 4;
    scene.add(obj);
  }, undefined, () => {
    const geo = new THREE.TorusKnotGeometry(0.6, 0.2, 128, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xc8ff00, roughness: 0.3, metalness: 0.8 });
    scene.add(new THREE.Mesh(geo, mat));
  });
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
  threeScene = { renderer };
}

/* ── CART ── */
function addToCart(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (!product) { showToast('Product not found'); return; }
  const existing = cart.find(item => item._id === productId);
  if (existing) { showToast('Already in cart'); return; }
  cart.push({ _id: product._id, name: product.name, price: product.price, image: product.image });
  saveCart();
  updateCartUI();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i._id !== id);
  saveCart();
  updateCartUI();
  renderCartSidebar();
}

function saveCart() { localStorage.setItem('f3d_cart', JSON.stringify(cart)); }

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  badge.textContent = cart.length;
  badge.style.display = cart.length > 0 ? 'flex' : 'none';
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  const open = sidebar.classList.toggle('open');
  overlay.classList.toggle('open', open);
  if (open) renderCartSidebar();
}

function renderCartSidebar() {
  const el = document.getElementById('cartItems');
  const total = cart.reduce((s, i) => s + i.price, 0);
  document.getElementById('cartTotal').textContent = `₹${formatPrice(total)}`;
  if (!cart.length) { el.innerHTML = '<div class="cart-empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg><p style="margin-top:12px;color:var(--text3)">Your cart is empty</p></div>'; return; }
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image || '/assets/placeholder.svg'}" alt="${item.name}" onerror="this.src='/assets/placeholder.svg'" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${formatPrice(item.price)}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item._id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');
}

function goCheckout() {
  if (!cart.length) { showToast('Cart is empty'); return; }
  if (!token) { toggleCart(); showPage('login'); showToast('Please sign in to checkout'); return; }
  toggleCart();
  renderCheckoutPage();
  showPage('checkout');
}

function buyNow(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (!product) return;
  cart = [{ _id: product._id, name: product.name, price: product.price, image: product.image }];
  saveCart(); updateCartUI();
  if (!token) { showPage('login'); showToast('Please sign in to checkout'); return; }
  renderCheckoutPage();
  showPage('checkout');
}

function renderCheckoutPage() {
  const total = cart.reduce((s, i) => s + i.price, 0);
  document.getElementById('checkoutItems').innerHTML = cart.map(i => `
    <div class="checkout-item"><span>${i.name}</span><span>₹${formatPrice(i.price)}</span></div>
  `).join('');
  document.getElementById('checkoutTotal').textContent = `₹${formatPrice(total)}`;
  if (user) {
    document.getElementById('checkoutName').value = user.name || '';
    document.getElementById('checkoutEmail').value = user.email || '';
  }
}

/* ── PAYMENT ── */
async function initiatePayment() {
  const name = document.getElementById('checkoutName').value.trim();
  const email = document.getElementById('checkoutEmail').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  if (!name || !email) { showToast('Please fill in your details'); return; }
  const total = cart.reduce((s, i) => s + i.price, 0);
  try {
    const r = await authFetch(`${API}/orders/create-payment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total * 100 })
    });
    const data = await r.json();
    const options = {
      key: data.key,
      amount: data.amount,
      currency: 'INR',
      name: document.getElementById('siteTitle').textContent,
      description: 'Digital Asset Purchase',
      order_id: data.orderId,
      prefill: { name, email, contact: phone },
      theme: { color: '#c8ff00' },
      handler: async (response) => {
        await placeOrder(response, name, email, phone, total);
      }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    showToast('Payment initialization failed. Check Razorpay keys.');
  }
}

async function placeOrder(paymentResponse, name, email, phone, total) {
  try {
    await authFetch(`${API}/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart, total, name, email, phone,
        address: document.getElementById('checkoutAddress').value,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id
      })
    });
    cart = []; saveCart(); updateCartUI();
    showToast('Order placed successfully!');
    showPage('orders');
  } catch { showToast('Order saving failed.'); }
}

/* ── AUTH ── */
async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; return; }
  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok) { errEl.textContent = data.message || 'Login failed.'; errEl.style.display = 'block'; return; }
    setAuth(data.token, data.user);
    showPage('home');
    showToast(`Welcome back, ${data.user.name}!`);
  } catch { errEl.textContent = 'Server error. Please try again.'; errEl.style.display = 'block'; }
}

async function signup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const errEl = document.getElementById('signupError');
  errEl.style.display = 'none';
  if (!name || !email || !password) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
  try {
    const r = await fetch(`${API}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await r.json();
    if (!r.ok) { errEl.textContent = data.message || 'Signup failed.'; errEl.style.display = 'block'; return; }
    setAuth(data.token, data.user);
    showPage('home');
    showToast(`Welcome to FORGE3D, ${data.user.name}!`);
  } catch { errEl.textContent = 'Server error. Please try again.'; errEl.style.display = 'block'; }
}

function googleLogin() {
  const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
  window.location.href = `${apiBase}/api/auth/google`;
}

function setAuth(t, u) {
  token = t; user = u;
  localStorage.setItem('f3d_token', t);
  localStorage.setItem('f3d_user', JSON.stringify(u));
  updateAuthUI();
}

function logout() {
  token = null; user = null;
  localStorage.removeItem('f3d_token');
  localStorage.removeItem('f3d_user');
  updateAuthUI();
  showPage('home');
  showToast('Signed out successfully.');
}

function updateAuthUI() {
  const guestMenu = document.getElementById('guestMenu');
  const authMenu = document.getElementById('authMenu');
  if (token && user) {
    guestMenu.style.display = 'none';
    authMenu.style.display = 'block';
    document.getElementById('menuUserName').textContent = user.name || user.email;
  } else {
    guestMenu.style.display = 'block';
    authMenu.style.display = 'none';
  }
}

function toggleUserMenu() {
  document.getElementById('userMenu').classList.toggle('open');
}

/* ── ORDERS ── */
async function loadOrders() {
  if (!token) { showPage('login'); return; }
  const el = document.getElementById('ordersList');
  el.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  try {
    const r = await authFetch(`${API}/orders/my`);
    const data = await r.json();
    const orders = data.orders || [];
    if (!orders.length) { el.innerHTML = '<p style="color:var(--text3);padding:40px 0">No orders yet.</p>'; return; }
    el.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Order #${o._id.slice(-8).toUpperCase()}</span>
          <span class="order-status status-${o.status || 'pending'}">${o.status || 'pending'}</span>
        </div>
        <div class="order-items">${(o.items||[]).map(i=>i.name).join(', ')}</div>
        <div class="order-total">₹${formatPrice(o.total)}</div>
      </div>
    `).join('');
  } catch { el.innerHTML = '<p style="color:var(--text3);padding:40px 0">Unable to load orders.</p>'; }
}

/* ── HELPERS ── */
function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, options);
}

function formatPrice(n) {
  return Number(n).toLocaleString('en-IN');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── HANDLE GOOGLE OAUTH REDIRECT ── */
const urlParams = new URLSearchParams(window.location.search);
const oauthToken = urlParams.get('token');
if (oauthToken) {
  fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${oauthToken}` } })
    .then(r => r.json())
    .then(u => { setAuth(oauthToken, u); window.history.replaceState({}, '', '/'); showToast(`Welcome, ${u.name}!`); })
    .catch(() => {});
}
