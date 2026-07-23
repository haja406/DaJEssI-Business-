import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireDeletePermission } from "../middleware/auth";

const purchaseSchema = z.object({
  purchaseNumber: z.string().min(1),
  date: z.coerce.date(),
  farmerId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  riceType: z.string().default("Paddy"),
  quantityKg: z.number().positive(),
  unitPrice: z.number().positive(),
  paymentStatus: z.enum(["PAID", "PARTIAL", "UNPAID"]).default("UNPAID"),
  amountPaid: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  // Not stored on Purchase itself — used to create the linked stock entry.
  warehouseId: z.string().optional().nullable(),
});

export const purchasesRouter = Router();

purchasesRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await prisma.purchase.findMany({
    include: { farmer: true, supplier: true },
    orderBy: { date: "desc" },
  });
  res.json(rows);
});

purchasesRouter.get("/:id", requireAuth, async (req, res) => {
  const row = await prisma.purchase.findUnique({
    where: { id: req.params.id },
    include: { farmer: true, supplier: true, stockMoves: true },
  });
  if (!row) return res.status(404).json({ error: "Introuvable." });
  res.json(row);
});

purchasesRouter.post("/", requireAuth, async (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  const { warehouseId, ...data } = parsed.data;
  const total = data.quantityKg * data.unitPrice;

  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({ data: { ...data, total }, include: { farmer: true, supplier: true } });
      if (warehouseId) {
        await tx.stockMovement.create({
          data: {
            date: data.date,
            warehouseId,
            type: "ENTRY",
            riceType: data.riceType,
            quantityKg: data.quantityKg,
            reason: `Achat ${data.purchaseNumber}`,
            purchaseId: created.id,
            createdById: data.createdById ?? undefined,
          },
        });
      }
      return created;
    });
    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

purchasesRouter.put("/:id", requireAuth, async (req, res) => {
  const parsed = purchaseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  const { warehouseId: _warehouseId, ...data } = parsed.data;
  const patch: Record<string, unknown> = { ...data };
  if (data.quantityKg !== undefined || data.unitPrice !== undefined) {
    const existing = await prisma.purchase.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Introuvable." });
    const quantityKg = data.quantityKg ?? existing.quantityKg;
    const unitPrice = data.unitPrice ?? existing.unitPrice;
    patch.total = quantityKg * unitPrice;
  }
  const row = await prisma.purchase.update({ where: { id: req.params.id }, data: patch, include: { farmer: true, supplier: true } });
  res.json(row);
});

purchasesRouter.delete("/:id", requireAuth, requireDeletePermission, async (req, res) => {
  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { purchaseId: req.params.id } }),
    prisma.purchase.delete({ where: { id: req.params.id } }),
  ]);
  res.status(204).send();
});
