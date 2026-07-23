import { z } from "zod";
import { prisma } from "../db";
import { createCrudRouter } from "../utils/crudRouter";

const supplierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  itemsSupplied: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const suppliersRouter = createCrudRouter(prisma.supplier, {
  schema: supplierSchema,
  orderBy: { createdAt: "desc" },
});
