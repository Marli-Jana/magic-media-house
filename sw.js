var CACHE_NAME = 'jana-magic-house-v3';
var OFFLINE_FILES = [
  './', './index.html', './styles.css', './app.js', './config.js', './manifest.webmanifest',
  './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png'
];
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(OFFLINE_FILES); }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) { if (key !== CACHE_NAME) { return caches.delete(key); } }));
  }));
});
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') { return; }
  event.respondWith(
    fetch(event.request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
      return response;
    }).catch(function () {
      return caches.match(event.request).then(function (cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
