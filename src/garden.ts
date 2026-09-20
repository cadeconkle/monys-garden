import type { Variety } from "./catalog";

export const AREAS = ["Front", "Side", "Back", "Patio"] as const;
export type Area = (typeof AREAS)[number];

export const STARTS = ["seed", "transplant", "tree"] as const;
export type Start = (typeof STARTS)[number];

export type Bed = {
  area: Area;
  name: string;
  plan: Variety | null;
};

export type Planting = {
  area: Area;
  bedName: string;
  variety: Variety;
  plantedOn: string;
  start: Start;
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

  return {
    garden: {
      beds: garden.beds.map((item) =>
        item === bed ? { ...item, plan: planting.variety } : item,
      ),
      plantings: [
        ...garden.plantings,
        {
          area: planting.area,
          bedName: planting.bedName,
          variety: planting.variety,
          plantedOn: planting.plantedOn,
          start: planting.start,
        },
      ],
    },
    error: null,
  };
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
