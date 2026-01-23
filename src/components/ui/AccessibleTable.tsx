"use client";

import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

interface AccessibleTableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption: string;
  captionHidden?: boolean;
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  selectedKey?: string;
}

export function AccessibleTable<T>({
  data,
  columns,
  caption,
  captionHidden = false,
  keyExtractor,
  emptyMessage = "Nenhum registro encontrado",
  onRowClick,
  selectedKey,
}: AccessibleTableProps<T>) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className="overflow-x-auto" role="region" aria-label={caption}>
      <table className="min-w-full divide-y divide-theme-table">
        <caption className={captionHidden ? "sr-only" : "text-lg font-semibold text-theme mb-4 text-left"}>
          {caption}
        </caption>
        <thead className="bg-theme-tertiary">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-xs font-medium text-theme-muted uppercase tracking-wider ${alignClasses[col.align || "left"]}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-theme-card divide-y divide-theme-table">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-theme-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const key = keyExtractor(item, index);
              const isSelected = selectedKey === key;
              const isClickable = !!onRowClick;

              return (
                <tr
                  key={key}
                  onClick={isClickable ? () => onRowClick(item) : undefined}
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(item);
                          }
                        }
                      : undefined
                  }
                  tabIndex={isClickable ? 0 : undefined}
                  role={isClickable ? "button" : undefined}
                  aria-selected={isSelected || undefined}
                  className={`
                    ${isClickable ? "cursor-pointer hover:bg-theme-hover focus:bg-theme-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" : ""}
                    ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 whitespace-nowrap text-sm text-theme ${alignClasses[col.align || "left"]}`}
                    >
                      {col.render(item, index)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
