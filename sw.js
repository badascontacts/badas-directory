// ================================================================
// BADAS DIRECTORY - Service Worker v2.5
// Strategy: Network-first for JS/CSS (always fresh),
//           Cache-first for fonts only (offline support)
// ================================================================

const CACHE_NAME = 'badas-dir-v2.6';  // ← bump this when deploying updates

// Only cache fonts (static). JS/CSS/HTML always fetched fresh from network.
const FONT_CACHE = 'badas-fonts-v1';

// Install: activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: delete ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── Google Sheets API: NETWORK ONLY, never cache ──────────────
  if (url.hostname.includes('docs.google.com') ||
      url.hostname.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // ── Google Fonts: cache-first (static, changes rarely) ────────
  if (url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(FONT_CACHE).then(c => c.put(event.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // ── App shell (JS, CSS, HTML): NETWORK-FIRST ──────────────────
  // Always try network first so updates are immediate.
  // Fall back to cache only when offline.
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then(res => {
        // Cache successful responses for offline fallback
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // For navigation, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
