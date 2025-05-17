const CACHE_NAME = 'pwa-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/form.html',
  '/api.html',
  '/css/style.css',
  '/js/app.js',
  '/js/idb.js',
  '/js/api.js',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sitemap.xml',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
            cacheNames
                .filter((cacheName) => cacheName !== CACHE_NAME)
                .map((cacheName) => caches.delete(cacheName))
        );
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(fetchHandle(event.request));
});

async function fetchHandle(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    fetchAndCache(request).catch(error => {
      console.error('Error fetching and saving:', error);
    });
    return cachedResponse;
  } else {
    try {
      return await fetchAndCache(request);
    } catch (error) {
      if (request.mode === 'navigate') {
        const fallback = await cache.match('/index.html');
        if (fallback) {
          return fallback;
        }
      }

      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  }
}

async function fetchAndCache(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
