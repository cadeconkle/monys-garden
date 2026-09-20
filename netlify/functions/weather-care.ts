import type { Config } from "@netlify/functions";
import { applyWeatherToGarden, careEventLabel, dueCareEvents } from "../../src/garden";
import { loadStoredGarden, saveStoredGarden } from "./_shared/garden-book-db";
import { fetchGrowingPlaceForecast } from "./_shared/growing-place-forecast";
import { pushLockScreenCare } from "./_shared/push-lock-screen-care";

export default async () => {
  const forecast = await fetchGrowingPlaceForecast();
  const garden = applyWeatherToGarden(await loadStoredGarden(), forecast);
  await saveStoredGarden(garden);
  await pushLockScreenCare(
    dueCareEvents(garden).map((event) => ({
      id: event.id,
      label: careEventLabel(event),
    })),
  );
};

export const config: Config = {
  schedule: "@hourly",
};
