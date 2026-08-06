// ================================================================
// BADAS DIRECTORY - Service Worker v2.8
// ================================================================

const CACHE_NAME = 'badas-dir-v2.8';
const FONT_CACHE = 'badas-fonts-v1';

// External image/API domains -- never cache, never intercept
const SKIP_HOSTS = [
  'logo.clearbit.com',
  'www.gravatar.com',
  'ui-avatars.com',
  'wsrv.nl',
  'drive.google.com',
  'lh3.googleusercontent.com',
  'fonts.gstatic.com',
  'fonts.googleapis.com',
];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Skip non-http schemes (chrome-extension, data, blob, etc.)
  if (!url.startsWith('http')) return;

  let host = '';
  try { host = new URL(url).hostname; } catch { return; }

  // Skip Google Sheets / APIs -- network only, never cache
  if (host.includes('docs.google.com') || host.includes('googleapis.com')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // Skip external image/avatar CDNs -- let browser handle directly
  if (SKIP_HOSTS.some(h => host.includes(h))) return;

  // Google Fonts -- cache first
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

  // App shell (JS, CSS, HTML, icons) -- network first, cache fallback
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
