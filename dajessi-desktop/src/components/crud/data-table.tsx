
import * as React from "react";
import {
  ArrowUpDown, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Printer, Search, Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { ColumnConfig, FilterConfig } from "./types";
import { exportToPdf, exportToExcel, printElement, type ExportColumn } from "@/lib/export";

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnConfig<T>[];
  searchKeys: string[];
  filters?: FilterConfig[];
  onAdd: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  onView?: (row: T) => void;
  canDelete: boolean;
  exportTitle: string;
  exportFileName: string;
  addLabel?: string;
  pageSize?: number;
}

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKeys,
  filters = [],
  onAdd,
  onEdit,
  onDelete,
  onView,
  canDelete,
  exportTitle,
  exportFileName,
  addLabel = "Ajouter",
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({});
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    let rows = [...data];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((key) => String(getNested(row, key) ?? "").toLowerCase().includes(q))
      );
    }

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== "__all__") {
        rows = rows.filter((row) => String(getNested(row, key) ?? "") === value);
      }
    });

    if (sortKey) {
      rows.sort((a, b) => {
        const av = getNested(a, sortKey);
        const bv = getNested(b, sortKey);
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
        return sortAsc
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    return rows;
  }, [data, search, activeFilters, sortKey, sortAsc, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const exportColumns: ExportColumn[] = columns.map((c) => ({
    header: c.header,
    accessor: c.exportAccessor ?? c.key,
  }));

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher..."
              className="pl-8"
            />
          </div>
          {filters.map((f) => (
            <Select
              key={f.key}
              onValueChange={(val) => { setActiveFilters((prev) => ({ ...prev, [f.key]: val })); setPage(1); }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous — {f.label}</SelectItem>
                {f.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <Button variant="outline" size="sm" onClick={() => exportToPdf(exportTitle, exportColumns, filtered, exportFileName)}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel(exportColumns, filtered, exportFileName)}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => printElement("data-table-printable")}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        </div>
      </div>

      <div id="data-table-printable">
        <h2 className="hidden print:block text-lg font-semibold mb-2">{exportTitle}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.sortable ? (
                    <button className="flex items-center gap-1 hover:opacity-80" onClick={() => toggleSort(col.key)}>
                      {col.header} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              <TableHead className="text-right no-print">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">
                  Aucune donnée trouvée.
                </TableCell>
              </TableRow>
            )}
            {paginated.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render ? col.render(row) : String(getNested(row, col.key) ?? "-")}
                  </TableCell>
                ))}
                <TableCell className="text-right no-print space-x-1 whitespace-nowrap">
                  {onView && (
                    <Button variant="ghost" size="sm" onClick={() => onView(row)}>Voir</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>Modifier</Button>
                  {canDelete && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(row)}>
                      Supprimer
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground no-print">
        <span>
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""} — page {currentPage}/{totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
