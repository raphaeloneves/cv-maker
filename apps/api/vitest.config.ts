import { defineConfig } from "vitest/config";

// Unit tests import service modules that read `./env.ts` at module load time
// (e.g. billing's stripe-client.ts, indirectly, via service.ts). These are
// dummy values only — no test talks to a real Postgres/S3/Stripe instance —
// just enough for `envSchema.parse(process.env)` to succeed during test
// collection.
export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_ACCESS_SECRET: "test-access-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
      S3_ENDPOINT: "http://localhost:9000",
      S3_BUCKET: "test-bucket",
      S3_ACCESS_KEY_ID: "test",
      S3_SECRET_ACCESS_KEY: "test",
      S3_PUBLIC_BASE_URL: "http://localhost:9000/test-bucket",
      STRIPE_SECRET_KEY: "sk_test_dummy",
      STRIPE_WEBHOOK_SECRET: "whsec_dummy",
      STRIPE_PRICE_ID: "price_dummy",
    },
  },
});
