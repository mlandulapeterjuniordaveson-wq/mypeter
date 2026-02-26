/**
 * KUMSIKA — AUTH MODULE v8
 * O-Techy Company 2026
 */

// ─── SESSION ─────────────────────────────────────────────────────
function loadSession()  { try { return JSON.parse(localStorage.getItem('kumsika_session')); } catch { return null; } }
function saveSession(u) { localStorage.setItem('kumsika_session', JSON.stringify(u)); }
function clearSession() { localStorage.removeItem('kumsika_session'); }

// ─── LOGIN ───────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;

  document.getElementById('e-err').classList.remove('show');
  document.getElementById('p-err').classList.remove('show');
  let ok = true;
  if (!email.includes('@') || !email.includes('.')) {
    document.getElementById('l-email').classList.add('err');
    document.getElementById('e-err').classList.add('show');
    ok = false;
  }
  if (pass.length < 6) {
    document.getElementById('l-pass').classList.add('err');
    document.getElementById('p-err').classList.add('show');
    ok = false;
  }
  if (!ok) { shakeEl('login-btn'); return; }

  const btn = document.getElementById('login-btn');
  const txt = document.getElementById('login-btn-text');
  btn.disabled = true;
  txt.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';

  try {
    const db = getDB();
    if (db) {
      currentUser = await supabaseLogin(email, pass);
    } else {
      await delay(900);
      currentUser = {
        id: 'guest_' + Date.now(), email,
        name: email.split('@')[0], phone: '', district: 'Lilongwe',
        avatar: null, isSeller: false, sellerType: 'person',
        isAdmin: false, verified: false, shopStatus: 'none', shopExpiry: '',
      };
    }
    saveSession(currentUser);
    updateProfileUI();
    goHome(false);
    setTimeout(() => loadHomeData(), 300);
  } catch (err) {
    showToast('❌ ' + (err.message || 'Login failed. Check your email & password.'), 'r');
  } finally {
    btn.disabled = false;
    txt.textContent = t('signIn');
  }
}

// ─── GOOGLE LOGIN ────────────────────────────────────────────────
async function doGoogleLogin() {
  const db = getDB();
  if (!db) { showToast('Not connected', 'r'); return; }
  try {
    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    });
    if (error) throw error;
  } catch (err) {
    showToast('❌ Google login failed: ' + err.message, 'r');
  }
}

// ─── FACEBOOK LOGIN ──────────────────────────────────────────────
async function doFacebookLogin() {
  const db = getDB();
  if (!db) { showToast('Not connected', 'r'); return; }
  try {
    const { error } = await db.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.href }
    });
    if (error) throw error;
  } catch (err) {
    showToast('❌ Facebook login failed: ' + err.message, 'r');
  }
}

// ─── SIGNUP ──────────────────────────────────────────────────────
async function doSignup() {
  const name     = document.getElementById('su-name')?.value.trim() || '';
  const email    = document.getElementById('su-email')?.value.trim() || '';
  const phone    = document.getElementById('su-phone')?.value.trim() || '';
  const pass     = document.getElementById('su-pass')?.value || '';
  const distEl   = document.getElementById('su-district');
  const district = distEl?.value || 'Lilongwe';
  const isSeller = document.getElementById('su-seller-toggle')?.classList.contains('on') || false;

  let errs = 0;
  const check = (inputId, errId, fn) => {
    const el = document.getElementById(inputId);
    const errEl = document.getElementById(errId);
    if (!el || !errEl) return;
    const ok = fn(el.value);
    el.classList.toggle('err', !ok);
    errEl.classList.toggle('show', !ok);
    if (!ok) errs++;
  };
  check('su-name',  'su-name-err',  v => v.trim().length >= 2);
  check('su-email', 'su-email-err', v => v.includes('@') && v.includes('.'));
  check('su-phone', 'su-phone-err', v => v.trim().length >= 9);
  check('su-pass',  'su-pass-err',  v => v.length >= 6);
  if (errs) { showToast('Please fix the errors above', 'r'); return; }

  const btn = document.getElementById('signup-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';

  try {
    const db = getDB();
    if (db) {
      currentUser = await supabaseSignup(email, pass, {
        full_name   : name,
        phone, district,
        is_seller   : isSeller,
        seller_type : isSeller ? 'shop' : 'person',
        shop_status : isSeller ? 'unpaid' : 'none',
      });
      if (currentUser.needsConfirmation) {
        showToast('📧 Check your email to confirm your account, then sign in.', 'g');
        btn.disabled = false;
        btn.innerHTML = `<span>${t('createAccount')}</span>`;
        return;
      }
    } else {
      await delay(1200);
      currentUser = {
        id: 'local_' + Date.now(), email, name, phone, district,
        avatar: null, isSeller, isAdmin: false,
        verified: false, shopStatus: isSeller ? 'unpaid' : 'none', shopExpiry: '',
      };
    }
    if (currentUser?.needsConfirmation || currentUser?.pending_confirmation) {
      // Email confirmation required — don't save session, show message
      showToast('📧 Check your email to confirm your account!', 'g');
      setTimeout(() => go('s-login', APP.screen), 1200);
    } else {
      saveSession(currentUser);
      updateProfileUI();
      showToast('🎉 Welcome to Kumsika! 🇲🇼', 'g');
      setTimeout(() => goHome(false), 700);
      setTimeout(() => loadHomeData(), 1000);
    }
  } catch (err) {
    showToast('❌ ' + (err.message || 'Signup failed'), 'r');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>${t('createAccount')}</span>`;
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────────
async function doLogout() {
  closeModal('logout-confirm');
  try { await supabaseLogout(); } catch {}
  clearSession();
  currentUser = null;
  // Reset data
  PRODUCTS.length = 0;
  SHOPS.length = 0;
  showToast('👋 Signed out', 'r');
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    APP.screen = 's-login'; APP.prev = null;
    document.getElementById('s-login')?.classList.add('active');
    const em = document.getElementById('l-email');
    const pw = document.getElementById('l-pass');
    if (em) em.value = '';
    if (pw) pw.value = '';
  }, 800);
}

// ─── PASSWORD ────────────────────────────────────────────────────
async function changePassword() {
  const newPass = document.getElementById('new-pass')?.value || '';
  if (newPass.length < 6) { showToast('New password must be 6+ characters', 'r'); return; }
  try {
    const db = getDB();
    if (db) {
      const { error } = await db.auth.updateUser({ password: newPass });
      if (error) throw error;
    }
    showToast('✅ Password updated!', 'g');
    const f = document.getElementById('change-pw-form');
    if (f) f.style.display = 'none';
    const op = document.getElementById('old-pass');
    const np = document.getElementById('new-pass');
    if (op) op.value = '';
    if (np) np.value = '';
  } catch (err) {
    showToast('❌ ' + (err.message || 'Failed'), 'r');
  }
}

function showChangePassword() {
  const f = document.getElementById('change-pw-form');
  if (f) f.style.display = f.style.display === 'none' ? 'flex' : 'none';
}

// ─── VALIDATION ──────────────────────────────────────────────────
function validateSignupField(inputId, errId, validator) {
  const el    = document.getElementById(inputId);
  const errEl = document.getElementById(errId);
  if (!el || !errEl) return;
  const val   = el.value;
  const valid = !val.trim() || validator(val);
  el.classList.toggle('err', !valid && val.trim().length > 0);
  el.classList.toggle('ok',   valid && val.trim().length > 0);
  errEl.classList.toggle('show', !valid && val.trim().length > 0);
}

function checkPasswordStrength(val) {
  const score = [val.length>=6, val.length>=10, /[A-Z]/.test(val), /[0-9]/.test(val), /[^A-Za-z0-9]/.test(val)].filter(Boolean).length;
  const levels = [
    {p:'20%',c:'#E60000',t:'Very weak'},{p:'40%',c:'#F97316',t:'Weak'},
    {p:'60%',c:'#F5A623',t:'Fair'},{p:'80%',c:'#84CC16',t:'Good'},{p:'100%',c:'#00cc00',t:'Strong 💪'},
  ];
  const l = levels[Math.min(score,4)];
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (fill)  { fill.style.width = val.length > 0 ? l.p : '0'; fill.style.background = l.c; }
  if (label) { label.textContent = val.length > 0 ? l.t : ''; label.style.color = l.c; }
  document.getElementById('su-pass')?.classList.toggle('err', val.length > 0 && val.length < 6);
  document.getElementById('su-pass')?.classList.toggle('ok',  val.length >= 6);
  document.getElementById('su-pass-err')?.classList.toggle('show', val.length > 0 && val.length < 6);
}

function validateEmailField() {
  const v  = document.getElementById('l-email')?.value || '';
  const ok = v.includes('@') && v.includes('.');
  document.getElementById('l-email')?.classList.toggle('ok',  ok && v.length > 0);
  document.getElementById('l-email')?.classList.toggle('err', !ok && v.length > 3);
  document.getElementById('e-err')?.classList.toggle('show',  !ok && v.length > 3);
}

function validatePassField() {
  const v = document.getElementById('l-pass')?.value || '';
  document.getElementById('l-pass')?.classList.toggle('ok',  v.length >= 6);
  document.getElementById('l-pass')?.classList.toggle('err', v.length > 0 && v.length < 6);
  document.getElementById('p-err')?.classList.toggle('show', v.length > 0 && v.length < 6);
}

function togglePw(id, eye) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  eye.textContent = inp.type === 'password' ? '👁️' : '🙈';
}
