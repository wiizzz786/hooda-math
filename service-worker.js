const CACHE_NAME = 'securely-proxy-v1';

// Register the worker to intercept requests globally
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/service-worker.js',
        '/securely.com/' // Ensure we rewrite the root to match
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  console.log('[ServiceWorker] Intercepting Request:', event.request.url);

  // 1. Check if this is a "proxy" request (usually HTTPS)
  if (event.request.method === 'POST') {
    // If not a proxy (e.g., fetch from localhost), return early
    if (event.request.origin === 'localhost') {
      return; 
    }
  }

  // 2. The Core Logic: Intercept the URL before it hits the Browser
  const url = event.request.url;
  const originalUrl = event.request.url;

  // Check if URL starts with the proxy domain or similar filter domain
  const filteredUrl = url.startsWith('securely.com') 
    ? url 
    : url.startsWith('https://www.securely.com')
      ? url 
      : originalUrl.startsWith('https://www.securely.com')
      ? originalUrl 
      : url + '/securely.com'; // Force add if needed

  console.log('[ServiceWorker] Rewriting URL:', url, '->', filteredUrl);

  event.respondWith(
    new Promise((resolve) => {
      // 3. Make the fetch happen on the rewritten URL
      fetch(filteredUrl, event.request)
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          resolve(err); // Allow fallback to original if rewritten fails
        });
    })
  );
});
