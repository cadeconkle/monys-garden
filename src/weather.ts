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
  if (!frostNight(forecast)) {
    return null;
  }

  return `Don't set ${kind} out until this frost window.`;
}

export function fallbackGrowingPlaceForecast(now = new Date()): GrowingPlaceForecast {
  const week = Array.from({ length: 7 }, (_, index) => ({
    date: localIsoDate(now, index),
    highF: 86,
    lowF: 68,
    inchesOfRain: 0,
  }));

  return { today: week[0], week };
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

function localIsoDate(now: Date, offsetDays: number): string {
  const day = new Date(now);
  day.setDate(day.getDate() + offsetDays);
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}
