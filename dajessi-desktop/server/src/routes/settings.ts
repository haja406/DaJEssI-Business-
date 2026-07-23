import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const settingsRouter = Router();

settingsRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  res.json(rows);
});

const updateSchema = z.object({ value: z.string() });

settingsRouter.put("/:key", requireAuth, requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valeur invalide." });
  try {
    const row = await prisma.setting.update({ where: { key: req.params.key }, data: { value: parsed.data.value } });
    res.json(row);
  } catch {
    res.status(404).json({ error: "Paramètre introuvable." });
  }
});
