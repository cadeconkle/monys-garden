import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { household } from "../../../db/schema";

export async function theGardener(): Promise<{ email: string } | "stranger" | null> {
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

export function gardenerResponse(gardener: { email: string } | "stranger" | null) {
  if (!gardener) {
    return Response.json({ error: "Open the garden as the Gardener." }, { status: 401 });
  }
  if (gardener === "stranger") {
    return Response.json({ error: "There is only one Gardener." }, { status: 409 });
  }
  return null;
}
