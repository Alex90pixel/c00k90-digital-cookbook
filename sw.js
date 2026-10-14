// C00K90 service worker: makes the app installable and keeps the app shell available offline.
const CACHE = 'c00k90-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './ciqual-2025.json', './pairings.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only handle our own files. Firebase, Google sign-in, fonts and photos always go straight to the network.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first, so every new push shows up right away; the cached copy is only used when offline.
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
