import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const reportsRouter = Router();

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }

async function sumWhere(model: "purchase" | "sale" | "expense" | "income", field: string, where: Record<string, unknown>) {
  const delegate = (prisma as unknown as Record<string, { aggregate: (args: unknown) => Promise<{ _sum: Record<string, number | null> }> }>)[model];
  const result = await delegate.aggregate({ _sum: { [field]: true }, where });
  return result._sum[field] ?? 0;
}

// ---------- Main dashboard ----------
reportsRouter.get("/dashboard", requireAuth, async (_req, res) => {
  const now = new Date();
  const today = { gte: startOfDay(now), lte: endOfDay(now) };
  const thisMonth = { gte: startOfMonth(now), lte: endOfMonth(now) };

  const [
    todaySales, todayPurchases,
    monthlySalesTotal, monthlyPurchasesTotal, monthlyExpensesTotal, monthlyIncomeTotal,
    allSalesTotal, allPurchasesTotal, allExpensesTotal, allIncomeTotal,
    entries, exits,
    recentPurchases, recentSales, recentExpenses,
  ] = await Promise.all([
    sumWhere("sale", "total", { date: today }),
    sumWhere("purchase", "total", { date: today }),
    sumWhere("sale", "total", { date: thisMonth }),
    sumWhere("purchase", "total", { date: thisMonth }),
    sumWhere("expense", "amount", { date: thisMonth }),
    sumWhere("income", "amount", { date: thisMonth }),
    sumWhere("sale", "total", {}),
    sumWhere("purchase", "total", {}),
    sumWhere("expense", "amount", {}),
    sumWhere("income", "amount", {}),
    prisma.stockMovement.aggregate({ _sum: { quantityKg: true }, where: { type: "ENTRY" } }),
    prisma.stockMovement.aggregate({ _sum: { quantityKg: true }, where: { type: "EXIT" } }),
    prisma.purchase.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { farmer: true, supplier: true } }),
    prisma.sale.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { customer: true } }),
    prisma.expense.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
  ]);

  const currentStockKg = (entries._sum.quantityKg ?? 0) - (exits._sum.quantityKg ?? 0);
  const monthlyRevenue = monthlySalesTotal + monthlyIncomeTotal;
  const monthlyProfit = monthlyRevenue - monthlyPurchasesTotal - monthlyExpensesTotal;
  const cashBalance = allSalesTotal + allIncomeTotal - allPurchasesTotal - allExpensesTotal;

  const recentActivities = [
    ...recentPurchases.map((p) => ({
      id: `p-${p.id}`, type: "achat", label: `Achat ${p.purchaseNumber} — ${p.farmer?.name ?? p.supplier?.name ?? ""}`,
      amount: p.total, date: p.createdAt,
    })),
    ...recentSales.map((s) => ({
      id: `s-${s.id}`, type: "vente", label: `Vente ${s.invoiceNumber} — ${s.customer?.name ?? ""}`,
      amount: s.total, date: s.createdAt,
    })),
    ...recentExpenses.map((e) => ({
      id: `e-${e.id}`, type: "dépense", label: e.description, amount: e.amount, date: e.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  res.json({
    todaySales, todayPurchases, currentStockKg, cashBalance,
    monthlyRevenue, monthlyExpenses: monthlyExpensesTotal, monthlyProfit,
    recentActivities,
  });
});

// ---------- Period reports: daily / weekly / monthly / yearly ----------
reportsRouter.get("/summary", requireAuth, async (req, res) => {
  const period = String(req.query.period ?? "monthly");
  const refDate = req.query.date ? new Date(String(req.query.date)) : new Date();

  let from: Date, to: Date, label: string;
  if (period === "daily") {
    from = startOfDay(refDate); to = endOfDay(refDate);
    label = from.toLocaleDateString("fr-FR");
  } else if (period === "weekly") {
    const day = refDate.getDay() || 7;
    from = startOfDay(new Date(refDate.getTime() - (day - 1) * 86400000));
    to = endOfDay(new Date(from.getTime() + 6 * 86400000));
    label = `Semaine du ${from.toLocaleDateString("fr-FR")} au ${to.toLocaleDateString("fr-FR")}`;
  } else if (period === "yearly") {
    from = new Date(refDate.getFullYear(), 0, 1);
    to = new Date(refDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    label = `Année ${refDate.getFullYear()}`;
  } else {
    from = startOfMonth(refDate); to = endOfMonth(refDate);
    label = from.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }

  const where = { date: { gte: from, lte: to } };
  const [purchases, sales, expenses, incomes] = await Promise.all([
    prisma.purchase.findMany({ where, include: { farmer: true, supplier: true }, orderBy: { date: "asc" } }),
    prisma.sale.findMany({ where, include: { customer: true }, orderBy: { date: "asc" } }),
    prisma.expense.findMany({ where, orderBy: { date: "asc" } }),
    prisma.income.findMany({ where, orderBy: { date: "asc" } }),
  ]);

  const totalPurchases = purchases.reduce((s, p) => s + p.total, 0);
  const totalSales = sales.reduce((s, s2) => s + s2.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const profit = totalSales + totalIncome - totalPurchases - totalExpenses;

  res.json({
    period, label, from, to,
    totals: { totalPurchases, totalSales, totalExpenses, totalIncome, profit },
    purchases, sales, expenses, incomes,
  });
});
