import { CrudPage } from "@/components/crud/crud-page";
import { purchaseSchema } from "@/lib/validations";
import type { ColumnConfig, FormFieldConfig } from "@/components/crud/types";
import { formatAr, formatKg, formatDate, todayInputValue } from "@/lib/utils";
import { useAuth, canDelete } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Purchase {
  id: string;
  purchaseNumber: string;
  date: string;
  farmer?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
  riceType: string;
  quantityKg: number;
  unitPrice: number;
  total: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  amountPaid: number;
}

const STATUS_LABELS: Record<string, string> = { PAID: "Payé", PARTIAL: "Partiel", UNPAID: "Impayé" };
const STATUS_TONE: Record<string, "default" | "gold" | "destructive"> = { PAID: "default", PARTIAL: "gold", UNPAID: "destructive" };

const columns: ColumnConfig<Purchase>[] = [
  { key: "purchaseNumber", header: "N° Achat", sortable: true },
  { key: "date", header: "Date", sortable: true, render: (r) => formatDate(r.date) },
  { key: "farmer.name", header: "Agriculteur / Fournisseur", render: (r) => r.farmer?.name ?? r.supplier?.name ?? "-" },
  { key: "riceType", header: "Type de riz" },
  { key: "quantityKg", header: "Quantité", render: (r) => formatKg(r.quantityKg) },
  { key: "unitPrice", header: "Prix/kg", render: (r) => formatAr(r.unitPrice) },
  { key: "total", header: "Total", sortable: true, render: (r) => formatAr(r.total) },
  { key: "paymentStatus", header: "Paiement", render: (r) => <Badge variant={STATUS_TONE[r.paymentStatus]}>{STATUS_LABELS[r.paymentStatus]}</Badge> },
];

const formFields: FormFieldConfig[] = [
  { name: "purchaseNumber", label: "N° Achat", type: "text", placeholder: "ACH-2026-001" },
  { name: "date", label: "Date", type: "date" },
  { name: "farmerId", label: "Agriculteur", type: "select", optional: true },
  { name: "supplierId", label: "Fournisseur (si applicable)", type: "select", optional: true },
  { name: "riceType", label: "Type de riz", type: "text", placeholder: "Paddy" },
  { name: "quantityKg", label: "Quantité (kg)", type: "number", step: "0.01" },
  { name: "unitPrice", label: "Prix unitaire (Ar/kg)", type: "number", step: "1" },
  {
    name: "paymentStatus", label: "Statut de paiement", type: "select",
    options: [{ value: "PAID", label: "Payé" }, { value: "PARTIAL", label: "Partiel" }, { value: "UNPAID", label: "Impayé" }],
  },
  { name: "amountPaid", label: "Montant payé (Ar)", type: "number", step: "1", optional: true },
  { name: "warehouseId", label: "Entrepôt de destination", type: "select", optional: true },
  { name: "notes", label: "Notes", type: "textarea", optional: true },
];

export default function PurchasesPage() {
  const { user } = useAuth();
  return (
    <CrudPage<Purchase>
      endpoint="/purchases"
      title="Achats"
      description="Achats de paddy — total calculé automatiquement, entrée de stock générée si un entrepôt est choisi."
      columns={columns}
      searchKeys={["purchaseNumber", "farmer.name", "riceType"]}
      formFields={formFields}
      schema={purchaseSchema}
      defaultValues={{
        purchaseNumber: "", date: todayInputValue(), farmerId: "", supplierId: "",
        riceType: "Paddy", quantityKg: 0, unitPrice: 900, paymentStatus: "UNPAID", amountPaid: 0, warehouseId: "", notes: "",
      }}
      canDelete={canDelete(user?.role)}
      relationSources={[
        { fieldName: "farmerId", endpoint: "/farmers", labelField: "name" },
        { fieldName: "supplierId", endpoint: "/suppliers", labelField: "name" },
        { fieldName: "warehouseId", endpoint: "/warehouses", labelField: "name" },
      ]}
      beforeSubmit={(v) => ({ ...v, createdById: user?.id })}
      detailFields={[
        { key: "purchaseNumber", label: "N° Achat" }, { key: "date", label: "Date" }, { key: "riceType", label: "Type de riz" },
        { key: "quantityKg", label: "Quantité (kg)" }, { key: "unitPrice", label: "Prix/kg (Ar)" }, { key: "total", label: "Total (Ar)" },
        { key: "paymentStatus", label: "Statut" }, { key: "amountPaid", label: "Montant payé (Ar)" }, { key: "notes", label: "Notes" },
      ]}
    />
  );
}
