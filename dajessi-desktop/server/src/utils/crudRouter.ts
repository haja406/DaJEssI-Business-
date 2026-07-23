import { Router } from "express";
import { z, type ZodType } from "zod";
import { requireAuth, requireDeletePermission } from "../middleware/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface PrismaDelegate {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface CrudRouterOptions {
  schema: ZodType;
  updateSchema?: ZodType;
  orderBy?: Record<string, "asc" | "desc">;
  include?: Record<string, boolean>;
  beforeCreate?: (data: Record<string, unknown>) => Record<string, unknown>;
  beforeUpdate?: (data: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Builds a full REST CRUD router (list, get, create, update, delete) for a
 * given Prisma model delegate. Used for the simple, single-table modules
 * (farmers, suppliers, customers, warehouses, expenses, incomes). Modules
 * with derived calculations or cross-table side effects (purchases, sales,
 * stock movements) use bespoke routers instead.
 */
export function createCrudRouter(delegate: PrismaDelegate, options: CrudRouterOptions): Router {
  const router = Router();
  const updateSchema = options.updateSchema ?? options.schema.partial();

  router.get("/", requireAuth, async (_req, res) => {
    try {
      const rows = await delegate.findMany({
        orderBy: options.orderBy,
        include: options.include,
      });
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.get("/:id", requireAuth, async (req, res) => {
    try {
      const row = await delegate.findUnique({ where: { id: req.params.id }, include: options.include });
      if (!row) return res.status(404).json({ error: "Introuvable." });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.post("/", requireAuth, async (req, res) => {
    const parsed = options.schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
    }
    try {
      const data = options.beforeCreate ? options.beforeCreate(parsed.data as Record<string, unknown>) : parsed.data;
      const row = await delegate.create({ data, include: options.include });
      res.status(201).json(row);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.put("/:id", requireAuth, async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
    }
    try {
      const data = options.beforeUpdate ? options.beforeUpdate(parsed.data as Record<string, unknown>) : parsed.data;
      const row = await delegate.update({ where: { id: req.params.id }, data, include: options.include });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.delete("/:id", requireAuth, requireDeletePermission, async (req, res) => {
    try {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}

export { z };
