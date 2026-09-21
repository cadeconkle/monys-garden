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
  soil?: string;
  fertilizer?: string;
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
  {
    name: "staking",
    how: "Tie a tomato or pepper to a stake as it grows; don't wait until a storm flattens it.",
  },
  {
    name: "mulch",
    how: "Two inches of mulch on clay holds morning water and keeps the Bed from baking at noon.",
  },
  {
    name: "trellis",
    how: "Give vines a fence or net before they sprawl; bitter melon and luffa want height in this heat.",
  },
  {
    name: "fig wrap",
    how: "Wrap young fig wood before a November frost night; unwrap when the morning warms.",
  },
  {
    name: "citrus pot",
    how: "A pot you can slide indoors; acidic mix, citrus feed in summer, almost none inside.",
  },
  {
    name: "squash borer watch",
    how: "Look for sawdust at the stem in June and cut the borer out or start a second sowing.",
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
    soil: "citrus pot mix",
    fertilizer: "monthly citrus food in summer",
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
    soil: "loose garden loam",
    fertilizer: "a light spring feed",
  },
  {
    name: "State Fair zinnia",
    category: "flowers",
    kind: "zinnia",
    fit: "strong",
    why: "Takes our summer sun without sulking.",
    kitchenTradition: "none",
    finish: {
      photoreal: photorealOf("State Fair zinnia"),
      winterFate: "dies — replant",
      difficulty: {
        level: "easy",
        why: "Sow it after frost and it takes our sun.",
      },
      harvest: {
        level: "heavy",
        why: "Cut blooms all summer if you keep the spent heads off.",
      },
      whenToPlant: "Direct sow after the April 4 frost window.",
      timeToHarvest: "About sixty days from seed to bloom.",
      soil: "It does not ask for rich soil; this clay with a little compost is enough.",
      techniques: ["watering"],
    },
  },
  {
    name: "Formosa azalea",
    category: "shrubs",
    kind: "azalea",
    fit: "strong",
    why: "A common Fuquay-Varina front yard shrub.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
    finish: {
      photoreal: photorealOf("Formosa azalea"),
      winterFate: "leave out",
      difficulty: {
        level: "moderate",
        why: "Wants acidic soil; wet clay at the roots yellows the leaf.",
      },
      harvest: {
        level: "solid",
        why: "A big spring bloom, then a quiet evergreen the rest of the year.",
      },
      whenToPlant: "Fall or early spring, while the soil is cool.",
      timeToHarvest: "Bloom in March and April on an established shrub.",
      soil: "Acidic, high in pine bark. Do not plant in a clay bowl that holds water.",
      techniques: ["mulch", "watering"],
    },
  },
  {
    name: "Yuletide camellia",
    category: "shrubs",
    kind: "camellia",
    fit: "strong",
    why: "Winter blooms after our first frost.",
    kitchenTradition: "none",
    finish: {
      photoreal: photorealOf("Yuletide camellia"),
      winterFate: "leave out",
      difficulty: {
        level: "moderate",
        why: "Needs afternoon shade and acidic soil on this clay.",
      },
      harvest: {
        level: "solid",
        why: "Red bloom from November into winter, after the first frost.",
      },
      whenToPlant: "Fall, so roots settle before summer heat.",
      timeToHarvest: "Bloom November into January once the shrub is established.",
      soil: "Acidic, well-drained soil with pine bark. Keep mulch off the stem.",
      techniques: ["mulch", "watering"],
    },
  },
  {
    name: "Natchez crape myrtle",
    category: "trees",
    kind: "crape myrtle",
    fit: "strong",
    why: "A street tree that loves this heat.",
    kitchenTradition: "none",
    finish: {
      photoreal: photorealOf("Natchez crape myrtle"),
      winterFate: "leave out",
      difficulty: {
        level: "easy",
        why: "A street tree that loves this heat and this clay.",
      },
      harvest: {
        level: "heavy",
        why: "White bloom from June until the nights cool.",
      },
      whenToPlant: "Spring after frost, or fall.",
      timeToHarvest: "Bloom the first hot summer on a started tree.",
      soil: "This clay is fine if the Bed drains. Skip heavy fertilizer; heat does the work.",
      techniques: ["mulch", "watering"],
    },
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
    finish: {
      photoreal: photorealOf("Carlos muscadine"),
      winterFate: "leave out",
      difficulty: {
        level: "easy",
        why: "A grape that belongs in the Carolina piedmont.",
      },
      harvest: {
        level: "heavy",
        why: "Bronze fruit for juice from a trellis in August and September.",
      },
      whenToPlant: "Set a bare-root vine in February, before bud swell.",
      timeToHarvest: "August into September; fruit in year two or three.",
      soil: "Well-drained clay is what muscadines expect. Low nitrogen; they do not want a rich Bed.",
      techniques: ["trellis", "mulch", "watering"],
    },
  },
  {
    name: "Brown Turkey fig",
    category: "fruit trees",
    kind: "fig",
    fit: "strong",
    why: "Heavy fruit in this heat; wrap young wood on frost nights.",
    kitchenTradition: "American",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
    finish: {
      photoreal: photorealOf("Brown Turkey fig"),
      winterFate: "protect in place",
      difficulty: {
        level: "moderate",
        why: "Young wood wants a wrap before a November frost night.",
      },
      harvest: {
        level: "heavy",
        why: "A long hot summer loads the branches.",
      },
      whenToPlant: "After the April 4 frost window.",
      timeToHarvest: "July into September; a young tree needs two or three summers.",
      soil: "Well-drained soil; this clay is fine if the Bed does not hold water. A spring compost, not a late nitrogen push.",
      techniques: ["fig wrap", "frost cloth", "mulch", "watering"],
    },
  },
  {
    name: "Chicago Hardy fig",
    category: "fruit trees",
    kind: "fig",
    fit: "strong",
    why: "Handles a colder snap than most figs here.",
    kitchenTradition: "American",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Fuyu persimmon",
    category: "fruit trees",
    kind: "persimmon",
    fit: "strong",
    why: "Non-astringent fruit after our first cool nights.",
    kitchenTradition: "American",
    buyPlace: { shop: "Garden Supply Company", channel: "nursery" },
    finish: {
      photoreal: photorealOf("Fuyu persimmon"),
      winterFate: "leave out",
      difficulty: {
        level: "easy",
        why: "A deciduous tree that takes our winter without a wrap.",
      },
      harvest: {
        level: "solid",
        why: "Non-astringent fruit after the first cool nights, once the tree is a few years in.",
      },
      whenToPlant: "Set a bare-root tree in February, before bud swell.",
      timeToHarvest: "October fruit; a young tree needs four or five summers.",
      soil: "Adapts to piedmont clay if the Bed drains. Light spring compost; skip heavy nitrogen.",
      techniques: ["mulch", "watering"],
    },
  },
  {
    name: "Saijo persimmon",
    category: "fruit trees",
    kind: "persimmon",
    fit: "strong",
    why: "Sweet after frost; a piedmont yard tree.",
    kitchenTradition: "American",
    buyPlace: { shop: "Garden Supply Company", channel: "nursery" },
  },
  {
    name: "Methley plum",
    category: "fruit trees",
    kind: "plum",
    fit: "strong",
    why: "Japanese plum that sets in this humid spring.",
    kitchenTradition: "both",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Santa Rosa plum",
    category: "fruit trees",
    kind: "plum",
    fit: "fair",
    why: "Fruit splits if May stays wet.",
    kitchenTradition: "American",
  },
  {
    name: "Orient pear",
    category: "fruit trees",
    kind: "pear",
    fit: "fair",
    why: "Fire blight pressure in our humidity.",
    kitchenTradition: "American",
  },
  {
    name: "Wonderful pomegranate",
    category: "fruit trees",
    kind: "pomegranate",
    fit: "fair",
    why: "Dies to the ground some winters, then resprouts.",
    kitchenTradition: "both",
  },
  {
    name: "Owari Satsuma",
    category: "fruit trees",
    kind: "satsuma",
    fit: "weak",
    why: "Needs a pot and a frost-free winter indoors.",
    kitchenTradition: "both",
    soil: "citrus pot mix",
    fertilizer: "monthly citrus food in summer",
  },
  {
    name: "Honeycrisp apple",
    category: "fruit trees",
    kind: "apple",
    fit: "weak",
    why: "Wants more chill and less July humidity than we have.",
    kitchenTradition: "American",
  },
  {
    name: "Pawpaw",
    category: "fruit trees",
    kind: "pawpaw",
    fit: "fair",
    why: "Wants a damp shade pocket we barely have.",
    kitchenTradition: "American",
  },
  {
    name: "Redhaven peach",
    category: "fruit trees",
    kind: "peach",
    fit: "fair",
    why: "Sets some fruit after a cautious April plant.",
    kitchenTradition: "American",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Siam Queen Thai basil",
    category: "herbs",
    kind: "Thai basil",
    fit: "strong",
    why: "Holds flavor in 95° heat.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
    finish: {
      photoreal: photorealOf("Siam Queen Thai basil"),
      winterFate: "dies — replant",
      difficulty: {
        level: "easy",
        why: "Heat and humidity are what it wants.",
      },
      harvest: {
        level: "heavy",
        why: "Pinch often and it keeps leafing until frost.",
      },
      whenToPlant: "Transplant after the April 4 frost, once nights stay warm.",
      timeToHarvest: "About fifty days from transplant; pick as it grows.",
      soil: "Ordinary garden soil with compost. Do not overfeed or the flavor thins.",
      techniques: ["watering", "mulch"],
    },
  },
  {
    name: "Genovese basil",
    category: "herbs",
    kind: "basil",
    fit: "strong",
    why: "Pesto leaf that loves our nights.",
    kitchenTradition: "American",
    buyPlace: { shop: "Harris Teeter", channel: "grocery" },
    finish: {
      photoreal: photorealOf("Genovese basil"),
      winterFate: "dies — replant",
      difficulty: {
        level: "easy",
        why: "Our warm nights grow big pesto leaves.",
      },
      harvest: {
        level: "heavy",
        why: "A pot or Bed keeps leafing if you pinch the flowers.",
      },
      whenToPlant: "After the April 4 frost window.",
      timeToHarvest: "About fifty days from transplant.",
      soil: "Rich, well-drained soil and a light feed; mulch so the clay does not bake.",
      techniques: ["watering", "mulch"],
    },
  },
  {
    name: "Holy basil",
    category: "herbs",
    kind: "holy basil",
    fit: "strong",
    why: "Doesn't flinch in humid July.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
  },
  {
    name: "Garlic chives",
    category: "herbs",
    kind: "garlic chives",
    fit: "strong",
    why: "Perennial clumps through our winter.",
    kitchenTradition: "both",
  },
  {
    name: "Rau ram",
    category: "herbs",
    kind: "rau ram",
    fit: "strong",
    why: "Vietnamese coriander that prefers our steam to cilantro's.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
  },
  {
    name: "Shiso",
    category: "herbs",
    kind: "shiso",
    fit: "strong",
    why: "Self-sows once it likes a Bed.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
  },
  {
    name: "Lemongrass",
    category: "herbs",
    kind: "lemongrass",
    fit: "strong",
    why: "A clump for soup; bring a start in or treat as dies-replant.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
    finish: {
      photoreal: photorealOf("Lemongrass"),
      winterFate: "bring in",
      difficulty: {
        level: "moderate",
        why: "A clump is easy in heat; a start has to come in before November frost.",
      },
      harvest: {
        level: "solid",
        why: "Stalks for soup all summer from one clump.",
      },
      whenToPlant: "Set out after nights stay warm, in May.",
      timeToHarvest: "Stalks by midsummer; the clump is bigger if you overwinter a start.",
      soil: "Rich soil in a pot you can slide indoors, or a well-drained Bed in summer.",
      techniques: ["overwinter indoors", "watering", "mulch"],
    },
  },
  {
    name: "Ginger",
    category: "herbs",
    kind: "ginger",
    fit: "fair",
    why: "Needs a long hot season and a pot you can drag in.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
    soil: "rich soil in a pot",
  },
  {
    name: "Turmeric",
    category: "herbs",
    kind: "turmeric",
    fit: "fair",
    why: "Same long heat; harvest after frost kills the tops.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
    soil: "rich soil in a pot",
  },
  {
    name: "Arp rosemary",
    category: "herbs",
    kind: "rosemary",
    fit: "fair",
    why: "The rosemary that hates wet clay least.",
    kitchenTradition: "American",
  },
  {
    name: "Mexican tarragon",
    category: "herbs",
    kind: "Mexican tarragon",
    fit: "strong",
    why: "Anise leaf that shrugs off August.",
    kitchenTradition: "both",
  },
  {
    name: "Spearmint",
    category: "herbs",
    kind: "spearmint",
    fit: "strong",
    why: "Thrives, then tries to own the Bed.",
    kitchenTradition: "both",
  },
  {
    name: "Flat-leaf parsley",
    category: "herbs",
    kind: "parsley",
    fit: "fair",
    why: "Best as a cool-season sowing.",
    kitchenTradition: "both",
    buyPlace: { shop: "Harris Teeter", channel: "grocery" },
  },
  {
    name: "Bouquet dill",
    category: "herbs",
    kind: "dill",
    fit: "fair",
    why: "Bolts when June arrives.",
    kitchenTradition: "American",
  },
  {
    name: "Heatwave II tomato",
    category: "vegetables",
    kind: "tomato",
    fit: "strong",
    why: "Bred to set fruit when nights stay hot.",
    kitchenTradition: "American",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
    finish: {
      photoreal: photorealOf("Heatwave II tomato"),
      winterFate: "dies — replant",
      difficulty: {
        level: "moderate",
        why: "Needs a stake and morning water; it still sets when nights stay hot.",
      },
      harvest: {
        level: "heavy",
        why: "Fruit keeps coming through the stretch when other tomatoes stall.",
      },
      whenToPlant: "Transplant after the April 4 frost, once the soil is warm.",
      timeToHarvest: "About seventy-five days from transplant.",
      soil: "Loose garden loam over this clay, mulched. A light feed at planting, then less once fruit sets.",
      techniques: ["staking", "mulch", "watering"],
    },
  },
  {
    name: "Cherokee Purple tomato",
    category: "vegetables",
    kind: "tomato",
    fit: "fair",
    why: "Flavor first, then July stall.",
    kitchenTradition: "American",
    seedSaveCount: 20,
  },
  {
    name: "Sungold tomato",
    category: "vegetables",
    kind: "tomato",
    fit: "fair",
    why: "Early cherries before the humidity thickens.",
    kitchenTradition: "American",
  },
  {
    name: "Thai Dragon pepper",
    category: "vegetables",
    kind: "pepper",
    fit: "strong",
    why: "Hot pepper for the wok; heat only helps.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
    finish: {
      photoreal: photorealOf("Thai Dragon pepper"),
      winterFate: "dies — replant",
      difficulty: {
        level: "easy",
        why: "Our heat only helps a hot pepper.",
      },
      harvest: {
        level: "heavy",
        why: "Thin pods for the wok until November frost.",
      },
      whenToPlant: "Transplant after the April 4 frost, once nights stay warm.",
      timeToHarvest: "About eighty days from transplant; pick green or red.",
      soil: "Well-drained soil; go light on nitrogen or you get leaf, not pods.",
      techniques: ["staking", "watering", "mulch"],
    },
  },
  {
    name: "Jalapeño",
    category: "vegetables",
    kind: "pepper",
    fit: "strong",
    why: "Sets through our summer.",
    kitchenTradition: "both",
    buyPlace: { shop: "Harris Teeter", channel: "grocery" },
  },
  {
    name: "Shishito",
    category: "vegetables",
    kind: "pepper",
    fit: "strong",
    why: "Blistered-pepper harvest until frost.",
    kitchenTradition: "both",
  },
  {
    name: "Ping Tung eggplant",
    category: "vegetables",
    kind: "eggplant",
    fit: "strong",
    why: "Long purple fruit that loves piedmont nights.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
    finish: {
      photoreal: photorealOf("Ping Tung eggplant"),
      winterFate: "dies — replant",
      difficulty: {
        level: "easy",
        why: "Long fruit that likes piedmont nights once the soil is warm.",
      },
      harvest: {
        level: "heavy",
        why: "Slender purple fruit all summer if you keep picking.",
      },
      whenToPlant: "Transplant in May, after nights stay above 60°F.",
      timeToHarvest: "About seventy days from transplant.",
      soil: "Warm, well-drained soil with compost. Mulch the clay so it does not crust.",
      techniques: ["staking", "mulch", "watering"],
    },
  },
  {
    name: "Black Beauty eggplant",
    category: "vegetables",
    kind: "eggplant",
    fit: "fair",
    why: "Slower in our clay if the Bed stays wet.",
    kitchenTradition: "American",
  },
  {
    name: "Burgundy okra",
    category: "vegetables",
    kind: "okra",
    fit: "strong",
    why: "Red pods in the same heat as Clemson.",
    kitchenTradition: "both",
    seedSaveCount: 20,
  },
  {
    name: "Georgia Southern collards",
    category: "vegetables",
    kind: "collards",
    fit: "strong",
    why: "The winter green this Garden can count on.",
    kitchenTradition: "American",
    finish: {
      photoreal: photorealOf("Georgia Southern collards"),
      winterFate: "leave out",
      difficulty: {
        level: "easy",
        why: "The winter green this Garden can count on.",
      },
      harvest: {
        level: "heavy",
        why: "Leaves sweeten after frost and hold through our mild winter.",
      },
      whenToPlant: "Sow in late August for a winter Bed, or in March for spring.",
      timeToHarvest: "About seventy days from seed; pick leaves as they size up.",
      soil: "This clay with compost is enough. A light nitrogen feed for leaves, not for a dry summer stand.",
      techniques: ["frost cloth", "mulch", "watering"],
    },
  },
  {
    name: "Tendergreen mustard",
    category: "vegetables",
    kind: "mustard",
    fit: "strong",
    why: "Fast leaves in our short cool windows.",
    kitchenTradition: "both",
  },
  {
    name: "Joi Choi",
    category: "vegetables",
    kind: "bok choy",
    fit: "fair",
    why: "Spring and fall only; June bitterness.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
  },
  {
    name: "Beauregard sweet potato",
    category: "vegetables",
    kind: "sweet potato",
    fit: "strong",
    why: "This clay and this heat are what it wants.",
    kitchenTradition: "American",
    finish: {
      photoreal: photorealOf("Beauregard sweet potato"),
      winterFate: "dies — replant",
      difficulty: {
        level: "easy",
        why: "This clay and this heat are what it wants.",
      },
      harvest: {
        level: "heavy",
        why: "A long hot season fills the Bed with roots.",
      },
      whenToPlant: "Set slips in May, once the soil is warm.",
      timeToHarvest: "About ninety to a hundred days; dig before the November 4 frost.",
      soil: "Loosened clay, not a soggy Bed. Go light on nitrogen or you get vines, not roots.",
      techniques: ["mulch", "watering"],
    },
  },
  {
    name: "Yardlong bean",
    category: "vegetables",
    kind: "yardlong bean",
    fit: "strong",
    why: "A trellis bean for stir-fry in August.",
    kitchenTradition: "Asian",
    buyPlace: { shop: "H Mart", channel: "grocery" },
  },
  {
    name: "Bush Blue Lake bean",
    category: "vegetables",
    kind: "bean",
    fit: "fair",
    why: "Produces before Mexican bean beetle season peaks.",
    kitchenTradition: "American",
  },
  {
    name: "Poinsett cucumber",
    category: "vegetables",
    kind: "cucumber",
    fit: "strong",
    why: "A southern cucumber that doesn't quit in July.",
    kitchenTradition: "American",
  },
  {
    name: "Marketmore cucumber",
    category: "vegetables",
    kind: "cucumber",
    fit: "fair",
    why: "Turns bitter if the Bed dries at noon.",
    kitchenTradition: "American",
  },
  {
    name: "Yellow crookneck squash",
    category: "vegetables",
    kind: "squash",
    fit: "fair",
    why: "Pick early; squash borer hunts the stem.",
    kitchenTradition: "American",
  },
  {
    name: "Sugar Baby watermelon",
    category: "vegetables",
    kind: "watermelon",
    fit: "strong",
    why: "Small melon that ripens in our season.",
    kitchenTradition: "American",
  },
  {
    name: "Silver Queen corn",
    category: "vegetables",
    kind: "corn",
    fit: "fair",
    why: "Wants more space than a backyard Bed likes.",
    kitchenTradition: "American",
  },
  {
    name: "Music garlic",
    category: "vegetables",
    kind: "garlic",
    fit: "strong",
    why: "Cloves in the ground by Thanksgiving.",
    kitchenTradition: "both",
  },
  {
    name: "Purple Top turnip",
    category: "vegetables",
    kind: "turnip",
    fit: "strong",
    why: "Fall roots after the heat breaks.",
    kitchenTradition: "American",
  },
  {
    name: "Crackerjack marigold",
    category: "flowers",
    kind: "marigold",
    fit: "strong",
    why: "Heat and a kitchen-adjacent bloom.",
    kitchenTradition: "none",
    seedSaveCount: 24,
  },
  {
    name: "Sensation cosmos",
    category: "flowers",
    kind: "cosmos",
    fit: "strong",
    why: "Airy bloom that does not ask for rich soil.",
    kitchenTradition: "none",
    seedSaveCount: 24,
  },
  {
    name: "Stella d'Oro daylily",
    category: "flowers",
    kind: "daylily",
    fit: "strong",
    why: "A front-yard bloom that survives neglect.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
    finish: {
      photoreal: photorealOf("Stella d'Oro daylily"),
      winterFate: "leave out",
      difficulty: {
        level: "easy",
        why: "A front-yard bloom that survives neglect in this heat.",
      },
      harvest: {
        level: "solid",
        why: "Gold bloom in waves from May into summer.",
      },
      whenToPlant: "Spring or fall; a started plant blooms the first summer.",
      timeToHarvest: "Bloom from May; ornamental, not a kitchen pick.",
      soil: "Ordinary soil, even this clay if it drains. A spring compost is plenty.",
      techniques: ["mulch", "watering"],
    },
  },
  {
    name: "Black-eyed Susan Goldsturm",
    category: "flowers",
    kind: "black-eyed Susan",
    fit: "strong",
    why: "August gold in clay.",
    kitchenTradition: "none",
  },
  {
    name: "Lantana Miss Huff",
    category: "flowers",
    kind: "lantana",
    fit: "strong",
    why: "Comes back after our winter.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Giant Blue pentas",
    category: "flowers",
    kind: "pentas",
    fit: "strong",
    why: "Hummingbird bloom in full piedmont sun.",
    kitchenTradition: "none",
  },
  {
    name: "Sarah Bernhardt peony",
    category: "flowers",
    kind: "peony",
    fit: "weak",
    why: "Our late heat cuts the bloom short.",
    kitchenTradition: "none",
  },
  {
    name: "George L. Taber azalea",
    category: "shrubs",
    kind: "azalea",
    fit: "strong",
    why: "The pink azalea on Fuquay streets.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Debutante camellia",
    category: "shrubs",
    kind: "camellia",
    fit: "strong",
    why: "Midwinter bloom after Yuletide fades.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "August Beauty gardenia",
    category: "shrubs",
    kind: "gardenia",
    fit: "strong",
    why: "Perfume in June; a classic yard shrub.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
    finish: {
      photoreal: photorealOf("August Beauty gardenia"),
      winterFate: "leave out",
      difficulty: {
        level: "moderate",
        why: "Perfume is easy; yellow leaves mean this clay is too wet or not acidic enough.",
      },
      harvest: {
        level: "solid",
        why: "White bloom and scent in June, repeating into summer.",
      },
      whenToPlant: "Spring after the April 4 frost window.",
      timeToHarvest: "Bloom in June on an established shrub.",
      soil: "Acidic, well-drained soil with pine bark. Do not let the Bed stay soggy.",
      techniques: ["mulch", "watering"],
    },
  },
  {
    name: "Oakleaf hydrangea",
    category: "shrubs",
    kind: "hydrangea",
    fit: "strong",
    why: "Cone bloom that takes our summer.",
    kitchenTradition: "none",
    buyPlace: { shop: "Garden Supply Company", channel: "nursery" },
  },
  {
    name: "Endless Summer hydrangea",
    category: "shrubs",
    kind: "hydrangea",
    fit: "fair",
    why: "Mopheads sulk if the clay stays wet and hot.",
    kitchenTradition: "none",
  },
  {
    name: "Premier blueberry",
    category: "shrubs",
    kind: "blueberry",
    fit: "strong",
    why: "Rabbiteye fruit for this heat.",
    kitchenTradition: "American",
    buyPlace: { shop: "Garden Supply Company", channel: "nursery" },
    finish: {
      photoreal: photorealOf("Premier blueberry"),
      winterFate: "leave out",
      difficulty: {
        level: "moderate",
        why: "Rabbiteye fruit for this heat, but only if the soil stays acidic.",
      },
      harvest: {
        level: "solid",
        why: "Early rabbiteye berries in June once the shrub is a few years in.",
      },
      whenToPlant: "Set a bare-root or potted shrub in late winter.",
      timeToHarvest: "June fruit; a young shrub needs two or three summers.",
      soil: "Very acidic, high in pine bark or peat. Raw red clay without amendment will not do.",
      techniques: ["mulch", "watering"],
    },
  },
  {
    name: "Zhuzhou Fuchsia loropetalum",
    category: "shrubs",
    kind: "loropetalum",
    fit: "strong",
    why: "The fringe flower used in every new yard.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Harbour Dwarf nandina",
    category: "shrubs",
    kind: "nandina",
    fit: "strong",
    why: "Common, tough, and already in this town's yards.",
    kitchenTradition: "none",
  },
  {
    name: "Knock Out rose",
    category: "shrubs",
    kind: "rose",
    fit: "fair",
    why: "Blooms, then black spot in our humidity.",
    kitchenTradition: "none",
  },
  {
    name: "Muskogee crape myrtle",
    category: "trees",
    kind: "crape myrtle",
    fit: "strong",
    why: "Lavender bloom, same heat proof.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Eastern redbud",
    category: "trees",
    kind: "redbud",
    fit: "strong",
    why: "March magenta before the peach.",
    kitchenTradition: "none",
    buyPlace: { shop: "Fairview Garden Center", channel: "nursery" },
    finish: {
      photoreal: photorealOf("Eastern redbud"),
      winterFate: "leave out",
      difficulty: {
        level: "easy",
        why: "March magenta before the peach, on a tree that takes this clay.",
      },
      harvest: {
        level: "solid",
        why: "A short, strong spring bloom, then shade for the rest of the year.",
      },
      whenToPlant: "Fall or late winter, while the tree is dormant.",
      timeToHarvest: "Bloom in March the spring after planting, on a started tree.",
      soil: "This clay is fine if it drains. A mulch ring, not a deep fertilized hole.",
      techniques: ["mulch", "watering"],
    },
  },
  {
    name: "Southern magnolia",
    category: "trees",
    kind: "magnolia",
    fit: "strong",
    why: "Broadleaf evergreen that belongs on this street.",
    kitchenTradition: "none",
    buyPlace: { shop: "Fairview Garden Center", channel: "nursery" },
  },
  {
    name: "Desirable pecan",
    category: "trees",
    kind: "pecan",
    fit: "strong",
    why: "A long-game nut tree for this climate.",
    kitchenTradition: "American",
    buyPlace: { shop: "Fairview Garden Center", channel: "nursery" },
  },
  {
    name: "Appalachian Red redbud",
    category: "trees",
    kind: "redbud",
    fit: "strong",
    why: "A redder spring bloom than Eastern redbud.",
    kitchenTradition: "none",
  },
  {
    name: "Cherokee Princess dogwood",
    category: "trees",
    kind: "dogwood",
    fit: "fair",
    why: "Needs afternoon shade; anthracnose if stressed.",
    kitchenTradition: "none",
  },
  {
    name: "Bloodgood Japanese maple",
    category: "trees",
    kind: "Japanese maple",
    fit: "fair",
    why: "Leaf scorch in our July west sun.",
    kitchenTradition: "none",
  },
  {
    name: "Noble muscadine",
    category: "vines",
    kind: "muscadine",
    fit: "strong",
    why: "Dark fruit for juice; same piedmont grape.",
    kitchenTradition: "American",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Maypop",
    category: "vines",
    kind: "maypop",
    fit: "strong",
    why: "Native passionflower; fruit for the curious.",
    kitchenTradition: "American",
    finish: {
      photoreal: photorealOf("Maypop"),
      winterFate: "leave out",
      difficulty: {
        level: "easy",
        why: "A native passionflower that dies to the ground and comes back in this climate.",
      },
      harvest: {
        level: "light",
        why: "A few egg-size fruits for the curious, after a summer of bloom.",
      },
      whenToPlant: "After the April 4 frost window.",
      timeToHarvest: "Bloom midsummer; fruit in late summer if bees find the flowers.",
      soil: "Ordinary soil; it does not ask for a rich Bed. Give it a trellis and sun.",
      techniques: ["trellis", "watering", "mulch"],
    },
  },
  {
    name: "Luffa",
    category: "vines",
    kind: "luffa",
    fit: "strong",
    why: "A sponge gourd on a strong trellis in our heat.",
    kitchenTradition: "both",
    buyPlace: { shop: "H Mart", channel: "grocery" },
  },
  {
    name: "Malabar spinach",
    category: "vines",
    kind: "Malabar spinach",
    fit: "strong",
    why: "Summer green when lettuce has given up.",
    kitchenTradition: "both",
    buyPlace: { shop: "H Mart", channel: "grocery" },
  },
  {
    name: "Confederate jasmine",
    category: "vines",
    kind: "Confederate jasmine",
    fit: "strong",
    why: "Patio perfume; evergreen in our winter.",
    kitchenTradition: "none",
    buyPlace: { shop: "Logan's Garden Hut", channel: "nursery" },
  },
  {
    name: "Hyacinth bean",
    category: "vines",
    kind: "hyacinth bean",
    fit: "strong",
    why: "Purple pods and a fast screen.",
    kitchenTradition: "none",
  },
  {
    name: "Issai kiwi",
    category: "vines",
    kind: "kiwi",
    fit: "weak",
    why: "Wants more chill than we keep.",
    kitchenTradition: "American",
  },
];
