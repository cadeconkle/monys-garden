async function showLockScreenCare(registration, careEvents) {
  const due = new Set(careEvents.map((event) => event.id));
  const shown = await registration.getNotifications();

  for (const current of shown) {
    if (current.tag && !due.has(current.tag)) {
      current.close();
    }
  }

  await Promise.all(
    careEvents.map((event) =>
      registration.showNotification("Mony's Garden", {
        tag: event.id,
        body: event.label,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { id: event.id },
      }),
    ),
  );
}
