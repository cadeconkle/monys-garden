import type { BuyPlace } from "./shops";

export const CATEGORIES = [
  "fruit trees",
  "herbs",
  "vegetables",
  "flowers",
  "shrubs",
  "trees",
  "vines",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const FITS = ["strong", "fair", "weak"] as const;
export type Fit = (typeof FITS)[number];

const FIT_STRENGTH: Record<Fit, number> = {
  weak: 0,
  fair: 1,
  strong: 2,
};

export const KITCHEN_TRADITIONS = ["Asian", "American", "both"] as const;
export type KitchenTradition = (typeof KITCHEN_TRADITIONS)[number];

export const WINTER_FATES = [
  "bring in",
  "leave out",
  "dies — replant",
  "protect in place",
] as const;
export type WinterFate = (typeof WINTER_FATES)[number];

export const DIFFICULTIES = ["easy", "moderate", "fussy"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const HARVESTS = ["light", "solid", "heavy"] as const;
export type Harvest = (typeof HARVESTS)[number];

export type Photoreal = {
  src: string;
  alt: string;
};

export type RatedWhy<Level extends string> = {
  level: Level;
  why: string;
};

export type VarietyFinish = {
  photoreal: Photoreal;
  winterFate: WinterFate;
  difficulty: RatedWhy<Difficulty>;
  harvest: RatedWhy<Harvest>;
  whenToPlant: string;
  timeToHarvest: string;
  soil: string;
  techniques: readonly string[];
};

export type Variety = {
  name: string;
  category: Category;
  kind: string;
  fit: Fit;
  why: string;
  kitchenTradition?: KitchenTradition | "none";
  seedSaveCount?: number;
  buyPlace?: BuyPlace;
  finish?: VarietyFinish;
};

export function showsFinish(
  variety: Variety,
  planted: readonly string[] = [],
): boolean {
  return Boolean(
    variety.finish && (variety.fit === "strong" || planted.includes(variety.name)),
  );
}

export type Technique = {
  name: string;
  how: string;
};

export function findTechnique(
  techniques: readonly Technique[],
  slug: string,
): Technique | undefined {
  return techniques.find((technique) => slugFor(technique.name) === slug);
}

export const catalogTechniques: Technique[] = [
  {
    name: "frost cloth",
    how: "Drape cloth to the ground before a November frost night, then take it off in the morning.",
  },
  {
    name: "watering",
    how: "Soak the Bed in the morning; a new Planting drinks more than an established shrub.",
  },
  {
    name: "overwinter indoors",
    how: "Bring the pot in before the November 4 frost. Bright window, less water, no citrus feed until it goes back out.",
  },
];

export function slugFor(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categoryFromSlug(slug: string): Category | undefined {
  return CATEGORIES.find((category) => slugFor(category) === slug);
}

export function categoriesIn(catalog: readonly Variety[]): Category[] {
  return CATEGORIES.filter((category) =>
    catalog.some((variety) => variety.category === category),
  );
}

export function kindsIn(catalog: readonly Variety[], category: Category): string[] {
  return [
    ...new Set(
      catalog.filter((variety) => variety.category === category).map((variety) => variety.kind),
    ),
  ];
}

export function kindFromSlug(
  catalog: readonly Variety[],
  category: Category,
  slug: string,
): string | undefined {
  return kindsIn(catalog, category).find((name) => slugFor(name) === slug);
}

export function varietiesOf(
  catalog: readonly Variety[],
  category: Category,
  kind: string,
): Variety[] {
  return catalog.filter((variety) => variety.category === category && variety.kind === kind);
}

export function findVariety(
  catalog: readonly Variety[],
  category: Category,
  kind: string,
  nameSlug: string,
): Variety | undefined {
  return varietiesOf(catalog, category, kind).find((variety) => slugFor(variety.name) === nameSlug);
}

export function varietyPath(variety: Variety): string {
  return `/catalog/${slugFor(variety.category)}/${slugFor(variety.kind)}/${slugFor(variety.name)}`;
}

export function suggestionsFor(catalog: readonly Variety[], variety: Variety): Variety[] {
  return catalog.filter(
    (candidate) =>
      candidate.kind === variety.kind &&
      candidate.name !== variety.name &&
      FIT_STRENGTH[candidate.fit] > FIT_STRENGTH[variety.fit],
  );
}

export function photorealOf(name: string): Photoreal {
  return {
    src: `/varieties/${slugFor(name)}.jpg`,
    alt: `Photoreal render of ${name}`,
  };
}

export const thinCatalog: Variety[] = [
  {
    name: "Contender peach",
    category: "fruit trees",
    kind: "peach",
    fit: "strong",
    why: "Sets fruit after our late frost.",
    kitchenTradition: "American",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
    finish: {
      photoreal: photorealOf("Contender peach"),
      winterFate: "leave out",
      difficulty: {
        level: "easy",
        why: "Late bloom misses our April frost.",
      },
      harvest: {
        level: "solid",
        why: "A pie-worth of fruit in a piedmont summer.",
      },
      whenToPlant: "Set a bare-root tree in February, before bud swell.",
      timeToHarvest: "Fruit in June to July; a young tree needs three summers.",
      soil: "Well-drained, slightly acidic loam. A light spring feed after fruit set — not a dump of nitrogen.",
      techniques: ["watering"],
    },
  },
  {
    name: "Elberta peach",
    category: "fruit trees",
    kind: "peach",
    fit: "weak",
    why: "Blooms too early for an April frost here.",
    kitchenTradition: "American",
  },
  {
    name: "Celeste fig",
    category: "fruit trees",
    kind: "fig",
    fit: "strong",
    why: "Likes our long, hot summers.",
    kitchenTradition: "American",
    finish: {
      photoreal: photorealOf("Celeste fig"),
      winterFate: "protect in place",
      difficulty: {
        level: "moderate",
        why: "Young wood wants a wrap on frost nights.",
      },
      harvest: {
        level: "heavy",
        why: "Two flushes if August stays hot.",
      },
      whenToPlant: "After the April 4 frost window.",
      timeToHarvest: "July into August.",
      soil: "Rich, well-drained soil and a spring compost, not a late nitrogen push.",
      techniques: ["frost cloth"],
    },
  },
  {
    name: "Improved Meyer lemon",
    category: "fruit trees",
    kind: "lemon",
    fit: "weak",
    why: "Has to come inside before November frost.",
    kitchenTradition: "both",
  },
  {
    name: "Queenette Thai basil",
    category: "herbs",
    kind: "Thai basil",
    fit: "strong",
    why: "Thrives in humid heat.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
  },
  {
    name: "Santo cilantro",
    category: "herbs",
    kind: "cilantro",
    fit: "fair",
    why: "Only happy in the short cool window before June.",
    kitchenTradition: "both",
  },
  {
    name: "Clemson Spineless okra",
    category: "vegetables",
    kind: "okra",
    fit: "strong",
    why: "Built for nights that stay over 86°F.",
    kitchenTradition: "both",
    finish: {
      photoreal: photorealOf("Clemson Spineless okra"),
      winterFate: "dies — replant",
      difficulty: {
        level: "easy",
        why: "It asks for heat and little else.",
      },
      harvest: {
        level: "heavy",
        why: "Pods keep coming until November frost.",
      },
      whenToPlant: "Late April once the soil is warm.",
      timeToHarvest: "About fifty-five days from seed.",
      soil: "Ordinary garden soil; go light on nitrogen or you get leaves, not pods.",
      techniques: ["watering"],
    },
  },
  {
    name: "Celebrity tomato",
    category: "vegetables",
    kind: "tomato",
    fit: "fair",
    why: "Sets fruit here, then stalls in July humidity.",
    kitchenTradition: "American",
  },
  {
    name: "State Fair zinnia",
    category: "flowers",
    kind: "zinnia",
    fit: "strong",
    why: "Takes our summer sun without sulking.",
    kitchenTradition: "none",
  },
  {
    name: "Formosa azalea",
    category: "shrubs",
    kind: "azalea",
    fit: "strong",
    why: "A common Fuquay-Varina front yard shrub.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Yuletide camellia",
    category: "shrubs",
    kind: "camellia",
    fit: "strong",
    why: "Winter blooms after our first frost.",
    kitchenTradition: "none",
  },
  {
    name: "Natchez crape myrtle",
    category: "trees",
    kind: "crape myrtle",
    fit: "strong",
    why: "A street tree that loves this heat.",
    kitchenTradition: "none",
  },
  {
    name: "bitter melon",
    category: "vines",
    kind: "bitter melon",
    fit: "fair",
    why: "Grows on a trellis in our summer if nights stay hot.",
    kitchenTradition: "Asian",
  },
  {
    name: "Carlos muscadine",
    category: "vines",
    kind: "muscadine",
    fit: "strong",
    why: "A grape that belongs in the Carolina piedmont.",
    kitchenTradition: "American",
  },
];
