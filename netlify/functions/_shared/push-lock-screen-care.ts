import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "../../../db";
import { lockScreenSubscriptions } from "../../../db/schema";
import type { LockScreenCare } from "../../../src/lock-screen";

export async function pushLockScreenCare(careEvents: readonly LockScreenCare[]) {
  const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Netlify.env.get("VAPID_PRIVATE_KEY");
  const subject = Netlify.env.get("VAPID_SUBJECT");
  if (!publicKey || !privateKey || !subject) {
    return { sent: false, reason: "missing-vapid" as const };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const payload = JSON.stringify({ careEvents });
  const stored = await db.select().from(lockScreenSubscriptions);
  let sent = 0;
  for (const row of stored) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload,
      );
      sent += 1;
    } catch {
      await db
        .delete(lockScreenSubscriptions)
        .where(eq(lockScreenSubscriptions.endpoint, row.endpoint));
    }
  }
  return { sent: sent > 0 };
}
