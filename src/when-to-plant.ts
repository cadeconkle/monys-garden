import type { Variety } from "./catalog";
import { stillInFrostSeason, type GrowingPlaceForecast } from "./forecast";
import { frostNight } from "./weather";

export function waitsForFrostWindow(variety: Variety): boolean {
  const fate = variety.finish?.winterFate;
  if (fate === "leave out") {
    return false;
  }
  if (fate === "bring in" || fate === "dies — replant" || fate === "protect in place") {
    return true;
  }

  return (
    variety.category === "vegetables" ||
    variety.category === "herbs" ||
    variety.category === "flowers" ||
    variety.category === "vines"
  );
}

export function plantingWindowAdvice(
  variety: Variety,
  forecast: GrowingPlaceForecast,
): string | null {
  if (!waitsForFrostWindow(variety)) {
    return null;
  }
  if (!frostNight(forecast) && !stillInFrostSeason(forecast.today.date)) {
    return null;
  }

  return `Don't set ${variety.kind} out until this frost window.`;
}
