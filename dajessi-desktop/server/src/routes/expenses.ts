import { z } from "zod";
import { prisma } from "../db";
import { createCrudRouter } from "../utils/crudRouter";

const expenseSchema = z.object({
  date: z.coerce.date(),
  category: z.enum(["TRANSPORT", "SALARY", "FUEL", "ELECTRICITY", "RENT", "MAINTENANCE", "OTHER"]),
  description: z.string().min(2),
  amount: z.number().positive(),
  notes: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
});

export const expensesRouter = createCrudRouter(prisma.expense, {
  schema: expenseSchema,
  orderBy: { date: "desc" },
});
