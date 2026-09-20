import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GardenApp } from "./garden-app";
import { createHousehold } from "./household";
import { createNetlifyHousehold } from "./netlify-household";
import { loadGrowingPlaceForecast } from "./weather";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Mony's Garden has nowhere to open.");
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <GardenApp
        household={import.meta.env.PROD ? createNetlifyHousehold() : createHousehold()}
        loadForecast={loadGrowingPlaceForecast}
      />
    </BrowserRouter>
  </StrictMode>,
);
