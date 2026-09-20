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
