/**
 * KUMSIKA — APP BOOT v8
 * O-Techy Company 2026
 */

// ─── CURRENT USER ────────────────────────────────────────────────
let currentUser = loadSession() || null;

// ─── BOOT ────────────────────────────────────────────────────────
let _splashDismissed = false;

function _dismissSplash() {
  if (_splashDismissed) return;
  _splashDismissed = true;
  const hasSesh = !!currentUser;
  const splash  = document.getElementById('s-splash');
  if (splash) { splash.style.transition = 'opacity 0.45s ease'; splash.style.opacity = '0'; }
  setTimeout(() => {
    const target = hasSesh ? 's-home' : 's-login';
    go(target, 's-splash');
    if (hasSesh) navTo('s-home', 'ni-home');
  }, 450);
}

window.addEventListener('error', (e) => {
  console.error('[Kumsika] Error:', e.message, e.lineno);
  setTimeout(_dismissSplash, 400);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Kumsika] Rejection:', e.reason);
  setTimeout(_dismissSplash, 400);
});

async function init() {
  // Theme
  const theme = localStorage.getItem('kumsika_theme') || 'malawi';
  document.documentElement.setAttribute('data-theme', theme);

  // PWA
  try { registerSW(); }    catch(e) {}
  try { setupOffline(); }  catch(e) {}
  try { setupPWA(); }      catch(e) {}

  // Wait for Supabase SDK to load (max 4s), then init
  try {
    await Promise.race([
      new Promise(r => {
        if (window._supabaseReady) { r(); return; }
        const t = setInterval(() => { if (window._supabaseReady) { clearInterval(t); r(); } }, 50);
      }),
      new Promise(r => setTimeout(r, 4000))
    ]);
    initSupabase();
  } catch(e) { console.warn('[Kumsika] Supabase skipped:', e); }

  // UI setup
  try { applyTranslations(); } catch(e) {}
  try { renderLangList(); }    catch(e) {}
  try { renderTutorial(); }    catch(e) {}
  try { renderShelves(); }     catch(e) {}
  try { updateProfileUI(); }   catch(e) {}
  try { initPayScreen(); }     catch(e) {}
  try { refreshPhotoSlots(); } catch(e) {}
  try { renderDistrictFilter(); } catch(e) {}

  // Render empty states initially
  try { renderFeatured([]); }  catch(e) {}
  try { renderGrid([]); }      catch(e) {}
  try { renderShopsList([]); } catch(e) {}

  // Dismiss splash after 2.8s
  setTimeout(_dismissSplash, 2800);

  // Load real data after splash dismisses
  setTimeout(async () => {
    if (currentUser) {
      try { await loadHomeData(); } catch(e) {}
      try { loadNotifications(); } catch(e) {}
      if (currentUser.isAdmin) {
        try { loadAdminPanel(); } catch(e) {}
      }
    } else {
      // Even guests see real products
      try { await loadHomeData(); } catch(e) {}
    }
  }, 3400);
}

document.addEventListener('DOMContentLoaded', init);
setTimeout(_dismissSplash, 8000); // Absolute fallback
