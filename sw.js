const CACHE_NAME =
  'nomi-pwa-shell-v1.0.3';

const SHELL_FILES = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './nomi-512.png',
  './nomi-maskable-512.png'
];

self.addEventListener(
  'install',
  function (event) {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(
          function (cache) {
            return cache.addAll(
              SHELL_FILES
            );
          }
        )
        .then(
          function () {
            return self.skipWaiting();
          }
        )
    );
  }
);

self.addEventListener(
  'activate',
  function (event) {
    event.waitUntil(
      caches
        .keys()
        .then(
          function (keys) {
            return Promise.all(
              keys
                .filter(
                  function (key) {
                    return (
                      key !==
                      CACHE_NAME
                    );
                  }
                )
                .map(
                  function (key) {
                    return caches.delete(
                      key
                    );
                  }
                )
            );
          }
        )
        .then(
          function () {
            return self.clients.claim();
          }
        )
    );
  }
);

self.addEventListener(
  'fetch',
  function (event) {
    const requestUrl =
      new URL(
        event.request.url
      );

    if (
      event.request.method !==
        'GET' ||
      requestUrl.origin !==
        self.location.origin
    ) {
      return;
    }

    if (
      event.request.mode ===
        'navigate'
    ) {
      event.respondWith(
        fetch(event.request)
          .then(
            function (response) {
              if (response.ok) {
                const copy =
                  response.clone();

                caches
                  .open(CACHE_NAME)
                  .then(
                    function (cache) {
                      return cache.put(
                        './index.html',
                        copy
                      );
                    }
                  );
              }

              return response;
            }
          )
          .catch(
            async function () {
              return (
                await caches.match(
                  './index.html'
                ) ||
                await caches.match(
                  './offline.html'
                )
              );
            }
          )
      );

      return;
    }

    event.respondWith(
      caches
        .match(event.request)
        .then(
          function (cached) {
            return (
              cached ||
              fetch(event.request)
            );
          }
        )
    );
  }
);
