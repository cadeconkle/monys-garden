import type { Handler } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { household } from "../../db/schema";

const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || "{}") as {
    user?: { id?: string; email?: string };
  };
  const identityId = body.user?.id;
  const email = body.user?.email;

  if (!identityId || !email) {
    return { statusCode: 400, body: "The Gardener is missing." };
  }

  const [row] = await db.select().from(household).where(eq(household.id, 1)).limit(1);

  if (row && row.gardenerIdentityId !== identityId) {
    return { statusCode: 403, body: "There is only one Gardener." };
  }

  return { statusCode: 200, body: "{}" };
};

export { handler };
