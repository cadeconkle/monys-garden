import type { Variety } from "./catalog";
import type { FrostNight, GrowingPlaceForecast } from "./forecast";
import { enoughRain, frostNight } from "./weather";

export const AREAS = ["Front", "Side", "Back", "Patio"] as const;
export type Area = (typeof AREAS)[number];

export const STARTS = ["seed", "transplant", "tree"] as const;
export type Start = (typeof STARTS)[number];

export const STAYS = ["in-bed", "indoors"] as const;
export type Stay = (typeof STAYS)[number];

export const PLANTING_ENDS = ["open", "harvested", "winter-kill", "failed"] as const;
export type PlantingEnd = (typeof PLANTING_ENDS)[number];

export const PLANTING_CARE_EVENT_TYPES = [
  "water",
  "harvest",
  "replant",
  "set-aside-seeds",
] as const;
export const CARE_EVENT_TYPES = [
  ...PLANTING_CARE_EVENT_TYPES,
  "frost",
  "rain-already-watered",
] as const;
export type CareEventType = (typeof CARE_EVENT_TYPES)[number];

export type Bed = {
  area: Area;
  name: string;
  plan: Variety | null;
  soil: string | null;
};

export type Planting = {
  id: string;
  area: Area;
  bedName: string;
  variety: Variety;
  plantedOn: string;
  start: Start;
  stay: Stay;
  end: PlantingEnd;
};

export type CareEvent = {
  id: string;
  type: CareEventType;
  plantingId?: string;
  varietyName?: string;
  bedName?: string;
  seedSaveCount?: number;
  frostNight?: FrostNight;
  done: boolean;
};

export type GardenBook = {
  beds: Bed[];
  plantings: Planting[];
  careEvents: CareEvent[];
};

export function emptyGarden(): GardenBook {
  return { beds: [], plantings: [], careEvents: [] };
}

export function nameBed(garden: GardenBook, area: Area, name: string): GardenBook {
  const trimmed = name.trim();
  if (!trimmed) {
    return garden;
  }
  if (garden.beds.some((bed) => bed.area === area && bed.name === trimmed)) {
    return garden;
  }

  return {
    ...garden,
    beds: [...garden.beds, { area, name: trimmed, plan: null, soil: null }],
  };
}

export type StartPlanting = {
  area: Area;
  bedName: string;
  variety: Variety;
  plantedOn: string;
  start: Start;
};

export type StartPlantingResult = {
  garden: GardenBook;
  error: string | null;
};

export function startPlanting(garden: GardenBook, planting: StartPlanting): StartPlantingResult {
  const bed = garden.beds.find(
    (item) => item.area === planting.area && item.name === planting.bedName,
  );
  if (!bed) {
    return { garden, error: "Name a Bed first." };
  }

  const varietyInBed =
    bed.plan?.name ??
    garden.plantings.find((item) => item.area === planting.area && item.bedName === planting.bedName)
      ?.variety.name;

  if (varietyInBed && varietyInBed !== planting.variety.name) {
    return {
      garden,
      error: `A Bed holds one Variety. Name a neighboring Bed for ${planting.variety.name}.`,
    };
  }

  const plantingId = crypto.randomUUID();

  return {
    garden: {
      beds: garden.beds.map((item) =>
        item === bed ? { ...item, plan: planting.variety } : item,
      ),
      plantings: [
        ...garden.plantings,
        {
          id: plantingId,
          area: planting.area,
          bedName: planting.bedName,
          variety: planting.variety,
          plantedOn: planting.plantedOn,
          start: planting.start,
          stay: "in-bed",
          end: "open",
        },
      ],
      careEvents: [...garden.careEvents, ...careEventsFor(planting, plantingId)],
    },
    error: null,
  };
}

export function setStay(garden: GardenBook, plantingId: string, stay: Stay): GardenBook {
  return {
    ...garden,
    plantings: garden.plantings.map((planting) =>
      planting.id === plantingId ? { ...planting, stay } : planting,
    ),
  };
}

export function overrideSoil(
  garden: GardenBook,
  area: Area,
  bedName: string,
  soil: string,
): GardenBook {
  const trimmed = soil.trim();
  if (!trimmed) {
    return garden;
  }

  return {
    ...garden,
    beds: garden.beds.map((bed) =>
      bed.area === area && bed.name === bedName ? { ...bed, soil: trimmed } : bed,
    ),
  };
}

export function soilFor(
  bed: { soil: string | null; plan: Variety | null },
  plantings: Planting[],
): string | null {
  const variety = bed.plan ?? plantings[0]?.variety;
  return bed.soil ?? varietySoil(variety) ?? null;
}

export function fertilizerAdviceFor(
  bed: { plan: Variety | null },
  plantings: Planting[],
): string | null {
  return bed.plan?.fertilizer ?? plantings[0]?.variety.fertilizer ?? null;
}

function varietySoil(variety: Variety | undefined): string | undefined {
  return variety?.soil ?? variety?.finish?.soil;
}

export function endPlantingAsFailed(garden: GardenBook, plantingId: string): GardenBook {
  return {
    ...garden,
    plantings: garden.plantings.map((planting) =>
      planting.id === plantingId ? { ...planting, end: "failed" } : planting,
    ),
  };
}

export function markCareEventDone(garden: GardenBook, careEventId: string): GardenBook {
  return {
    ...garden,
    careEvents: garden.careEvents.map((event) =>
      event.id === careEventId ? { ...event, done: true } : event,
    ),
  };
}

export function applyWeatherToGarden(
  garden: GardenBook,
  forecast?: GrowingPlaceForecast,
): GardenBook {
  if (!forecast) {
    return garden;
  }

  return ensureFrostCareEvent(dismissWaterForRain(garden, forecast), forecast);
}

export function ensureFrostCareEvent(
  garden: GardenBook,
  forecast?: GrowingPlaceForecast,
): GardenBook {
  if (!forecast) {
    return garden;
  }

  const night = frostNight(forecast);
  if (!night) {
    return garden;
  }

  const hasOpenPlanting = garden.plantings.some((planting) => planting.end === "open");
  if (!hasOpenPlanting) {
    return garden;
  }

  const already = garden.careEvents.some(
    (event) => event.type === "frost" && event.frostNight?.date === night.date,
  );
  if (already) {
    return garden;
  }

  return {
    ...garden,
    careEvents: [
      ...garden.careEvents,
      {
        id: `frost:${night.date}`,
        type: "frost",
        frostNight: night,
        done: false,
      },
    ],
  };
}

function dismissWaterForRain(garden: GardenBook, forecast: GrowingPlaceForecast): GardenBook {
  if (!enoughRain(forecast)) {
    return garden;
  }

  const openWater = garden.careEvents.filter((event) => event.type === "water" && !event.done);
  if (openWater.length === 0) {
    return garden;
  }

  const existing = new Set(garden.careEvents.map((event) => event.id));
  const rainCare = openWater.flatMap((water) => {
    const id = `rain-already-watered:${forecast.today.date}:${water.id}`;
    if (existing.has(id)) {
      return [];
    }

    return [
      {
        id,
        type: "rain-already-watered" as const,
        plantingId: water.plantingId,
        varietyName: water.varietyName,
        bedName: water.bedName,
        done: false,
      },
    ];
  });

  return {
    ...garden,
    careEvents: [
      ...garden.careEvents.map((event) =>
        event.type === "water" && !event.done ? { ...event, done: true } : event,
      ),
      ...rainCare,
    ],
  };
}

export function dueCareEvents(garden: GardenBook): CareEvent[] {
  const failedIds = new Set(
    garden.plantings.filter((planting) => planting.end === "failed").map((planting) => planting.id),
  );

  return garden.careEvents.filter((event) => {
    if (event.done) {
      return false;
    }
    if (event.type === "water" && event.plantingId && failedIds.has(event.plantingId)) {
      return false;
    }
    return true;
  });
}

export function careEventLabel(event: CareEvent): string {
  if (event.type === "frost") {
    return event.frostNight
      ? `Cover for frost on ${event.frostNight.date}`
      : "Cover for frost";
  }

  if (event.type === "rain-already-watered") {
    return `Rain already watered ${event.varietyName} in ${event.bedName}`;
  }

  if (event.type === "set-aside-seeds") {
    if (event.seedSaveCount != null) {
      return `Set aside ${event.seedSaveCount} seeds of ${event.varietyName}`;
    }
    return `Set aside seeds of ${event.varietyName}`;
  }

  const verb = event.type === "water" ? "Water" : event.type === "harvest" ? "Harvest" : "Replant";
  return `${verb} ${event.varietyName} in ${event.bedName}`;
}

function careEventsFor(planting: StartPlanting, plantingId: string): CareEvent[] {
  return PLANTING_CARE_EVENT_TYPES.map((type) => ({
    id: crypto.randomUUID(),
    type,
    plantingId,
    varietyName: planting.variety.name,
    bedName: planting.bedName,
    seedSaveCount: type === "set-aside-seeds" ? planting.variety.seedSaveCount : undefined,
    done: false,
  }));
}

export function currentPlantings(garden: GardenBook): Planting[] {
  return garden.plantings;
}

export function currentPlantingsByArea(garden: GardenBook): {
  area: Area;
  beds: { name: string; plan: Variety | null; soil: string | null; plantings: Planting[] }[];
}[] {
  return AREAS.flatMap((area) => {
    const here = currentPlantings(garden).filter((item) => item.area === area);
    const names = [...new Set(here.map((item) => item.bedName))];
    if (names.length === 0) {
      return [];
    }

    return [
      {
        area,
        beds: names.map((name) => {
          const bed = garden.beds.find((item) => item.area === area && item.name === name);
          return {
            name,
            plan: bed?.plan ?? null,
            soil: bed?.soil ?? null,
            plantings: here.filter((item) => item.bedName === name),
          };
        }),
      },
    ];
  });
}
