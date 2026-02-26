/**
 * KUMSIKA SERVICE WORKER
 * Malawi's #1 Marketplace — O-Techy Company 2026
 * Offline-first PWA with cache-first strategy
 */

const CACHE_NAME     = 'kumsika-v7';
const OFFLINE_URL    = '/offline.html';

const CORE_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/ui.js',
  '/js/products.js',
  '/js/shop.js',
  '/js/fixes.js',
  '/js/cloudinary.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&family=Syne:wght@700;800&display=swap'
];

// ── INSTALL ────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_FILES).catch(() => {
        // Individual file caching on failure
        return Promise.allSettled(CORE_FILES.map(f => cache.add(f).catch(() => {})));
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase / Cloudinary API calls — always network
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('cloudinary.com') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/')
  ) {
    event.respondWith(fetch(request).catch(() => Response.error()));
    return;
  }

  // Cache-first for fonts & static assets
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return resp;
        }).catch(() => caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // Network-first for HTML navigation
  event.respondWith(
    fetch(request).then(resp => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
      }
      return resp;
    }).catch(() =>
      caches.match(request).then(cached => cached || caches.match(OFFLINE_URL))
    )
  );
});

// ── BACKGROUND SYNC ──────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-listings') {
    event.waitUntil(syncPendingListings());
  }
});

async function syncPendingListings() {
  // When back online, push queued listing data to Supabase
  // Placeholder — implement once Supabase is connected
  console.log('[SW] Syncing pending listings…');
}

// ── PUSH NOTIFICATIONS ──────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kumsika 🇲🇼', {
      body:    data.body    || 'New activity on Kumsika Marketplace',
      icon:    data.icon    || '/assets/icons/icon-192.png',
      badge:   data.badge   || '/assets/icons/icon-72.png',
      tag:     data.tag     || 'kumsika-notif',
      renotify: true,
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url || '/');
    })
  );
});
