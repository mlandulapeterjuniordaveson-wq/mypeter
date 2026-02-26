/**
 * KUMSIKA — PRODUCTS MODULE v8 FIXED
 * Real data from Supabase. No mock data shown to users.
 * O-Techy Company 2026
 */

// ─── DATA STORES (populated from Supabase) ───────────────────────
var PRODUCTS = [];
var displayedProducts = [];
var userProducts      = [];
var currentDetailProduct = null; // global - shared with ui.js
let searchHistory     = JSON.parse(localStorage.getItem('kumsika_search_history') || '[]');

const EMOJI_MAP = {
  Electronics:'📱', Vehicles:'🚗', Fashion:'👗', Food:'🌽',
  Furniture:'🛋️', Jobs:'💼', Services:'🔧', Agriculture:'🌾', Other:'📦'
};

// ─── LOAD HOME DATA FROM SUPABASE ────────────────────────────────
async function loadHomeData() {
  try {
    showHomeLoading(true);
    const [prods, shops] = await Promise.all([
      supabaseFetchProducts({ limit: 60 }),
      supabaseFetchShops(),
    ]);
    PRODUCTS = prods || [];
    SHOPS    = shops || [];
    displayedProducts = [...PRODUCTS];
    userProducts = PRODUCTS.filter(p => p.seller_id === currentUser?.id);

    renderFeatured(PRODUCTS);
    renderGrid(PRODUCTS);
    renderShopsList(SHOPS);
    renderMyListings();
    renderMyShop();
    renderDistrictFilter();

    // Load notifications
    if (currentUser?.id) {
      loadNotifications();
      subscribeToNotifications(currentUser.id, (payload) => {
        loadNotifications();
        showToast('🔔 ' + (payload.new?.title || 'New notification'), 'g');
      });
    }
  } catch(e) {
    console.error('[loadHomeData]', e);
    showToast('Could not load latest data', 'r');
  } finally {
    showHomeLoading(false);
  }
}

function showHomeLoading(show) {
  const el = document.getElementById('home-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// ─── RENDER FEATURED ─────────────────────────────────────────────
function renderFeatured(prods) {
  const c = document.getElementById('h-scroll-container');
  if (!c) return;
  const sorted = [...prods].sort((a,b) => (b.views||0) - (a.views||0)).slice(0,8);

  if (!sorted.length) {
    c.innerHTML = `<div style="color:var(--muted);font-size:13px;padding:16px;">No products yet. Be the first to post!</div>`;
    return;
  }

  c.innerHTML = sorted.map(p => `
    <div class="feat-card" onclick="openDetail('${p.id}')">
      <div class="feat-img">
        ${p.image_url
          ? `<img src="${escHtml(p.image_url)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" alt="${escHtml(p.name)}"/>`
          : `<span style="font-size:40px;">${p.emoji}</span>`}
        ${p.tag ? `<div class="feat-tag ${p.tag}">${p.tag.toUpperCase()}</div>` : ''}
        <button class="feat-fav" onclick="event.stopPropagation();favToggle(this,'${p.id}')">
          ${APP.savedItems.has(p.id) ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="feat-body">
        <div class="feat-name">${escHtml(p.name)}</div>
        <div class="feat-price">MK ${(p.price||0).toLocaleString()}</div>
        <div class="feat-loc">📍 ${escHtml(p.loc||p.district||'')}</div>
      </div>
    </div>`).join('');
}

// ─── RENDER GRID ─────────────────────────────────────────────────
function renderGrid(prods) {
  const c = document.getElementById('listing-grid');
  if (!c) return;

  const filtered = prods.filter(p => APP.activeDistricts.size === 0 || APP.activeDistricts.has(p.district));

  if (!filtered.length) {
    c.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-icon">🛍️</div>
      <div class="empty-title">No listings yet</div>
      <div class="empty-desc">Products posted by sellers will appear here.</div>
    </div>`;
    return;
  }

  c.innerHTML = filtered.map(p => `
    <div class="p-card" onclick="openDetail('${p.id}')">
      <div class="p-img">
        ${p.image_url
          ? `<img src="${escHtml(p.image_url)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" alt="${escHtml(p.name)}"/>`
          : `<span style="font-size:36px;">${p.emoji}</span>`}
        ${p.verified ? '<div class="p-badge">✓ Verified</div>' : ''}
        <button class="p-fav" onclick="event.stopPropagation();favToggle(this,'${p.id}')">
          ${APP.savedItems.has(p.id) ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="p-body">
        <div class="p-name">${escHtml(p.name)}</div>
        <div class="p-price">MK ${(p.price||0).toLocaleString()}</div>
        <div class="p-meta">📍 ${escHtml(p.district||'')} · 👁️ ${p.views||0}</div>
      </div>
    </div>`).join('');
}

// ─── PRODUCT DETAIL ──────────────────────────────────────────────
// NOTE: currentDetailProduct is declared in ui.js — do NOT redeclare here

async function openDetail(productId) {
  const p = PRODUCTS.find(x => String(x.id) === String(productId));
  if (!p) return;
  currentDetailProduct = p;

  // Increment views
  try { supabaseIncrementViews(productId); } catch(e) {}

  const images = [p.image_url, ...(p.extra_images||[])].filter(Boolean);

  // Render gallery image into the detail-main-img-area div
  const galleryArea = document.getElementById('detail-main-img-area');
  if (galleryArea) {
    // Remove any previous product image (keep the back/share buttons)
    galleryArea.querySelectorAll('.det-product-img').forEach(el => el.remove());
    if (images.length > 0) {
      const imgEl = document.createElement('div');
      imgEl.className = 'det-product-img';
      imgEl.style.cssText = 'position:absolute;inset:0;z-index:0;';
      imgEl.innerHTML = `<img src="${escHtml(images[0])}" style="width:100%;height:100%;object-fit:cover;" alt="${escHtml(p.name)}" loading="lazy"/>`;
      galleryArea.insertBefore(imgEl, galleryArea.firstChild);
    } else {
      const emojiEl = document.createElement('div');
      emojiEl.className = 'det-product-img';
      emojiEl.style.cssText = 'position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;font-size:72px;background:var(--surface2);';
      emojiEl.textContent = p.emoji;
      galleryArea.insertBefore(emojiEl, galleryArea.firstChild);
    }
  }

  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

  set('detail-name',  p.name);
  set('detail-price', `MK ${(p.price||0).toLocaleString()}`);
  set('detail-desc',  p.description || 'No description provided.');
  set('det-cat',      p.category || '');
  set('detail-meta',  `${p.district||''} · ${p.category||''} ${p.negotiable ? '· Negotiable':''}${p.delivery ? ' · 🚚 Delivery':''}`);

  const viewEl = document.getElementById('det-views-count');
  if (viewEl) viewEl.textContent = p.views || 0;

  const shop       = SHOPS.find(sh => sh.id === (p.shop_id || p.shopId));
  const sellerName = p.sellerName || shop?.owner || 'Seller';
  const shopName   = (p.verified ? '✓ Verified · ' : '') + (shop?.name || '');
  set('detail-seller-name', sellerName);
  set('detail-shop-name',   shopName);

  // Save button state
  const saveBtn = document.getElementById('det-save-btn');
  if (saveBtn) saveBtn.textContent = APP.savedItems.has(p.id) ? '❤️' : '🤍';

  // WhatsApp button
  const waNum = shop?.wa || shop?.whatsapp || '';
  const waBtn = document.getElementById('det-wa-btn');
  if (waBtn) {
    waBtn.style.display = waNum ? 'flex' : 'none';
    waBtn.onclick = () => openWhatsApp(p.name, 'Is this still available?', `MK ${p.price?.toLocaleString()}`, waNum);
  }

  go('s-detail', APP.screen);
}

function setGalleryImg(url) {
  const galleryArea = document.getElementById('detail-main-img-area');
  if (!galleryArea) return;
  galleryArea.querySelectorAll('.det-product-img').forEach(el => el.remove());
  const imgEl = document.createElement('div');
  imgEl.className = 'det-product-img';
  imgEl.style.cssText = 'position:absolute;inset:0;z-index:0;';
  imgEl.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;" alt="" loading="lazy"/>`;
  galleryArea.insertBefore(imgEl, galleryArea.firstChild);
}

async function startChatWithSeller(sellerId, shopId, productId) {
  if (!currentUser) { go('s-login', APP.screen); return; }
  try {
    const convId = await supabaseStartConversation(currentUser.id, sellerId, shopId, productId);
    openConversation(convId);
  } catch(e) {
    showToast('❌ Could not start chat', 'r');
  }
}

// ─── SEARCH ──────────────────────────────────────────────────────
async function doSearch(q) {
  // Hide search history panel on typing
  const panel = document.getElementById('search-history-panel');
  if (panel) panel.style.display = 'none';

  if (!q || !q.trim()) { renderGrid(PRODUCTS); return; }
  const query = q.toLowerCase().trim();

  // Save history
  searchHistory = [query, ...searchHistory.filter(x => x !== query)].slice(0,5);
  localStorage.setItem('kumsika_search_history', JSON.stringify(searchHistory));
  renderSearchHistory();

  // Search locally first
  let results = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query) ||
    (p.description||'').toLowerCase().includes(query) ||
    (p.district||'').toLowerCase().includes(query) ||
    (p.category||'').toLowerCase().includes(query)
  );

  // Also fetch from Supabase for fresh results
  try {
    const fresh = await supabaseFetchProducts({ search: query });
    if (fresh && fresh.length) {
      const ids = new Set(results.map(p => p.id));
      fresh.forEach(p => { if (!ids.has(p.id)) results.push(p); });
    }
  } catch(e) {}

  displayedProducts = results;
  renderGrid(results);
}

function renderSearchHistory() {
  // FIX: was 'search-history-list', HTML has 'search-history-chips'
  const c = document.getElementById('search-history-chips');
  if (!c) return;
  c.innerHTML = searchHistory.map(s => `
    <div class="search-hist-item" onclick="document.getElementById('search-inp').value='${escHtml(s)}';doSearch('${escHtml(s)}')">
      🕐 ${escHtml(s)}
    </div>`).join('');
}

function clearSearchHistory() {
  searchHistory = [];
  localStorage.removeItem('kumsika_search_history');
  renderSearchHistory();
}

// ─── FILTER / SORT ───────────────────────────────────────────────
function filterByCategory(cat) {
  const filtered = cat === 'All'
    ? PRODUCTS.filter(p => APP.activeDistricts.size === 0 || APP.activeDistricts.has(p.district))
    : PRODUCTS.filter(p => p.category === cat && (APP.activeDistricts.size === 0 || APP.activeDistricts.has(p.district)));
  displayedProducts = filtered;
  renderGrid(filtered);
}

function applyFilter() {
  let filtered = [...PRODUCTS].filter(p => APP.activeDistricts.size === 0 || APP.activeDistricts.has(p.district));
  if (APP.filterSortPrice === 'low')  filtered.sort((a,b) => a.price - b.price);
  if (APP.filterSortPrice === 'high') filtered.sort((a,b) => b.price - a.price);
  displayedProducts = filtered;
  renderGrid(filtered);
  closeModal('filter-modal');
}

function refreshProducts() {
  renderFeatured(PRODUCTS);
  renderGrid(displayedProducts.length ? displayedProducts : PRODUCTS);
}

function setSortBtnPrice(dir) {
  APP.filterSortPrice = dir;
  document.getElementById('sort-low-btn')?.classList.toggle('active', dir==='low');
  document.getElementById('sort-high-btn')?.classList.toggle('active', dir==='high');
}

function renderDistrictFilter() {
  const c = document.getElementById('district-filter-list');
  if (!c) return;
  const allDistricts = ['Lilongwe','Blantyre','Mzuzu','Zomba','Mangochi','Kasungu','Salima','Dedza','Karonga','Ntchisi','Dowa','Nkhotakota','Balaka','Mulanje','Thyolo','Machinga','Chiradzulu','Mwanza','Neno','Phalombe','Rumphi','Chitipa','Mzimba','Likoma','Nkhata Bay','Ntcheu','Chikwawa','Nsanje'];
  if (!APP.activeDistricts.size) allDistricts.forEach(d => APP.activeDistricts.add(d));
  c.innerHTML = allDistricts.map(d => `
    <label class="district-row" onclick="toggleDistrict('${d}')">
      <span>${d}</span>
      <span class="district-check${APP.activeDistricts.has(d)?' on':''}">✓</span>
    </label>`).join('');
}

function toggleDistrict(d) {
  if (APP.activeDistricts.has(d)) APP.activeDistricts.delete(d);
  else APP.activeDistricts.add(d);
  renderDistrictFilter();
}

function selectAllDistricts() {
  document.querySelectorAll('#district-filter-list .district-row').forEach(r => {
    const d = r.querySelector('span').textContent;
    APP.activeDistricts.add(d);
    r.querySelector('.district-check').classList.add('on');
  });
}

function clearAllDistricts() {
  APP.activeDistricts.clear();
  renderDistrictFilter();
}

// ─── MY LISTINGS ─────────────────────────────────────────────────
function renderMyListings() {
  // FIX: was 'my-listings-list', HTML has 'my-listings-grid'
  const c = document.getElementById('my-listings-grid');
  if (!c) return;
  const mine = PRODUCTS.filter(p => p.seller_id === currentUser?.id);
  userProducts = mine;
  if (!mine.length) {
    c.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-title">${t('noListings')}</div>
      <div class="empty-desc">${t('noListingsDesc')}</div>
      <button class="btn-g" style="width:auto;padding:12px 24px;margin-top:16px;" onclick="go('s-sell',APP.screen)">Post a Listing</button>
    </div>`;
    return;
  }
  c.innerHTML = mine.map(p => `
    <div class="listing-row" onclick="openDetail('${p.id}')">
      <div class="listing-img">
        ${p.image_url ? `<img src="${escHtml(p.image_url)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" alt=""/>` : `<span style="font-size:24px;">${p.emoji}</span>`}
      </div>
      <div class="listing-info">
        <div class="listing-name">${escHtml(p.name)}</div>
        <div class="listing-price">MK ${(p.price||0).toLocaleString()}</div>
        <div class="listing-meta">👁️ ${p.views||0} views · ${p.district||''}</div>
      </div>
      <button class="btn-sm btn-sm-r" onclick="event.stopPropagation();deleteListing('${p.id}')">🗑️</button>
    </div>`).join('');
}

async function deleteListing(productId) {
  if (!confirm('Delete this listing?')) return;
  try {
    await supabaseDeleteProduct(productId, currentUser.id);
    PRODUCTS = PRODUCTS.filter(p => String(p.id) !== String(productId));
    showToast('✅ Listing deleted', 'g');
    renderMyListings();
    refreshProducts();
  } catch(e) {
    showToast('❌ Could not delete: ' + e.message, 'r');
  }
}

// ─── MY SHOP ─────────────────────────────────────────────────────
async function renderMyShop() {
  const c = document.getElementById('my-shop-content');
  if (!c || !currentUser?.id) return;

  const myShop = SHOPS.find(s => s.owner_id === currentUser.id) ||
    (currentUser.id ? await supabaseFetchMyShop(currentUser.id) : null);

  if (!myShop) {
    c.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🏪</div>
      <div class="empty-title">No Shop Yet</div>
      <div class="empty-desc">Open your shop to start selling across Malawi.</div>
      <button class="btn-g" style="width:auto;padding:12px 24px;margin-top:16px;" onclick="go('s-shop-create',APP.screen)">Open My Shop</button>
    </div>`;
    return;
  }

  let daysLeft = 0;
  let expiryStr = '';
  if (myShop.subscription_expiry) {
    const exp = new Date(myShop.subscription_expiry);
    const now = new Date();
    daysLeft = Math.max(0, Math.ceil((exp - now) / (1000*60*60*24)));
    expiryStr = exp.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  }

  const statusColor = myShop.status === 'active' ? 'var(--G-bright)' : myShop.status === 'pending' ? '#F5A623' : 'var(--R)';

  c.innerHTML = `
    <div style="padding:14px;">
      <div class="shop-card" style="margin-bottom:12px;">
        <div class="shop-cover" style="height:80px;">
          ${myShop.cover_url ? `<img src="${escHtml(myShop.cover_url)}" style="width:100%;height:100%;object-fit:cover;" alt=""/>` : '<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--G),var(--G-bright));"></div>'}
        </div>
        <div class="shop-info">
          <div class="shop-logo-row">
            <div class="shop-logo">${myShop.logo_url ? `<img src="${escHtml(myShop.logo_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:11px;" alt=""/>` : '🏪'}</div>
            <div style="flex:1;">
              <div class="shop-name">${escHtml(myShop.name)}</div>
              <div class="shop-meta">📍 ${myShop.district} · ${myShop.category}</div>
            </div>
            <span class="badge" style="background:${statusColor}20;color:${statusColor};">${(myShop.status||'').toUpperCase()}</span>
          </div>
        </div>
      </div>
      ${myShop.status === 'active' && expiryStr ? `
        <div style="background:var(--G-dim);border:1px solid rgba(0,204,0,.2);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--G-bright);">
          ✅ Active until <strong>${expiryStr}</strong> · <strong>${daysLeft} days remaining</strong>
        </div>` : ''}
      ${myShop.status !== 'active' ? `
        <button class="btn-g" onclick="openModal('pay-modal')" style="margin-bottom:10px;">
          💳 Activate Subscription
        </button>` : ''}
      <button class="btn-ghost" onclick="go('s-my-listings',APP.screen)" style="margin-bottom:8px;">📦 View My Listings</button>
      <button class="btn-ghost" onclick="go('s-sell',APP.screen)">➕ Post New Listing</button>
    </div>`;
}

// ─── SELL / POST LISTING ──────────────────────────────────────────
/**
 * SELLER MODEL:
 *  - INDIVIDUAL seller (sellerType='person'): Any signed-in user can post for free.
 *    Their product appears under their profile, not a shop.
 *  - SHOP seller (sellerType='shop'): User has opened a shop.
 *    Products are linked to their shop. Subscription required to post under the shop.
 *
 *  The sell gate only blocks shop sellers with no active subscription.
 *  Individual sellers always have access.
 */
function setupSellScreen() {
  if (!currentUser) return;
  const gate = document.getElementById('sell-sub-gate');
  const form = document.getElementById('sell-form-wrap');
  const isIndividual = currentUser.sellerType === 'person' || !currentUser.isSeller;
  const isShopActive = currentUser.shopStatus === 'active';
  const canSell = isIndividual || isShopActive || currentUser.isAdmin;
  if (gate) gate.style.display = canSell ? 'none' : 'block';
  if (form) form.style.display = canSell ? 'flex' : 'none';

  // Show/update the sell-as label
  const modeEl = document.getElementById('sell-mode-label');
  if (modeEl) {
    if (isIndividual) {
      modeEl.innerHTML = '👤 Selling as <strong>' + escHtml(currentUser.name) + '</strong> (individual)';
      modeEl.style.display = 'block';
    } else if (isShopActive) {
      const myShop = SHOPS.find(s => s.owner_id === currentUser.id);
      modeEl.innerHTML = '🏪 Selling under <strong>' + escHtml(myShop?.name || 'My Shop') + '</strong>';
      modeEl.style.display = 'block';
    } else {
      modeEl.style.display = 'none';
    }
  }
}

window._pendingProductFiles = [];

function addPhoto() {
  if (APP.photoCount >= 3) { showToast('Maximum 3 photos', 'y'); return; }
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10*1024*1024) { showToast('Image must be under 10MB', 'r'); return; }
    window._pendingProductFiles.push(file);
    const localUrl = await _fileToBase64(file);
    APP.photoCount++;
    refreshPhotoSlots(localUrl);
    showToast(`📷 Photo ${APP.photoCount} added`, 'g');
  };
  inp.click();
}

function refreshPhotoSlots(previewUrl = null) {
  // photo-slots is the correct ID from HTML
  const grid = document.getElementById('photo-slots');
  if (!grid) return;

  // Update counter
  const countEl = document.getElementById('photo-count');
  if (countEl) countEl.textContent = APP.photoCount;

  if (previewUrl) {
    // Insert new preview before the add button
    const slot = document.createElement('div');
    slot.className = 'photo-slot filled';
    slot.innerHTML = `<img src="${previewUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" alt="Photo"/>`;
    const addBtn = document.getElementById('add-photo-btn');
    if (addBtn) grid.insertBefore(slot, addBtn);
    else grid.appendChild(slot);
  } else {
    // Full reset - remove all previews
    grid.querySelectorAll('.photo-slot.filled').forEach(s => s.remove());
  }

  // Show/hide add button
  const addBtn = document.getElementById('add-photo-btn');
  if (addBtn) addBtn.style.display = APP.photoCount >= 3 ? 'none' : 'flex';
}

async function doPost() {
  if (!currentUser || !currentUser.id) {
    showToast('Please sign in to post a listing', 'r');
    go('s-login', APP.screen);
    return;
  }
  // FIX: Block any non-UUID seller IDs (guest_, local_, demo_, etc.)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(currentUser.id)) {
    showToast('Please sign in with a real account to post', 'r');
    go('s-login', APP.screen);
    return;
  }

  const title    = document.getElementById('s-title')?.value.trim();
  const desc     = document.getElementById('s-desc')?.value.trim();
  const price    = parseFloat(document.getElementById('s-price')?.value || '0');
  const category = document.getElementById('s-category')?.value;
  const location = document.getElementById('s-location')?.value;
  const negotiable = document.getElementById('s-negotiable')?.classList.contains('on') || false;
  const delivery   = document.getElementById('s-delivery')?.classList.contains('on') || false;

  if (!title)               { showToast('Enter a product title', 'r'); return; }
  if (!price || price <= 0) { showToast('Enter a valid price', 'r'); return; }
  if (!category)            { showToast('Select a category', 'r'); return; }
  if (!location)            { showToast('Select your location', 'r'); return; }

  const btn = document.getElementById('post-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>'; }

  try {
    const myShop = SHOPS.find(s => s.owner_id === currentUser.id);

    let imageUrls = [];
    if (window._pendingProductFiles && window._pendingProductFiles.length) {
      showToast('⏳ Uploading photos to Cloudinary…');
      imageUrls = await uploadProductImages(window._pendingProductFiles, currentUser.id);
      window._pendingProductFiles = [];
    }

    const product = {
      seller_id   : currentUser.id,
      shop_id     : (myShop?.id && UUID_RE.test(myShop.id)) ? myShop.id : null,
      name        : title,
      description : desc,
      price,
      category,
      district    : location,
      image_url   : imageUrls[0] || null,
      extra_images: imageUrls.slice(1),
      negotiable,
      delivery,
    };

    const saved = await supabasePostProduct(product);

    PRODUCTS.unshift(saved);
    userProducts.unshift(saved);
    displayedProducts = [...PRODUCTS];

    // Reset form
    ['s-title','s-desc','s-price'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
    const sc = document.getElementById('s-category');
    const sl = document.getElementById('s-location');
    if (sc) sc.value = '';
    if (sl) sl.value = '';
    APP.photoCount = 0;
    refreshPhotoSlots(); // reset photos

    showToast('🎉 Listing posted!', 'g');
    refreshProducts();
    renderMyListings();
    setTimeout(() => go('s-my-listings', APP.screen), 800);
  } catch(err) {
    showToast('❌ ' + (err.message || 'Failed to post'), 'r');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `🚀 <span>${t('postFree')}</span>`; }
  }
}

async function aiWrite() {
  const titleInp = document.getElementById('s-title');
  const descInp  = document.getElementById('s-desc');
  const cat      = document.getElementById('s-category')?.value;
  const btn      = document.querySelector('.ai-cta');
  if (btn) { btn.style.opacity = '.6'; btn.style.pointerEvents = 'none'; }
  showToast('🤖 AI is suggesting a listing…');
  await delay(1200);
  const samples = [
    { t:'iPhone 14 Pro Max 256GB — Space Black',  d:'Excellent condition, battery 91%, Face ID working. Original box included. Price negotiable.', cat:'Electronics' },
    { t:'Toyota Corolla 2020 — Manual Transmission', d:'Well maintained, fuel efficient, AC working, new tyres. All documents ready.', cat:'Vehicles' },
    { t:'Handmade Chitenge Dress — Size Medium',  d:'Beautiful handmade chitenge dress, vibrant African print, comfortable fit.', cat:'Fashion' },
    { t:'Fresh Farm Tomatoes — Per Crate',        d:'Fresh farm tomatoes, no chemicals. Available in bulk. Delivery to Lilongwe.', cat:'Food' },
  ];
  const sample = samples.find(s => s.cat === cat) || samples[0];
  if (titleInp && !titleInp.value) titleInp.value = sample.t;
  if (descInp  && !descInp.value)  descInp.value  = sample.d;
  if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
  showToast('✅ Fill in your real details then post!', 'g');
}

// ─── FAVOURITES ──────────────────────────────────────────────────
function favToggle(btn, productId) {
  if (APP.savedItems.has(productId)) {
    APP.savedItems.delete(productId);
    btn.textContent = '🤍';
  } else {
    APP.savedItems.add(productId);
    btn.textContent = '❤️';
    showToast('❤️ Saved!', 'g');
  }
  saveFavs();
}
