const CACHE_NAME = 'elkassa-pos-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pré-cache minimal. L'essentiel sera mis en cache dynamiquement.
      return cache.addAll([
        '/pos',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorer les appels API et les requêtes non-GET
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
    return;
  }

  // Pour les pages, les assets statiques et images, utiliser la stratégie Stale-While-Revalidate ou Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Mettre à jour le cache avec la nouvelle version
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si le réseau échoue (hors ligne), renvoyer la réponse en cache
        return cachedResponse;
      });

      // Renvoyer le cache immédiatement s'il existe, sinon attendre le réseau
      return cachedResponse || fetchPromise;
    })
  );
});
