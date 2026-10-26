// Kill switch for the old app's service worker.
// Phones and browsers that installed the old app check this file for updates. This version
// clears the old offline copy, removes itself and sends any open window to the new site.
const NEW_HOME = 'https://cookbook.antdevlabs.com/';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      windows.forEach((client) => client.navigate(NEW_HOME).catch(() => undefined));
    })(),
  );
});
