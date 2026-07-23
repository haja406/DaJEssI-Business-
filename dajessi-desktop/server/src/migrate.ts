import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";

/**
 * Applies any pending Prisma migrations against the local SQLite database.
 * Works both in development (running from the repo) and in the packaged
 * Electron app (running from resourcesPath, where server/prisma was copied
 * as an extraResource — see package.json "build.extraResources").
 */
export function runMigrations(): void {
  const isPackaged = process.env.DAJESSI_PACKAGED === "1";

  const schemaPath = isPackaged
    ? path.join(process.resourcesPath, "prisma", "schema.prisma")
    : path.join(__dirname, "..", "..", "server", "prisma", "schema.prisma");

  const prismaCliEntry = isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "node_modules", "prisma", "build", "index.js")
    : require.resolve("prisma/build/index.js");

  if (!fs.existsSync(schemaPath)) {
    console.warn(`[migrate] Fichier de schéma introuvable : ${schemaPath} — migration ignorée.`);
    return;
  }

  try {
    execFileSync(process.execPath, [prismaCliEntry, "migrate", "deploy", "--schema", schemaPath], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
      stdio: "inherit",
    });
  } catch (err) {
    console.error("[migrate] Échec de l'application des migrations :", err);
    throw err;
  }
}
