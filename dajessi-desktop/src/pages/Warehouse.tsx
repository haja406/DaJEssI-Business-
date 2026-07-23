import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CrudPage } from "@/components/crud/crud-page";
import { warehouseSchema, stockMovementSchema } from "@/lib/validations";
import type { ColumnConfig, FormFieldConfig } from "@/components/crud/types";
import { formatKg, formatDate, todayInputValue } from "@/lib/utils";
import { useAuth, canDelete } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  capacityKg: number;
  lowStockThresholdKg: number;
  currentStockKg: number;
  lowStock: boolean;
}

interface StockMovement {
  id: string;
  date: string;
  warehouse?: { id: string; name: string } | null;
  type: "ENTRY" | "EXIT";
  riceType: string;
  quantityKg: number;
  reason: string | null;
}

const warehouseColumns: ColumnConfig<Warehouse>[] = [
  { key: "name", header: "Nom", sortable: true },
  { key: "location", header: "Emplacement" },
  { key: "capacityKg", header: "Capacité", render: (r) => formatKg(r.capacityKg) },
  { key: "currentStockKg", header: "Stock actuel", sortable: true, render: (r) => formatKg(r.currentStockKg) },
  {
    key: "lowStock", header: "Alerte",
    render: (r) => r.lowStock
      ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Stock bas</Badge>
      : <Badge>Normal</Badge>,
  },
];

const warehouseFormFields: FormFieldConfig[] = [
  { name: "name", label: "Nom de l'entrepôt", type: "text", placeholder: "Entrepôt principal" },
  { name: "location", label: "Emplacement", type: "text", optional: true },
  { name: "capacityKg", label: "Capacité (kg)", type: "number", step: "1" },
  { name: "lowStockThresholdKg", label: "Seuil d'alerte stock bas (kg)", type: "number", step: "1" },
];

const movementColumns: ColumnConfig<StockMovement>[] = [
  { key: "date", header: "Date", sortable: true, render: (r) => formatDate(r.date) },
  { key: "warehouse.name", header: "Entrepôt", render: (r) => r.warehouse?.name ?? "-" },
  { key: "type", header: "Type", render: (r) => <Badge variant={r.type === "ENTRY" ? "default" : "destructive"}>{r.type === "ENTRY" ? "Entrée" : "Sortie"}</Badge> },
  { key: "riceType", header: "Type de riz" },
  { key: "quantityKg", header: "Quantité", sortable: true, render: (r) => formatKg(r.quantityKg) },
  { key: "reason", header: "Motif" },
];

const movementFormFields: FormFieldConfig[] = [
  { name: "date", label: "Date", type: "date" },
  { name: "warehouseId", label: "Entrepôt", type: "select" },
  { name: "type", label: "Type de mouvement", type: "select", options: [{ value: "ENTRY", label: "Entrée" }, { value: "EXIT", label: "Sortie" }] },
  { name: "riceType", label: "Type de riz", type: "text", placeholder: "Riz blanc" },
  { name: "quantityKg", label: "Quantité (kg)", type: "number", step: "0.01" },
  { name: "reason", label: "Motif", type: "text", optional: true, placeholder: "Ajustement d'inventaire, décorticage..." },
];

export default function WarehousePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-brand-dark dark:text-white">Entrepôt / Stock</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestion des lieux de stockage, entrées/sorties et alertes de stock bas.
        </p>
      </div>

      <Tabs defaultValue="warehouses">
        <TabsList>
          <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
          <TabsTrigger value="movements">Mouvements de stock</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses">
          <CrudPage<Warehouse>
            endpoint="/warehouses"
            title="Entrepôts"
            columns={warehouseColumns}
            searchKeys={["name", "location"]}
            formFields={warehouseFormFields}
            schema={warehouseSchema}
            defaultValues={{ name: "", location: "", capacityKg: 0, lowStockThresholdKg: 500 }}
            canDelete={canDelete(user?.role)}
          />
        </TabsContent>

        <TabsContent value="movements">
          <CrudPage<StockMovement>
            endpoint="/stock-movements"
            title="Mouvements de stock"
            description="Historique des entrées et sorties — les achats et ventes en génèrent automatiquement."
            columns={movementColumns}
            searchKeys={["warehouse.name", "riceType", "reason"]}
            filters={[{ key: "type", label: "Type", options: [{ value: "ENTRY", label: "Entrée" }, { value: "EXIT", label: "Sortie" }] }]}
            formFields={movementFormFields}
            schema={stockMovementSchema}
            defaultValues={{ date: todayInputValue(), warehouseId: "", type: "ENTRY", riceType: "Riz blanc", quantityKg: 0, reason: "" }}
            canDelete={canDelete(user?.role)}
            relationSources={[{ fieldName: "warehouseId", endpoint: "/warehouses", labelField: "name" }]}
            beforeSubmit={(v) => ({ ...v, createdById: user?.id })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
