import * as React from "react";
import { api } from "@/lib/api";
import { formatAr, formatDate, formatKg } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { exportToPdf, exportToExcel, printElement } from "@/lib/export";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

interface SummaryData {
  period: string;
  label: string;
  totals: { totalPurchases: number; totalSales: number; totalExpenses: number; totalIncome: number; profit: number };
  purchases: { id: string; purchaseNumber: string; date: string; quantityKg: number; total: number; farmer?: { name: string } | null; supplier?: { name: string } | null }[];
  sales: { id: string; invoiceNumber: string; date: string; quantityKg: number; total: number; profit: number; customer?: { name: string } | null }[];
  expenses: { id: string; date: string; description: string; category: string; amount: number }[];
  incomes: { id: string; date: string; description: string; source: string; amount: number }[];
}

const PERIOD_LABELS: Record<string, string> = { daily: "Journalier", weekly: "Hebdomadaire", monthly: "Mensuel", yearly: "Annuel" };

export default function ReportsPage() {
  const [period, setPeriod] = React.useState("monthly");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = React.useState<SummaryData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    api.get<SummaryData>(`/reports/summary?period=${period}&date=${date}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [period, date]);

  function handleExportPdf() {
    if (!data) return;
    exportToPdf(
      `Rapport ${PERIOD_LABELS[period]} — ${data.label}`,
      [
        { header: "Type", accessor: "type" }, { header: "Référence", accessor: "ref" },
        { header: "Date", accessor: "date" }, { header: "Montant (Ar)", accessor: "amount" },
      ],
      buildFlatRows(),
      `rapport-${period}-${date}`
    );
  }
  function handleExportExcel() {
    if (!data) return;
    exportToExcel(
      [
        { header: "Type", accessor: "type" }, { header: "Référence", accessor: "ref" },
        { header: "Date", accessor: "date" }, { header: "Montant (Ar)", accessor: "amount" },
      ],
      buildFlatRows(),
      `rapport-${period}-${date}`
    );
  }

  function buildFlatRows(): Record<string, unknown>[] {
    if (!data) return [];
    return [
      ...data.purchases.map((p) => ({ type: "Achat", ref: p.purchaseNumber, date: formatDate(p.date), amount: p.total })),
      ...data.sales.map((s) => ({ type: "Vente", ref: s.invoiceNumber, date: formatDate(s.date), amount: s.total })),
      ...data.expenses.map((e) => ({ type: "Dépense", ref: e.description, date: formatDate(e.date), amount: e.amount })),
      ...data.incomes.map((i) => ({ type: "Revenu", ref: i.description, date: formatDate(i.date), amount: i.amount })),
    ];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-brand-dark dark:text-white">Rapports financiers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Journalier, hebdomadaire, mensuel ou annuel — avec export.</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PERIOD_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 rounded-md border border-border bg-white dark:bg-card px-3 text-sm"
          />
        </div>
      </div>

      {loading || !data ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div id="report-printable" className="space-y-4">
          <h3 className="hidden print:block text-lg font-semibold">{PERIOD_LABELS[period]} — {data.label}</h3>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Achats</p><p className="font-display text-lg font-semibold">{formatAr(data.totals.totalPurchases)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Ventes</p><p className="font-display text-lg font-semibold">{formatAr(data.totals.totalSales)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Dépenses</p><p className="font-display text-lg font-semibold">{formatAr(data.totals.totalExpenses)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Autres revenus</p><p className="font-display text-lg font-semibold">{formatAr(data.totals.totalIncome)}</p></CardContent></Card>
            <Card className="bg-gold-pale"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Profit net</p><p className="font-display text-lg font-semibold">{formatAr(data.totals.profit)}</p></CardContent></Card>
          </div>

          <div className="flex items-center gap-2 no-print">
            <Button variant="outline" size="sm" onClick={handleExportPdf}><Download className="h-4 w-4" /> PDF</Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
            <Button variant="outline" size="sm" onClick={() => printElement("report-printable")}><Printer className="h-4 w-4" /> Imprimer</Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Achats ({data.purchases.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Fournisseur</TableHead><TableHead>Quantité</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.purchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.purchaseNumber}</TableCell><TableCell>{formatDate(p.date)}</TableCell>
                      <TableCell>{p.farmer?.name ?? p.supplier?.name ?? "-"}</TableCell>
                      <TableCell>{formatKg(p.quantityKg)}</TableCell><TableCell>{formatAr(p.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ventes ({data.sales.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Quantité</TableHead><TableHead>Total</TableHead><TableHead>Profit</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.invoiceNumber}</TableCell><TableCell>{formatDate(s.date)}</TableCell>
                      <TableCell>{s.customer?.name ?? "-"}</TableCell><TableCell>{formatKg(s.quantityKg)}</TableCell>
                      <TableCell>{formatAr(s.total)}</TableCell><TableCell>{formatAr(s.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dépenses ({data.expenses.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Catégorie</TableHead><TableHead>Description</TableHead><TableHead>Montant</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.expenses.map((e) => (
                    <TableRow key={e.id}><TableCell>{formatDate(e.date)}</TableCell><TableCell>{e.category}</TableCell><TableCell>{e.description}</TableCell><TableCell>{formatAr(e.amount)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
