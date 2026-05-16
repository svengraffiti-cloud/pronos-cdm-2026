self.addEventListener("push", function (event) {
  let data = {
    title: "Les Pronos de Papy ðŸ‘´ðŸ»",
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
      data.title || "Les Pronos de Papy ðŸ‘´ðŸ»",
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
