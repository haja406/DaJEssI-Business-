import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the whole embedded server process.
export const prisma = new PrismaClient();
