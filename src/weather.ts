import type { ForecastDay, FrostNight, GrowingPlaceForecast } from "./forecast";

export type { ForecastDay, FrostNight, GrowingPlaceForecast };
export { forecastFromOpenMeteo, loadGrowingPlaceForecast } from "./forecast";

export const ENOUGH_RAIN_INCHES = 0.25;
export const FROST_LOW_F = 32;

export function enoughRain(forecast: GrowingPlaceForecast): boolean {
  return forecast.today.inchesOfRain >= ENOUGH_RAIN_INCHES;
}

export function frostNight(forecast: GrowingPlaceForecast): FrostNight | undefined {
  return forecast.week.find((day) => day.lowF <= FROST_LOW_F);
}
