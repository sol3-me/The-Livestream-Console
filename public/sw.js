/// <reference lib="webworker" />

// Incrementing this version will trigger cache invalidation on the next visit.
const CACHE_NAME = 'tlc-v1';

// App shell assets to pre-cache on install.
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // Activate immediately instead of waiting for existing clients to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Remove old caches when a new version of the service worker activates.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests; let mutations (POST, PUT, DELETE) pass through.
  if (request.method !== 'GET') return;

  // For API and auth routes, always go to the network (never serve stale data).
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Network-first strategy: try network, fall back to cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful same-origin responses for future offline use.
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
