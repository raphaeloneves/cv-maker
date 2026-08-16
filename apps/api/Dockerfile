# Built from the monorepo root: `docker build -f apps/api/Dockerfile .`
# (docker-compose.yml sets context: .. accordingly).
#
# Node 22, not 20: corepack's `pnpm` shim resolves whatever pnpm version is
# pinned by the root package.json's `packageManager` field (see below), and
# recent pnpm majors require Node >=22.13 to even start ("No such built-in
# module: node:sqlite" on Node 20 is corepack/pnpm itself failing to load,
# not an app error). Keep this in sync with root package.json's `engines`.
FROM node:22-slim AS base
# Prisma's query engine is linked against a specific OpenSSL version and
# detects which one to fetch/generate for by probing the filesystem at
# `prisma generate` time — on a bare -slim image with no libssl installed at
# all, it silently guesses wrong (openssl-1.1.x) instead of failing loudly,
# then the *correct* engine (openssl-3.0.x, what Debian bookworm actually
# has) is missing at runtime. Installing openssl before `prisma generate`
# runs (in the build stage) makes detection accurate; installing it here in
# `base` also covers the runtime stage, which inherits from `base` too.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# --- deps: install once, cached across builds ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/cv-render/package.json packages/cv-render/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile || pnpm install

# --- build ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY scripts scripts
COPY packages/contracts packages/contracts
COPY packages/cv-render packages/cv-render
COPY apps/api apps/api
RUN pnpm --filter @cv-maker/contracts run typecheck || true
RUN pnpm --filter @cv-maker/api exec prisma generate
RUN pnpm --filter @cv-maker/api run build
# @cv-maker/contracts and @cv-maker/cv-render are consumed as raw TS source
# in dev (see scripts/patch-runtime-exports.mjs for why) — compile them for
# real here and repoint their package.json at the compiled output, but only
# in this build stage's filesystem copy, never in the source tree.
RUN pnpm --filter @cv-maker/contracts run build
RUN pnpm --filter @cv-maker/cv-render run build
RUN node scripts/patch-runtime-exports.mjs

# --- runtime ---
FROM base AS runtime
ENV NODE_ENV=production
# Puppeteer's bundled Chromium runtime dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2 \
  && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 4000
# Call the prisma binary directly rather than `pnpm exec prisma` — this
# runtime stage deliberately doesn't copy the root pnpm-workspace.yaml/
# package.json/lockfile (keeps the image lean), but `pnpm exec` in modern
# pnpm performs a workspace-aware dependency-status check that needs those
# files and fails without them ("no package named @cv-maker/contracts is
# present in the workspace"). The local .bin shim doesn't need any of that.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
