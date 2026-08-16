# Built from the monorepo root: `docker build -f apps/api/Dockerfile .`
# (docker-compose.yml sets context: .. accordingly).
FROM node:20-slim AS base
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
COPY packages/contracts packages/contracts
COPY packages/cv-render packages/cv-render
COPY apps/api apps/api
RUN pnpm --filter @cv-maker/contracts run typecheck || true
RUN pnpm --filter @cv-maker/api exec prisma generate
RUN pnpm --filter @cv-maker/api run build

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
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
