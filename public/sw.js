const CACHE_NAME = "pronos-cdm-2026-cache-v2";

const STATIC_ASSETS = [
  "/",
  "/logo.png",
  "/stadium.jpg",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(function (error) {
        console.error("Erreur cache install:", error);
      })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }

            return null;
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.hostname.includes("supabase.co")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (
    event.request.destination === "image" ||
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "font" ||
    requestUrl.pathname === "/" ||
    requestUrl.pathname.startsWith("/_next/")
  ) {
    event.respondWith(
      caches.match(event.request).then(function (cachedResponse) {
        const networkFetch = fetch(event.request)
          .then(function (networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();

              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, responseClone);
              });
            }

            return networkResponse;
          })
          .catch(function () {
            return cachedResponse;
          });

        return cachedResponse || networkFetch;
      })
    );
  }
});

self.addEventListener("push", function (event) {
  let data = {
    title: "Les Pronos de Papy 👴🏻",
    body: "Nouvelle notification.",
    url: "/",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "Nouvelle notification.",
    icon: "/logo.png",
    badge: "/logo.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Les Pronos de Papy 👴🏻",
      options
    )
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

      return null;
    })
  );
});
