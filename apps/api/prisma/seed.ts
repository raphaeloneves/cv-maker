// Dev/QA seed data. Run via `pnpm --filter @cv-maker/api run db:seed`.
//
// Creates one ADMIN account (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, see
// .env.example) that bypasses the paywall and watermark entirely — see
// hasActiveEntitlement() in packages/contracts/src/billing.ts. This is the
// "log in and skip payment" account requested for QA/demo purposes. It is
// never created via the public sign-up endpoint — only via this seed script.
import argon2 from "argon2";
import { PrismaClient } from "../generated/client/index.js";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin account seed.",
    );
    return;
  }

  const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN" },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      locale: "PT_PT",
      termsAcceptances: {
        create: { version: "seed-v1" },
      },
    },
  });

  console.log(`Seeded admin account: ${admin.email} (role=${admin.role}, id=${admin.id})`);
  console.log(
    "This account bypasses the paywall/watermark for every CV it owns — do not expose these credentials publicly.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
