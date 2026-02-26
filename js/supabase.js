/**
 * KUMSIKA — SUPABASE MODULE v11
 * O-Techy Company 2026
 *
 * SECURITY: No admin credentials in this file.
 * Admin role is determined by `is_admin` column in profiles table.
 * To grant admin: UPDATE profiles SET is_admin = true WHERE email = 'you@email.com';
 */

const SUPABASE_URL      = 'https://qnwfqhdwuppccpjhyltg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFud2ZxaGR3dXBwY2Nwamh5bHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODA5MjUsImV4cCI6MjA4NzU1NjkyNX0.ZTUdzI6iweyNx2az8E-A6733cjNEwIJ8kvIxtei-9uw';

// ─── CLIENT ──────────────────────────────────────────────────────
let _sb = null;
function getDB() { return _sb; }

function initSupabase() {
  const SDK = window._supabaseSDK || null;
  if (!SDK) { console.warn('[Kumsika] Supabase SDK not loaded — offline mode'); return null; }
  _sb = SDK.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  _sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        const u = await fetchOrCreateProfile(session.user);
        currentUser = u;
        saveSession(currentUser);
        try { updateProfileUI(); } catch(e) {}
        try { loadHomeData(); } catch(e) {}
      } catch(e) { console.error('[AuthState]', e); }
    } else if (event === 'SIGNED_OUT') {
      currentUser = null; clearSession();
    }
  });
  return _sb;
}

// ─── PROFILE ─────────────────────────────────────────────────────
function _mapProfile(p, authUser) {
  return {
    id         : p.id,
    email      : p.email || authUser?.email || '',
    name       : p.full_name || authUser?.email?.split('@')[0] || 'User',
    phone      : p.phone || '',
    district   : p.district || 'Lilongwe',
    avatar     : p.avatar_url || null,
    isSeller   : p.is_seller || false,
    sellerType : p.seller_type || 'person',  // 'person' | 'shop'
    isAdmin    : p.is_admin === true,         // DB only — never set from frontend
    verified   : p.is_verified || !!(authUser?.email_confirmed_at),
    shopStatus : p.shop_status || 'none',
    shopExpiry : p.shop_expiry || '',
    bio        : p.bio || '',
    badge      : p.badge || null,
  };
}

async function fetchOrCreateProfile(authUser) {
  const db = getDB();
  if (!db) throw new Error('No DB');
  const { data: existing } = await db.from('profiles').select('*').eq('id', authUser.id).single();
  if (existing) return _mapProfile(existing, authUser);

  const profileData = {
    id          : authUser.id,
    email       : authUser.email,
    full_name   : authUser.user_metadata?.full_name || authUser.email.split('@')[0],
    phone       : authUser.user_metadata?.phone || '',
    district    : authUser.user_metadata?.district || 'Lilongwe',
    is_seller   : authUser.user_metadata?.is_seller || false,
    seller_type : authUser.user_metadata?.seller_type || 'person',
    is_admin    : false,
    created_at  : new Date().toISOString(),
  };
  const { data: created } = await db.from('profiles').upsert(profileData).select().single();
  return _mapProfile(created || profileData, authUser);
}

// ─── AUTH ─────────────────────────────────────────────────────────
async function supabaseLogin(email, password) {
  const db = getDB();
  if (!db) throw new Error('Not connected');
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return await fetchOrCreateProfile(data.user);
}

async function supabaseSignup(email, password, meta = {}) {
  const db = getDB();
  if (!db) throw new Error('Not connected');
  const { data, error } = await db.auth.signUp({ email, password, options: { data: meta } });
  if (error) throw error;
  if (!data.user) {
    return { id: null, email, name: meta.full_name || email.split('@')[0],
      phone: meta.phone || '', district: meta.district || 'Lilongwe',
      avatar: null, isSeller: meta.is_seller || false, sellerType: meta.seller_type || 'person',
      isAdmin: false, verified: false, shopStatus: 'none', shopExpiry: '',
      needsConfirmation: true };
  }
  await db.from('profiles').upsert({
    id: data.user.id, email, full_name: meta.full_name || '',
    phone: meta.phone || '', district: meta.district || 'Lilongwe',
    is_seller: meta.is_seller || false, seller_type: meta.seller_type || 'person',
    is_admin: false, created_at: new Date().toISOString(),
  });
  return await fetchOrCreateProfile(data.user);
}

async function supabaseLogout() {
  const db = getDB(); if (!db) return;
  await db.auth.signOut();
}

async function supabaseUpdateProfile(userId, updates) {
  const db = getDB(); if (!db) return;
  const safe = { ...updates };
  delete safe.is_admin; // NEVER allow frontend to set admin
  await db.from('profiles').upsert({ id: userId, ...safe, updated_at: new Date().toISOString() });
  if (updates.avatar_url || updates.full_name) await db.auth.updateUser({ data: updates });
}

// ─── PRODUCTS ────────────────────────────────────────────────────
async function supabaseFetchProducts(opts = {}) {
  const db = getDB(); if (!db) return [];
  let q = db.from('products').select(`
    *, profiles(full_name, avatar_url, is_verified, seller_type),
    shops(name, subscription_status)
  `).eq('is_hidden', false).order('created_at', { ascending: false });
  if (opts.category && opts.category !== 'All') q = q.eq('category', opts.category);
  if (opts.district)  q = q.in('district', Array.isArray(opts.district) ? opts.district : [opts.district]);
  if (opts.search)    q = q.or(`name.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
  if (opts.limit)     q = q.limit(opts.limit);
  if (opts.seller_id) q = q.eq('seller_id', opts.seller_id);
  const { data, error } = await q;
  if (error) { console.error('[Products]', error); return []; }
  return (data || []).map(normalizeProduct);
}

function normalizeProduct(p) {
  return {
    id: p.id, name: p.name, price: parseFloat(p.price),
    district: p.district, loc: p.district, category: p.category,
    description: p.description || '', desc: p.description || '',
    image_url: p.image_url || null, extra_images: p.extra_images || [],
    emoji: EMOJI_MAP[p.category] || '📦',
    verified: p.profiles?.is_verified || false,
    negotiable: p.negotiable || false, delivery: p.delivery || false,
    views: p.views || 0, seller_id: p.seller_id,
    shop_id: p.shop_id, shopId: p.shop_id,
    sellerName: p.profiles?.full_name || 'Seller',
    sellerType: p.profiles?.seller_type || 'person',
    shopName: p.shops?.name || '', created_at: p.created_at, tag: null,
  };
}

async function supabasePostProduct(product) {
  const db = getDB(); if (!db) throw new Error('Not connected');
  const { data, error } = await db.from('products').insert({
    seller_id: product.seller_id, shop_id: product.shop_id || null,
    name: product.name, description: product.description,
    price: product.price, category: product.category, district: product.district,
    image_url: product.image_url || null, extra_images: product.extra_images || [],
    negotiable: product.negotiable || false, delivery: product.delivery || false,
    is_hidden: false, created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return normalizeProduct(data);
}

async function supabaseDeleteProduct(productId, sellerId) {
  const db = getDB(); if (!db) return;
  const { error } = await db.from('products').delete().eq('id', productId).eq('seller_id', sellerId);
  if (error) throw error;
}

async function supabaseIncrementViews(productId) {
  const db = getDB(); if (!db) return;
  try { await db.rpc('increment_views', { product_id: productId }); } catch(e) {}
}

// ─── SHOPS ───────────────────────────────────────────────────────
async function supabaseFetchShops(opts = {}) {
  const db = getDB(); if (!db) return [];
  let q = db.from('shops').select(`*, profiles(full_name)`).order('created_at', { ascending: false });
  if (opts.district) q = q.eq('district', opts.district);
  if (opts.search)   q = q.or(`name.ilike.%${opts.search}%,district.ilike.%${opts.search}%`);
  const { data, error } = await q;
  if (error) { console.error('[Shops]', error); return []; }
  return (data || []).map(s => ({
    id: s.id, name: s.name, description: s.description || '',
    district: s.district, category: s.category || 'General',
    logo_url: s.logo_url || null, cover_url: s.cover_url || null,
    owner_id: s.owner_id, owner: s.profiles?.full_name || 'Seller',
    status: s.subscription_status || 'pending',
    shopStatus: s.subscription_status,
    subscription_plan: s.subscription_plan,
    subscription_expiry: s.subscription_expiry,
    whatsapp: s.whatsapp_number || '', wa: s.whatsapp_number || '',
    views: s.total_views || 0, emoji: '🏪', rating: 4.5, products: 0, created_at: s.created_at,
  }));
}

async function supabaseFetchMyShop(ownerId) {
  const db = getDB(); if (!db) return null;
  const { data } = await db.from('shops').select('*').eq('owner_id', ownerId).single();
  return data || null;
}

async function supabaseCreateShop(shop) {
  const db = getDB(); if (!db) throw new Error('Not connected');
  const { data, error } = await db.from('shops').insert({
    owner_id: shop.owner_id, name: shop.name, description: shop.description || '',
    district: shop.district, category: shop.category,
    whatsapp_number: shop.whatsapp || '', logo_url: shop.logo_url || null,
    cover_url: shop.cover_url || null, subscription_status: 'pending',
    created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  // Mark user as shop seller
  await db.from('profiles').update({ is_seller: true, seller_type: 'shop' }).eq('id', shop.owner_id);
  return data;
}

// ─── MESSAGES ────────────────────────────────────────────────────
async function supabaseFetchConversations(userId) {
  const db = getDB(); if (!db) return [];
  const { data } = await db.from('conversations')
    .select(`*, buyer:profiles!buyer_id(full_name,avatar_url), seller:profiles!seller_id(full_name,avatar_url)`)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false });
  return data || [];
}

async function supabaseFetchMessages(convId) {
  const db = getDB(); if (!db) return [];
  const { data } = await db.from('messages')
    .select('*, sender:profiles(full_name,avatar_url)')
    .eq('conversation_id', convId).order('sent_at', { ascending: true });
  return data || [];
}

async function supabaseSendMessage(convId, senderId, content) {
  const db = getDB(); if (!db) throw new Error('Not connected');
  const { error } = await db.from('messages').insert({
    conversation_id: convId, sender_id: senderId,
    content, sent_at: new Date().toISOString(),
  });
  if (error) throw error;
  await db.from('conversations').update({ last_message: content, updated_at: new Date().toISOString() }).eq('id', convId);
}

async function supabaseStartConversation(buyerId, sellerId, shopId, productId) {
  const db = getDB(); if (!db) throw new Error('Not connected');
  const { data: existing } = await db.from('conversations').select('id')
    .eq('buyer_id', buyerId).eq('seller_id', sellerId)
    .eq('product_id', productId || null).single();
  if (existing) return existing.id;
  const { data, error } = await db.from('conversations').insert({
    buyer_id: buyerId, seller_id: sellerId,
    shop_id: shopId || null, product_id: productId || null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data.id;
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────
async function supabaseFetchNotifications(userId) {
  const db = getDB(); if (!db) return [];
  const { data } = await db.from('notifications').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
  return data || [];
}

async function supabaseMarkNotifRead(notifId) {
  const db = getDB(); if (!db) return;
  await db.from('notifications').update({ read: true }).eq('id', notifId);
}

async function supabaseCreateNotification(userId, type, title, body, data = {}) {
  const db = getDB(); if (!db) return;
  await db.from('notifications').insert({ user_id: userId, type, title, body, data, created_at: new Date().toISOString() });
}

// ─── PAYMENT PROOFS ──────────────────────────────────────────────
async function supabaseSubmitPaymentProof(proof) {
  const db = getDB(); if (!db) return;
  const { error } = await db.from('payment_requests').insert({
    user_id: proof.user_id, user_email: proof.user_email, user_name: proof.user_name,
    sender_number: proof.sender_number, txn_ref: proof.txn_ref || null,
    method: proof.method, plan: proof.plan, amount: proof.amount,
    proof_url: proof.proof_url, status: 'pending', submitted_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ─── ADMIN ───────────────────────────────────────────────────────
async function supabaseAdminFetchPaymentRequests() {
  const db = getDB(); if (!db) return [];
  const { data } = await db.from('payment_requests').select('*').order('submitted_at', { ascending: false });
  return data || [];
}

async function supabaseAdminApprovePayment(requestId, userId, shopId, plan) {
  const db = getDB(); if (!db) return;
  const months = plan === 'year' ? 12 : 1;
  const expiry = new Date(); expiry.setMonth(expiry.getMonth() + months);
  const expiryStr = expiry.toISOString().split('T')[0];
  await db.from('payment_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', requestId);
  if (shopId) {
    await db.from('shops').update({ subscription_status: 'active', subscription_plan: plan, subscription_expiry: expiryStr }).eq('id', shopId);
  }
  await db.from('profiles').update({ shop_status: 'active', shop_expiry: expiryStr }).eq('id', userId);
  await supabaseCreateNotification(userId, 'system', '✅ Shop Activated!',
    `Your shop subscription is active until ${expiryStr}. Start posting products!`, {});
  return expiryStr;
}

async function supabaseAdminUpdateShopStatus(shopId, status) {
  const db = getDB(); if (!db) return;
  await db.from('shops').update({ subscription_status: status }).eq('id', shopId);
}

async function supabaseAdminGrantBadge(userId, badge) {
  const db = getDB(); if (!db) return;
  await db.from('profiles').update({ badge }).eq('id', userId);
  await supabaseCreateNotification(userId, 'system', '🏅 Badge Awarded!',
    `You have been awarded the "${badge}" badge!`, {});
}

// ─── BUG REPORTS ─────────────────────────────────────────────────
async function supabaseSubmitBugReport(report) {
  const db = getDB(); if (!db) return;
  await db.from('bug_reports').insert({
    type: report.type, description: report.description,
    device: report.device, user_email: report.user_email || 'anonymous',
    timestamp: new Date().toISOString(),
  });
}

// ─── REALTIME ────────────────────────────────────────────────────
function subscribeToMessages(convId, callback) {
  const db = getDB(); if (!db) return null;
  return db.channel(`conv-${convId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` }, callback)
    .subscribe();
}

function subscribeToNotifications(userId, callback) {
  const db = getDB(); if (!db) return null;
  return db.channel(`notif-${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, callback)
    .subscribe();
}
