import { render, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Technique, Variety } from "./catalog";
import { GardenApp } from "./garden-app";
import { createHousehold, type Household } from "./household";
import type { Shop } from "./shops";

export function openGarden(options?: {
  household?: Household;
  catalog?: readonly Variety[];
  techniques?: readonly Technique[];
  shops?: readonly Shop[];
}): RenderResult & {
  household: Household;
} {
  const household = options?.household ?? createHousehold();
  const host = document.createElement("div");
  document.body.append(host);
  const view = render(
    <MemoryRouter>
      <GardenApp
        household={household}
        catalog={options?.catalog}
        techniques={options?.techniques}
        shops={options?.shops}
      />
    </MemoryRouter>,
    { container: host, baseElement: host },
  );

  return { ...view, household };
}

export async function openAsGardener(
  view: RenderResult,
  credentials = { email: "mony@garden.test", password: "soil-and-rain" },
) {
  const keyboard = userEvent.setup();
  await keyboard.type(await view.findByLabelText("Email"), credentials.email);
  await keyboard.type(view.getByLabelText("Password"), credentials.password);
  await keyboard.click(view.getByRole("button", { name: "Open the garden" }));
}
