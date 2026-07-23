import express from "express";
import cors from "cors";
import { prisma } from "./db";
import { runMigrations } from "./migrate";
import { seedDefaults } from "./seed";

import { authRouter } from "./routes/auth";
import { farmersRouter } from "./routes/farmers";
import { suppliersRouter } from "./routes/suppliers";
import { customersRouter } from "./routes/customers";
import { purchasesRouter } from "./routes/purchases";
import { salesRouter } from "./routes/sales";
import { warehousesRouter } from "./routes/warehouses";
import { stockMovementsRouter } from "./routes/stockMovements";
import { expensesRouter } from "./routes/expenses";
import { incomesRouter } from "./routes/incomes";
import { settingsRouter } from "./routes/settings";
import { reportsRouter } from "./routes/reports";

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/farmers", farmersRouter);
  app.use("/api/suppliers", suppliersRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/purchases", purchasesRouter);
  app.use("/api/sales", salesRouter);
  app.use("/api/warehouses", warehousesRouter);
  app.use("/api/stock-movements", stockMovementsRouter);
  app.use("/api/expenses", expensesRouter);
  app.use("/api/incomes", incomesRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/reports", reportsRouter);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  });

  return app;
}

let started = false;

/**
 * Runs pending migrations, seeds default data (admin account, warehouse,
 * settings) on first launch, then starts listening. Safe to call once per
 * process — used both by Electron's main process and by `npm run dev:server`.
 */
export async function startServer(): Promise<void> {
  if (started) return;
  started = true;

  runMigrations();
  await seedDefaults();

  const app = buildApp();
  const port = Number(process.env.PORT ?? 4310);

  await new Promise<void>((resolve) => {
    app.listen(port, "127.0.0.1", () => {
      console.log(`[server] DaJEssI Business API en écoute sur http://127.0.0.1:${port}`);
      resolve();
    });
  });
}

// Allow running directly via `tsx watch server/src/index.ts` for local development.
if (require.main === module) {
  startServer().catch((err) => {
    console.error("Échec du démarrage du serveur :", err);
    process.exit(1);
  });
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
