import type { LockScreen, LockScreenCare } from "./lock-screen";

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

    async sync(careEvents) {
      if (!canUseLockScreen()) {
        return;
      }

      await showViaServiceWorker(careEvents);

      if (careEvents.length > 0) {
        published = true;
      }
      if (published) {
        await publish(careEvents);
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

async function publish(careEvents: readonly LockScreenCare[]) {
  try {
    await fetch("/api/lock-screen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careEvents }),
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

async function showViaServiceWorker(careEvents: readonly LockScreenCare[]) {
  const registration = await existingServiceWorker();
  if (!registration?.active) {
    return;
  }
  registration.active.postMessage({ careEvents });
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
