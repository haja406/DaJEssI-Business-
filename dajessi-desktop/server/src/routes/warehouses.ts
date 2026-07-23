import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireDeletePermission } from "../middleware/auth";

const warehouseSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional().nullable(),
  capacityKg: z.number().min(0).default(0),
  lowStockThresholdKg: z.number().min(0).default(500),
});

export const warehousesRouter = Router();

async function withComputedStock(warehouseId: string) {
  const [entries, exits] = await Promise.all([
    prisma.stockMovement.aggregate({ _sum: { quantityKg: true }, where: { warehouseId, type: "ENTRY" } }),
    prisma.stockMovement.aggregate({ _sum: { quantityKg: true }, where: { warehouseId, type: "EXIT" } }),
  ]);
  return (entries._sum.quantityKg ?? 0) - (exits._sum.quantityKg ?? 0);
}

warehousesRouter.get("/", requireAuth, async (_req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({ orderBy: { name: "asc" } });
    const withStock = await Promise.all(
      warehouses.map(async (w) => {
        const currentStockKg = await withComputedStock(w.id);
        return { ...w, currentStockKg, lowStock: currentStockKg <= w.lowStockThresholdKg };
      })
    );
    res.json(withStock);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

warehousesRouter.get("/:id", requireAuth, async (req, res) => {
  const w = await prisma.warehouse.findUnique({ where: { id: req.params.id } });
  if (!w) return res.status(404).json({ error: "Introuvable." });
  const currentStockKg = await withComputedStock(w.id);
  res.json({ ...w, currentStockKg, lowStock: currentStockKg <= w.lowStockThresholdKg });
});

warehousesRouter.post("/", requireAuth, async (req, res) => {
  const parsed = warehouseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  const w = await prisma.warehouse.create({ data: parsed.data });
  res.status(201).json(w);
});

warehousesRouter.put("/:id", requireAuth, async (req, res) => {
  const parsed = warehouseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  const w = await prisma.warehouse.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(w);
});

warehousesRouter.delete("/:id", requireAuth, requireDeletePermission, async (req, res) => {
  await prisma.warehouse.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
