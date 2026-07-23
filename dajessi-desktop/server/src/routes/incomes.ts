import { z } from "zod";
import { prisma } from "../db";
import { createCrudRouter } from "../utils/crudRouter";

const incomeSchema = z.object({
  date: z.coerce.date(),
  source: z.enum(["SALES", "OTHER"]).default("OTHER"),
  description: z.string().min(2),
  amount: z.number().positive(),
  notes: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
});

export const incomesRouter = createCrudRouter(prisma.income, {
  schema: incomeSchema,
  orderBy: { date: "desc" },
});
