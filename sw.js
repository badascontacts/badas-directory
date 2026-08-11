// ================================================================
// BADAS DIRECTORY - Service Worker v3.4 (Full Offline Support)
// ================================================================

const CACHE_NAME  = 'badas-dir-v3.4';
const FONT_CACHE  = 'badas-fonts-v1';
const IMAGE_CACHE = 'badas-images-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/data.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const IMAGE_HOSTS = [
  'logo.clearbit.com',
  'www.gravatar.com',
  'ui-avatars.com',
  'wsrv.nl',
  'drive.google.com',
  'lh3.googleusercontent.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== FONT_CACHE && k !== IMAGE_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Skip non-http schemes
  if (!url.startsWith('http')) return;

  let host = '';
  try { host = new URL(url).hostname; } catch { return; }

  // 1. Google Sheets / APIs -- Network Only! If offline, return 503 so app.js catches it
  if (host.includes('docs.google.com') && !url.includes('/uc?')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => new Response('', { status: 503 }))
    );
    return;
  }
  if (host.includes('googleapis.com')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // 2. Images (Drive, Avatars, etc.) -- Stale-While-Revalidate
  if (IMAGE_HOSTS.some(h => host.includes(h))) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req, { mode: 'no-cors' }).then(res => {
          if (res && (res.status === 200 || res.status === 0)) {
            caches.open(IMAGE_CACHE).then(c => c.put(req, res.clone()));
          }
          return res;
        }).catch(() => {});
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Google Fonts -- Cache First
  if (host.includes('fonts.gstatic.com') || host.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && res.status === 200) {
            caches.open(FONT_CACHE).then(c => c.put(req, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // 4. App Shell (JS, CSS, HTML) -- Network First, fallback to cache
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('./index.html');
        })
      )
  );
});