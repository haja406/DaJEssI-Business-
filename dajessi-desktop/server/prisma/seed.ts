// Standalone seed entry point for `npm run prisma:seed` during development.
// The same logic also runs automatically on every app startup (see
// server/src/index.ts) so a freshly installed desktop app seeds itself
// without requiring any manual command.
import { seedDefaults } from "../src/seed";
import { prisma } from "../src/db";

seedDefaults()
  .then(() => console.log("[seed] Terminé."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
