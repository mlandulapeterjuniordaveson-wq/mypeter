/**
 * KUMSIKA — SHOPS MODULE v8
 * Real data from Supabase. No mock data.
 * O-Techy Company 2026
 */

// Live SHOPS array (populated from Supabase in products.js loadHomeData)
let SHOPS = [];
let currentShop = null;

// ─── RENDER SHOPS LIST ────────────────────────────────────────────
function renderShopsList(shops) {
  const c = document.getElementById('shops-list');
  if (!c) return;

  if (!shops || !shops.length) {
    c.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🏪</div>
      <div class="empty-title">No Shops Yet</div>
      <div class="empty-desc">Be the first to open a shop in Malawi!</div>
      <button class="btn-g" style="width:auto;padding:12px 24px;margin-top:16px;" onclick="go('s-shop-create','s-shops')">Open My Shop</button>
    </div>`;
    return;
  }

  const badge = s =>
    s.status === 'active'    ? '<span class="badge badge-g">✓ ACTIVE</span>'    :
    s.status === 'pending'   ? '<span class="badge badge-y">PENDING</span>'   :
    s.status === 'unpaid'    ? '<span class="badge badge-y">UNPAID</span>'    :
                               '<span class="badge badge-r">SUSPENDED</span>';

  // Sort: active shops first, then by creation date
  const sorted = [...shops].sort((a,b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return new Date(b.created_at||0) - new Date(a.created_at||0);
  });

  c.innerHTML = sorted.map(s => `
    <div class="shop-card" onclick="openShopDetail('${s.id}')">
      <div class="shop-cover">
        <div class="shop-cover-glow"></div>
        ${s.cover_url
          ? `<img src="${escHtml(s.cover_url)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" alt=""/>`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a5c2a,#00cc00);display:flex;align-items:center;justify-content:center;font-size:42px;">🏪</div>`}
      </div>
      <div class="shop-info">
        <div class="shop-logo-row">
          <div class="shop-logo">
            ${s.logo_url ? `<img src="${escHtml(s.logo_url)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:11px;" alt=""/>` : '🏪'}
          </div>
          <div style="flex:1;">
            <div class="shop-name">${escHtml(s.name)}</div>
            <div class="shop-meta">📍 ${escHtml(s.district||'')} · ${escHtml(s.category||'General')}</div>
          </div>
          ${badge(s)}
        </div>
        ${s.status==='active' && s.subscription_expiry ? `
          <div style="font-size:10px;color:var(--G-bright);padding:4px 0 0;">
            ✅ Active until ${new Date(s.subscription_expiry).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
          </div>` : ''}
        <div class="shop-stats-row">
          <div class="shop-stat"><strong>${escHtml(s.owner||'')}</strong></div>
          <div class="shop-viewer-count">👁️ ${s.views||0}</div>
        </div>
      </div>
    </div>`).join('');
}

function searchShops(q) {
  const filtered = SHOPS.filter(s =>
    !q ||
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    (s.district||'').toLowerCase().includes(q.toLowerCase()) ||
    (s.category||'').toLowerCase().includes(q.toLowerCase()) ||
    (s.owner||'').toLowerCase().includes(q.toLowerCase())
  );
  renderShopsList(filtered);
}

// ─── SHOP DETAIL ──────────────────────────────────────────────────
async function openShopDetail(shopId) {
  const shop = SHOPS.find(s => s.id === shopId);
  if (!shop) return;
  currentShop = shop;

  const shopProds = PRODUCTS.filter(p => p.shop_id === shopId || p.shopId === shopId);
  const s = document.getElementById('s-shop-detail');
  if (!s) return;

  const nameEl   = document.getElementById('sd-name');
  const metaEl   = document.getElementById('sd-meta');
  const descEl   = document.getElementById('sd-desc');
  const coverEl  = document.getElementById('sd-cover');
  const logoEl   = document.getElementById('sd-logo');
  const prodsEl  = document.getElementById('sd-products');
  const waBtn    = document.getElementById('sd-wa-btn');
  const msgBtn   = document.getElementById('sd-msg-btn');
  const ownerEl  = document.getElementById('sd-owner');

  if (nameEl)  nameEl.textContent  = shop.name;
  if (metaEl)  metaEl.textContent  = `📍 ${shop.district} · ${shop.category||'General'}`;
  if (descEl)  descEl.textContent  = shop.description || 'No description.';
  if (ownerEl) ownerEl.textContent = `By ${shop.owner||'Seller'}`;

  if (coverEl) coverEl.innerHTML = shop.cover_url
    ? `<img src="${escHtml(shop.cover_url)}" style="width:100%;height:100%;object-fit:cover;" alt=""/>`
    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a5c2a,#00cc00);"></div>`;

  if (logoEl) logoEl.innerHTML = shop.logo_url
    ? `<img src="${escHtml(shop.logo_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" alt=""/>`
    : '🏪';

  // Subscription expiry display
  const subEl = document.getElementById('sd-subscription');
  if (subEl && shop.subscription_expiry && shop.status === 'active') {
    const exp = new Date(shop.subscription_expiry);
    const daysLeft = Math.max(0, Math.ceil((exp - new Date()) / (1000*60*60*24)));
    subEl.innerHTML = `✅ Active until ${exp.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} (${daysLeft} days)`;
    subEl.style.display = 'block';
  } else if (subEl) {
    subEl.style.display = 'none';
  }

  if (prodsEl) {
    if (!shopProds.length) {
      prodsEl.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">📦</div><div class="empty-title">No products yet</div></div>`;
    } else {
      prodsEl.innerHTML = shopProds.map(p => `
        <div class="p-card" onclick="openDetail('${p.id}')">
          <div class="p-img">
            ${p.image_url ? `<img src="${escHtml(p.image_url)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" alt=""/>` : `<span style="font-size:32px;">${p.emoji}</span>`}
          </div>
          <div class="p-body">
            <div class="p-name">${escHtml(p.name)}</div>
            <div class="p-price">MK ${(p.price||0).toLocaleString()}</div>
          </div>
        </div>`).join('');
    }
  }

  if (waBtn) {
    const waNum = shop.wa || shop.whatsapp || '';
    waBtn.style.display = waNum ? 'flex' : 'none';
    waBtn.onclick = () => openWhatsApp(shop.name, 'I found your shop on Kumsika', '', waNum);
  }

  if (msgBtn) {
    msgBtn.style.display = currentUser && shop.owner_id && shop.owner_id !== currentUser?.id ? 'flex' : 'none';
    msgBtn.onclick = () => startChatWithSeller(shop.owner_id, shop.id, null);
  }

  go('s-shop-detail', APP.screen);
}

// ─── SHOP CREATION ────────────────────────────────────────────────
async function doCreateShop() {
  if (!currentUser?.id) { showToast('Please sign in first', 'r'); return; }

  const name     = document.getElementById('shop-name-inp')?.value.trim();
  const desc     = document.getElementById('shop-desc-inp')?.value.trim();
  const district = document.getElementById('shop-district-inp')?.value;
  const category = document.getElementById('shop-category-inp')?.value;
  const wa       = document.getElementById('shop-wa-inp')?.value.trim();

  if (!name)     { showToast('Enter shop name', 'r'); return; }
  if (!district) { showToast('Select district', 'r'); return; }
  if (!category) { showToast('Select category', 'r'); return; }

  const btn = document.getElementById('create-shop-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>'; }

  try {
    let logoUrl  = null;
    let coverUrl = null;

    const logoFile  = document.getElementById('shop-logo-file')?.files[0];
    const coverFile = document.getElementById('shop-cover-file')?.files[0];

    if (logoFile)  logoUrl  = await uploadShopLogo(logoFile, currentUser.id);
    if (coverFile) coverUrl = await uploadShopCover(coverFile, currentUser.id);

    const shop = await supabaseCreateShop({
      owner_id : currentUser.id,
      name, description: desc, district, category,
      whatsapp: wa, logo_url: logoUrl, cover_url: coverUrl,
    });

    SHOPS.unshift({
      id: shop.id, name, description: desc, district, category,
      owner: currentUser.name, owner_id: currentUser.id,
      logo_url: logoUrl, cover_url: coverUrl,
      whatsapp: wa, wa, status: 'pending',
      views: 0, emoji: '🏪', rating: 5.0, products: 0,
      created_at: new Date().toISOString(),
    });

    renderShopsList(SHOPS);
    showToast('🏪 Shop created! Now activate your subscription.', 'g');
    setTimeout(() => { openModal('pay-modal'); go('s-shops', APP.screen); }, 1000);
  } catch(err) {
    showToast('❌ ' + (err.message || 'Failed to create shop'), 'r');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Create Shop'; }
  }
}

// ─── PAYMENT SCREEN ──────────────────────────────────────────────
let selectedPlan = 'month';

function selectPlan(plan) {
  selectedPlan = plan;
  document.getElementById('plan-month')?.classList.toggle('selected', plan==='month');
  document.getElementById('plan-year')?.classList.toggle('selected', plan==='year');
  const amountEl = document.getElementById('pi-amount');
  if (amountEl) amountEl.textContent = plan === 'year' ? 'MK 40,000' : 'MK 5,000';
}

function initPayScreen() {
  selectPlan('month');
}

let _proofFile = null;
function triggerProofUpload() {
  document.getElementById('proof-file-input')?.click();
}

async function handleProofFile(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5*1024*1024) { showToast('Image must be under 5MB', 'r'); return; }
  _proofFile = file;
  const url = await _fileToBase64(file);
  const prev = document.getElementById('proof-img-preview');
  if (prev) prev.src = url;
  document.getElementById('proof-upload-inner').style.display = 'none';
  document.getElementById('proof-preview-inner').style.display = 'block';
  validateProofForm();
}

function validateProofForm() {
  const num = document.getElementById('proof-sender-number')?.value.trim() || '';
  const ok  = num.replace(/\s/g,'').length >= 9 && _proofFile;
  const btn = document.getElementById('submit-proof-btn');
  if (btn) { btn.disabled = !ok; btn.style.opacity = ok ? '1' : '.4'; }
  const err = document.getElementById('proof-num-err');
  if (err) err.classList.toggle('show', num.length > 0 && num.replace(/\s/g,'').length < 9);
}

async function submitPaymentProof() {
  if (!currentUser?.id) { showToast('Please sign in first', 'r'); return; }
  if (!_proofFile) { showToast('Upload a payment screenshot', 'r'); return; }

  const senderNum = document.getElementById('proof-sender-number')?.value.trim();
  const txnRef    = document.getElementById('proof-txn-ref')?.value.trim();
  const method    = selectedPlan === 'year' ? 'airtel' : 'tnm';
  const amount    = selectedPlan === 'year' ? 40000 : 5000;

  const btn = document.getElementById('submit-proof-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>'; }

  try {
    showToast('⏳ Uploading proof…');
    const proofUrl = await uploadPaymentProof(_proofFile, currentUser.id);

    await supabaseSubmitPaymentProof({
      user_id       : currentUser.id,
      user_email    : currentUser.email,
      user_name     : currentUser.name,
      sender_number : senderNum,
      txn_ref       : txnRef,
      method, plan: selectedPlan, amount,
      proof_url     : proofUrl,
    });

    showToast('✅ Payment proof submitted! We\'ll review within 24 hours.', 'g');
    _proofFile = null;
    go('s-home', APP.screen);
  } catch(err) {
    showToast('❌ ' + (err.message || 'Submit failed'), 'r');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Payment Proof'; }
  }
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────
async function loadAdminPanel() {
  if (!currentUser?.isAdmin) return;
  try {
    const requests = await supabaseAdminFetchPaymentRequests();
    renderAdminPayments(requests);
    renderAdminShops();
  } catch(e) { console.error('[Admin]', e); }
}

function renderAdminPayments(requests) {
  const c = document.getElementById('admin-payments-list');
  if (!c) return;
  if (!requests.length) {
    c.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;">No payment requests</div>';
    return;
  }
  c.innerHTML = requests.map(r => `
    <div class="admin-row" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:10px;">
      <div style="font-weight:700;margin-bottom:4px;">${escHtml(r.user_name||'')} — ${escHtml(r.user_email||'')}</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">
        Plan: <strong>${r.plan}</strong> · Amount: <strong>MK ${(r.amount||0).toLocaleString()}</strong> · 
        Method: ${r.method} · Status: <strong style="color:${r.status==='approved'?'var(--G-bright)':r.status==='rejected'?'var(--R)':'var(--text2)'}">${r.status}</strong>
      </div>
      ${r.proof_url ? `<a href="${escHtml(r.proof_url)}" target="_blank" style="font-size:12px;color:var(--G-bright);">📷 View Screenshot</a>` : ''}
      ${r.status === 'pending' ? `
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn-sm btn-sm-g" onclick="adminApprove('${r.id}','${r.user_id||''}','${r.plan}')">✓ Approve</button>
          <button class="btn-sm btn-sm-r" onclick="adminReject('${r.id}')">✗ Reject</button>
        </div>` : ''}
    </div>`).join('');
}

function renderAdminShops() {
  const c = document.getElementById('admin-shops-list');
  if (!c) return;
  c.innerHTML = SHOPS.map(s => `
    <div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;margin-bottom:8px;display:flex;align-items:center;gap:10px;">
      <div style="flex:1;">
        <div style="font-weight:700;">${escHtml(s.name)}</div>
        <div style="font-size:11px;color:var(--muted);">${s.district} · ${s.status}</div>
      </div>
      <button class="btn-sm btn-sm-y" onclick="adminGrantBadge('${s.owner_id}')">🏅 Badge</button>
      <button class="btn-sm btn-sm-r" onclick="adminSuspendShop('${s.id}')">⛔</button>
    </div>`).join('') || '<div style="color:var(--muted);text-align:center;padding:20px;">No shops yet</div>';
}

async function adminApprove(requestId, userId, plan) {
  try {
    const myShop = SHOPS.find(s => s.owner_id === userId);
    const expiry = await supabaseAdminApprovePayment(requestId, userId, myShop?.id || null, plan);
    showToast('✅ Payment approved! Shop activated until ' + expiry, 'g');
    loadAdminPanel();
    loadHomeData();
  } catch(e) { showToast('❌ ' + e.message, 'r'); }
}

async function adminReject(requestId) {
  const db = getDB();
  if (!db) return;
  await db.from('payment_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', requestId);
  showToast('Rejected', 'r');
  loadAdminPanel();
}

async function adminGrantBadge(userId) {
  const badge = prompt('Enter badge name (e.g. "⭐ Top Seller", "✓ Verified", "🏆 Premium"):');
  if (!badge) return;
  try {
    await supabaseAdminGrantBadge(userId, badge);
    showToast('🏅 Badge granted!', 'g');
  } catch(e) { showToast('❌ ' + e.message, 'r'); }
}

async function adminSuspendShop(shopId) {
  if (!confirm('Suspend this shop?')) return;
  try {
    await supabaseAdminUpdateShopStatus(shopId, 'suspended');
    const s = SHOPS.find(x => x.id === shopId);
    if (s) s.status = 'suspended';
    renderAdminShops();
    showToast('Shop suspended', 'r');
  } catch(e) { showToast('❌ ' + e.message, 'r'); }
}
