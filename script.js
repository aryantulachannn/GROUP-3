'use strict';
(async () => {
  document.getElementById('resultCount').textContent = 'Loading products…';
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Unable to load the catalogue.');
  const products = await response.json();
  if (!Array.isArray(products)) throw new Error('Invalid product response.');
  const categories = { study: 'Study essentials', assignment: 'Assignment tools', daily: 'Everyday campus', learning: 'Learning & revision' };
  const byId = new Map(products.map(p => [p.id, p]));
  const $ = id => document.getElementById(id);
  const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100).replace(/^\$/, 'A$');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const storageKey = 'edumarth-cart-v1';
  let storageNoticeShown = false;
  let cart = {};
  let toastTimer;

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2800);
  }
  function sanitiseCart(input) {
    const output = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return output;
    for (const [id, qty] of Object.entries(input)) {
      const product = byId.get(id);
      if (product && Number.isInteger(qty) && qty > 0) output[id] = Math.min(qty, product.stock);
    }
    return output;
  }
  try { cart = sanitiseCart(JSON.parse(localStorage.getItem(storageKey) || '{}')); } catch { cart = {}; }

  function selectProducts({ query = '', category = 'all', price = 'all', deals = false, sort = 'featured' } = {}) {
    const needle = query.trim().toLowerCase();
    const result = products.filter(p => {
      const match = `${p.name} ${p.description} ${categories[p.category]}`.toLowerCase().includes(needle);
      const priceMatch = price === 'all' || (price === 'under25' && p.price < 2500) || (price === '25to50' && p.price >= 2500 && p.price <= 5000) || (price === '50to100' && p.price > 5000 && p.price <= 10000) || (price === 'over100' && p.price > 10000);
      return match && (category === 'all' || p.category === category) && priceMatch && (!deals || p.compareAt > p.price);
    });
    if (sort === 'priceAsc') result.sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') result.sort((a, b) => b.price - a.price);
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }
  function priceHTML(p) { return `<div class="product-price"><strong>${money(p.price)}</strong>${p.compareAt > p.price ? `<del aria-label="Demo comparison price ${money(p.compareAt)}">${money(p.compareAt)}</del>` : ''}</div>`; }
  function cardHTML(p) {
    return `<article class="product-card"><button type="button" class="product-image" data-view="${p.id}" aria-label="View ${escape(p.name)} details"><img src="${p.image}" alt="Illustration of ${escape(p.name)}" width="320" height="280" loading="lazy">${p.compareAt > p.price ? '<span class="deal-badge">DEMO DEAL</span>' : ''}<span class="quick-view" aria-hidden="true">↗</span></button><div class="product-body"><span class="product-category">${categories[p.category]}</span><h3 class="product-name"><button type="button" data-view="${p.id}">${escape(p.name)}</button></h3><p class="product-description">${escape(p.description.split('. ')[0])}${p.description.includes('. ') ? '.' : ''}</p>${priceHTML(p)}<button type="button" class="add-button" data-add="${p.id}" aria-label="Add ${escape(p.name)} to cart">Add to cart <span aria-hidden="true">+</span></button></div></article>`;
  }
  function renderProducts() {
    const filtered = selectProducts({ query: $('searchInput').value, category: $('categoryFilter').value, price: $('priceFilter').value, deals: $('dealsOnly').checked, sort: $('sortOrder').value });
    $('productList').innerHTML = filtered.map(cardHTML).join('');
    $('resultCount').textContent = `${filtered.length} of ${products.length} products`;
    $('emptyState').hidden = filtered.length > 0;
  }
  function resetFilters() {
    $('filterForm').reset();
    $('dealsOnly').checked = false;
    $('sortOrder').value = 'featured';
    renderProducts();
  }
  function saveCart() {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); }
    catch { if (!storageNoticeShown) { notify('Browser storage is unavailable. Your cart will last for this visit.'); storageNoticeShown = true; } }
  }
  function renderCart() {
    const entries = Object.entries(cart);
    const count = entries.reduce((sum, [,qty]) => sum + qty, 0);
    $('cartCount').textContent = count;
    $('openCart').setAttribute('aria-label', `Open cart, ${count} ${count === 1 ? 'item' : 'items'}`);
    $('cartItems').innerHTML = entries.length ? entries.map(([id,qty]) => {
      const p = byId.get(id);
      return `<article class="cart-item"><img src="${p.image}" alt="" width="320" height="280"><div><h3>${escape(p.name)}</h3><p class="cart-item-price">${money(p.price)} each · <strong>${money(p.price * qty)}</strong></p><div class="cart-item-controls"><div class="quantity"><button type="button" data-qty="${id}" data-delta="-1" aria-label="Decrease ${escape(p.name)} quantity">−</button><span aria-label="Quantity">${qty}</span><button type="button" data-qty="${id}" data-delta="1" aria-label="Increase ${escape(p.name)} quantity" ${qty >= p.stock ? 'disabled' : ''}>+</button></div><button type="button" class="subtle-button" data-remove="${id}" aria-label="Remove ${escape(p.name)} from cart">Remove</button></div></div></article>`;
    }).join('') : '<div class="cart-empty"><h3>Your next chapter starts here.</h3><p>Your cart is empty. Explore the collection and add your essentials.</p><button type="button" class="button primary" data-close="cartDialog">Browse products →</button></div>';
    $('cartTotal').textContent = money(entries.reduce((sum,[id,qty]) => sum + byId.get(id).price * qty, 0));
    $('cartSummary').hidden = entries.length === 0;
  }
  function addToCart(id) {
    const p = byId.get(id);
    if (!p) return;
    if ((cart[id] || 0) >= p.stock) { notify('You have reached the demo stock limit for this item.'); return; }
    cart[id] = (cart[id] || 0) + 1;
    saveCart(); renderCart(); notify(`${p.name} added to your cart`);
  }
  function changeQuantity(id,delta) {
    if (!byId.has(id) || !cart[id]) return;
    cart[id] = Math.max(0, Math.min(byId.get(id).stock, cart[id] + delta));
    if (!cart[id]) delete cart[id];
    saveCart(); renderCart();
  }
  function openProduct(id) {
    const p = byId.get(id);
    if (!p) return;
    $('productDetails').innerHTML = `<div class="detail-layout"><div class="detail-image"><img src="${p.image}" alt="Illustration of ${escape(p.name)}" width="320" height="280"></div><div class="detail-copy"><p class="eyebrow">${categories[p.category]}</p><h2 id="productDialogTitle">${escape(p.name)}</h2>${priceHTML(p)}<p>${escape(p.description)}</p><ul>${p.features.map(f => `<li>${escape(f)}</li>`).join('')}</ul><button type="button" class="button primary" data-add="${p.id}">Add to cart <span aria-hidden="true">+</span></button><p>Sample product · ${p.stock} units in demo stock</p></div></div>`;
    $('productDialog').showModal();
  }

  $('filterForm').addEventListener('submit', e => { e.preventDefault(); renderProducts(); });
  ['searchInput','categoryFilter','priceFilter','dealsOnly','sortOrder'].forEach(id => $(id).addEventListener(id === 'searchInput' ? 'input' : 'change', renderProducts));
  $('clearFilters').addEventListener('click', resetFilters);
  $('emptyClear').addEventListener('click', resetFilters);
  $('allCategoryLink').addEventListener('click', resetFilters);
  $('dealsLink').addEventListener('click', () => { resetFilters(); $('dealsOnly').checked = true; renderProducts(); });
  document.querySelectorAll('[data-category]').forEach(link => link.addEventListener('click', () => { resetFilters(); $('categoryFilter').value = link.dataset.category; renderProducts(); }));
  $('openCart').addEventListener('click', () => { renderCart(); $('cartDialog').showModal(); });
  $('emptyCart').addEventListener('click', () => { cart = {}; saveCart(); renderCart(); $('cartDialog').querySelector('button').focus(); notify('Cart cleared'); });
  document.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.dataset.add) addToCart(button.dataset.add);
    if (button.dataset.view) openProduct(button.dataset.view);
    if (button.dataset.close) $(button.dataset.close).close();
    if (button.dataset.qty) {
      const id = button.dataset.qty, delta = Number(button.dataset.delta);
      changeQuantity(id,delta);
      const target = $('cartItems').querySelector(`[data-qty="${id}"][data-delta="${delta}"]:not(:disabled)`);
      (target || $('cartDialog').querySelector('button')).focus();
    }
    if (button.dataset.remove) {
      delete cart[button.dataset.remove]; saveCart(); renderCart();
      $('cartDialog').querySelector('button').focus();
    }
  });
  ['cartDialog','productDialog'].forEach(id => $(id).addEventListener('click', e => { if (e.target !== $(id)) return; const r = $(id).getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $(id).close(); }));
  $('year').textContent = new Date().getFullYear();
  renderProducts(); renderCart();
  // Small pure-function surface for reproducible functional checks and future API integration.
  window.EduMarth = Object.freeze({ selectProducts, sanitiseCart, money });
})().catch(error => {
  console.error(error);
  document.getElementById('resultCount').textContent = 'Products could not be loaded.';
  const notice = document.createElement('p');
  notice.className = 'notice'; notice.setAttribute('role', 'alert');
  notice.textContent = 'Please open this site through the running EduMarth server, then reload. The product database is currently unavailable.';
  document.getElementById('productList').replaceChildren(notice);
  document.getElementById('openCart').disabled = true;
});
