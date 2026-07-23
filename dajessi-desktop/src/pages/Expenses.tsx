import { CrudPage } from "@/components/crud/crud-page";
import { expenseSchema } from "@/lib/validations";
import type { ColumnConfig, FormFieldConfig } from "@/components/crud/types";
import { formatAr, formatDate, todayInputValue } from "@/lib/utils";
import { useAuth, canDelete } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Expense {
  id: string; date: string; category: string; description: string; amount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  TRANSPORT: "Transport", SALARY: "Salaire", FUEL: "Carburant", ELECTRICITY: "Électricité",
  RENT: "Loyer", MAINTENANCE: "Entretien", OTHER: "Autre",
};

const columns: ColumnConfig<Expense>[] = [
  { key: "date", header: "Date", sortable: true, render: (r) => formatDate(r.date) },
  { key: "category", header: "Catégorie", render: (r) => <Badge variant="gold">{CATEGORY_LABELS[r.category]}</Badge> },
  { key: "description", header: "Description", sortable: true },
  { key: "amount", header: "Montant", sortable: true, render: (r) => formatAr(r.amount) },
];

const formFields: FormFieldConfig[] = [
  { name: "date", label: "Date", type: "date" },
  { name: "category", label: "Catégorie", type: "select", options: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })) },
  { name: "description", label: "Description", type: "text", placeholder: "Achat de gony supplémentaires" },
  { name: "amount", label: "Montant (Ar)", type: "number", step: "1" },
  { name: "notes", label: "Notes", type: "textarea", optional: true },
];

export default function ExpensesPage() {
  const { user } = useAuth();
  return (
    <CrudPage<Expense>
      endpoint="/expenses"
      title="Dépenses"
      description="Transport, salaire, carburant, électricité, loyer, entretien et autres charges."
      columns={columns}
      searchKeys={["description"]}
      filters={[{ key: "category", label: "Catégorie", options: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })) }]}
      formFields={formFields}
      schema={expenseSchema}
      defaultValues={{ date: todayInputValue(), category: "OTHER", description: "", amount: 0, notes: "" }}
      canDelete={canDelete(user?.role)}
      beforeSubmit={(v) => ({ ...v, createdById: user?.id })}
    />
  );
}
