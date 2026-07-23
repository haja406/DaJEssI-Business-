import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Identifiants requis." });

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !user.active) return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "12h" }
  );

  res.json({
    token,
    user: { id: user.id, fullName: user.fullName, username: user.username, role: user.role },
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "Introuvable." });
  res.json({ id: user.id, fullName: user.fullName, username: user.username, role: user.role });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Mot de passe invalide (6 caractères min.)." });

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "Introuvable." });

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Mot de passe actuel incorrect." });

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
});

// ---------- User management (administrator only) ----------
const userSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["ADMINISTRATOR", "EMPLOYEE"]).default("EMPLOYEE"),
});

authRouter.get("/users", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, username: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

authRouter.post("/users", requireAuth, requireAdmin, async (req, res) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) return res.status(409).json({ error: "Ce nom d'utilisateur existe déjà." });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      username: parsed.data.username,
      role: parsed.data.role,
      passwordHash,
    },
    select: { id: true, fullName: true, username: true, role: true, active: true },
  });
  res.status(201).json(user);
});

authRouter.put("/users/:id/toggle-active", requireAuth, requireAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "Introuvable." });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { active: !user.active } });
  res.json({ id: updated.id, active: updated.active });
});
