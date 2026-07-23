import { CrudPage } from "@/components/crud/crud-page";
import { saleSchema } from "@/lib/validations";
import type { ColumnConfig, FormFieldConfig } from "@/components/crud/types";
import { formatAr, formatKg, formatDate, todayInputValue } from "@/lib/utils";
import { useAuth, canDelete } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customer?: { id: string; name: string } | null;
  riceType: string;
  quantityKg: number;
  unitPrice: number;
  discount: number;
  total: number;
  profit: number;
  paymentMethod: string;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces", MOBILE_MONEY: "Mobile Money", BANK_TRANSFER: "Virement bancaire", CREDIT: "Crédit",
};

const columns: ColumnConfig<Sale>[] = [
  { key: "invoiceNumber", header: "N° Facture", sortable: true },
  { key: "date", header: "Date", sortable: true, render: (r) => formatDate(r.date) },
  { key: "customer.name", header: "Client", render: (r) => r.customer?.name ?? "-" },
  { key: "quantityKg", header: "Quantité", render: (r) => formatKg(r.quantityKg) },
  { key: "unitPrice", header: "Prix/kg", render: (r) => formatAr(r.unitPrice) },
  { key: "total", header: "Total", sortable: true, render: (r) => formatAr(r.total) },
  { key: "profit", header: "Profit", sortable: true, render: (r) => <Badge variant={r.profit >= 0 ? "default" : "destructive"}>{formatAr(r.profit)}</Badge> },
  { key: "paymentMethod", header: "Paiement", render: (r) => METHOD_LABELS[r.paymentMethod] },
];

const formFields: FormFieldConfig[] = [
  { name: "invoiceNumber", label: "N° Facture", type: "text", placeholder: "FAC-2026-001" },
  { name: "date", label: "Date", type: "date" },
  { name: "customerId", label: "Client", type: "select", optional: true },
  { name: "riceType", label: "Type de riz", type: "text", placeholder: "Riz blanc" },
  { name: "quantityKg", label: "Quantité (kg)", type: "number", step: "0.01" },
  { name: "unitPrice", label: "Prix de vente (Ar/kg)", type: "number", step: "1" },
  { name: "costPerKg", label: "Coût de revient (Ar/kg)", type: "number", step: "1", optional: true },
  { name: "discount", label: "Remise (Ar)", type: "number", step: "1", optional: true },
  {
    name: "paymentMethod", label: "Méthode de paiement", type: "select",
    options: Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label })),
  },
  { name: "warehouseId", label: "Entrepôt de sortie", type: "select", optional: true },
  { name: "notes", label: "Notes", type: "textarea", optional: true },
];

export default function SalesPage() {
  const { user } = useAuth();
  return (
    <CrudPage<Sale>
      endpoint="/sales"
      title="Ventes"
      description="Ventes de riz blanc — total et profit calculés automatiquement, sortie de stock générée si un entrepôt est choisi."
      columns={columns}
      searchKeys={["invoiceNumber", "customer.name", "riceType"]}
      formFields={formFields}
      schema={saleSchema}
      defaultValues={{
        invoiceNumber: "", date: todayInputValue(), customerId: "", riceType: "Riz blanc",
        quantityKg: 0, unitPrice: 2500, costPerKg: 0, discount: 0, paymentMethod: "CASH", warehouseId: "", notes: "",
      }}
      canDelete={canDelete(user?.role)}
      relationSources={[
        { fieldName: "customerId", endpoint: "/customers", labelField: "name" },
        { fieldName: "warehouseId", endpoint: "/warehouses", labelField: "name" },
      ]}
      beforeSubmit={(v) => ({ ...v, createdById: user?.id })}
      detailFields={[
        { key: "invoiceNumber", label: "N° Facture" }, { key: "date", label: "Date" }, { key: "riceType", label: "Type de riz" },
        { key: "quantityKg", label: "Quantité (kg)" }, { key: "unitPrice", label: "Prix/kg (Ar)" }, { key: "discount", label: "Remise (Ar)" },
        { key: "total", label: "Total (Ar)" }, { key: "profit", label: "Profit (Ar)" }, { key: "notes", label: "Notes" },
      ]}
    />
  );
}
