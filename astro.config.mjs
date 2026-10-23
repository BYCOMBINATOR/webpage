import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  server: { port: 4173, host: true },
  devToolbar: { enabled: false },
  vite: {
    server: { port: 4173 },
  },
});
