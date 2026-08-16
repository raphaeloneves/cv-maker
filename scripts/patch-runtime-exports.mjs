// Docker-build-only tool. Run against a BUILD-STAGE COPY of the repo (never
// against the actual source tree — this script is not invoked by any local
// dev workflow) after `packages/contracts` and `packages/cv-render` have
// been compiled to `dist/`.
//
// Why this exists: those two packages' real package.json (in source control)
// points `main`/`types`/`exports["."]` at `./src/index.ts` — deliberately,
// because that lets tsx (apps/api dev) and Vite (apps/web dev) consume the
// TypeScript source directly with instant HMR across the whole workspace,
// with no separate build step to remember to run while developing.
//
// Plain `node dist/server.js` in the production image has no such loader —
// it can only resolve to real, already-compiled `.js` files. So the
// production image needs these two packages' package.json to point at
// `./dist/index.js` instead, but ONLY inside the image; the source-of-truth
// files in the repo must keep pointing at `src` for the dev experience above
// to keep working. Hence: patch a copy, in a build stage, never the source.
import { readFileSync, writeFileSync } from "node:fs";

const targets = ["packages/contracts/package.json", "packages/cv-render/package.json"];

for (const path of targets) {
  const pkg = JSON.parse(readFileSync(path, "utf-8"));
  pkg.main = "./dist/index.js";
  pkg.types = "./dist/index.d.ts";
  if (pkg.exports && typeof pkg.exports === "object" && "." in pkg.exports) {
    pkg.exports["."] = "./dist/index.js";
  }
  writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`patched ${path} -> dist`);
}
