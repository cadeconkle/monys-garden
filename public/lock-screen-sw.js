self.addEventListener("push", (event) => {
  event.waitUntil(syncLockScreen(event));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(openGarden());
});

async function syncLockScreen(event) {
  if (!event.data) {
    return;
  }

  const payload = event.data.json();
  const notices = Array.isArray(payload.notices) ? payload.notices : [];
  const shown = await self.registration.getNotifications();
  const due = new Set(notices.map((notice) => notice.id));

  for (const current of shown) {
    if (current.tag && !due.has(current.tag)) {
      current.close();
    }
  }

  await Promise.all(
    notices.map((notice) =>
      self.registration.showNotification("Mony's Garden", {
        tag: notice.id,
        body: notice.label,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { id: notice.id },
      }),
    ),
  );
}

async function openGarden() {
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of windows) {
    if ("focus" in client) {
      return client.focus();
    }
  }
  if (self.clients.openWindow) {
    return self.clients.openWindow("/");
  }
}
