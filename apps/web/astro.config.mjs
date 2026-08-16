import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// Static output — all dynamic state comes from the API (apps/api) over
// fetch/TanStack Query, so no Astro SSR/adapter is needed. Deploys as-is to
// Cloudflare Pages. See /Users/rneves/.claude/plans/calm-enchanting-wilkes.md.
export default defineConfig({
  output: "static",
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
});
