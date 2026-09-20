import { GROWING_PLACE } from "../../../src/growing-place";
import { forecastFromOpenMeteo, type GrowingPlaceForecast } from "../../../src/forecast";

export async function fetchGrowingPlaceForecast(): Promise<GrowingPlaceForecast> {
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
    throw new Error("The Growing-place forecast could not be read.");
  }

  return forecastFromOpenMeteo(await response.json());
}
