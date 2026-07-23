import { CrudPage } from "@/components/crud/crud-page";
import { supplierSchema } from "@/lib/validations";
import type { ColumnConfig, FormFieldConfig } from "@/components/crud/types";
import { useAuth, canDelete } from "@/contexts/AuthContext";

interface Supplier {
  id: string; name: string; phone: string | null; address: string | null;
  itemsSupplied: string | null; notes: string | null;
}

const columns: ColumnConfig<Supplier>[] = [
  { key: "name", header: "Nom", sortable: true },
  { key: "phone", header: "Téléphone" },
  { key: "address", header: "Adresse" },
  { key: "itemsSupplied", header: "Articles fournis" },
];

const formFields: FormFieldConfig[] = [
  { name: "name", label: "Nom", type: "text", placeholder: "Fournisseur SARL" },
  { name: "phone", label: "Téléphone", type: "text", optional: true },
  { name: "address", label: "Adresse", type: "text", optional: true },
  { name: "itemsSupplied", label: "Articles fournis", type: "text", optional: true, placeholder: "Gony, matériel..." },
  { name: "notes", label: "Notes", type: "textarea", optional: true },
];

export default function SuppliersPage() {
  const { user } = useAuth();
  return (
    <CrudPage<Supplier>
      endpoint="/suppliers"
      title="Fournisseurs"
      description="Fournisseurs de matériel, gony et autres intrants."
      columns={columns}
      searchKeys={["name", "phone", "address"]}
      formFields={formFields}
      schema={supplierSchema}
      defaultValues={{ name: "", phone: "", address: "", itemsSupplied: "", notes: "" }}
      canDelete={canDelete(user?.role)}
    />
  );
}
