import * as React from "react";
import type { ZodType } from "zod";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { DataTable } from "./data-table";
import { CrudForm } from "./crud-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnConfig, FilterConfig, FormFieldConfig } from "./types";

interface RowBase {
  id: string;
}

interface RelationSource {
  fieldName: string;
  endpoint: string; // e.g. "/farmers"
  valueField?: string;
  labelField: string;
}

interface CrudPageProps<T extends RowBase> {
  endpoint: string; // e.g. "/farmers"
  title: string;
  description?: string;
  columns: ColumnConfig<T>[];
  searchKeys: string[];
  filters?: FilterConfig[];
  formFields: FormFieldConfig[];
  schema: ZodType;
  defaultValues: Record<string, unknown>;
  canDelete: boolean;
  addLabel?: string;
  detailFields?: { key: string; label: string }[];
  relationSources?: RelationSource[];
  /** Transform form values right before sending to the API (e.g. inject createdById). */
  beforeSubmit?: (values: Record<string, unknown>) => Record<string, unknown>;
}

export function CrudPage<T extends RowBase>({
  endpoint,
  title,
  description,
  columns,
  searchKeys,
  filters,
  formFields,
  schema,
  defaultValues,
  canDelete,
  addLabel,
  detailFields,
  relationSources,
  beforeSubmit,
}: CrudPageProps<T>) {
  const { toast } = useToast();

  const [rows, setRows] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [relationOptions, setRelationOptions] = React.useState<Record<string, { value: string; label: string }[]>>({});

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<T | null>(null);
  const [deletingRow, setDeletingRow] = React.useState<T | null>(null);
  const [viewingRow, setViewingRow] = React.useState<T | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<T[]>(endpoint);
      setRows(data);
    } catch (err) {
      toast({ title: "Erreur de chargement", description: err instanceof ApiError ? err.message : undefined, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [endpoint, toast]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  React.useEffect(() => {
    async function loadRelations() {
      if (!relationSources?.length) return;
      const results: Record<string, { value: string; label: string }[]> = {};
      for (const rel of relationSources) {
        try {
          const data = await api.get<Record<string, unknown>[]>(rel.endpoint);
          const valueField = rel.valueField ?? "id";
          results[rel.fieldName] = data.map((r) => ({ value: String(r[valueField]), label: String(r[rel.labelField]) }));
        } catch {
          results[rel.fieldName] = [];
        }
      }
      setRelationOptions(results);
    }
    loadRelations();
  }, [relationSources]);

  function openAdd() { setEditingRow(null); setDialogOpen(true); }
  function openEdit(row: T) { setEditingRow(row); setDialogOpen(true); }

  async function handleSubmit(values: Record<string, unknown>) {
    let cleaned = { ...values };
    Object.keys(cleaned).forEach((k) => { if (cleaned[k] === "") cleaned[k] = null; });
    if (beforeSubmit) cleaned = beforeSubmit(cleaned);

    try {
      if (editingRow) {
        await api.put(`${endpoint}/${editingRow.id}`, cleaned);
        toast({ title: "Modifié avec succès", variant: "success" });
      } else {
        await api.post(endpoint, cleaned);
        toast({ title: "Ajouté avec succès", variant: "success" });
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast({
        title: editingRow ? "Échec de la modification" : "Échec de l'ajout",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "error",
      });
    }
  }

  async function handleDelete() {
    if (!deletingRow) return;
    try {
      await api.delete(`${endpoint}/${deletingRow.id}`);
      toast({ title: "Supprimé avec succès", variant: "success" });
      fetchData();
    } catch (err) {
      toast({ title: "Échec de la suppression", description: err instanceof ApiError ? err.message : undefined, variant: "error" });
    }
    setDeletingRow(null);
  }

  const formDefaultValues = editingRow
    ? Object.fromEntries(formFields.map((f) => [f.name, (editingRow as Record<string, unknown>)[f.name] ?? ""]))
    : defaultValues;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-brand-dark dark:text-white">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>

      <Card>
        <CardContent className="pt-5">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Chargement...</div>
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              searchKeys={searchKeys}
              filters={filters}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={(row) => setDeletingRow(row)}
              onView={detailFields ? (row) => setViewingRow(row) : undefined}
              canDelete={canDelete}
              exportTitle={title}
              exportFileName={endpoint.replace("/", "")}
              addLabel={addLabel}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRow ? "Modifier" : "Ajouter"} — {title}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Mettez à jour les informations puis enregistrez." : "Renseignez les informations puis enregistrez."}
            </DialogDescription>
          </DialogHeader>
          <CrudForm
            fields={formFields}
            schema={schema}
            defaultValues={formDefaultValues}
            relationOptions={relationOptions}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingRow} onOpenChange={(open) => !open && setDeletingRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Voulez-vous vraiment supprimer cet enregistrement ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingRow} onOpenChange={(open) => !open && setViewingRow(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Détails</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {detailFields?.map((f) => (
              <div key={f.key} className="flex justify-between border-b border-border py-1.5 text-sm">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-medium text-right">{String((viewingRow as unknown as Record<string, unknown>)?.[f.key] ?? "-")}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
