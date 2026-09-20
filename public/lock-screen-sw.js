importScripts("/lock-screen-care.js");

self.addEventListener("push", (event) => {
  event.waitUntil(syncLockScreen(event));
});

self.addEventListener("message", (event) => {
  const careEvents = event.data?.careEvents;
  if (!Array.isArray(careEvents)) {
    return;
  }
  event.waitUntil(showLockScreenCare(self.registration, careEvents));
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
  const careEvents = Array.isArray(payload.careEvents) ? payload.careEvents : [];
  await showLockScreenCare(self.registration, careEvents);
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
