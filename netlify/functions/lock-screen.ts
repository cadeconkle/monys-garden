import type { Config } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "../../db";
import { household, lockScreenSubscriptions } from "../../db/schema";

type LockScreenBody = {
  subscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  notices?: { id: string; label: string }[];
};

export default async (req: Request) => {
  if (req.method === "GET") {
    return Response.json({
      vapidPublicKey: Netlify.env.get("VAPID_PUBLIC_KEY") ?? null,
    });
  }

  const gardener = await theGardener();
  if (!gardener) {
    return Response.json({ error: "Open the garden as the Gardener." }, { status: 401 });
  }
  if (gardener === "stranger") {
    return Response.json({ error: "There is only one Gardener." }, { status: 409 });
  }

  if (req.method === "PUT") {
    const keys = subscriptionKeys((await req.json()) as LockScreenBody);
    if (!keys) {
      return Response.json({ error: "The lock screen is missing." }, { status: 400 });
    }
    await saveSubscription(gardener.email, keys);
    return Response.json({ saved: true });
  }

  if (req.method === "POST") {
    const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Netlify.env.get("VAPID_PRIVATE_KEY");
    const subject = Netlify.env.get("VAPID_SUBJECT");
    if (!publicKey || !privateKey || !subject) {
      return Response.json({ sent: false }, { status: 503 });
    }

    const body = (await req.json()) as LockScreenBody;
    const keys = subscriptionKeys(body);
    if (keys) {
      await saveSubscription(gardener.email, keys);
    }

    const payload = JSON.stringify({ notices: body.notices ?? [] });
    webpush.setVapidDetails(subject, publicKey, privateKey);
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
    return Response.json({ sent: sent > 0 });
  }

  return new Response("Method not allowed", { status: 405 });
};

async function theGardener(): Promise<{ email: string } | "stranger" | null> {
  const identity = await getUser();
  if (!identity?.email) {
    return null;
  }
  const [row] = await db.select().from(household).where(eq(household.id, 1)).limit(1);
  if (!row) {
    return null;
  }
  if (row.gardenerIdentityId !== identity.id) {
    return "stranger";
  }
  return { email: row.gardenerEmail };
}

function subscriptionKeys(body: LockScreenBody) {
  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return null;
  }
  return { endpoint, p256dh, auth };
}

async function saveSubscription(
  gardenerEmail: string,
  keys: { endpoint: string; p256dh: string; auth: string },
) {
  await db
    .insert(lockScreenSubscriptions)
    .values({
      endpoint: keys.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      gardenerEmail,
    })
    .onConflictDoUpdate({
      target: lockScreenSubscriptions.endpoint,
      set: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        gardenerEmail,
      },
    });
}

export const config: Config = {
  path: "/api/lock-screen",
  method: ["GET", "PUT", "POST"],
};
