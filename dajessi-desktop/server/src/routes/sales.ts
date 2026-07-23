import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireDeletePermission } from "../middleware/auth";

const saleSchema = z.object({
  invoiceNumber: z.string().min(1),
  date: z.coerce.date(),
  customerId: z.string().optional().nullable(),
  riceType: z.string().default("Riz blanc"),
  quantityKg: z.number().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
  costPerKg: z.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CREDIT"]).default("CASH"),
  notes: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  // Not stored on Sale itself — used to create the linked stock exit.
  warehouseId: z.string().optional().nullable(),
});

export const salesRouter = Router();

function computeTotals(quantityKg: number, unitPrice: number, discount: number, costPerKg: number) {
  const total = quantityKg * unitPrice - discount;
  const profit = total - quantityKg * costPerKg;
  return { total, profit };
}

salesRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await prisma.sale.findMany({ include: { customer: true }, orderBy: { date: "desc" } });
  res.json(rows);
});

salesRouter.get("/:id", requireAuth, async (req, res) => {
  const row = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { customer: true, stockMoves: true },
  });
  if (!row) return res.status(404).json({ error: "Introuvable." });
  res.json(row);
});

salesRouter.post("/", requireAuth, async (req, res) => {
  const parsed = saleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  const { warehouseId, ...data } = parsed.data;
  const { total, profit } = computeTotals(data.quantityKg, data.unitPrice, data.discount, data.costPerKg);

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({ data: { ...data, total, profit }, include: { customer: true } });
      if (warehouseId) {
        await tx.stockMovement.create({
          data: {
            date: data.date,
            warehouseId,
            type: "EXIT",
            riceType: data.riceType,
            quantityKg: data.quantityKg,
            reason: `Vente ${data.invoiceNumber}`,
            saleId: created.id,
            createdById: data.createdById ?? undefined,
          },
        });
      }
      return created;
    });
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

salesRouter.put("/:id", requireAuth, async (req, res) => {
  const parsed = saleSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  const { warehouseId: _warehouseId, ...data } = parsed.data;
  const patch: Record<string, unknown> = { ...data };
  if (data.quantityKg !== undefined || data.unitPrice !== undefined || data.discount !== undefined || data.costPerKg !== undefined) {
    const existing = await prisma.sale.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Introuvable." });
    const quantityKg = data.quantityKg ?? existing.quantityKg;
    const unitPrice = data.unitPrice ?? existing.unitPrice;
    const discount = data.discount ?? existing.discount;
    const costPerKg = data.costPerKg ?? existing.costPerKg;
    const { total, profit } = computeTotals(quantityKg, unitPrice, discount, costPerKg);
    patch.total = total;
    patch.profit = profit;
  }
  const row = await prisma.sale.update({ where: { id: req.params.id }, data: patch, include: { customer: true } });
  res.json(row);
});

salesRouter.delete("/:id", requireAuth, requireDeletePermission, async (req, res) => {
  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { saleId: req.params.id } }),
    prisma.sale.delete({ where: { id: req.params.id } }),
  ]);
  res.status(204).send();
});
