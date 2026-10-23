import { defineConfig } from "astro/config";

const pages = Boolean(process.env.CI);

export default defineConfig({
  site: "https://bycombinator.github.io",
  base: pages ? "/webpage" : "/",
  server: { port: 4173, host: true },
  devToolbar: { enabled: false },
  vite: {
    server: { port: 4173 },
  },
});
