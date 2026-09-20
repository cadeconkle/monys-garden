import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { createDeviceLockScreen } from "./device-lock-screen";
import { GardenApp } from "./garden-app";
import { createNetlifyGardenBook } from "./garden-book";
import { createHousehold } from "./household";
import { createNetlifyHousehold } from "./netlify-household";
import { loadGrowingPlaceForecast } from "./forecast";
import "./styles.css";

const lockScreen = createDeviceLockScreen();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Mony's Garden has nowhere to open.");
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <GardenApp
        household={import.meta.env.PROD ? createNetlifyHousehold() : createHousehold()}
        gardenBook={import.meta.env.PROD ? createNetlifyGardenBook() : undefined}
        loadForecast={loadGrowingPlaceForecast}
        lockScreen={lockScreen}
      />
    </BrowserRouter>
  </StrictMode>,
);
