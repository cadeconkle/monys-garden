import type { LockScreen, LockScreenNotice } from "./lock-screen";

const pageNotices = new Map<string, Notification>();

export function createDeviceLockScreen(): LockScreen {
  let subscription: PushSubscriptionJSON | null = null;
  let published = false;

  return {
    async offer() {
      if (!canUseLockScreen()) {
        return;
      }
      if ((await offerLockScreen()) !== "granted") {
        return;
      }
      subscription ??= await subscribeForPush();
      await registerSubscription(subscription);
    },

    async sync(notices) {
      if (!canUseLockScreen()) {
        return;
      }

      await showNotices(notices);

      if (notices.length > 0) {
        published = true;
      }
      if (published) {
        await publish(notices);
      }
    },
  };
}

async function registerSubscription(subscription: PushSubscriptionJSON | null) {
  if (!subscription) {
    return;
  }
  try {
    await fetch("/api/lock-screen", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });
  } catch {
    return;
  }
}

async function publish(notices: readonly LockScreenNotice[]) {
  try {
    await fetch("/api/lock-screen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notices }),
    });
  } catch {
    return;
  }
}

function canUseLockScreen(): boolean {
  return typeof Notification !== "undefined";
}

async function offerLockScreen(): Promise<NotificationPermission> {
  if (Notification.permission !== "default") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

async function showNotices(notices: readonly LockScreenNotice[]) {
  const registration = await existingServiceWorker();
  const due = new Set(notices.map((notice) => notice.id));

  if (registration) {
    const shown = await registration.getNotifications();
    for (const current of shown) {
      if (current.tag && !due.has(current.tag)) {
        current.close();
      }
    }
    if (Notification.permission !== "granted") {
      return;
    }
    await Promise.all(
      notices.map((notice) =>
        registration.showNotification("Mony's Garden", {
          tag: notice.id,
          body: notice.label,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          data: { id: notice.id },
        }),
      ),
    );
    return;
  }

  closePageNotices(due);
  if (Notification.permission !== "granted") {
    return;
  }
  showOnPage(notices);
}

function closePageNotices(due: Set<string>) {
  for (const [id, shown] of pageNotices) {
    if (!due.has(id)) {
      shown.close();
      pageNotices.delete(id);
    }
  }
}

function showOnPage(notices: readonly LockScreenNotice[]) {
  for (const notice of notices) {
    pageNotices.set(
      notice.id,
      new Notification("Mony's Garden", {
        tag: notice.id,
        body: notice.label,
        icon: "/icon-192.png",
      }),
    );
  }
}

async function existingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

async function subscribeForPush(): Promise<PushSubscriptionJSON | null> {
  const registration = await existingServiceWorker();
  if (!registration?.pushManager) {
    return null;
  }

  let publicKey: string | null = null;
  try {
    const response = await fetch("/api/lock-screen");
    if (!response.ok) {
      return null;
    }
    publicKey = ((await response.json()) as { vapidPublicKey: string | null }).vapidPublicKey;
  } catch {
    return null;
  }
  if (!publicKey) {
    return null;
  }

  try {
    const push = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(publicKey),
    });
    return push.toJSON();
  } catch {
    return null;
  }
}

function applicationServerKey(vapidPublicKey: string): BufferSource {
  const padding = "=".repeat((4 - (vapidPublicKey.length % 4)) % 4);
  const base64 = (vapidPublicKey + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = atob(base64);
  const key = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    key[index] = raw.charCodeAt(index);
  }
  return key;
}
