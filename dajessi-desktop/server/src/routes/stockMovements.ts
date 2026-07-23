import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireDeletePermission } from "../middleware/auth";

const movementSchema = z.object({
  date: z.coerce.date(),
  warehouseId: z.string().min(1),
  type: z.enum(["ENTRY", "EXIT"]),
  riceType: z.string().default("Riz blanc"),
  quantityKg: z.number().positive(),
  reason: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
});

export const stockMovementsRouter = Router();

stockMovementsRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await prisma.stockMovement.findMany({
    include: { warehouse: true },
    orderBy: { date: "desc" },
  });
  res.json(rows);
});

stockMovementsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  const row = await prisma.stockMovement.create({ data: parsed.data, include: { warehouse: true } });
  res.status(201).json(row);
});

stockMovementsRouter.delete("/:id", requireAuth, requireDeletePermission, async (req, res) => {
  await prisma.stockMovement.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
