import { z } from "zod";
import { prisma } from "../db";
import { createCrudRouter } from "../utils/crudRouter";

const farmerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  village: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const farmersRouter = createCrudRouter(prisma.farmer, {
  schema: farmerSchema,
  orderBy: { createdAt: "desc" },
});
