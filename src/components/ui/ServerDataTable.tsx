"use client";

import { ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  sortable?: boolean;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

interface ServerDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: PaginationMeta;
  sort?: SortState;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  selectedKey?: string;
}

export function ServerDataTable<T>({
  columns, data, keyExtractor, isLoading = false, emptyMessage = "Nenhum registro encontrado",
  pagination, sort, onSort, onPageChange, onRowClick, selectedKey,
}: ServerDataTableProps<T>) {
  const align = { left: "text-left", center: "text-center", right: "text-right" };

  const handleSort = (col: string) => {
    if (!onSort) return;
    onSort(col, sort?.column === col && sort.direction === "asc" ? "desc" : "asc");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-theme">
        <table className="min-w-full divide-y divide-theme-table" role="grid">
          <thead className="bg-theme-tertiary">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`px-4 py-3 text-xs font-medium text-theme-muted uppercase tracking-wider ${align[col.align || "left"]} ${col.sortable ? "cursor-pointer hover:text-theme" : ""}`}
                  style={col.width ? { width: col.width } : undefined}>
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && <span className={sort?.column === col.key ? "text-blue-500" : "opacity-40"}>
                      {sort?.column === col.key && sort.direction === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-theme-card divide-y divide-theme-table">
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-theme-muted">{emptyMessage}</td></tr>
            ) : data.map((item, idx) => {
              const key = keyExtractor(item, idx);
              return (
                <tr key={key} onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-theme-hover" : ""} ${selectedKey === key ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm text-theme ${align[col.align || "left"]}`}>
                      {col.render ? col.render(item, idx) : (item as Record<string, unknown>)[col.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-theme-muted">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange?.(pagination.page - 1)} disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-theme hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-theme">Página {pagination.page} de {pagination.totalPages}</span>
            <button onClick={() => onPageChange?.(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg border border-theme hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
