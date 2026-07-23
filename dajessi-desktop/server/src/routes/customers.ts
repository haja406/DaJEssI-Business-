import { z } from "zod";
import { prisma } from "../db";
import { createCrudRouter } from "../utils/crudRouter";

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  customerType: z.enum(["individual", "wholesaler", "retailer", "institution"]).default("individual"),
  notes: z.string().optional().nullable(),
});

export const customersRouter = createCrudRouter(prisma.customer, {
  schema: customerSchema,
  orderBy: { createdAt: "desc" },
});
