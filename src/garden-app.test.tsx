import { fireEvent, waitFor, within, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Variety, VarietyFinish } from "./catalog";
import { applyWeatherToGarden } from "./garden";
import { createMemoryGardenBook } from "./garden-book";
import { createHousehold } from "./household";
import { openAsGardener, openGarden } from "./open-garden";
import type { ForecastDay, GrowingPlaceForecast } from "./forecast";

async function goToCatalog(garden: RenderResult) {
  await userEvent.click(garden.getAllByRole("link", { name: "Catalog" })[0]);
}

const meyerFinish: VarietyFinish = {
  photoreal: {
    src: "/varieties/improved-meyer-lemon.jpg",
    alt: "Photoreal render of Improved Meyer lemon",
  },
  winterFate: "bring in",
  difficulty: {
    level: "fussy",
    why: "November frost will take it if it stays on the Patio.",
  },
  harvest: {
    level: "light",
    why: "Indoor winters cut the fruit it can hold.",
  },
  whenToPlant: "Move the pot out after the April 4 frost window.",
  timeToHarvest: "Fruit in winter if it flowers under glass.",
  soil: "Acidic, fast-draining soil in a pot and a citrus feed in summer, then almost none indoors.",
  techniques: ["overwinter indoors"],
};

test("the app is written only for Fuquay-Varina", () => {
  const garden = openGarden();

  expect(garden.getByText("Fuquay-Varina, North Carolina")).toBeVisible();
});

test("the Gardener can open Catalog and Garden after the first opening", async () => {
  const garden = openGarden();

  await openAsGardener(garden);

  expect(garden.getByRole("heading", { name: "Garden" })).toBeVisible();
  expect(garden.getByRole("link", { name: "Catalog" })).toBeVisible();
  expect(garden.getByRole("link", { name: "Garden" })).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));
  expect(await garden.findByRole("heading", { name: "Catalog" })).toBeVisible();
});

test("an empty Garden still offers the Catalog", async () => {
  const garden = openGarden();

  await openAsGardener(garden);

  expect(garden.getByText("Nothing is in the ground yet.")).toBeVisible();
  expect(garden.getByRole("heading", { name: "Front" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "Side" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "Back" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "Patio" })).toBeVisible();
  expect(garden.getAllByText("No Beds named yet.")).toHaveLength(4);
  await userEvent.click(garden.getByRole("link", { name: "Open the Catalog" }));
  expect(await garden.findByRole("heading", { name: "Catalog" })).toBeVisible();
});

test("the Gardener can find a Variety by name without dropping it from the Catalog", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Contender peach",
        category: "fruit trees",
        kind: "peach",
        fit: "strong",
        why: "Sets fruit after our late frost.",
      },
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
    ],
  });

  await openAsGardener(garden);
  await goToCatalog(garden);

  expect(await garden.findByRole("link", { name: "fruit trees" })).toBeVisible();
  expect(garden.getByRole("link", { name: "herbs" })).toBeVisible();

  await userEvent.type(garden.getByLabelText("Find a Variety"), "Contender");

  expect(await garden.findByRole("link", { name: "Contender peach" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "Queenette Thai basil" })).toBeNull();
  expect(garden.queryByRole("link", { name: "fruit trees" })).toBeNull();

  await userEvent.clear(garden.getByLabelText("Find a Variety"));

  expect(await garden.findByRole("link", { name: "fruit trees" })).toBeVisible();
  expect(garden.getByRole("link", { name: "herbs" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "Contender peach" })).toBeNull();
});

test("a second profile cannot be created", async () => {
  const household = createHousehold();
  const first = openGarden({ household });
  await openAsGardener(first);

  const stranger = openGarden({ household });
  await openAsGardener(stranger, {
    email: "cade@garden.test",
    password: "another-notebook",
  });

  expect(stranger.getByRole("alert")).toHaveTextContent("There is only one Gardener.");
  expect(stranger.queryByRole("heading", { name: "Garden" })).toBeNull();
  expect(stranger.getByRole("button", { name: "Open the garden" })).toBeVisible();
});

test("phone and iPad open the same Garden as one Gardener", async () => {
  const household = createHousehold();
  const phone = openGarden({ household });
  await openAsGardener(phone, {
    email: "mony@garden.test",
    password: "soil-and-rain",
  });

  const tablet = openGarden({ household });
  await openAsGardener(tablet, {
    email: "mony@garden.test",
    password: "soil-and-rain",
  });

  expect(phone.getByRole("heading", { name: "Garden" })).toBeVisible();
  expect(tablet.getByRole("heading", { name: "Garden" })).toBeVisible();
  expect(phone.getByText("mony@garden.test")).toBeVisible();
  expect(tablet.getByText("mony@garden.test")).toBeVisible();
});

test("the Gardener can browse Category, then Kind, then Variety", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Contender peach",
        category: "fruit trees",
        kind: "peach",
        fit: "strong",
        why: "Sets fruit after our late frost.",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));

  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  expect(await garden.findByRole("heading", { name: "fruit trees" })).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "peach" }));
  expect(await garden.findByRole("heading", { name: "peach" })).toBeVisible();
  expect(garden.getByRole("link", { name: "Contender peach" })).toBeVisible();
  expect(garden.getAllByText("fruit trees").length).toBeGreaterThan(1);
  expect(garden.getByText(/strong Fit/)).toBeVisible();
  expect(garden.getByText("Sets fruit after our late frost.")).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "Contender peach" }));
  expect(await garden.findByRole("heading", { name: "Contender peach" })).toBeVisible();
  expect(garden.getAllByText("fruit trees").length).toBeGreaterThan(1);
  expect(garden.getAllByText("peach").length).toBeGreaterThan(1);
  expect(garden.getByText(/strong Fit/)).toBeVisible();
  expect(garden.getByText("Sets fruit after our late frost.")).toBeVisible();
});

test("Fit filter hides weaker candidates without dropping them from the Catalog", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Contender peach",
        category: "fruit trees",
        kind: "peach",
        fit: "strong",
        why: "Sets fruit after our late frost.",
      },
      {
        name: "Elberta peach",
        category: "fruit trees",
        kind: "peach",
        fit: "weak",
        why: "Blooms too early for an April frost here.",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));

  await userEvent.click(await garden.findByRole("checkbox", { name: "weak" }));
  await userEvent.click(garden.getByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "peach" }));
  expect(garden.getByRole("link", { name: "Contender peach" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "Elberta peach" })).toBeNull();

  await userEvent.click(garden.getByRole("checkbox", { name: "weak" }));
  expect(garden.getByRole("link", { name: "Elberta peach" })).toBeVisible();

  await userEvent.click(garden.getByRole("checkbox", { name: "strong" }));
  expect(garden.queryByRole("link", { name: "Contender peach" })).toBeNull();
  expect(garden.getByRole("link", { name: "Elberta peach" })).toBeVisible();
});

test("a thin Variety shows Fit and why and does not invent photoreal art or full care", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));
  await userEvent.click(await garden.findByRole("link", { name: "herbs" }));
  await userEvent.click(garden.getByRole("link", { name: "Thai basil" }));
  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));

  expect(await garden.findByRole("heading", { name: "Queenette Thai basil" })).toBeVisible();
  expect(garden.getAllByText("herbs").length).toBeGreaterThan(1);
  expect(garden.getAllByText("Thai basil").length).toBeGreaterThan(1);
  expect(garden.getByText(/strong Fit/)).toBeVisible();
  expect(garden.getByText("Thrives in humid heat.")).toBeVisible();
  expect(garden.getByText(/still thin/)).toBeVisible();
  expect(garden.queryByRole("img")).toBeNull();
  expect(garden.queryByText(/soil/i)).toBeNull();
  expect(garden.queryByText(/winter fate/i)).toBeNull();
  expect(garden.queryByText(/difficulty/i)).toBeNull();
  expect(garden.queryByText(/harvest/i)).toBeNull();
  expect(garden.queryByText(/technique/i)).toBeNull();
  expect(garden.queryByText(/buy place/i)).toBeNull();
});

test("a Favorite is not a List", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));
  await userEvent.click(await garden.findByRole("link", { name: "herbs" }));
  await userEvent.click(garden.getByRole("link", { name: "Thai basil" }));
  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));
  await userEvent.click(garden.getByRole("button", { name: "Heart as a Favorite" }));

  await userEvent.click(garden.getByRole("link", { name: "Favorites" }));
  expect(await garden.findByRole("link", { name: "Queenette Thai basil" })).toBeVisible();
  expect(garden.getByText(/Not a List/)).toBeVisible();

  await userEvent.click(
    within(garden.getByRole("navigation", { name: "Catalog trail" })).getByRole("link", {
      name: "Catalog",
    }),
  );
  await userEvent.click(garden.getByRole("link", { name: "Lists" }));
  expect(await garden.findByRole("heading", { name: "Lists" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "Queenette Thai basil" })).toBeNull();
  expect(garden.queryByRole("link", { name: "Favorites" })).toBeNull();
  expect(garden.getByText(/not a Favorite/i)).toBeVisible();

  await userEvent.type(garden.getByLabelText("List name"), "Front shrubs");
  await userEvent.click(garden.getByRole("button", { name: "Create List" }));
  await userEvent.click(
    within(garden.getByRole("navigation", { name: "Catalog trail" })).getByRole("link", {
      name: "Catalog",
    }),
  );
  await userEvent.click(garden.getByRole("link", { name: "herbs" }));
  await userEvent.click(garden.getByRole("link", { name: "Thai basil" }));
  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));
  await userEvent.click(garden.getByRole("button", { name: "Add to Front shrubs" }));
  await userEvent.click(garden.getByRole("button", { name: "Unheart this Favorite" }));

  await userEvent.click(garden.getByRole("link", { name: "Favorites" }));
  expect(garden.queryByRole("link", { name: "Queenette Thai basil" })).toBeNull();

  await userEvent.click(
    within(garden.getByRole("navigation", { name: "Catalog trail" })).getByRole("link", {
      name: "Catalog",
    }),
  );
  await userEvent.click(garden.getByRole("link", { name: "Lists" }));
  await userEvent.click(garden.getByRole("link", { name: "Front shrubs" }));
  expect(garden.getByRole("link", { name: "Queenette Thai basil" })).toBeVisible();
});

test("the Gardener can create a named List, add and remove Varieties, and open the List to each Variety", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
      {
        name: "Formosa azalea",
        category: "shrubs",
        kind: "azalea",
        fit: "strong",
        why: "A common Fuquay-Varina front yard shrub.",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));
  await userEvent.click(await garden.findByRole("link", { name: "Lists" }));
  expect(await garden.findByRole("heading", { name: "Lists" })).toBeVisible();

  await userEvent.type(garden.getByLabelText("List name"), "spring seeds");
  await userEvent.click(garden.getByRole("button", { name: "Create List" }));
  expect(garden.getByRole("link", { name: "spring seeds" })).toBeVisible();

  await userEvent.click(
    within(garden.getByRole("navigation", { name: "Catalog trail" })).getByRole("link", {
      name: "Catalog",
    }),
  );
  await userEvent.click(await garden.findByRole("link", { name: "herbs" }));
  await userEvent.click(garden.getByRole("link", { name: "Thai basil" }));
  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));
  await userEvent.click(garden.getByRole("button", { name: "Add to spring seeds" }));

  await userEvent.click(garden.getByRole("link", { name: "Lists" }));
  await userEvent.click(garden.getByRole("link", { name: "spring seeds" }));
  expect(await garden.findByRole("heading", { name: "spring seeds" })).toBeVisible();
  expect(garden.getByRole("link", { name: "Queenette Thai basil" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "Formosa azalea" })).toBeNull();

  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));
  expect(await garden.findByRole("heading", { name: "Queenette Thai basil" })).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "Lists" }));
  await userEvent.click(garden.getByRole("link", { name: "spring seeds" }));
  await userEvent.click(garden.getByRole("button", { name: "Remove Queenette Thai basil" }));
  expect(garden.queryByRole("link", { name: "Queenette Thai basil" })).toBeNull();
});

test("the Gardener can heart and unheart a Variety as a Favorite", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));
  await userEvent.click(await garden.findByRole("link", { name: "Favorites" }));
  expect(await garden.findByRole("heading", { name: "Favorites" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "Queenette Thai basil" })).toBeNull();

  await userEvent.click(
    within(garden.getByRole("navigation", { name: "Catalog trail" })).getByRole("link", {
      name: "Catalog",
    }),
  );
  await userEvent.click(await garden.findByRole("link", { name: "herbs" }));
  await userEvent.click(garden.getByRole("link", { name: "Thai basil" }));
  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));
  await userEvent.click(garden.getByRole("button", { name: "Heart as a Favorite" }));

  expect(garden.getByText("This is a Favorite.")).toBeVisible();
  expect(garden.getByRole("button", { name: "Unheart this Favorite" })).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "Favorites" }));
  expect(await garden.findByRole("link", { name: "Queenette Thai basil" })).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));
  await userEvent.click(garden.getByRole("button", { name: "Unheart this Favorite" }));
  expect(garden.getByRole("button", { name: "Heart as a Favorite" })).toBeVisible();
  expect(garden.queryByText("This is a Favorite.")).toBeNull();

  await userEvent.click(garden.getByRole("link", { name: "Favorites" }));
  expect(garden.queryByRole("link", { name: "Queenette Thai basil" })).toBeNull();
});

test("the Gardener can filter by Kitchen tradition and by Ornamental", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
        kitchenTradition: "Asian",
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
        name: "Santo cilantro",
        category: "herbs",
        kind: "cilantro",
        fit: "fair",
        why: "Only happy in the short cool window before June.",
        kitchenTradition: "both",
      },
      {
        name: "Formosa azalea",
        category: "shrubs",
        kind: "azalea",
        fit: "strong",
        why: "A common Fuquay-Varina front yard shrub.",
        kitchenTradition: "none",
      },
      {
        name: "Yuletide camellia",
        category: "shrubs",
        kind: "camellia",
        fit: "strong",
        why: "Winter blooms after our first frost.",
        kitchenTradition: "none",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));

  expect(await garden.findByRole("link", { name: "herbs" })).toBeVisible();
  expect(garden.getByRole("link", { name: "vegetables" })).toBeVisible();
  expect(garden.getByRole("link", { name: "shrubs" })).toBeVisible();

  await userEvent.click(garden.getByRole("checkbox", { name: "American" }));
  await userEvent.click(garden.getByRole("checkbox", { name: "both" }));
  await userEvent.click(garden.getByRole("checkbox", { name: "Ornamental" }));

  expect(garden.getByRole("link", { name: "herbs" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "vegetables" })).toBeNull();
  expect(garden.queryByRole("link", { name: "shrubs" })).toBeNull();

  await userEvent.click(garden.getByRole("link", { name: "herbs" }));
  expect(garden.getByRole("link", { name: "Thai basil" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "cilantro" })).toBeNull();

  await userEvent.click(
    within(garden.getByRole("navigation", { name: "Catalog trail" })).getByRole("link", {
      name: "Catalog",
    }),
  );
  await userEvent.click(garden.getByRole("checkbox", { name: "Asian" }));
  await userEvent.click(garden.getByRole("checkbox", { name: "Ornamental" }));

  expect(garden.queryByRole("link", { name: "herbs" })).toBeNull();
  expect(garden.queryByRole("link", { name: "vegetables" })).toBeNull();
  expect(garden.getByRole("link", { name: "shrubs" })).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "shrubs" }));
  expect(garden.getByRole("link", { name: "azalea" })).toBeVisible();
  expect(garden.getByRole("link", { name: "camellia" })).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "azalea" }));
  await userEvent.click(garden.getByRole("link", { name: "Formosa azalea" }));
  expect(await garden.findByRole("heading", { name: "Formosa azalea" })).toBeVisible();
  expect(garden.getByText(/Ornamental/)).toBeVisible();
  expect(garden.queryByText(/Asian kitchen/i)).toBeNull();
});

test("Suggestions are only stronger-Fit Varieties of the same Kind", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Elberta peach",
        category: "fruit trees",
        kind: "peach",
        fit: "weak",
        why: "Blooms too early for an April frost here.",
      },
      {
        name: "Redhaven peach",
        category: "fruit trees",
        kind: "peach",
        fit: "fair",
        why: "Sets some fruit after a cautious April plant.",
      },
      {
        name: "Contender peach",
        category: "fruit trees",
        kind: "peach",
        fit: "strong",
        why: "Sets fruit after our late frost.",
      },
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "peach" }));
  await userEvent.click(garden.getByRole("link", { name: "Elberta peach" }));

  expect(await garden.findByRole("heading", { name: "Suggestions" })).toBeVisible();
  expect(garden.getByRole("link", { name: "Redhaven peach" })).toBeVisible();
  expect(garden.getByRole("link", { name: "Contender peach" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "Queenette Thai basil" })).toBeNull();
  expect(garden.queryByRole("link", { name: "Celebrity tomato" })).toBeNull();
  expect(garden.queryByText(/companion/i)).toBeNull();

  await userEvent.click(garden.getByRole("link", { name: "Redhaven peach" }));
  expect(await garden.findByRole("heading", { name: "Redhaven peach" })).toBeVisible();
  expect(garden.getByRole("link", { name: "Contender peach" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "Elberta peach" })).toBeNull();
  expect(garden.queryByRole("link", { name: "Queenette Thai basil" })).toBeNull();

  await userEvent.click(garden.getByRole("link", { name: "Contender peach" }));
  expect(await garden.findByRole("heading", { name: "Contender peach" })).toBeVisible();
  expect(garden.queryByRole("heading", { name: "Suggestions" })).toBeNull();
  expect(garden.queryByRole("link", { name: "Elberta peach" })).toBeNull();
  expect(garden.queryByRole("link", { name: "Redhaven peach" })).toBeNull();
});

test("Catalog categories include vines and keep bushes inside shrubs", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celeste fig",
        category: "fruit trees",
        kind: "fig",
        fit: "strong",
        why: "Likes our long, hot summers.",
      },
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
      {
        name: "Clemson Spineless okra",
        category: "vegetables",
        kind: "okra",
        fit: "strong",
        why: "Built for nights that stay over 86°F.",
      },
      {
        name: "State Fair zinnia",
        category: "flowers",
        kind: "zinnia",
        fit: "strong",
        why: "Takes our summer sun without sulking.",
      },
      {
        name: "Formosa azalea",
        category: "shrubs",
        kind: "azalea",
        fit: "strong",
        why: "A common Fuquay-Varina front yard shrub.",
      },
      {
        name: "Natchez crape myrtle",
        category: "trees",
        kind: "crape myrtle",
        fit: "strong",
        why: "A street tree that loves this heat.",
      },
      {
        name: "bitter melon",
        category: "vines",
        kind: "bitter melon",
        fit: "fair",
        why: "Grows on a trellis in our summer if nights stay hot.",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));

  expect(await garden.findByRole("link", { name: "fruit trees" })).toBeVisible();
  expect(garden.getByRole("link", { name: "herbs" })).toBeVisible();
  expect(garden.getByRole("link", { name: "vegetables" })).toBeVisible();
  expect(garden.getByRole("link", { name: "flowers" })).toBeVisible();
  expect(garden.getByRole("link", { name: "shrubs" })).toBeVisible();
  expect(garden.getByRole("link", { name: "trees" })).toBeVisible();
  expect(garden.getByRole("link", { name: "vines" })).toBeVisible();
  expect(garden.queryByRole("link", { name: "bushes" })).toBeNull();
});

test("a strong-Fit Variety can show photoreal art and full care", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Contender peach",
        category: "fruit trees",
        kind: "peach",
        fit: "strong",
        why: "Sets fruit after our late frost.",
        finish: {
          photoreal: {
            src: "/varieties/contender-peach.jpg",
            alt: "Photoreal render of Contender peach",
          },
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
    ],
  });

  await openAsGardener(garden);
  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "peach" }));
  await userEvent.click(garden.getByRole("link", { name: "Contender peach" }));

  expect(await garden.findByRole("heading", { name: "Contender peach" })).toBeVisible();
  expect(
    garden.getByRole("img", { name: "Photoreal render of Contender peach" }),
  ).toBeVisible();
  expect(garden.getByRole("heading", { name: "Winter fate" })).toBeVisible();
  expect(garden.getByText("leave out")).toBeVisible();
  expect(garden.getByRole("heading", { name: "Difficulty" })).toBeVisible();
  expect(garden.getByText("easy")).toBeVisible();
  expect(garden.getByText("Late bloom misses our April frost.")).toBeVisible();
  expect(garden.getByRole("heading", { name: "Harvest" })).toBeVisible();
  expect(garden.getByText("solid")).toBeVisible();
  expect(garden.getByText("A pie-worth of fruit in a piedmont summer.")).toBeVisible();
  expect(garden.getByRole("heading", { name: "When to plant" })).toBeVisible();
  expect(garden.getByText("Set a bare-root tree in February, before bud swell.")).toBeVisible();
  expect(garden.getByRole("heading", { name: "Time to harvest" })).toBeVisible();
  expect(
    garden.getByText("Fruit in June to July; a young tree needs three summers."),
  ).toBeVisible();
  expect(garden.getByRole("heading", { name: "Soil" })).toBeVisible();
  expect(
    garden.getByText(
      "Well-drained, slightly acidic loam. A light spring feed after fruit set — not a dump of nitrogen.",
    ),
  ).toBeVisible();
  expect(garden.queryByText(/still thin/)).toBeNull();
});

test("a Variety she plants gets a finished page even if Fit is weak", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Improved Meyer lemon",
        category: "fruit trees",
        kind: "lemon",
        fit: "weak",
        why: "Has to come inside before November frost.",
        finish: meyerFinish,
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Patio", "Lemon pot");
  await startThePlanting(garden, {
    variety: "Improved Meyer lemon",
    bed: "Patio · Lemon pot",
    plantedOn: "2026-04-12",
    start: "tree",
  });

  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "lemon" }));
  await userEvent.click(garden.getByRole("link", { name: "Improved Meyer lemon" }));

  expect(await garden.findByRole("heading", { name: "Improved Meyer lemon" })).toBeVisible();
  expect(
    garden.getByRole("img", { name: "Photoreal render of Improved Meyer lemon" }),
  ).toBeVisible();
  expect(garden.getByText("bring in")).toBeVisible();
  expect(garden.getByText("fussy")).toBeVisible();
  expect(garden.getByText("light")).toBeVisible();
  expect(garden.queryByText(/still thin/)).toBeNull();
});

test("a thin Variety stays thin even when she plants it or finish waits on a weak Fit", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Elberta peach",
        category: "fruit trees",
        kind: "peach",
        fit: "weak",
        why: "Blooms too early for an April frost here.",
      },
      {
        name: "Improved Meyer lemon",
        category: "fruit trees",
        kind: "lemon",
        fit: "weak",
        why: "Has to come inside before November frost.",
        finish: meyerFinish,
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Front", "Peach tree");
  await startThePlanting(garden, {
    variety: "Elberta peach",
    bed: "Front · Peach tree",
    plantedOn: "2026-02-10",
    start: "tree",
  });

  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "peach" }));
  await userEvent.click(garden.getByRole("link", { name: "Elberta peach" }));

  expect(await garden.findByRole("heading", { name: "Elberta peach" })).toBeVisible();
  expect(garden.getByText(/still thin/)).toBeVisible();
  expect(garden.queryByRole("img")).toBeNull();
  expect(garden.queryByRole("heading", { name: "Winter fate" })).toBeNull();

  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "lemon" }));
  await userEvent.click(garden.getByRole("link", { name: "Improved Meyer lemon" }));

  expect(await garden.findByRole("heading", { name: "Improved Meyer lemon" })).toBeVisible();
  expect(garden.getByText(/still thin/)).toBeVisible();
  expect(garden.queryByRole("img")).toBeNull();
  expect(garden.queryByRole("heading", { name: "Winter fate" })).toBeNull();
});

test("Winter fate, Difficulty, and Harvest use the Growing-place words", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Contender peach",
        category: "fruit trees",
        kind: "peach",
        fit: "strong",
        why: "Sets fruit after our late frost.",
        finish: {
          photoreal: {
            src: "/varieties/contender-peach.jpg",
            alt: "Photoreal render of Contender peach",
          },
          winterFate: "leave out",
          difficulty: { level: "easy", why: "Late bloom misses our April frost." },
          harvest: { level: "solid", why: "A pie-worth of fruit in a piedmont summer." },
          whenToPlant: "February bare-root.",
          timeToHarvest: "June to July.",
          soil: "Well-drained acidic loam.",
          techniques: [],
        },
      },
      {
        name: "Celeste fig",
        category: "fruit trees",
        kind: "fig",
        fit: "strong",
        why: "Likes our long, hot summers.",
        finish: {
          photoreal: {
            src: "/varieties/celeste-fig.jpg",
            alt: "Photoreal render of Celeste fig",
          },
          winterFate: "protect in place",
          difficulty: { level: "moderate", why: "Young wood wants a wrap on frost nights." },
          harvest: { level: "heavy", why: "Two flushes if August stays hot." },
          whenToPlant: "After the April 4 frost window.",
          timeToHarvest: "July into August.",
          soil: "Rich, well-drained soil and a spring compost, not a late nitrogen push.",
          techniques: ["frost cloth"],
        },
      },
      {
        name: "Clemson Spineless okra",
        category: "vegetables",
        kind: "okra",
        fit: "strong",
        why: "Built for nights that stay over 86°F.",
        finish: {
          photoreal: {
            src: "/varieties/clemson-spineless-okra.jpg",
            alt: "Photoreal render of Clemson Spineless okra",
          },
          winterFate: "dies — replant",
          difficulty: { level: "easy", why: "It asks for heat and little else." },
          harvest: { level: "heavy", why: "Pods keep coming until November frost." },
          whenToPlant: "Late April once the soil is warm.",
          timeToHarvest: "About fifty-five days from seed.",
          soil: "Ordinary garden soil; go light on nitrogen or you get leaves, not pods.",
          techniques: ["watering"],
        },
      },
      {
        name: "Improved Meyer lemon",
        category: "fruit trees",
        kind: "lemon",
        fit: "strong",
        why: "Worth the indoor winter for a few fruit.",
        finish: meyerFinish,
      },
    ],
  });

  await openAsGardener(garden);
  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "peach" }));
  await userEvent.click(garden.getByRole("link", { name: "Contender peach" }));
  expect(garden.getByText("leave out")).toBeVisible();
  expect(garden.getByText("easy")).toBeVisible();
  expect(garden.getByText("solid")).toBeVisible();

  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "fig" }));
  await userEvent.click(garden.getByRole("link", { name: "Celeste fig" }));
  expect(garden.getByText("protect in place")).toBeVisible();
  expect(garden.getByText("moderate")).toBeVisible();
  expect(garden.getByText("heavy")).toBeVisible();

  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "vegetables" }));
  await userEvent.click(garden.getByRole("link", { name: "okra" }));
  await userEvent.click(garden.getByRole("link", { name: "Clemson Spineless okra" }));
  expect(garden.getByText("dies — replant")).toBeVisible();

  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "lemon" }));
  await userEvent.click(garden.getByRole("link", { name: "Improved Meyer lemon" }));
  expect(garden.getByText("bring in")).toBeVisible();
  expect(garden.getByText("fussy")).toBeVisible();
  expect(garden.getByText("light")).toBeVisible();
});

test("the Gardener can open a Technique from a Variety and from its own section", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celeste fig",
        category: "fruit trees",
        kind: "fig",
        fit: "strong",
        why: "Likes our long, hot summers.",
        finish: {
          photoreal: {
            src: "/varieties/celeste-fig.jpg",
            alt: "Photoreal render of Celeste fig",
          },
          winterFate: "protect in place",
          difficulty: { level: "moderate", why: "Young wood wants a wrap on frost nights." },
          harvest: { level: "heavy", why: "Two flushes if August stays hot." },
          whenToPlant: "After the April 4 frost window.",
          timeToHarvest: "July into August.",
          soil: "Rich, well-drained soil and a spring compost, not a late nitrogen push.",
          techniques: ["frost cloth"],
        },
      },
    ],
    techniques: [
      {
        name: "frost cloth",
        how: "Drape cloth to the ground before a November frost night, then take it off in the morning.",
      },
      {
        name: "watering",
        how: "Soak the Bed in the morning; a new Planting drinks more than an established shrub.",
      },
    ],
  });

  await openAsGardener(garden);
  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "Techniques" }));
  expect(await garden.findByRole("heading", { name: "Techniques" })).toBeVisible();
  expect(garden.getByRole("link", { name: "frost cloth" })).toBeVisible();
  expect(garden.getByRole("link", { name: "watering" })).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "frost cloth" }));
  expect(await garden.findByRole("heading", { name: "frost cloth" })).toBeVisible();
  expect(
    garden.getByText(
      "Drape cloth to the ground before a November frost night, then take it off in the morning.",
    ),
  ).toBeVisible();

  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "fig" }));
  await userEvent.click(garden.getByRole("link", { name: "Celeste fig" }));
  await userEvent.click(garden.getByRole("link", { name: "frost cloth" }));
  expect(await garden.findByRole("heading", { name: "frost cloth" })).toBeVisible();
});

test("the shipped Catalog finishes a strong-Fit Variety and leaves a thin one thin", async () => {
  const garden = openGarden();

  await openAsGardener(garden);
  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "peach" }));
  await userEvent.click(garden.getByRole("link", { name: "Contender peach" }));

  expect(await garden.findByRole("heading", { name: "Contender peach" })).toBeVisible();
  expect(
    garden.getByRole("img", { name: "Photoreal render of Contender peach" }),
  ).toBeVisible();
  expect(garden.getByText("leave out")).toBeVisible();
  expect(garden.queryByText(/still thin/)).toBeNull();

  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "herbs" }));
  await userEvent.click(garden.getByRole("link", { name: "Thai basil" }));
  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));

  expect(await garden.findByRole("heading", { name: "Queenette Thai basil" })).toBeVisible();
  expect(garden.getByText(/still thin/)).toBeVisible();
  expect(garden.queryByRole("img")).toBeNull();
});

test("the Gardener can name a Bed and start a Planting", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
  });

  await openAsGardener(garden);

  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(garden.getByRole("heading", { name: "Back" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "Tomato row" })).toBeVisible();
  expect(garden.getByText("Celebrity tomato · transplant · 2026-04-12")).toBeVisible();
});

test("a Bed cannot hold two Varieties; a second Variety needs a neighboring Bed", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
    ],
  });

  await openAsGardener(garden);

  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });
  await startThePlanting(garden, {
    variety: "Queenette Thai basil",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "seed",
  });

  expect(garden.getByRole("alert")).toHaveTextContent(
    "A Bed holds one Variety. Name a neighboring Bed for Queenette Thai basil.",
  );
  expect(garden.queryByText(/Queenette Thai basil ·/)).toBeNull();

  await nameTheBed(garden, "Back", "Basil at the feet");
  await startThePlanting(garden, {
    variety: "Queenette Thai basil",
    bed: "Back · Basil at the feet",
    plantedOn: "2026-04-12",
    start: "seed",
  });

  expect(garden.getByRole("heading", { name: "Tomato row" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "Basil at the feet" })).toBeVisible();
  expect(garden.getByText("Celebrity tomato · transplant · 2026-04-12")).toBeVisible();
  expect(garden.getByText("Queenette Thai basil · seed · 2026-04-12")).toBeVisible();
});

test("starting a Planting writes the Bed plan to that Variety", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(garden.getByText("Bed plan: Celebrity tomato")).toBeVisible();
});

test("a later season in the same Bed is a new Planting; the old Planting is unchanged", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "seed",
  });
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2027-04-10",
    start: "transplant",
  });

  expect(garden.getByText("Celebrity tomato · seed · 2026-04-12")).toBeVisible();
  expect(garden.getByText("Celebrity tomato · transplant · 2027-04-10")).toBeVisible();
  expect(garden.getByText("Bed plan: Celebrity tomato")).toBeVisible();

  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));
  expect(await garden.findByRole("heading", { name: "Catalog" })).toBeVisible();
  await userEvent.click(garden.getByRole("link", { name: "Garden" }));
  expect(await garden.findByRole("heading", { name: "Garden" })).toBeVisible();
  expect(garden.getByText("Celebrity tomato · seed · 2026-04-12")).toBeVisible();
  expect(garden.getByText("Celebrity tomato · transplant · 2027-04-10")).toBeVisible();
});

test("a Planting produces water, harvest, replant, and set aside seeds Care events", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(garden.getByRole("heading", { name: "Care" })).toBeVisible();
  expect(garden.getByText("Water Celebrity tomato in Tomato row")).toBeVisible();
  expect(garden.getByText("Harvest Celebrity tomato in Tomato row")).toBeVisible();
  expect(garden.getByText("Replant Celebrity tomato in Tomato row")).toBeVisible();
  expect(garden.getByText("Set aside seeds of Celebrity tomato")).toBeVisible();
});

test("the Gardener can mark a Care event done and it leaves the due list", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  const water = garden.getByText("Water Celebrity tomato in Tomato row").closest("li");
  expect(water).not.toBeNull();
  await userEvent.click(within(water!).getByRole("button", { name: "Mark done" }));

  expect(garden.queryByText("Water Celebrity tomato in Tomato row")).toBeNull();
  expect(garden.getByText("Harvest Celebrity tomato in Tomato row")).toBeVisible();
  expect(garden.getByText("Replant Celebrity tomato in Tomato row")).toBeVisible();
  expect(garden.getByText("Set aside seeds of Celebrity tomato")).toBeVisible();
});

test("set aside seeds uses the Variety's seed-save count, not a made-up number", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
        seedSaveCount: 47,
      },
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
        seedSaveCount: 12,
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(garden.getByText("Set aside 47 seeds of Celebrity tomato")).toBeVisible();
  expect(garden.queryByText("Set aside 12 seeds of Celebrity tomato")).toBeNull();
  expect(garden.queryByText("Set aside seeds of Celebrity tomato")).toBeNull();
});

test("an open Care event is due on the lock screen", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  const care = within(garden.getByRole("list", { name: "Care events" }));
  expect(care.getByText("Water Celebrity tomato in Tomato row")).toBeVisible();
  expect(care.getByText("Harvest Celebrity tomato in Tomato row")).toBeVisible();
  expect(care.getByText("Replant Celebrity tomato in Tomato row")).toBeVisible();
  expect(care.getByText("Set aside seeds of Celebrity tomato")).toBeVisible();
});

test("marking a Care event done clears it from the lock screen", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  const water = garden.getByText("Water Celebrity tomato in Tomato row").closest("li");
  expect(water).not.toBeNull();
  await userEvent.click(within(water!).getByRole("button", { name: "Mark done" }));

  const care = within(garden.getByRole("list", { name: "Care events" }));
  expect(garden.queryByText("Water Celebrity tomato in Tomato row")).toBeNull();
  expect(care.getByText("Harvest Celebrity tomato in Tomato row")).toBeVisible();
  expect(care.getByText("Replant Celebrity tomato in Tomato row")).toBeVisible();
  expect(care.getByText("Set aside seeds of Celebrity tomato")).toBeVisible();
});

test("a second profile does not receive lock-screen Care events", async () => {
  const household = createHousehold();
  const catalog: Variety[] = [
    {
      name: "Celebrity tomato",
      category: "vegetables",
      kind: "tomato",
      fit: "fair",
      why: "Sets fruit here, then stalls in July humidity.",
    },
  ];
  const first = openGarden({ household, catalog });

  await openAsGardener(first);
  await nameTheBed(first, "Back", "Tomato row");
  await startThePlanting(first, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(first.getByText("Water Celebrity tomato in Tomato row")).toBeVisible();

  const stranger = openGarden({ household, catalog });
  await openAsGardener(stranger, {
    email: "cade@garden.test",
    password: "another-notebook",
  });

  expect(stranger.getByRole("alert")).toHaveTextContent("There is only one Gardener.");
  expect(stranger.queryByRole("heading", { name: "Garden" })).toBeNull();
  expect(stranger.queryByText("Water Celebrity tomato in Tomato row")).toBeNull();
});

test("ending a Planting early as failed stops further water Care events", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Patio", "Basil pot");
  await startThePlanting(garden, {
    variety: "Queenette Thai basil",
    bed: "Patio · Basil pot",
    plantedOn: "2026-05-02",
    start: "seed",
  });

  expect(garden.getByText("Water Queenette Thai basil in Basil pot")).toBeVisible();

  const planting = garden.getByText("Queenette Thai basil · seed · 2026-05-02").closest("li");
  expect(planting).not.toBeNull();
  await userEvent.click(
    within(planting!).getByRole("button", { name: "End this Planting as failed" }),
  );

  expect(garden.queryByText("Water Queenette Thai basil in Basil pot")).toBeNull();
  expect(garden.getByText("Harvest Queenette Thai basil in Basil pot")).toBeVisible();
});

test("enough rain dismisses an open water Care event", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
    weather: rainyWeek(),
  });

  await openAsGardener(garden);
  await garden.findByRole("heading", { name: "Growing-place forecast" });
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(garden.queryByText("Water Celebrity tomato in Tomato row")).toBeNull();
  expect(garden.getByText("Rain already watered Celebrity tomato in Tomato row")).toBeVisible();
  expect(garden.getByText("Harvest Celebrity tomato in Tomato row")).toBeVisible();
});

test("a later dry day does not bring back water rain already dismissed", async () => {
  const tomato: Variety = {
    name: "Celebrity tomato",
    category: "vegetables",
    kind: "tomato",
    fit: "fair",
    why: "Sets fruit here, then stalls in July humidity.",
  };
  const gardenBook = createMemoryGardenBook();
  const wet = openGarden({
    catalog: [tomato],
    gardenBook,
    weather: rainyWeek(),
  });

  await openAsGardener(wet);
  await wet.findByRole("heading", { name: "Garden" });
  await nameTheBed(wet, "Back", "Tomato row");
  await startThePlanting(wet, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(wet.getByText("Rain already watered Celebrity tomato in Tomato row")).toBeVisible();
  await waitFor(async () => {
    expect((await gardenBook.load()).plantings).toHaveLength(1);
  });
  wet.unmount();

  const dry = openGarden({
    catalog: [tomato],
    gardenBook,
    weather: dryWeek(),
  });
  await openAsGardener(dry);

  expect(await dry.findByText("Rain already watered Celebrity tomato in Tomato row")).toBeVisible();
  expect(dry.queryByText("Water Celebrity tomato in Tomato row")).toBeNull();
});

test("weather still changes Care when the Garden is not open", async () => {
  const tomato: Variety = {
    name: "Celebrity tomato",
    category: "vegetables",
    kind: "tomato",
    fit: "fair",
    why: "Sets fruit here, then stalls in July humidity.",
  };
  const gardenBook = createMemoryGardenBook();
  const open = openGarden({
    catalog: [tomato],
    gardenBook,
    weather: dryWeek(),
  });

  await openAsGardener(open);
  await open.findByRole("heading", { name: "Garden" });
  await nameTheBed(open, "Back", "Tomato row");
  await startThePlanting(open, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(open.getByText("Water Celebrity tomato in Tomato row")).toBeVisible();
  await waitFor(async () => {
    expect((await gardenBook.load()).plantings).toHaveLength(1);
  });
  open.unmount();

  await gardenBook.save(applyWeatherToGarden(await gardenBook.load(), rainyWeek()));

  const closedStorm = openGarden({
    catalog: [tomato],
    gardenBook,
    weather: dryWeek(),
  });
  await openAsGardener(closedStorm);

  expect(
    await closedStorm.findByText("Rain already watered Celebrity tomato in Tomato row"),
  ).toBeVisible();
  expect(closedStorm.queryByText("Water Celebrity tomato in Tomato row")).toBeNull();
});

test("coming frost creates a frost Care event", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
    weather: frostWeek(),
  });

  await openAsGardener(garden);
  await garden.findByRole("heading", { name: "Growing-place forecast" });
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-01",
    start: "transplant",
  });

  expect(garden.getByText("Cover for frost on 2026-04-03")).toBeVisible();
});

test("coming frost does not create a frost Care event when nothing is in the ground", async () => {
  const garden = openGarden({
    weather: frostWeek(),
  });

  await openAsGardener(garden);
  await garden.findByRole("heading", { name: "Growing-place forecast" });

  expect(garden.getByText("Nothing is in the ground yet.")).toBeVisible();
  expect(garden.queryByText("Cover for frost on 2026-04-03")).toBeNull();
  expect(garden.queryByRole("heading", { name: "Care" })).toBeNull();
});

test("a Variety can show when-to-plant driven by the Growing-place forecast", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
    weather: frostWeek(),
  });

  await openAsGardener(garden);
  await garden.findByRole("heading", { name: "Growing-place forecast" });
  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "vegetables" }));
  await userEvent.click(garden.getByRole("link", { name: "tomato" }));
  await userEvent.click(garden.getByRole("link", { name: "Celebrity tomato" }));

  expect(await garden.findByRole("heading", { name: "Celebrity tomato" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "When to plant" })).toBeVisible();
  expect(garden.getByText("Don't set tomato out until this frost window.")).toBeVisible();
});

test("when-to-plant uses the Growing-place frost pair when the week is above freezing", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
      },
    ],
    weather: {
      today: { date: "2026-03-20", highF: 68, lowF: 46, inchesOfRain: 0 },
      week: [
        { date: "2026-03-20", highF: 68, lowF: 46, inchesOfRain: 0 },
        { date: "2026-03-21", highF: 70, lowF: 48, inchesOfRain: 0 },
        { date: "2026-03-22", highF: 72, lowF: 50, inchesOfRain: 0 },
        { date: "2026-03-23", highF: 71, lowF: 49, inchesOfRain: 0 },
        { date: "2026-03-24", highF: 69, lowF: 47, inchesOfRain: 0 },
        { date: "2026-03-25", highF: 67, lowF: 45, inchesOfRain: 0 },
        { date: "2026-03-26", highF: 66, lowF: 44, inchesOfRain: 0 },
      ],
    },
  });

  await openAsGardener(garden);
  await garden.findByRole("heading", { name: "Growing-place forecast" });
  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "vegetables" }));
  await userEvent.click(garden.getByRole("link", { name: "tomato" }));
  await userEvent.click(garden.getByRole("link", { name: "Celebrity tomato" }));

  expect(await garden.findByRole("heading", { name: "Celebrity tomato" })).toBeVisible();
  expect(garden.getByText("Don't set tomato out until this frost window.")).toBeVisible();
});

test("when-to-plant from the forecast is only for Varieties that wait on frost", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Contender peach",
        category: "fruit trees",
        kind: "peach",
        fit: "strong",
        why: "Sets fruit after our late frost.",
        finish: {
          photoreal: {
            src: "/varieties/contender-peach.jpg",
            alt: "Photoreal render of Contender peach",
          },
          winterFate: "leave out",
          difficulty: { level: "easy", why: "Late bloom misses our April frost." },
          harvest: { level: "solid", why: "A pie-worth of fruit." },
          whenToPlant: "Set a bare-root tree in February, before bud swell.",
          timeToHarvest: "Fruit in June to July.",
          soil: "Well-drained loam.",
          techniques: ["watering"],
        },
      },
    ],
    weather: frostWeek(),
  });

  await openAsGardener(garden);
  await garden.findByRole("heading", { name: "Growing-place forecast" });
  await goToCatalog(garden);
  await userEvent.click(await garden.findByRole("link", { name: "fruit trees" }));
  await userEvent.click(garden.getByRole("link", { name: "peach" }));
  await userEvent.click(garden.getByRole("link", { name: "Contender peach" }));

  expect(await garden.findByRole("heading", { name: "Contender peach" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "When to plant" })).toBeVisible();
  expect(garden.getByText("Set a bare-root tree in February, before bud swell.")).toBeVisible();
  expect(garden.queryByText("Don't set peach out until this frost window.")).toBeNull();
});

test("the Garden shows a Growing-place forecast glance for Fuquay-Varina, not a weather app", async () => {
  const garden = openGarden({
    loadForecast: async () => rainyWeek(),
  });

  await openAsGardener(garden);

  expect(garden.getByRole("heading", { name: "Garden" })).toBeVisible();
  expect(await garden.findByRole("heading", { name: "Growing-place forecast" })).toBeVisible();
  expect(garden.getByText("Today · 2026-06-15 · 84° / 68° · 0.4 in rain")).toBeVisible();
  expect(garden.getByText("This week")).toBeVisible();
  expect(garden.getByText("2026-06-16 · 86° / 70° · dry")).toBeVisible();
  expect(garden.getByText("Enough rain to dismiss water.")).toBeVisible();
  expect(garden.getByText("Fuquay-Varina, North Carolina")).toBeVisible();
  expect(garden.queryByRole("link", { name: "Weather" })).toBeNull();
  expect(garden.queryByRole("heading", { name: "Weather" })).toBeNull();
});

test("Areas are only Front, Side, Back, and Patio; the kitchen cannot be created as an Area", async () => {
  const garden = openGarden();

  await openAsGardener(garden);

  const area = garden.getByLabelText("Area");
  expect(within(area).getByRole("option", { name: "Front" })).toBeVisible();
  expect(within(area).getByRole("option", { name: "Side" })).toBeVisible();
  expect(within(area).getByRole("option", { name: "Back" })).toBeVisible();
  expect(within(area).getByRole("option", { name: "Patio" })).toBeVisible();
  expect(within(area).queryByRole("option", { name: /kitchen/i })).toBeNull();
  expect(within(area).queryByRole("option", { name: /indoors/i })).toBeNull();
});

test("the Shop list is a short curated set with website and Maps links that leave the app", async () => {
  const garden = openGarden({
    shops: [
      {
        name: "H Mart",
        kind: "Asian grocery",
        why: "Asian greens, Thai basil, and bitter melon.",
        website: "https://www.hmart.com/store/cary-nc-27519",
        maps: "https://www.google.com/maps/search/?api=1&query=H+Mart+Cary+NC",
      },
      {
        name: "Harris Teeter",
        kind: "American grocery",
        why: "Everyday produce and common pot herbs.",
        website: "https://www.harristeeter.com/stores/grocery/nc/fuquay-varina/fuquay-crossing/097/00498",
        maps: "https://www.google.com/maps/search/?api=1&query=Harris+Teeter+Fuquay-Varina+NC",
      },
      {
        name: "Logan's Garden Hut",
        kind: "plant shop",
        why: "Starts, shrubs, and trees for this Garden.",
        website: "https://www.logansgardenhut.com/",
        maps: "https://www.google.com/maps/search/?api=1&query=Logan%27s+Garden+Hut+Fuquay-Varina+NC",
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Shops" }));

  expect(await garden.findByRole("heading", { name: "Shops" })).toBeVisible();
  expect(garden.getByText("A short list of Shops for this Garden.")).toBeVisible();
  expect(garden.getByRole("heading", { name: "H Mart" })).toBeVisible();
  expect(garden.getByText("Asian grocery")).toBeVisible();
  expect(garden.getByText("Asian greens, Thai basil, and bitter melon.")).toBeVisible();
  expect(garden.getByRole("heading", { name: "Harris Teeter" })).toBeVisible();
  expect(garden.getByText("American grocery")).toBeVisible();
  expect(garden.getByRole("heading", { name: "Logan's Garden Hut" })).toBeVisible();
  expect(garden.getByText("plant shop")).toBeVisible();
  expect(garden.queryByText(/directory/i)).toBeNull();

  const website = garden.getByRole("link", { name: "H Mart website" });
  const maps = garden.getByRole("link", { name: "H Mart Google Maps" });
  expect(website).toHaveAttribute("href", "https://www.hmart.com/store/cary-nc-27519");
  expect(website).toHaveAttribute("target", "_blank");
  expect(website).toHaveAttribute("rel", "noreferrer");
  expect(maps).toHaveAttribute(
    "href",
    "https://www.google.com/maps/search/?api=1&query=H+Mart+Cary+NC",
  );
  expect(maps).toHaveAttribute("target", "_blank");
  expect(maps).toHaveAttribute("rel", "noreferrer");
});

test("a Variety can show a Buy place", async () => {
  const garden = openGarden({
    shops: [
      {
        name: "H Mart",
        kind: "Asian grocery",
        why: "Asian greens, Thai basil, and bitter melon.",
        website: "https://www.hmart.com/store/cary-nc-27519",
        maps: "https://www.google.com/maps/search/?api=1&query=H+Mart+Cary+NC",
      },
    ],
    catalog: [
      {
        name: "Queenette Thai basil",
        category: "herbs",
        kind: "Thai basil",
        fit: "strong",
        why: "Thrives in humid heat.",
        buyPlace: { shop: "H Mart", channel: "grocery" },
      },
    ],
  });

  await openAsGardener(garden);
  await userEvent.click(garden.getByRole("link", { name: "Catalog" }));
  await userEvent.click(await garden.findByRole("link", { name: "herbs" }));
  await userEvent.click(garden.getByRole("link", { name: "Thai basil" }));
  await userEvent.click(garden.getByRole("link", { name: "Queenette Thai basil" }));

  expect(await garden.findByRole("heading", { name: "Queenette Thai basil" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "Buy place" })).toBeVisible();
  await userEvent.click(garden.getByRole("link", { name: "grocery at H Mart" }));
  expect(await garden.findByRole("heading", { name: "Shops" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "H Mart" })).toBeVisible();
});

test("setting Stay to indoors does not change Area, and the Gardener can bring the Planting back to its Bed", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Improved Meyer lemon",
        category: "fruit trees",
        kind: "lemon",
        fit: "weak",
        why: "Has to come inside before November frost.",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Patio", "Lemon pot");
  await startThePlanting(garden, {
    variety: "Improved Meyer lemon",
    bed: "Patio · Lemon pot",
    plantedOn: "2025-04-12",
    start: "tree",
  });

  expect(garden.getByRole("heading", { name: "Patio" })).toBeVisible();
  expect(garden.getByRole("heading", { name: "Lemon pot" })).toBeVisible();
  expect(garden.getByText("Improved Meyer lemon · tree · 2025-04-12")).toBeVisible();
  expect(garden.getByText("Stay: in-bed")).toBeVisible();
  expect(garden.queryByRole("heading", { name: /kitchen/i })).toBeNull();

  await userEvent.click(garden.getByRole("button", { name: "Bring indoors" }));

  expect(garden.getByRole("heading", { name: "Patio" })).toBeVisible();
  expect(garden.getByText("Stay: indoors")).toBeVisible();
  expect(garden.queryByText("Stay: in-bed")).toBeNull();
  expect(garden.queryByRole("heading", { name: /kitchen/i })).toBeNull();
  expect(garden.queryByRole("heading", { name: /indoors/i })).toBeNull();
  expect(garden.getByText("Improved Meyer lemon · tree · 2025-04-12")).toBeVisible();

  await userEvent.click(garden.getByRole("button", { name: "Bring back to the Bed" }));

  expect(garden.getByRole("heading", { name: "Patio" })).toBeVisible();
  expect(garden.getByText("Stay: in-bed")).toBeVisible();
  expect(garden.queryByText("Stay: indoors")).toBeNull();
});

test("a Bed can override Soil; the Variety default remains when there is no override", async () => {
  const garden = openGarden({
    catalog: [
      {
        name: "Improved Meyer lemon",
        category: "fruit trees",
        kind: "lemon",
        fit: "weak",
        why: "Has to come inside before November frost.",
        soil: "citrus pot mix",
        fertilizer: "monthly citrus food in summer",
      },
      {
        name: "Celebrity tomato",
        category: "vegetables",
        kind: "tomato",
        fit: "fair",
        why: "Sets fruit here, then stalls in July humidity.",
        soil: "loose garden loam",
        fertilizer: "a light spring feed",
      },
    ],
  });

  await openAsGardener(garden);
  await nameTheBed(garden, "Patio", "Lemon pot");
  await nameTheBed(garden, "Back", "Tomato row");
  await startThePlanting(garden, {
    variety: "Improved Meyer lemon",
    bed: "Patio · Lemon pot",
    plantedOn: "2025-04-12",
    start: "tree",
  });
  await startThePlanting(garden, {
    variety: "Celebrity tomato",
    bed: "Back · Tomato row",
    plantedOn: "2026-04-12",
    start: "transplant",
  });

  expect(garden.getByText("Soil: citrus pot mix")).toBeVisible();
  expect(garden.getByText("Soil: loose garden loam")).toBeVisible();
  expect(garden.getByText("Fertilizer advice: monthly citrus food in summer")).toBeVisible();
  expect(garden.queryByText(/fertilizer is due/i)).toBeNull();
  expect(garden.queryByRole("button", { name: /fertilizer/i })).toBeNull();
  expect(
    within(garden.getByRole("list", { name: "Care events" })).queryByText(/fertilizer/i),
  ).toBeNull();

  await userEvent.type(garden.getByLabelText("Soil override for Lemon pot"), "amended clay");
  await userEvent.click(garden.getByRole("button", { name: "Override Soil for Lemon pot" }));

  expect(garden.getByText("Soil: amended clay")).toBeVisible();
  expect(garden.queryByText("citrus pot mix")).toBeNull();
  expect(garden.getByText("Soil: loose garden loam")).toBeVisible();
  expect(garden.getByText("Fertilizer advice: monthly citrus food in summer")).toBeVisible();
});

function dryWeek(): GrowingPlaceForecast {
  const week: ForecastDay[] = [
    { date: "2026-06-16", highF: 86, lowF: 70, inchesOfRain: 0 },
    { date: "2026-06-17", highF: 88, lowF: 71, inchesOfRain: 0 },
    { date: "2026-06-18", highF: 87, lowF: 70, inchesOfRain: 0 },
    { date: "2026-06-19", highF: 85, lowF: 69, inchesOfRain: 0 },
    { date: "2026-06-20", highF: 84, lowF: 68, inchesOfRain: 0 },
    { date: "2026-06-21", highF: 86, lowF: 70, inchesOfRain: 0 },
    { date: "2026-06-22", highF: 87, lowF: 71, inchesOfRain: 0 },
  ];
  return { today: week[0], week };
}

function rainyWeek(): GrowingPlaceForecast {
  const week: ForecastDay[] = [
    { date: "2026-06-15", highF: 84, lowF: 68, inchesOfRain: 0.4 },
    { date: "2026-06-16", highF: 86, lowF: 70, inchesOfRain: 0 },
    { date: "2026-06-17", highF: 88, lowF: 71, inchesOfRain: 0 },
    { date: "2026-06-18", highF: 87, lowF: 70, inchesOfRain: 0 },
    { date: "2026-06-19", highF: 85, lowF: 69, inchesOfRain: 0 },
    { date: "2026-06-20", highF: 84, lowF: 68, inchesOfRain: 0 },
    { date: "2026-06-21", highF: 86, lowF: 70, inchesOfRain: 0 },
  ];
  return { today: week[0], week };
}

function frostWeek(): GrowingPlaceForecast {
  const week: ForecastDay[] = [
    { date: "2026-04-02", highF: 58, lowF: 41, inchesOfRain: 0 },
    { date: "2026-04-03", highF: 55, lowF: 28, inchesOfRain: 0 },
    { date: "2026-04-04", highF: 62, lowF: 40, inchesOfRain: 0 },
    { date: "2026-04-05", highF: 68, lowF: 46, inchesOfRain: 0 },
    { date: "2026-04-06", highF: 70, lowF: 48, inchesOfRain: 0 },
    { date: "2026-04-07", highF: 72, lowF: 50, inchesOfRain: 0 },
    { date: "2026-04-08", highF: 74, lowF: 52, inchesOfRain: 0 },
  ];
  return { today: week[0], week };
}

async function nameTheBed(garden: RenderResult, area: string, name: string) {
  await userEvent.selectOptions(garden.getByLabelText("Area"), area);
  const bedName = garden.getByLabelText("Bed name");
  await userEvent.clear(bedName);
  await userEvent.type(bedName, name);
  await userEvent.click(garden.getByRole("button", { name: "Name the Bed" }));
}

async function startThePlanting(
  garden: RenderResult,
  planting: { variety: string; bed: string; plantedOn: string; start: string },
) {
  await userEvent.selectOptions(garden.getByLabelText("Variety"), planting.variety);
  await userEvent.selectOptions(garden.getByLabelText("Bed"), planting.bed);
  fireEvent.change(garden.getByLabelText("Planted on"), { target: { value: planting.plantedOn } });
  await userEvent.selectOptions(garden.getByLabelText("Start"), planting.start);
  await userEvent.click(garden.getByRole("button", { name: "Start the Planting" }));
}
