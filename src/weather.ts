import { GROWING_PLACE } from "./growing-place";

export type ForecastDay = {
  date: string;
  highF: number;
  lowF: number;
  inchesOfRain: number;
};

export type GrowingPlaceForecast = {
  today: ForecastDay;
  week: ForecastDay[];
};

export const ENOUGH_RAIN_INCHES = 0.25;
export const FROST_LOW_F = 32;

export function enoughRain(forecast: GrowingPlaceForecast): boolean {
  return forecast.today.inchesOfRain >= ENOUGH_RAIN_INCHES;
}

export function frostNight(forecast: GrowingPlaceForecast): ForecastDay | undefined {
  return forecast.week.find((day) => day.lowF <= FROST_LOW_F);
}

export function plantingWindowAdvice(
  kind: string,
  forecast: GrowingPlaceForecast,
): string | null {
  if (frostNight(forecast) || stillInFrostSeason(forecast.today.date)) {
    return `Don't set ${kind} out until this frost window.`;
  }

  return null;
}

function stillInFrostSeason(isoDate: string): boolean {
  const monthDay = isoDate.slice(5);
  return monthDay < GROWING_PLACE.lastSpringFrost || monthDay >= GROWING_PLACE.firstFallFrost;
}

export async function loadGrowingPlaceForecast(): Promise<GrowingPlaceForecast> {
  const response = await fetch("/api/weather");
  if (!response.ok) {
    throw new Error("The Growing-place forecast could not be read.");
  }

  return (await response.json()) as GrowingPlaceForecast;
}

type OpenMeteoDaily = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
};

export function forecastFromOpenMeteo(payload: OpenMeteoDaily): GrowingPlaceForecast {
  const dates = payload.daily?.time ?? [];
  if (dates.length === 0) {
    throw new Error("The Growing-place forecast was empty.");
  }

  const week = dates.map((date, index) => ({
    date,
    highF: Math.round(payload.daily?.temperature_2m_max?.[index] ?? 0),
    lowF: Math.round(payload.daily?.temperature_2m_min?.[index] ?? 0),
    inchesOfRain: Math.round((payload.daily?.precipitation_sum?.[index] ?? 0) * 100) / 100,
  }));

  return { today: week[0], week };
}
