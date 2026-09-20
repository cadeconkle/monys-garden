/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "lock-screen-sw.js", "lock-screen-care.js"],
      workbox: {
        importScripts: ["lock-screen-sw.js"],
      },
      manifest: {
        name: "Mony's Garden",
        short_name: "Garden",
        description: "The household garden in Fuquay-Varina, North Carolina",
        theme_color: "#1F6A3C",
        background_color: "#D4B78A",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
