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
  // `@dnd-kit/*` (drag-to-reorder in the CV content step) is only reachable
  // from /builder/content's own module graph, not from any earlier step's —
  // so `astro dev`'s on-demand dep pre-bundler doesn't discover it until the
  // first time someone actually lands on that page. That first navigation
  // then races the re-optimize (dnd-kit's chunks 503 while esbuild re-runs),
  // and if a full-reload signal gets missed the page is left hydrating an
  // island whose import() rejected forever — the "stuck on loading" bug.
  // Listing it here makes it part of the startup pre-bundle instead.
  vite: {
    optimizeDeps: {
      include: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
    },
  },
});
