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
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests; let mutations (POST, PUT, DELETE) pass through.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigationRequest =
    request.mode === 'navigate' || request.destination === 'document';
  const isRuntimeCacheableAsset =
    isSameOrigin &&
    (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'));

  // Never cache API/auth routes or navigations/documents, which may contain
  // authenticated or user-specific HTML/RSC content.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    isNavigationRequest
  ) {
    return;
  }

  // Only apply runtime caching to known static assets.
  if (!isRuntimeCacheableAsset) return;

  // Network-first strategy for static assets: try network, fall back to cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful same-origin static asset responses for future offline use.
        if (response.ok) {
          const clone = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          );
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
