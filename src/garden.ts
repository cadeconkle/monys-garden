import type { Variety } from "./catalog";

export const AREAS = ["Front", "Side", "Back", "Patio"] as const;
export type Area = (typeof AREAS)[number];

export const STARTS = ["seed", "transplant", "tree"] as const;
export type Start = (typeof STARTS)[number];

export const STAYS = ["in-bed", "indoors"] as const;
export type Stay = (typeof STAYS)[number];

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
};

export type GardenBook = {
  beds: Bed[];
  plantings: Planting[];
};

export function emptyGarden(): GardenBook {
  return { beds: [], plantings: [] };
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

  return {
    garden: {
      beds: garden.beds.map((item) =>
        item === bed ? { ...item, plan: planting.variety } : item,
      ),
      plantings: [
        ...garden.plantings,
        {
          id: crypto.randomUUID(),
          area: planting.area,
          bedName: planting.bedName,
          variety: planting.variety,
          plantedOn: planting.plantedOn,
          start: planting.start,
          stay: "in-bed",
        },
      ],
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
  return bed.soil ?? bed.plan?.soil ?? plantings[0]?.variety.soil ?? null;
}

export function fertilizerAdviceFor(
  bed: { plan: Variety | null },
  plantings: Planting[],
): string | null {
  return bed.plan?.fertilizer ?? plantings[0]?.variety.fertilizer ?? null;
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
          const record = garden.beds.find((bed) => bed.area === area && bed.name === name);
          return {
            name,
            plan: record?.plan ?? null,
            soil: record?.soil ?? null,
            plantings: here.filter((item) => item.bedName === name),
          };
        }),
      },
    ];
  });
}
