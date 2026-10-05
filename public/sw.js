const CACHE_NAME = 'poultry-farm-v4';

// Install - activate immediately, no pre-caching of hashed build assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate - drop every older cache so stale builds can never be served
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : null))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // OAuth + API traffic must always hit the network
  if (url.pathname.startsWith('/~oauth')) return;

  // HTML navigations: always network first, cached shell only when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('/index.html', clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache first, fall back to network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return res;
      });
    })
  );
});
