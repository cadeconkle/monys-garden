import type { Config } from "@netlify/functions";
import { gardenerResponse, theGardener } from "./_shared/gardener";
import { pushLockScreenCare } from "./_shared/push-lock-screen-care";
import { db } from "../../db";
import { lockScreenSubscriptions } from "../../db/schema";
import type { LockScreenCare } from "../../src/lock-screen";

type LockScreenBody = {
  subscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  careEvents?: LockScreenCare[];
};

export default async (req: Request) => {
  if (req.method === "GET") {
    return Response.json({
      vapidPublicKey: Netlify.env.get("VAPID_PUBLIC_KEY") ?? null,
    });
  }

  const gardener = await theGardener();
  if (!gardener || gardener === "stranger") {
    return gardenerResponse(gardener) as Response;
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
    const body = (await req.json()) as LockScreenBody;
    const keys = subscriptionKeys(body);
    if (keys) {
      await saveSubscription(gardener.email, keys);
    }

    const pushed = await pushLockScreenCare(body.careEvents ?? []);
    if (pushed.reason === "missing-vapid") {
      return Response.json({ sent: false }, { status: 503 });
    }
    return Response.json({ sent: pushed.sent });
  }

  return new Response("Method not allowed", { status: 405 });
};

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
