export const GROWING_PLACE = {
  name: "Fuquay-Varina, North Carolina",
  latitude: 35.5843,
  longitude: -78.8,
  timezone: "America/New_York",
  lastSpringFrost: "04-04",
  firstFallFrost: "11-04",
} as const;

export type GrowingPlace = typeof GROWING_PLACE;
