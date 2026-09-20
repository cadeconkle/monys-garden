import type { Config } from "@netlify/functions";
import { gardenerResponse, theGardener } from "./_shared/gardener";
import { loadStoredGarden, saveStoredGarden } from "./_shared/garden-book-db";
import type { GardenBook } from "../../src/garden";

export default async (req: Request) => {
  const gardener = await theGardener();
  if (!gardener || gardener === "stranger") {
    return gardenerResponse(gardener) as Response;
  }

  if (req.method === "GET") {
    return Response.json(await loadStoredGarden());
  }

  if (req.method === "PUT") {
    await saveStoredGarden((await req.json()) as GardenBook);
    return Response.json({ saved: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/garden",
  method: ["GET", "PUT"],
};
