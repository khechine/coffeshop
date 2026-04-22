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
    const url = new URL(event.request.url);

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
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            });
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
