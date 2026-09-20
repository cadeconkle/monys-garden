import { fireEvent, within, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createHousehold } from "./household";
import { openAsGardener, openGarden } from "./open-garden";

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
  await userEvent.click(garden.getByRole("link", { name: "Open the Catalog" }));
  expect(await garden.findByRole("heading", { name: "Catalog" })).toBeVisible();
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

  await userEvent.type(garden.getByLabelText("Soil override for Lemon pot"), "amended clay");
  await userEvent.click(garden.getByRole("button", { name: "Override Soil for Lemon pot" }));

  expect(garden.getByText("Soil: amended clay")).toBeVisible();
  expect(garden.queryByText("citrus pot mix")).toBeNull();
  expect(garden.getByText("Soil: loose garden loam")).toBeVisible();
  expect(garden.getByText("Fertilizer advice: monthly citrus food in summer")).toBeVisible();
});

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
