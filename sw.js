var CACHE = 'ev-app-v16';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(['./index.html', './manifest.json']);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  var isHtml = url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHtml) {
    // Alltid hent fersk HTML fra nett, fall tilbake til cache hvis offline
    e.respondWith(
      fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  } else {
    // Alt annet: cache først
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
          return response;
        });
      })
    );
  }
});
