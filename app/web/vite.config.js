import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Build to ../web/dist would clash; we build into ./dist and the server resolves it.
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    // Dev proxy: forward API/WS to a locally running `mercury dashboard`.
    proxy: {
      "/api": "http://127.0.0.1:7777",
      "/ws": { target: "ws://127.0.0.1:7777", ws: true },
    },
  },
});
