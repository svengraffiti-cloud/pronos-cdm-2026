const CACHE_NAME = "pronos-cdm-2026-cache-v1000";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request));
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
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Les Pronos de Papy 👴🏻", {
      body: data.body || "Nouvelle notification.",
      icon: "/logo-app.png",
      badge: "/logo-app.png",
      data: {
        url: data.url || "/",
      },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }

      if (clients.openWindow) return clients.openWindow(url);
      return null;
    })
  );
});
