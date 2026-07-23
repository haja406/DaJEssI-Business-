import * as React from "react";
import { api } from "@/lib/api";
import { formatAr, formatKg, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart, Receipt, Warehouse, Wallet, TrendingUp, DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface DashboardData {
  todaySales: number;
  todayPurchases: number;
  currentStockKg: number;
  cashBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  recentActivities: { id: string; type: string; label: string; amount: number; date: string }[];
}

function KpiCard({ label, value, icon: Icon, tone = "neutral" }: { label: string; value: string; icon: LucideIcon; tone?: "brand" | "gold" | "neutral" | "danger" }) {
  const TONE: Record<string, string> = {
    brand: "bg-brand text-white", gold: "bg-gold text-brand-dark",
    neutral: "bg-brand-pale text-brand-dark", danger: "bg-red-50 text-red-700",
  };
  return (
    <Card>
      <CardContent className="pt-5 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="font-display text-2xl font-semibold text-brand-dark dark:text-white font-tabular">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", TONE[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get<DashboardData>("/reports/dashboard").then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">Chargement du tableau de bord...</p>;
  }

  const chartData = [
    { label: "Aujourd'hui", achats: data.todayPurchases, ventes: data.todaySales },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Ventes du jour" value={formatAr(data.todaySales)} icon={Receipt} tone="gold" />
        <KpiCard label="Achats du jour" value={formatAr(data.todayPurchases)} icon={ShoppingCart} tone="brand" />
        <KpiCard label="Stock actuel" value={formatKg(data.currentStockKg)} icon={Warehouse} tone="neutral" />
        <KpiCard label="Solde de caisse" value={formatAr(data.cashBalance)} icon={DollarSign} tone={data.cashBalance >= 0 ? "brand" : "danger"} />
        <KpiCard label="Revenu mensuel" value={formatAr(data.monthlyRevenue)} icon={TrendingUp} tone="gold" />
        <KpiCard label="Dépenses mensuelles" value={formatAr(data.monthlyExpenses)} icon={Wallet} tone="danger" />
        <KpiCard label="Profit mensuel" value={formatAr(data.monthlyProfit)} icon={TrendingUp} tone={data.monthlyProfit >= 0 ? "brand" : "danger"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Achats vs Ventes — aujourd&apos;hui</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E4" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatAr(v)} />
                <Legend />
                <Bar dataKey="achats" name="Achats" fill="#1F4E3D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ventes" name="Ventes" fill="#C9A227" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Activités récentes</CardTitle></CardHeader>
          <CardContent>
            {data.recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité pour le moment.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentActivities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-block h-2 w-2 rounded-full",
                        a.type === "achat" ? "bg-brand" : a.type === "vente" ? "bg-gold" : "bg-red-500")} />
                      <span>{a.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{formatAr(a.amount)}</span>
                      <span className="text-xs">{formatDate(a.date)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
