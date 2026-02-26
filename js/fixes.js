/**
 * KUMSIKA — MISSING FUNCTIONS & FIXES v9
 * Adds all functions referenced in HTML that were missing from other modules.
 * O-Techy Company 2026
 */

// ─── SORT PRODUCTS ───────────────────────────────────────────────
function sortProducts(mode, btn) {
  APP.sortMode = mode;
  document.querySelectorAll('.sort-pill').forEach(p => p.classList.remove('on'));
  if (btn) btn.classList.add('on');
  let sorted = [...PRODUCTS];
  if (mode === 'low')      sorted.sort((a, b) => a.price - b.price);
  else if (mode === 'high') sorted.sort((a, b) => b.price - a.price);
  else if (mode === 'district') sorted.sort((a, b) => (a.district||'').localeCompare(b.district||''));
  displayedProducts = sorted;
  renderGrid(sorted);
}

// ─── CATEGORY CLICK ──────────────────────────────────────────────
function catClick(el, cat) {
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('on'));
  if (el) el.classList.add('on');
  filterByCategory(cat);
}

// ─── SEARCH HISTORY ──────────────────────────────────────────────
function showSearchHistory() {
  const panel = document.getElementById('search-history-panel');
  const chips = document.getElementById('search-history-chips');
  if (!panel || !chips) return;
  if (!searchHistory.length) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  chips.innerHTML = searchHistory.slice(0, 5).map(q =>
    `<div class="sh-chip" onclick="doSearch('${escHtml(q)}')">${escHtml(q)}</div>`
  ).join('');
}

// Hide search history on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#search-inp') && !e.target.closest('#search-history-panel')) {
    const panel = document.getElementById('search-history-panel');
    if (panel) panel.style.display = 'none';
  }
});

// ─── CLEAR NOTIFICATIONS ─────────────────────────────────────────
async function clearNotifs() {
  const db = getDB();
  if (db && currentUser?.id) {
    try {
      await db.from('notifications').update({ read: true }).eq('user_id', currentUser.id);
    } catch(e) {}
  }
  const c = document.getElementById('notif-container');
  if (c) c.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">All clear!</div><div class="empty-desc">No new notifications.</div></div>';
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'none';
  showToast('✅ Notifications cleared', 'g');
}

// ─── DETAIL SCREEN HELPERS ───────────────────────────────────────
function openChatFromDetail() {
  if (!currentUser) { go('s-login', APP.screen); showToast('Sign in to chat with sellers', 'y'); return; }
  const p = currentDetailProduct;
  if (!p) return;
  if (!p.seller_id || p.seller_id === currentUser.id) {
    showToast('This is your own listing', 'y'); return;
  }
  startChatWithSeller(p.seller_id, p.shop_id, p.id);
}

function openShopFromDetail() {
  const p = currentDetailProduct;
  if (!p) return;
  const shop = SHOPS.find(s => s.id === p.shop_id || s.id === p.shopId);
  if (shop) { openShopDetail(shop.id); return; }
  if (p.seller_id) {
    const sellerShop = SHOPS.find(s => s.owner_id === p.seller_id);
    if (sellerShop) { openShopDetail(sellerShop.id); return; }
  }
  showToast('Shop not found', 'y');
}

function shareProduct() {
  const p = currentDetailProduct;
  const url = window.location.href.split('?')[0] + '?product=' + (p?.id || '');
  if (navigator.share) {
    navigator.share({
      title: p?.name || 'Check this out on Kumsika!',
      text: p ? `${p.name} — MK ${(p.price||0).toLocaleString()} on Kumsika 🇲🇼` : 'Check this out on Kumsika!',
      url,
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url).then(() => showToast('🔗 Link copied!', 'g')).catch(() => showToast('🔗 Share: ' + url, 'g'));
  }
}

function toggleSave(btn) {
  const p = currentDetailProduct;
  if (!p) return;
  if (APP.savedItems.has(p.id)) {
    APP.savedItems.delete(p.id);
    if (btn) btn.textContent = '🤍';
    showToast('Removed from saved', '');
  } else {
    APP.savedItems.add(p.id);
    if (btn) btn.textContent = '❤️';
    showToast('❤️ Saved!', 'g');
  }
  saveFavs();
}

// ─── SELL SCREEN AUTO-SETUP ──────────────────────────────────────
// Call setupSellScreen() whenever user navigates to s-sell
document.addEventListener('DOMContentLoaded', () => {
  // Intercept navigation to s-sell to always call setupSellScreen
  document.querySelectorAll('[onclick]').forEach(el => {
    const oc = el.getAttribute('onclick');
    if (oc && oc.includes("'s-sell'")) {
      el.addEventListener('click', () => setTimeout(() => setupSellScreen(), 50));
    }
  });
});

// ─── ADMIN BADGE GRANT ────────────────────────────────────────────
async function grantBadge(userId, badge) {
  try {
    await supabaseAdminGrantBadge(userId, badge);
    showToast(`🏅 Badge "${badge}" granted!`, 'g');
    closeModal('admin-confirm');
  } catch(e) {
    showToast('❌ Failed to grant badge: ' + e.message, 'r');
  }
}

// ─── SUBSCRIPTION EXPIRY CALCULATION ─────────────────────────────
function calcSubscriptionExpiry(plan, startDate) {
  const start = startDate ? new Date(startDate) : new Date();
  if (plan === 'year')  start.setFullYear(start.getFullYear() + 1);
  else                  start.setMonth(start.getMonth() + 1);
  return start.toISOString().split('T')[0];
}

// ─── STORAGE PERMISSION REQUEST ───────────────────────────────────
function requestStoragePermission() {
  // For PWA — ask user to allow persistent storage
  if (navigator.storage?.persist) {
    navigator.storage.persist().then(granted => {
      if (granted) showToast('💾 Offline storage enabled!', 'g');
    });
  }
}
// Request on first load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(requestStoragePermission, 5000));
} else {
  setTimeout(requestStoragePermission, 5000);
}

// ─── BACK BUTTON OVERRIDE ─────────────────────────────────────────
// Ensure browser back button works with app navigation
window.addEventListener('popstate', () => {
  if (APP.prev && APP.prev !== APP.screen) {
    go(APP.prev, null);
  }
});

// Push state when navigating
const _origGo = window.go;
if (typeof go === 'function') {
  // Override go() to also push browser history
  const _go_base = go;
  window._go_with_history = function(id, from) {
    _go_base(id, from);
    try { history.pushState({ screen: id }, '', '#' + id); } catch(e) {}
  };
}

// ─── CREATE SHOP WRAPPER ─────────────────────────────────────────
// HTML has onclick="createShop()" but shop.js has doCreateShop()
function createShop() {
  doCreateShop();
}

// ─── ADMIN GRANT BADGE UI ────────────────────────────────────────
function showGrantBadgeModal(userId, userName) {
  const title = document.getElementById('admin-confirm-title');
  const desc  = document.getElementById('admin-confirm-desc');
  const btn   = document.getElementById('admin-confirm-btn');
  if (title) title.textContent = `Grant Badge to ${userName}`;
  if (desc) {
    desc.innerHTML = `<select id="badge-select" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);">
      <option value="Top Seller">🏆 Top Seller</option>
      <option value="Verified Seller">✅ Verified Seller</option>
      <option value="Premium Seller">⭐ Premium Seller</option>
      <option value="Trusted Seller">🔒 Trusted Seller</option>
    </select>`;
  }
  if (btn) btn.onclick = () => {
    const badge = document.getElementById('badge-select')?.value || 'Verified Seller';
    grantBadge(userId, badge);
  };
  openModal('admin-confirm');
}

// ─── NOTIFY BADGE ON NAV ─────────────────────────────────────────
// Update notification badge count in nav
function updateNotifBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (count > 0) {
    badge.style.display = 'flex';
    badge.textContent = count > 9 ? '9+' : count;
  } else {
    badge.style.display = 'none';
  }
}

// Hook into loadNotifications result
const _origRenderNotifs = window.renderNotifs;

// ─── AUTO-LOAD PRODUCTS ON DEEPLINK ──────────────────────────────
// If URL has ?product=ID, open that product after load
window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get('product');
  if (pid) {
    setTimeout(() => {
      const p = PRODUCTS.find(x => String(x.id) === String(pid));
      if (p) openDetail(p.id);
    }, 4000);
  }
});

console.log('[Kumsika Fixes v9] Loaded ✓');

// ─── PREMIUM PLAN SCREEN FUNCTIONS ───────────────────────────────
let _premPlan     = 'month';
let _payMethod    = 'tnm';

function setPremPlan(plan) {
  _premPlan = plan;
  const monthEl = document.getElementById('pp-month');
  const yearEl  = document.getElementById('pp-year');
  const ppcMonth = document.getElementById('ppc-month');
  const ppcYear  = document.getElementById('ppc-year');
  if (monthEl) monthEl.classList.toggle('active', plan === 'month');
  if (yearEl)  yearEl.classList.toggle('active',  plan === 'year');
  if (ppcMonth) ppcMonth.textContent = plan === 'month' ? '✓' : '';
  if (ppcYear)  ppcYear.textContent  = plan === 'year'  ? '✓' : '';
  const amount = plan === 'year' ? 'MK 40,000' : 'MK 5,000';
  const amtEl = document.getElementById('pi-amount-display');
  const amtStep = document.getElementById('pi-amount-step');
  if (amtEl)   amtEl.textContent  = amount;
  if (amtStep) amtStep.textContent = amount;
  selectedPlan = plan;
}

function setPayMethod(method) {
  _payMethod = method;
  document.getElementById('pmt-tnm')?.classList.toggle('active',    method === 'tnm');
  document.getElementById('pmt-airtel')?.classList.toggle('active', method === 'airtel');
  const step1  = document.getElementById('pi-step1');
  const badge  = document.getElementById('pi-network-badge');
  const phone  = document.getElementById('pi-phone-display');
  const altNote = document.getElementById('pi-alt-note');
  if (method === 'tnm') {
    if (step1)   step1.innerHTML  = 'Open <strong>TNM Mpamba</strong> on your phone';
    if (badge)   badge.textContent = 'TNM Mpamba';
    if (phone)   phone.textContent = '0999 626 944';
    if (altNote) altNote.innerHTML = '💡 You can also pay to: <strong>0888 258 180</strong> (same account)';
  } else {
    if (step1)   step1.innerHTML  = 'Open <strong>Airtel Money</strong> on your phone';
    if (badge)   badge.textContent = 'Airtel Money';
    if (phone)   phone.textContent = '0888 258 180';
    if (altNote) altNote.innerHTML = '💡 You can also pay to: <strong>0999 626 944</strong> (TNM Mpamba)';
  }
}

function copyPayNumber() {
  const phone = document.getElementById('pi-phone-display')?.textContent || '0999 626 944';
  const clean = phone.replace(/\s/g, '');
  navigator.clipboard?.writeText(clean).then(() => showToast('📋 Number copied: ' + clean, 'g')).catch(() => {
    showToast('📋 Number: ' + clean, 'g');
  });
}

// ─── TOAST ALIAS ─────────────────────────────────────────────────
// Ensure toast() works everywhere
if (typeof toast === 'undefined') window.toast = showToast;

// ─── NAVIGATION MSG BADGE UPDATE ─────────────────────────────────
async function updateMsgBadge() {
  if (!currentUser?.id) return;
  try {
    const db = getDB();
    if (!db) return;
    const { data, count } = await db.from('conversations')
      .select('id', { count: 'exact' })
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .gt('unread_count', 0);
    const msgBadge = document.getElementById('msg-badge');
    if (msgBadge) {
      if (count && count > 0) {
        msgBadge.style.display = 'flex';
        msgBadge.textContent = count > 9 ? '9+' : count;
      } else {
        msgBadge.style.display = 'none';
      }
    }
  } catch(e) {}
}

// ─── MESSAGE SCREEN AUTO-LOAD ─────────────────────────────────────
// When navigating to messages, load convos
const _origNavTo = typeof navTo === 'function' ? navTo : null;

// Intercept navigation to messages
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[onclick*="messages"]').forEach(el => {
    const orig = el.getAttribute('onclick');
    if (orig && orig.includes("'s-messages'")) {
      el.addEventListener('click', () => {
        setTimeout(() => renderConvos(), 200);
      });
    }
  });
});

console.log('[Kumsika Fixes v13] Loaded ✓');
