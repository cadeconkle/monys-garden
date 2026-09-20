import type { Config } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "../../db";
import { household } from "../../db/schema";

type LockScreenPush = {
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

  if (req.method === "POST") {
    const identity = await getUser();
    if (!identity?.email) {
      return Response.json({ error: "Open the garden as the Gardener." }, { status: 401 });
    }

    const [row] = await db.select().from(household).where(eq(household.id, 1)).limit(1);
    if (!row || row.gardenerIdentityId !== identity.id) {
      return Response.json({ error: "There is only one Gardener." }, { status: 409 });
    }

    const publicKey = Netlify.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Netlify.env.get("VAPID_PRIVATE_KEY");
    const subject = Netlify.env.get("VAPID_SUBJECT");
    if (!publicKey || !privateKey || !subject) {
      return Response.json({ sent: false }, { status: 503 });
    }

    const body = (await req.json()) as LockScreenPush;
    const endpoint = body.subscription?.endpoint;
    const p256dh = body.subscription?.keys?.p256dh;
    const auth = body.subscription?.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return Response.json({ error: "The lock screen is missing." }, { status: 400 });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    try {
      await webpush.sendNotification(
        { endpoint, keys: { p256dh, auth } },
        JSON.stringify({ notices: body.notices ?? [] }),
      );
      return Response.json({ sent: true });
    } catch {
      return Response.json({ sent: false }, { status: 502 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/lock-screen",
  method: ["GET", "POST"],
};
