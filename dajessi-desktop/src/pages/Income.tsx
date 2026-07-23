import { CrudPage } from "@/components/crud/crud-page";
import { incomeSchema } from "@/lib/validations";
import type { ColumnConfig, FormFieldConfig } from "@/components/crud/types";
import { formatAr, formatDate, todayInputValue } from "@/lib/utils";
import { useAuth, canDelete } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Income {
  id: string; date: string; source: string; description: string; amount: number;
}

const SOURCE_LABELS: Record<string, string> = { SALES: "Ventes", OTHER: "Autre" };

const columns: ColumnConfig<Income>[] = [
  { key: "date", header: "Date", sortable: true, render: (r) => formatDate(r.date) },
  { key: "source", header: "Source", render: (r) => <Badge>{SOURCE_LABELS[r.source]}</Badge> },
  { key: "description", header: "Description", sortable: true },
  { key: "amount", header: "Montant", sortable: true, render: (r) => formatAr(r.amount) },
];

const formFields: FormFieldConfig[] = [
  { name: "date", label: "Date", type: "date" },
  { name: "source", label: "Source", type: "select", options: [{ value: "SALES", label: "Ventes" }, { value: "OTHER", label: "Autre" }] },
  { name: "description", label: "Description", type: "text", placeholder: "Subvention, remboursement..." },
  { name: "amount", label: "Montant (Ar)", type: "number", step: "1" },
  { name: "notes", label: "Notes", type: "textarea", optional: true },
];

export default function IncomePage() {
  const { user } = useAuth();
  return (
    <CrudPage<Income>
      endpoint="/incomes"
      title="Revenus"
      description="Revenus des ventes (résumé) et autres revenus divers."
      columns={columns}
      searchKeys={["description"]}
      filters={[{ key: "source", label: "Source", options: [{ value: "SALES", label: "Ventes" }, { value: "OTHER", label: "Autre" }] }]}
      formFields={formFields}
      schema={incomeSchema}
      defaultValues={{ date: todayInputValue(), source: "OTHER", description: "", amount: 0, notes: "" }}
      canDelete={canDelete(user?.role)}
      beforeSubmit={(v) => ({ ...v, createdById: user?.id })}
    />
  );
}
