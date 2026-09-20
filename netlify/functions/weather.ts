import type { Config } from "@netlify/functions";
import { GROWING_PLACE } from "../../src/growing-place";
import { forecastFromOpenMeteo } from "../../src/weather";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(GROWING_PLACE.latitude));
  url.searchParams.set("longitude", String(GROWING_PLACE.longitude));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("precipitation_unit", "inch");
  url.searchParams.set("timezone", GROWING_PLACE.timezone);
  url.searchParams.set("forecast_days", "7");

  const response = await fetch(url);
  if (!response.ok) {
    return Response.json(
      { error: "The Growing-place forecast could not be read." },
      { status: 502 },
    );
  }

  try {
    return Response.json(forecastFromOpenMeteo(await response.json()));
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
