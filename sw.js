const CACHE_NAME =
  'nomi-pwa-shell-v1.0.2';

const SHELL_FILES = [
  './',
  './index.html',
  './offline.html',
  './config.js',
  './app.js',
  './manifest.webmanifest'
];

self.addEventListener(
  'install',
  (event) => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) =>
          cache.addAll(
            SHELL_FILES
          )
        )
        .then(() =>
          self.skipWaiting()
        )
    );
  }
);

self.addEventListener(
  'activate',
  (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (key) =>
                  key !==
                  CACHE_NAME
              )
              .map(
                (key) =>
                  caches.delete(
                    key
                  )
              )
          )
        )
        .then(() =>
          self.clients.claim()
        )
    );
  }
);

self.addEventListener(
  'fetch',
  (event) => {
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

    const isFreshFile =
      event.request.mode ===
        'navigate' ||
      requestUrl.pathname.endsWith(
        '/index.html'
      ) ||
      requestUrl.pathname.endsWith(
        '/app.js'
      ) ||
      requestUrl.pathname.endsWith(
        '/config.js'
      ) ||
      requestUrl.pathname.endsWith(
        '/sw.js'
      );

    if (isFreshFile) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy =
                response.clone();

              caches
                .open(
                  CACHE_NAME
                )
                .then((cache) =>
                  cache.put(
                    event.request,
                    copy
                  )
                );
            }

            return response;
          })
          .catch(async () => {
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
          })
      );

      return;
    }

    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => {
          if (cached) {
            return cached;
          }

          return fetch(
            event.request
          ).then((response) => {
            if (response.ok) {
              const copy =
                response.clone();

              caches
                .open(
                  CACHE_NAME
                )
                .then((cache) =>
                  cache.put(
                    event.request,
                    copy
                  )
                );
            }

            return response;
          });
        })
    );
  }
);
