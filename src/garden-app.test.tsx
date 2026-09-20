import { within } from "@testing-library/react";
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
