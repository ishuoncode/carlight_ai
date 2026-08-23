/* CarLight service worker — PWA offline support */
const VERSION = 'carlight-v1';
const STATIC_CACHE = VERSION + '-static';
const PAGES_CACHE = VERSION + '-pages';
const OFFLINE_URL = '/offline.html';

// Core assets cached at install
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    /\.(css|js|png|jpg|jpeg|svg|webp|avif|ico|woff2?|ttf|eot)$/i.test(url.pathname)
  );
}

// ✅ Works for both dev and prod:
// - Prod responses are cached normally.
// - Dev responses come with `Cache-Control: no-store` — we respect that, so
//   hot-reload / fresh code is never pinned by the cache during development.
//   (Offline fallback still applies via previously cached pages/offline.html.)
function isCacheable(response) {
  if (!response || !response.ok) return false;
  const cacheControl = response.headers.get('cache-control') || '';
  return !cacheControl.includes('no-store');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never cache API responses — billing/customer data must always be fresh
  if (url.pathname.startsWith('/api/')) return;

  // Page navigations: network first, fall back to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(response)) {
            const copy = response.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              (cached) =>
                cached ||
                caches.match(OFFLINE_URL).then((page) => page || Response.error())
            )
        )
    );
    return;
  }

  // Static assets: cache first, refresh in background (stale-while-revalidate)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (isCacheable(response)) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
