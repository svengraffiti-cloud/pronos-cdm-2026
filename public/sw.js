<<<<<<< HEAD
const CACHE_NAME = "pronos-cdm-2026-cache-v999";

self.addEventListener("install", function (event) {
=======
self.addEventListener("install", (event) => {
>>>>>>> 576ffa1 (Ajout bouton rafraichir app)
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
<<<<<<< HEAD
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
=======
    caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
>>>>>>> 576ffa1 (Ajout bouton rafraichir app)
  );
  self.clients.claim();
});

<<<<<<< HEAD
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
    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "Nouvelle notification.",
    icon: "/logo-app.png?v=999",
    badge: "/logo-app.png?v=999",
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
=======
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
>>>>>>> 576ffa1 (Ajout bouton rafraichir app)
});
