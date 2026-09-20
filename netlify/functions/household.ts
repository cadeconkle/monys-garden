import type { Config } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { household } from "../../db/schema";
import { GROWING_PLACE } from "../../src/growing-place";

export default async (req: Request) => {
  if (req.method === "GET") {
    const identity = await getUser();
    const offeredEmail = new URL(req.url).searchParams.get("email");
    const [row] = await db.select().from(household).where(eq(household.id, 1)).limit(1);

    return Response.json({
      growingPlace: GROWING_PLACE,
      gardenerExists: Boolean(row),
      isTheGardener: Boolean(row && offeredEmail && row.gardenerEmail === offeredEmail),
      gardener:
        identity && row && row.gardenerIdentityId === identity.id
          ? { email: row.gardenerEmail }
          : null,
    });
  }

  if (req.method === "POST") {
    const identity = await getUser();
    if (!identity?.email) {
      return Response.json({ error: "Open the garden as the Gardener." }, { status: 401 });
    }

    const [row] = await db.select().from(household).where(eq(household.id, 1)).limit(1);

    if (!row) {
      const [created] = await db
        .insert(household)
        .values({
          id: 1,
          gardenerIdentityId: identity.id,
          gardenerEmail: identity.email,
        })
        .returning();

      return Response.json({ email: created.gardenerEmail });
    }

    if (row.gardenerIdentityId !== identity.id) {
      return Response.json({ error: "There is only one Gardener." }, { status: 409 });
    }

    return Response.json({ email: row.gardenerEmail });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: ["/api/household", "/api/household/open"],
  method: ["GET", "POST"],
};
