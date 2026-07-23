import bcrypt from "bcryptjs";
import { prisma } from "./db";

export async function seedDefaults(): Promise<void> {
  const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: { fullName: "Administrateur", username: "admin", passwordHash, role: "ADMINISTRATOR" },
    });
    console.log("[seed] Compte administrateur créé : admin / admin123 (à changer après la première connexion)");
  }

  const existingWarehouse = await prisma.warehouse.findFirst();
  if (!existingWarehouse) {
    await prisma.warehouse.create({
      data: {
        name: "Entrepôt principal",
        location: "Fokontany Marirano, Commune Marondry, District Ankazobe",
        capacityKg: 20000,
        lowStockThresholdKg: 500,
      },
    });
    console.log("[seed] Entrepôt principal créé");
  }

  const defaults: { key: string; label: string; value: string }[] = [
    { key: "company_name", label: "Nom de l'entreprise", value: "DaJEssy'Varotra" },
    { key: "company_address", label: "Adresse", value: "Fokontany Marirano, Commune Marondry, District Ankazobe (RN4)" },
    { key: "company_phone", label: "Téléphone", value: "" },
    { key: "company_email", label: "Email", value: "" },
    { key: "currency", label: "Devise", value: "MGA" },
    { key: "purchase_price_per_kg", label: "Prix d'achat par défaut (Ar/kg)", value: "900" },
    { key: "selling_price_per_kg", label: "Prix de vente par défaut (Ar/kg)", value: "2500" },
    { key: "rice_yield_pct", label: "Rendement décorticage (%)", value: "65" },
  ];
  for (const s of defaults) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
}
