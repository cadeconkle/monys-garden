import type { Variety } from "./catalog";

export const AREAS = ["Front", "Side", "Back", "Patio"] as const;
export type Area = (typeof AREAS)[number];

export const STARTS = ["seed", "transplant", "tree"] as const;
export type Start = (typeof STARTS)[number];

export const PLANTING_ENDS = ["open", "harvested", "winter-kill", "failed"] as const;
export type PlantingEnd = (typeof PLANTING_ENDS)[number];

export const CARE_KINDS = ["water", "harvest", "replant", "set-aside-seeds"] as const;
export type CareKind = (typeof CARE_KINDS)[number];

export type Bed = {
  area: Area;
  name: string;
  plan: Variety | null;
};

export type Planting = {
  id: string;
  area: Area;
  bedName: string;
  variety: Variety;
  plantedOn: string;
  start: Start;
  end: PlantingEnd;
};

export type CareEvent = {
  id: string;
  kind: CareKind;
  plantingId: string;
  varietyName: string;
  bedName: string;
  seedSaveCount?: number;
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
    beds: [...garden.beds, { area, name: trimmed, plan: null }],
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
          end: "open",
        },
      ],
      careEvents: [...garden.careEvents, ...careEventsFor(planting, plantingId)],
    },
    error: null,
  };
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

export function dueCareEvents(garden: GardenBook): CareEvent[] {
  const failedIds = new Set(
    garden.plantings.filter((planting) => planting.end === "failed").map((planting) => planting.id),
  );

  return garden.careEvents.filter((event) => {
    if (event.done) {
      return false;
    }
    if (event.kind === "water" && failedIds.has(event.plantingId)) {
      return false;
    }
    return true;
  });
}

export function careEventLabel(event: CareEvent): string {
  if (event.kind === "set-aside-seeds") {
    if (event.seedSaveCount != null) {
      return `Set aside ${event.seedSaveCount} seeds of ${event.varietyName}`;
    }
    return `Set aside seeds of ${event.varietyName}`;
  }

  const verb = event.kind === "water" ? "Water" : event.kind === "harvest" ? "Harvest" : "Replant";
  return `${verb} ${event.varietyName} in ${event.bedName}`;
}

function careEventsFor(planting: StartPlanting, plantingId: string): CareEvent[] {
  return CARE_KINDS.map((kind) => ({
    id: crypto.randomUUID(),
    kind,
    plantingId,
    varietyName: planting.variety.name,
    bedName: planting.bedName,
    seedSaveCount: kind === "set-aside-seeds" ? planting.variety.seedSaveCount : undefined,
    done: false,
  }));
}

export function currentPlantings(garden: GardenBook): Planting[] {
  return garden.plantings;
}

export function currentPlantingsByArea(garden: GardenBook): {
  area: Area;
  beds: { name: string; plan: Variety | null; plantings: Planting[] }[];
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
        beds: names.map((name) => ({
          name,
          plan: garden.beds.find((bed) => bed.area === area && bed.name === name)?.plan ?? null,
          plantings: here.filter((item) => item.bedName === name),
        })),
      },
    ];
  });
}
