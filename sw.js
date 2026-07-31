const CACHE_NAME =
  'nomi-pwa-shell-v1.0.4';

const SHELL_FILES = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './nomi-192-v2.png',
  './nomi-512-v2.png',
  './nomi-maskable-512-v2.png'
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

    const alwaysFresh =
      event.request.mode ===
        'navigate' ||
      requestUrl.pathname.endsWith(
        '/index.html'
      ) ||
      requestUrl.pathname.endsWith(
        '/manifest.webmanifest'
      ) ||
      requestUrl.pathname.endsWith(
        '/sw.js'
      );

    if (alwaysFresh) {
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
                        event.request,
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
                  event.request
                ) ||
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
            if (cached) {
              return cached;
            }

            return fetch(
              event.request
            ).then(
              function (response) {
                if (response.ok) {
                  const copy =
                    response.clone();

                  caches
                    .open(CACHE_NAME)
                    .then(
                      function (cache) {
                        return cache.put(
                          event.request,
                          copy
                        );
                      }
                    );
                }

                return response;
              }
            );
          }
        )
    );
  }
);
