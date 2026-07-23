import { CrudPage } from "@/components/crud/crud-page";
import { customerSchema } from "@/lib/validations";
import type { ColumnConfig, FormFieldConfig } from "@/components/crud/types";
import { useAuth, canDelete } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string; name: string; phone: string | null; address: string | null; customerType: string;
}

const TYPE_LABELS: Record<string, string> = {
  individual: "Particulier", wholesaler: "Grossiste", retailer: "Détaillant", institution: "Institution",
};

const columns: ColumnConfig<Customer>[] = [
  { key: "name", header: "Nom", sortable: true },
  { key: "phone", header: "Téléphone" },
  { key: "address", header: "Adresse" },
  { key: "customerType", header: "Type", render: (r) => <Badge>{TYPE_LABELS[r.customerType]}</Badge> },
];

const formFields: FormFieldConfig[] = [
  { name: "name", label: "Nom", type: "text", placeholder: "Épicerie Analakely" },
  { name: "phone", label: "Téléphone", type: "text", optional: true },
  { name: "address", label: "Adresse", type: "text", optional: true },
  { name: "customerType", label: "Type de client", type: "select", options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })) },
  { name: "notes", label: "Notes", type: "textarea", optional: true },
];

export default function CustomersPage() {
  const { user } = useAuth();
  return (
    <CrudPage<Customer>
      endpoint="/customers"
      title="Clients"
      description="Base de données des acheteurs de riz blanc."
      columns={columns}
      searchKeys={["name", "phone", "address"]}
      filters={[{ key: "customerType", label: "Type", options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })) }]}
      formFields={formFields}
      schema={customerSchema}
      defaultValues={{ name: "", phone: "", address: "", customerType: "individual", notes: "" }}
      canDelete={canDelete(user?.role)}
    />
  );
}
