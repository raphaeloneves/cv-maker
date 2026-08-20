import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// Routes that require a signed-in session render a static app shell with no
// meaningful content for a logged-out crawler (see the `noindex` prop each
// of these pages passes to BaseLayout/BuilderLayout) — kept out of the
// sitemap for the same reason, and in one place so the two can't drift.
const GATED_PATH_PREFIXES = ["/dashboard", "/account", "/billing", "/optimizer", "/builder", "/academy"];

// Static output — all dynamic state comes from the API (apps/api) over
// fetch/TanStack Query, so no Astro SSR/adapter is needed. Deploys as-is to
// Cloudflare Pages. See /Users/rneves/.claude/plans/calm-enchanting-wilkes.md.
export default defineConfig({
  output: "static",
  // Canonical production origin — required for correct <link rel="canonical">
  // tags, Open Graph URLs, and absolute sitemap.xml entries. Update this if
  // the production domain ever changes; every other absolute URL in the app
  // is derived from it, nothing else hardcodes it.
  site: "https://cvmaker.flathire.agency",
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !GATED_PATH_PREFIXES.some((prefix) => new URL(page).pathname.startsWith(prefix)),
    }),
  ],
});
