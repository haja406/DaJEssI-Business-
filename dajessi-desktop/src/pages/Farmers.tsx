import { CrudPage } from "@/components/crud/crud-page";
import { farmerSchema } from "@/lib/validations";
import type { ColumnConfig, FormFieldConfig } from "@/components/crud/types";
import { formatDate } from "@/lib/utils";
import { useAuth, canDelete } from "@/contexts/AuthContext";

interface Farmer {
  id: string; name: string; phone: string | null; village: string | null;
  district: string | null; notes: string | null; createdAt: string;
}

const columns: ColumnConfig<Farmer>[] = [
  { key: "name", header: "Nom", sortable: true },
  { key: "phone", header: "Téléphone" },
  { key: "village", header: "Village", sortable: true },
  { key: "district", header: "District" },
  { key: "createdAt", header: "Ajouté le", render: (r) => formatDate(r.createdAt) },
];

const formFields: FormFieldConfig[] = [
  { name: "name", label: "Nom", type: "text", placeholder: "Rakoto Jean" },
  { name: "phone", label: "Téléphone", type: "text", optional: true },
  { name: "village", label: "Village", type: "text", optional: true },
  { name: "district", label: "District", type: "text", optional: true },
  { name: "notes", label: "Notes", type: "textarea", optional: true },
];

export default function FarmersPage() {
  const { user } = useAuth();
  return (
    <CrudPage<Farmer>
      endpoint="/farmers"
      title="Agriculteurs"
      description="Tantsaha fournisseurs de paddy (vary akotry)."
      columns={columns}
      searchKeys={["name", "phone", "village"]}
      formFields={formFields}
      schema={farmerSchema}
      defaultValues={{ name: "", phone: "", village: "", district: "", notes: "" }}
      canDelete={canDelete(user?.role)}
      detailFields={[
        { key: "name", label: "Nom" }, { key: "phone", label: "Téléphone" },
        { key: "village", label: "Village" }, { key: "district", label: "District" }, { key: "notes", label: "Notes" },
      ]}
    />
  );
}
