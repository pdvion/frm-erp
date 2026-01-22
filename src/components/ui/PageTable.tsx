"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  className?: string;
  render?: (item: T) => ReactNode;
}

interface PageTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  rowClassName?: (item: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function PageTable<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
  emptyMessage = "Nenhum registro encontrado",
  isLoading = false,
}: PageTableProps<T>) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-theme-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-theme-table">
        <thead className="bg-theme-table-header">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-medium text-theme-muted uppercase tracking-wider ${alignClass[col.align || "left"]} ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-table">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={`hover:bg-theme-table-hover transition-colors ${rowClassName?.(item) || ""}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm ${alignClass[col.align || "left"]} ${col.className || ""}`}
                >
                  {col.render
                    ? col.render(item)
                    : (item as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
