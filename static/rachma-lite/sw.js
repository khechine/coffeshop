// Rachma Pro — Service Worker
const CACHE_NAME = 'rachma-pro-v1';
const STATIC_ASSETS = [
    '/gestion.html',
    '/gestion-app.js',
    '/gestion-style.css',
    '/style.css',
    '/shared.js',
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: clear old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: Network first for API, Cache first for static assets
self.addEventListener('fetch', (event) => {
    // Only handle GET requests. POST/PUT/DELETE should always go to network and cannot be cached.
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Only handle http/https requests. Ignore chrome-extension:// and others that Cache API doesn't support.
    if (!url.protocol.startsWith('http')) return;

    // Always fetch API calls from network (never cache)
    if (url.pathname.includes('/management/') || url.hostname.includes('api.')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({ error: 'Hors ligne' }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            )
        );
        return;
    }

    // Static assets: Cache first, fallback to network
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200) return response;
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, clone).catch(() => {});
                    }
                });
                return response;
            }).catch(() => {
                // Return a basic fallback if both cache and network fail
                return new Response('Ressource indisponible hors ligne', { status: 503 });
            });
        }).catch(() => {
            return new Response('Erreur interne du Service Worker', { status: 500 });
        })
    );
});

// Background sync for offline actions (future use)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
});

// Push notifications (future use)
self.addEventListener('push', (event) => {
    const data = event.data?.json() || { title: 'Rachma Pro', body: 'Nouvelle notification' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [100, 50, 100]
        })
    );
});
