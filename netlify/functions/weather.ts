import type { Config } from "@netlify/functions";
import { fetchGrowingPlaceForecast } from "./_shared/growing-place-forecast";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    return Response.json(await fetchGrowingPlaceForecast());
  } catch {
    return Response.json(
      { error: "The Growing-place forecast could not be read." },
      { status: 502 },
    );
  }
};

export const config: Config = {
  path: "/api/weather",
  method: "GET",
};
