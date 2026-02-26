/**
 * KUMSIKA — UI MODULE v13
 * ────────────────────────────────────────────────────────────
 * Navigation, Toast, Theme, PWA, i18n, Avatar upload,
 * Profile, Messages, Notifications, Admin, Shelves.
 * O-Techy Company 2026
 */

// ─── STATE ───────────────────────────────────────────────────────
const APP = {
  screen              : 's-splash',
  prev                : null,
  sortMode            : 'default',
  filterSortPrice     : null,
  activeDistricts     : new Set(['Lilongwe','Blantyre','Mzuzu','Zomba','Mangochi','Kasungu','Salima','Dedza','Karonga','Ntchisi','Dowa','Nkhotakota','Balaka','Mulanje','Thyolo','Machinga']),
  photoCount          : 0,
  bugType             : 'crash',
  pendingAdminAction  : null,
  savedItems          : new Set(JSON.parse(localStorage.getItem('kumsika_saved') || '[]')),
  deferredInstall     : null,
};
function saveFavs() { localStorage.setItem('kumsika_saved', JSON.stringify([...APP.savedItems])); }

let currentDetailProduct = null;
let tutStep = 0;

// ─── i18n ────────────────────────────────────────────────────────
const T = {
  en: {
    home:'Home', shops:'Shops', messages:'Messages', profile:'Profile',
    notifications:'Notifications', listings:'Listings', shelves:'My Shelves',
    settings:'Settings', language:'Language', security:'Security',
    editProfile:'Edit Profile', myShop:'My Shop', myListings:'My Listings',
    hotDeals:'Hot Deals', latestListings:'Latest Listings',
    browseShops:'Browse Shops', browseShopsDesc:'Discover verified sellers across Malawi',
    seeAll:'See all', explore:'Explore',
    searchPlaceholder:'Search products in Malawi…', searchShops:'Search shops…',
    searchLang:'Search language…', msgPlaceholder:'Type a message…',
    filter:'Filter', filterSort:'Filter & Sort', sortByPrice:'Sort By Price',
    filterByDistrict:'Filter By District', priceLow:'↑ Low First', priceHigh:'↓ High First',
    apply:'Apply', cancel:'Cancel',
    sortDefault:'Default', sortLow:'Price: Low↑', sortHigh:'Price: High↓', sortDist:'By District',
    all:'All', products:'Products', views:'Views', sales:'Sales',
    statSellers:'Sellers', statListings:'Listings', statSatisfied:'Satisfied',
    emailAddress:'Email Address', password:'Password', fullName:'Full Name',
    phoneNumber:'Phone Number', district:'District',
    signIn:'Sign In', signOut:'Sign Out', createAccount:'Create Account',
    browseGuest:'Browse as Guest', or:'or',
    welcomeBack:'Welcome back 👋', trustedBy:'Trusted by thousands across Malawi',
    noAccount:'New here?', haveAccount:'Already have an account?',
    joinKumsika:'Join Kumsika 🎉', freeToJoin:'Free to join. Thousands of buyers waiting.',
    validEmail:'Enter a valid email address', passMin:'Password must be 6+ characters',
    iAmSeller:'I am a Seller', sellerDesc:'I want to open a shop and sell products',
    agreeTerms:"By signing up you agree to Kumsika's guidelines & privacy policy",
    photos:'Photos', addPhoto:'Add Photo', productTitle:'Product Title',
    description:'Description', price:'Price (MK)', category:'Category', location:'Location',
    negotiable:'Negotiable', negotiableDesc:'Allow buyers to make offers',
    delivery:'Delivery Available', deliveryDesc:'You can deliver to buyer',
    postListing:'Post Listing', postFree:'Post Listing — Free',
    aiWrite:'AI — Write for me', aiWriteDesc:'Auto-fill listing with AI',
    subRequired:'⚠️ Active subscription required to post listings.',
    activateShop:'💳 Activate Shop', subActive:'Subscription Active',
    chatWhatsApp:'Chat on WhatsApp', chatSeller:'💬 Chat with Seller', chat:'Chat',
    stillAvail:'Still available?', lowerPrice:'Lower price?', canDeliver:'Delivery?', payCash:'Pay cash!',
    recentSearches:'Recent Searches', clear:'Clear',
    openShop:'Open Your Shop', shopName:'Shop Name',
    saveChanges:'💾 Save Changes', save:'Save', edit:'Edit ›', bio:'Bio',
    tapToChange:'Tap to change photo', appearance:'Appearance',
    amoledBlack:'AMOLED Black', amoledDesc:'Pure black — best for OLED',
    lightMode:'Malawi Light', lightDesc:'Clean Malawi-themed interface',
    pushNotif:'Push Notifications', msgNotif:'Message Alerts',
    installApp:'Install App', installDesc:'Add to home screen',
    clearCache:'Clear Cache', clearCacheDesc:'Clear search history & cache',
    changePassword:'Change Password', currentPassword:'Current Password',
    newPassword:'New Password', updatePassword:'Update Password',
    twoFactor:'Two-Factor Auth', activeSessions:'Active Sessions',
    howToUse:'How to Use', reportBug:'Report a Bug', aboutApp:'About Kumsika',
    bugDesc:'Help us improve! Describe the issue encountered.',
    bugType:'Bug Type', bugDescription:'Describe the issue',
    deviceInfo:'Your Device (optional)', submitReport:'📤 Submit Report', skip:'Skip',
    overview:'Overview', users:'Users',
    noMessages:'No Messages Yet', noMessagesDesc:'Chat with sellers to negotiate.',
    browseListing:'Browse Listings', noListings:'No Listings Yet',
    noListingsDesc:'Post your first product listing.',
    selling:'Selling', account:'Account', support:'Support', data:'Data',
    signOutTitle:'Sign Out?', signOutDesc:'You will be signed out. Sign back in anytime.',
    contact:'Contact',
  },
  ny: {
    home:'Nyumba', shops:'Masitolo', messages:'Mauthenga', profile:'Mbiri',
    signIn:'Lowani', signOut:'Tukani', createAccount:'Pangani Akaunti',
    browseGuest:'Onani monga Mlendo', filter:'Sefa', apply:'Gwiritsani', cancel:'Lekani',
    all:'Zonse', noListings:'Zoveka Mulibe', clear:'Chotsani',
    postListing:'Potsa Zoveka', postFree:'Potsa Zoveka — Mfulu',
    searchPlaceholder:'Sakani zinthu ku Malawi…', save:'Sungani',
  },
};

const LANGUAGES = [
  { code:'en',    flag:'🇬🇧', name:'English',  native:'English' },
  { code:'ny',    flag:'🇲🇼', name:'Chichewa', native:'Chicheŵa' },
  { code:'tum',   flag:'🇲🇼', name:'Tumbuka',  native:'Chitumbuka' },
  { code:'yao',   flag:'🇲🇼', name:'Yao',      native:'Chiyao' },
  { code:'ton',   flag:'🇲🇼', name:'Tonga',    native:'Chitonga' },
  { code:'sena',  flag:'🇲🇼', name:'Sena',     native:'Chisena' },
  { code:'lomwe', flag:'🇲🇼', name:'Lomwe',    native:'Chilomwe' },
  { code:'sw',    flag:'🇹🇿', name:'Swahili',  native:'Kiswahili' },
];

let currentLang = localStorage.getItem('kumsika_lang') || 'en';
function t(key) { return T[currentLang]?.[key] || T.en[key] || key; }

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val && el.children.length === 0) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  const langEl = document.getElementById('cur-lang');
  if (langEl) langEl.textContent = LANGUAGES.find(l => l.code === currentLang)?.name || 'English';
  const setLEl = document.getElementById('settings-lang-display');
  if (setLEl) setLEl.textContent = (LANGUAGES.find(l => l.code === currentLang)?.name || 'English') + ' ›';
}

function renderLangList(q) {
  const c = document.getElementById('lang-list');
  if (!c) return;
  const filtered = LANGUAGES.filter(l => !q || l.name.toLowerCase().includes(q.toLowerCase()) || l.native.toLowerCase().includes(q.toLowerCase()));
  c.innerHTML = filtered.map(l => `
    <div class="lang-item" onclick="pickLang('${l.code}')">
      <div class="l-flag">${l.flag}</div>
      <div class="l-text"><div class="l-name">${l.name}</div><div class="l-native">${l.native}</div></div>
      ${currentLang === l.code ? '<div class="l-check">✓</div>' : ''}
    </div>`).join('');
}

function filterLangs(q) { renderLangList(q); }

function pickLang(code) {
  currentLang = code;
  localStorage.setItem('kumsika_lang', code);
  applyTranslations();
  renderLangList();
  showToast('🌍 Language changed to ' + (LANGUAGES.find(l => l.code === code)?.name || code), 'g');
  setTimeout(() => back(), 800);
}

// ─── NAVIGATION ───────────────────────────────────────────────────
function go(id, from) {
  const prev = document.getElementById(APP.screen);
  const next = document.getElementById(id);
  if (!next || id === APP.screen) return;
  if (prev) prev.classList.remove('active');
  APP.prev   = from || APP.screen;
  APP.screen = id;
  requestAnimationFrame(() => {
    next.classList.add('active');
    const scrollEl = next.querySelector('.scroll, .scroll-free');
    if (scrollEl) scrollEl.scrollTop = 0;
  });
}

function back() {
  if (APP.prev && APP.prev !== APP.screen) go(APP.prev, null);
}

function navTo(screenId, navId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
  const baseId = navId.replace(/\d+$/, '');
  document.querySelectorAll(`[id^="${baseId}"]`).forEach(n => n.classList.add('on'));
  go(screenId, APP.screen);
}

function goHome(asGuest) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  APP.screen = 's-home'; APP.prev = 's-home';
  document.getElementById('s-home').classList.add('active');
  document.querySelectorAll('[id^="ni-home"]').forEach(n => {
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('on'));
    n.classList.add('on');
  });
  if (!asGuest) setTimeout(() => showToast('✓ Welcome, ' + (currentUser?.name?.split(' ')[0] || 'Guest') + '! 👋', 'g'), 300);
}

function openModal(id)  { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

// ─── TOAST ────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(_toastTimer);
  el.textContent = msg;
  el.className   = 'toast show' + (type ? ' ' + type : '');
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
// Alias for backward compat
const toast = showToast;

// ─── THEME ────────────────────────────────────────────────────────
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('kumsika_theme', theme);
  const ca = document.getElementById('chk-amoled');
  const cm = document.getElementById('chk-malawi');
  if (ca) ca.textContent = theme === 'amoled' ? '✓ Active' : '';
  if (cm) cm.textContent = (theme === 'malawi' || theme === 'white') ? '✓ Active' : '';
  showToast(theme === 'amoled' ? '🖤 Dark mode activated' : '🇲🇼 Malawi light theme', 'g');
}

// ─── PWA ─────────────────────────────────────────────────────────
function setupPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    APP.deferredInstall = e;
    const hint = document.getElementById('pwa-install-hint');
    if (hint) hint.style.display = 'block';
  });
  window.addEventListener('appinstalled', () => {
    APP.deferredInstall = null;
    const hint = document.getElementById('pwa-install-hint');
    if (hint) hint.style.display = 'none';
    showToast('📲 Kumsika installed!', 'g');
  });
}

async function installPWA() {
  if (!APP.deferredInstall) { showToast('App is already installed or not supported', 'y'); closeModal('pwa-modal'); return; }
  try {
    APP.deferredInstall.prompt();
    const { outcome } = await APP.deferredInstall.userChoice;
    if (outcome === 'accepted') { APP.deferredInstall = null; showToast('📲 Installing Kumsika…', 'g'); }
    closeModal('pwa-modal');
  } catch {}
}

// ─── OFFLINE ─────────────────────────────────────────────────────
function setupOffline() {
  const bar = document.getElementById('offline-bar');
  if (!bar) return;
  window.addEventListener('online',  () => bar.classList.remove('show'));
  window.addEventListener('offline', () => bar.classList.add('show'));
  if (!navigator.onLine) bar.classList.add('show');
}

// ─── PROFILE ─────────────────────────────────────────────────────
function updateProfileUI() {
  if (!currentUser) return;
  const set    = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  const setVal = (id, v) => { const e = document.getElementById(id); if (e) e.value = v || ''; };

  set('profile-name',  currentUser.name  || '');
  set('profile-email', (currentUser.email || '') + (currentUser.district ? ' · ' + currentUser.district : ''));
  setVal('edit-name',     currentUser.name);
  setVal('edit-email',    currentUser.email);
  setVal('edit-phone',    currentUser.phone);

  const distSel = document.getElementById('edit-district');
  if (distSel && currentUser.district) {
    for (const o of distSel.options) {
      if (o.value === currentUser.district || o.textContent === currentUser.district) { o.selected = true; break; }
    }
  }

  set('security-email', currentUser.email || '');
  if (currentUser.avatar) updateAvatarUI(currentUser.avatar);

  const isAdmin = currentUser.isAdmin === true; // from DB — never check email
  const el = id => document.getElementById(id);
  if (el('admin-badge'))     el('admin-badge').style.display     = isAdmin               ? '' : 'none';
  if (el('admin-menu-row'))  el('admin-menu-row').style.display  = isAdmin               ? '' : 'none';
  if (el('seller-badge'))    el('seller-badge').style.display    = currentUser.isSeller  ? '' : 'none';
  if (el('verified-badge'))  el('verified-badge').style.display  = currentUser.verified  ? '' : 'none';

  const shopSt = el('profile-shop-status');
  if (shopSt) {
    if      (currentUser.shopStatus === 'active')  shopSt.textContent = 'Active — expires ' + (currentUser.shopExpiry || 'Mar 2026');
    else if (currentUser.shopStatus === 'unpaid')  shopSt.textContent = '⚠️ Subscription unpaid';
    else if (currentUser.shopStatus === 'pending') shopSt.textContent = '⏳ Payment under review';
    else                                           shopSt.textContent = 'No shop yet';
  }

  const myProds = userProducts.length;
  if (el('profile-listings-count')) el('profile-listings-count').textContent = myProds + ' active listing' + (myProds !== 1 ? 's' : '');
  set('stat-listings', myProds);
  set('stat-views',    userProducts.reduce((s, p) => s + p.views, 0).toLocaleString());

  // Badges updated by loadNotifications() and renderConvos()
}

async function saveProfile() {
  const name     = document.getElementById('edit-name')?.value.trim();
  const email    = document.getElementById('edit-email')?.value.trim();
  const phone    = document.getElementById('edit-phone')?.value.trim()  || '';
  const district = document.getElementById('edit-district')?.value      || '';
  const bio      = document.getElementById('edit-bio')?.value.trim()    || '';

  if (!name || name.length < 2) { showToast('Name must be at least 2 characters', 'r'); return; }
  if (!email || !email.includes('@')) { showToast(t('validEmail'), 'r'); return; }

  try {
    if (getDB()) await supabaseUpdateProfile(currentUser.id, { full_name: name, email, phone, district, bio });
  } catch {}

  currentUser = { ...currentUser, name, email, phone, district };
  saveSession(currentUser);
  updateProfileUI();
  showToast('💾 Profile saved!', 'g');
  setTimeout(() => back(), 700);
}

// ─── AVATAR UPLOAD ────────────────────────────────────────────────
function triggerAvatarUpload() {
  document.getElementById('avatar-file-input')?.click();
}

async function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'r'); return; }
  if (file.size > 5 * 1024 * 1024)     { showToast('Image must be under 5MB', 'r');   return; }

  const spinner = document.getElementById('avatar-upload-spinner');
  if (spinner) spinner.classList.add('show');
  showToast('⏳ Uploading photo…');

  try {
    let imageUrl;
    if (CLOUDINARY_CONFIG.cloudName !== 'YOUR_CLOUD_NAME') {
      imageUrl = await uploadAvatar(file, currentUser?.id || 'anon');
      if (getDB()) await supabaseUpdateProfile(currentUser.id, { avatar_url: imageUrl });
    } else {
      imageUrl = await _fileToBase64(file);
      await delay(900);
    }
    if (currentUser) { currentUser.avatar = imageUrl; saveSession(currentUser); }
    updateAvatarUI(imageUrl);
    showToast('✅ Photo updated!', 'g');
  } catch (err) {
    showToast('❌ Upload failed: ' + (err.message || 'Try again'), 'r');
  } finally {
    if (spinner) spinner.classList.remove('show');
    input.value = '';
  }
}

function updateAvatarUI(url) {
  const imgHtml = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Avatar" loading="lazy"/>`;
  ['profile-av-container', 'edit-av-preview'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = imgHtml;
  });
}

// ─── WHATSAPP ─────────────────────────────────────────────────────
function openWhatsApp(shopName, productName, price, waNumber) {
  const num = (waNumber || '265888258180').replace(/\D/g, '');
  const msg = price
    ? `Hello ${shopName}! I'm interested in *${productName}* (MK ${Number(price).toLocaleString()}). Is it still available?`
    : `Hello ${shopName}! I found you on Kumsika. Can we talk?`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ─── MESSAGES ─────────────────────────────────────────────────────
const CONVOS = [
  
];

// ─── MESSAGING (Real Supabase) ───────────────────────────────────
let _activeConvId = null;
let _msgSubscription = null;

async function renderConvos() {
  const list  = document.getElementById('conv-list');
  const empty = document.getElementById('messages-empty');
  if (!list) return;

  if (!currentUser?.id) {
    list.innerHTML = '';
    if (empty) { empty.style.display = 'block'; empty.innerHTML = '<div class="empty-icon">💬</div><div class="empty-title">Sign in to message sellers</div>'; }
    return;
  }

  try {
    const convs = await supabaseFetchConversations(currentUser.id);
    if (!convs.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    list.innerHTML = convs.map(c => {
      const other = c.buyer_id === currentUser.id ? c.seller : c.buyer;
      const name  = other?.full_name || 'User';
      const av    = other?.avatar_url ? `<img src="${escHtml(other.avatar_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt=""/>` : '👤';
      const time  = c.updated_at ? new Date(c.updated_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '';
      return `<div class="conv-item" onclick="openConversation('${c.id}','${escHtml(name)}')">
        <div class="conv-av">${av}</div>
        <div class="conv-body">
          <div class="conv-name">${escHtml(name)}</div>
          <div class="conv-preview">${escHtml(c.last_message||'Start chatting...')}</div>
        </div>
        <div class="conv-meta">
          <div class="conv-time">${time}</div>
          ${c.unread_count ? `<div class="conv-badge">${c.unread_count}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    console.error('[Convos]', e);
    if (empty) empty.style.display = 'block';
  }
}

async function openConversation(convId, name) {
  _activeConvId = convId;
  const e = id => document.getElementById(id);
  if (e('chat-name'))   e('chat-name').textContent   = name || 'Chat';
  if (e('chat-online')) e('chat-online').textContent = '🟢 Active';

  const box = e('chat-box');
  if (box) box.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px;font-size:12px;">Loading messages…</div>';

  go('s-chat', 's-messages');

  try {
    const messages = await supabaseFetchMessages(convId);
    renderMessages(messages);
  } catch(err) {
    console.error('[Messages]', err);
  }

  // Subscribe to new messages
  if (_msgSubscription) { try { _msgSubscription.unsubscribe(); } catch(e) {} }
  _msgSubscription = subscribeToMessages(convId, (payload) => {
    if (payload.new) appendMessage(payload.new);
  });
}

function renderMessages(messages) {
  const box = document.getElementById('chat-box');
  const typing = document.getElementById('typing-msg');
  if (!box) return;
  box.innerHTML = '';
  messages.forEach(m => appendMessage(m));
  if (typing) box.insertBefore(typing, null);
  box.scrollTop = box.scrollHeight;
}

function appendMessage(m) {
  const box    = document.getElementById('chat-box');
  const typing = document.getElementById('typing-msg');
  if (!box) return;
  const isMe   = m.sender_id === currentUser?.id;
  const time   = m.sent_at ? new Date(m.sent_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '';
  const el     = document.createElement('div');
  el.className = 'msg ' + (isMe ? 'me' : 'them');
  el.innerHTML = `<div class="bubble">${escHtml(m.content)}</div><div class="m-time">${time}${isMe ? ' ✓✓' : ''}</div>`;
  if (typing && box.contains(typing)) box.insertBefore(el, typing);
  else box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

async function sendMsg() {
  const inp  = document.getElementById('c-input');
  const text = inp?.value.trim();
  if (!text || !_activeConvId || !currentUser?.id) return;
  inp.value = ''; inp.style.height = 'auto';
  try {
    await supabaseSendMessage(_activeConvId, currentUser.id, text);
    appendMessage({ sender_id: currentUser.id, content: text, sent_at: new Date().toISOString() });
  } catch(err) {
    showToast('❌ Message failed: ' + err.message, 'r');
    inp.value = text;
  }
}

function quickReply(text) {
  const inp = document.getElementById('c-input');
  if (inp) { inp.value = text; inp.focus(); }
}

// ─── NOTIFICATIONS (Real Supabase) ───────────────────────────────
async function loadNotifications() {
  if (!currentUser?.id) return;
  try {
    const notifs = await supabaseFetchNotifications(currentUser.id);
    renderNotifs(notifs);
    const unread = notifs.filter(n => !n.read).length;
    const badge  = document.getElementById('notif-badge');
    if (badge) { badge.textContent = unread || ''; badge.style.display = unread ? 'flex' : 'none'; }
  } catch(e) {}
}

function renderNotifs(notifs) {
  const c = document.getElementById('notif-container');
  if (!c) return;
  if (!notifs || !notifs.length) {
    c.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">No Notifications Yet</div><div class="empty-desc">You will be notified about messages, views, and updates.</div></div>';
    return;
  }
  c.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n.id}')">
      <div class="notif-icon">${n.type==='message'?'💬':n.type==='sale'?'💰':n.type==='view'?'👁️':'🔔'}</div>
      <div class="notif-body">
        ${n.title ? `<div style="font-weight:700;font-size:13px;margin-bottom:2px;">${escHtml(n.title)}</div>` : ''}
        <div class="notif-text">${escHtml(n.body)}</div>
        <div class="notif-time">${n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
      </div>
      ${!n.read ? '<div class="unread-dot"></div>' : ''}
    </div>`).join('');
}

async function markNotifRead(id) {
  try { await supabaseMarkNotifRead(id); loadNotifications(); } catch(e) {}
}

// ─── SHELVES ─────────────────────────────────────────────────────
let SHELVES = JSON.parse(localStorage.getItem('kumsika_shelves') || 'null') || [
  { id:1, name:'Tech Wishlist', items:[1,4,10] },
  { id:2, name:'Fashion Picks', items:[3,5]   },
];
function saveShelves() { localStorage.setItem('kumsika_shelves', JSON.stringify(SHELVES)); }

function renderShelves() {
  const c = document.getElementById('shelves-list');
  if (!c) return;
  let html = SHELVES.map(shelf => {
    const items  = shelf.items.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
    const thumbs = items.slice(0, 3).map(p => `<div class="s-thumb">${p.emoji}</div>`).join('') || '<div class="s-thumb">📦</div>';
    return `<div class="shelf-card" onclick="openShelf(${shelf.id})">
      <div class="shelf-thumbs">${thumbs}</div>
      <div class="shelf-info"><div class="sn">${escHtml(shelf.name)}</div><div class="sc">${items.length} items</div><span class="badge badge-grey">🔒 PRIVATE</span></div>
    </div>`;
  }).join('');
  html += `<div class="add-shelf" onclick="createNewShelf()"><span style="font-size:22px;">＋</span><span>Create New Shelf</span></div>`;
  c.innerHTML = html;
}

function createNewShelf() {
  const name = prompt('Shelf name:');
  if (!name || !name.trim()) return;
  SHELVES.push({ id: Date.now(), name: name.trim(), items: [] });
  saveShelves(); renderShelves();
  showToast('✅ Shelf "' + name.trim() + '" created!', 'g');
}

function openShelf(id) {
  const s = SHELVES.find(x => x.id === id);
  if (!s) return;
  showToast('Opening "' + s.name + '"…');
}

// ─── SELLER CHECK ─────────────────────────────────────────────────
/**
 * Gate logic for the + FAB button:
 *  - Not signed in → go to login
 *  - Signed in (individual seller OR shop seller with active sub) → go to sell screen
 *  - Shop seller with inactive subscription → prompt to activate
 */
function checkSellerAndSell() {
  if (!currentUser) {
    showToast('Please sign in to post a listing', 'y');
    go('s-login', APP.screen);
    return;
  }
  // Individual sellers can always post — no subscription needed
  const isIndividual = currentUser.sellerType === 'person' || !currentUser.isSeller;
  if (isIndividual || currentUser.isAdmin) {
    setupSellScreen();
    go('s-sell', APP.screen);
    return;
  }
  // Shop sellers need an active subscription
  if (currentUser.shopStatus === 'active') {
    setupSellScreen();
    go('s-sell', APP.screen);
    return;
  }
  showToast('⚠️ Activate your shop subscription to post listings', 'y');
  openModal('pay-modal');
}

// ─── TUTORIAL ─────────────────────────────────────────────────────
const TUTS = [
  { icon:'🔍', title:'Discover Listings',    desc:'Browse thousands of products across all 28 districts of Malawi. Filter by district and sort by price.' },
  { icon:'❤️', title:'Save Your Favourites', desc:'Tap the heart icon to save items you like to your personal Shelves for later.' },
  { icon:'💬', title:'Chat with Sellers',    desc:'Use WhatsApp or in-app chat to negotiate prices and arrange pickup or delivery.' },
  { icon:'🏪', title:'Open Your Shop',       desc:'Become a seller for MK 5,000/month. Unlimited listings, verified badge, and analytics.' },
  { icon:'🇲🇼', title:'Made for Malawi',     desc:'Kumsika supports Chichewa, all 28 districts, TNM & Airtel Money payments, and works offline!' },
];

function renderTutorial() {
  const slide   = TUTS[tutStep];
  const wrap    = document.getElementById('tutorial-slide-wrap');
  const dots    = document.getElementById('tutorial-dots');
  const nextBtn = document.getElementById('tutorial-next');
  const skipBtn = document.getElementById('tutorial-skip');
  if (wrap)    wrap.innerHTML    = `<div class="tutorial-slide"><div class="tutorial-icon">${slide.icon}</div><div class="tutorial-title">${slide.title}</div><div class="tutorial-desc">${slide.desc}</div></div>`;
  if (dots)    dots.innerHTML    = TUTS.map((_, i) => `<div class="tutorial-dot ${i === tutStep ? 'on' : ''}"></div>`).join('');
  if (nextBtn) nextBtn.textContent = tutStep < TUTS.length - 1 ? 'Next →' : '🚀 Get Started';
  if (skipBtn) skipBtn.style.display = tutStep < TUTS.length - 1 ? 'block' : 'none';
}

function tutorialNext() {
  if (tutStep < TUTS.length - 1) { tutStep++; renderTutorial(); }
  else { tutStep = 0; back(); }
}

// ─── BUG REPORT ───────────────────────────────────────────────────
function selectBugType(type, btn) {
  APP.bugType = type;
  document.querySelectorAll('.bug-type-chip').forEach(c => c.classList.remove('selected'));
  btn.classList.add('selected');
}

async function submitBugReport() {
  const desc   = document.getElementById('bug-desc')?.value.trim();
  const device = document.getElementById('bug-device')?.value.trim();
  if (!desc) { showToast('Please describe the issue', 'r'); return; }
  const btn = document.querySelector('#s-report-bug .btn-g');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>'; }
  try {
    await supabaseSubmitBugReport({ type: APP.bugType, description: desc, device: device || navigator.userAgent, user_email: currentUser?.email || 'anonymous' });
  } catch {}
  if (btn) { btn.disabled = false; btn.textContent = t('submitReport'); }
  if (document.getElementById('bug-desc'))   document.getElementById('bug-desc').value   = '';
  if (document.getElementById('bug-device')) document.getElementById('bug-device').value = '';
  showToast('🐛 Bug report submitted! Thank you!', 'g');
  setTimeout(() => back(), 1000);
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────
// No mock users — real profiles loaded from Supabase
let _adminUsersCache = [];

function adminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
  ['overview','payments','shops','products'].forEach(p => {
    const el = document.getElementById(`admin-${p}-panel`);
    if (el) el.style.display = p === tab ? 'block' : 'none';
  });
  if (tab === 'payments') { try { loadAdminPanel(); } catch(e) {} }
  else if (tab === 'shops')    { try { renderAdminShops(); } catch(e) {} }
  else if (tab === 'products') { try { renderAdminProducts(); } catch(e) {} }
  else if (tab === 'users')    { try { renderAdminUsers(); } catch(e) {} }
  // Update overview stats
  if (tab === 'overview') {
    const shEl = document.getElementById('a-stat-shops');
    const prEl = document.getElementById('a-stat-products');
    const acEl = document.getElementById('a-stat-active');
    if (shEl) shEl.textContent = SHOPS.length;
    if (prEl) prEl.textContent = PRODUCTS.length;
    if (acEl) acEl.textContent = SHOPS.filter(s => s.status === 'active').length;
  }
}

// renderAdminShops() is defined in shop.js — do NOT re-define here (duplicate function error)

function renderAdminProducts() {
  const c = document.getElementById('admin-products-list');
  if (!c) return;
  c.innerHTML = PRODUCTS.map(p => `
    <div class="admin-item">
      <div class="admin-item-icon">${p.emoji}</div>
      <div class="admin-item-body">
        <div class="admin-item-name">${escHtml(p.name)}</div>
        <div class="admin-item-meta">MK ${p.price.toLocaleString()} · ${p.district} · ${p.views} views</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-sm btn-sm-r" onclick="adminAction('removeProduct',${p.id},'${escHtml(p.name)}')">Remove</button>
      </div>
    </div>`).join('');
}

async function renderAdminUsers() {
  const c = document.getElementById('admin-users-list');
  if (!c) return;
  c.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;"><div class="spinner" style="margin:0 auto 8px;"></div>Loading users…</div>';
  try {
    const db = getDB();
    if (db) {
      const { data, error } = await db.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      _adminUsersCache = data || [];
    }
  } catch(e) {
    console.warn('[renderAdminUsers]', e);
  }
  if (!_adminUsersCache.length) {
    c.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;">No users yet. Manage via Supabase dashboard.</div>';
    return;
  }
  c.innerHTML = _adminUsersCache.map(u => `
    <div class="admin-item">
      <div class="admin-item-icon">👤</div>
      <div class="admin-item-body">
        <div class="admin-item-name">${escHtml(u.full_name || u.email || 'User')}</div>
        <div class="admin-item-meta">${escHtml(u.email||'')} · ${escHtml(u.district||'')}${u.is_admin ? ' · 🔑 Admin' : ''}${u.is_seller ? ' · 🏪 Seller' : ''}</div>
      </div>
      <div class="admin-item-actions">
        <span class="badge ${u.is_verified ? 'badge-g' : 'badge-grey'}">${u.is_verified ? '✓ Verified' : 'Unverified'}</span>
        ${!u.is_admin ? `<button class="btn-sm btn-sm-r" onclick="adminAction('banUser','${u.id}','${escHtml(u.full_name||u.email||'User')}')">Ban</button>` : ''}
      </div>
    </div>`).join('');
}

function adminAction(action, targetId, targetName) {
  APP.pendingAdminAction = { action, targetId, targetName };
  const msgs = {
    suspendShop  : ['Suspend Shop',   `Suspend "${targetName}"?`],
    activateShop : ['Activate Shop',  `Activate "${targetName}"?`],
    deleteShop   : ['Delete Shop',    `Permanently delete "${targetName}"? Cannot be undone.`],
    removeProduct: ['Remove Product', `Remove "${targetName}" from marketplace?`],
    banUser      : ['Ban User',       `Ban "${targetName}"? They will lose access.`],
    deleteProduct: ['Delete Listing', `Delete this listing permanently?`],
  };
  const [title, desc] = msgs[action] || ['Confirm', 'Are you sure?'];
  document.getElementById('admin-confirm-title').textContent = title;
  document.getElementById('admin-confirm-desc').textContent  = desc;
  openModal('admin-confirm');
}

async function doAdminAction() {
  closeModal('admin-confirm');
  const a = APP.pendingAdminAction;
  if (!a) return;
  APP.pendingAdminAction = null;

  try {
    if (a.action === 'suspendShop') {
      await supabaseAdminUpdateShopStatus(a.targetId, 'suspended');
      const s = SHOPS.find(x => x.id === a.targetId);
      if (s) s.status = 'suspended';
      showToast('🚫 Shop suspended', 'y');
      renderAdminShops();

    } else if (a.action === 'activateShop') {
      await supabaseAdminUpdateShopStatus(a.targetId, 'active');
      const s = SHOPS.find(x => x.id === a.targetId);
      if (s) s.status = 'active';
      showToast('✅ Shop activated', 'g');
      renderAdminShops();

    } else if (a.action === 'deleteShop') {
      const db = getDB();
      if (db) await db.from('shops').delete().eq('id', a.targetId);
      const i = SHOPS.findIndex(x => x.id === a.targetId);
      if (i > -1) SHOPS.splice(i, 1);
      showToast('🗑️ Shop deleted', 'r');
      renderAdminShops();

    } else if (a.action === 'removeProduct') {
      const db = getDB();
      if (db) await db.from('products').update({ is_hidden: true }).eq('id', a.targetId);
      const i = PRODUCTS.findIndex(x => x.id === a.targetId);
      if (i > -1) PRODUCTS.splice(i, 1);
      showToast('🗑️ Product removed', 'r');
      renderAdminProducts();
      refreshProducts();

    } else if (a.action === 'banUser') {
      const db = getDB();
      if (db) await db.from('profiles').update({ is_banned: true }).eq('id', a.targetId);
      showToast('🚫 User banned', 'r');
      renderAdminUsers();
    }
  } catch(e) {
    showToast('❌ Action failed: ' + (e.message || 'Try again'), 'r');
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function shakeEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = 'shake .4s ease'; });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function clearCache() {
  localStorage.removeItem('kumsika_search_history');
  caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  showToast('✅ Cache cleared!', 'g');
}

// ─── SERVICE WORKER REGISTRATION ─────────────────────────────────
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('[Kumsika] SW registered:', reg.scope))
      .catch(err => console.warn('[Kumsika] SW failed:', err));
  }
}
