"use client";

import { ReactNode, useState, useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from "lucide-react";
import { Checkbox } from "./Checkbox";
import { TableSkeleton } from "./Skeleton";

export type SortDirection = "asc" | "desc" | null;

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  render?: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
  stickyHeader?: boolean;
  className?: string;
  sortable?: boolean;
  defaultSort?: { key: string; direction: SortDirection };
  onSort?: (key: string, direction: SortDirection) => void;
  caption?: string;
  captionHidden?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  emptyIcon,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  stickyHeader = false,
  className = "",
  sortable = false,
  defaultSort,
  onSort,
  caption,
  captionHidden = true,
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<{
    key: string;
    direction: SortDirection;
  }>(defaultSort || { key: "", direction: null });

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const handleSort = useCallback(
    (key: string) => {
      let newDirection: SortDirection;
      if (internalSort.key !== key) {
        newDirection = "asc";
      } else if (internalSort.direction === "asc") {
        newDirection = "desc";
      } else if (internalSort.direction === "desc") {
        newDirection = null;
      } else {
        newDirection = "asc";
      }

      setInternalSort({ key, direction: newDirection });
      onSort?.(key, newDirection);
    },
    [internalSort, onSort]
  );

  const sortedData = useMemo(() => {
    if (!internalSort.key || !internalSort.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[internalSort.key];
      const bVal = (b as Record<string, unknown>)[internalSort.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return internalSort.direction === "asc" ? comparison : -comparison;
    });
  }, [data, internalSort]);

  const selectedKeys = useMemo(
    () => new Set(selectedRows.map(keyExtractor)),
    [selectedRows, keyExtractor]
  );

  const allSelected = data.length > 0 && selectedKeys.size === data.length;
  const someSelected = selectedKeys.size > 0 && selectedKeys.size < data.length;

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...data]);
    }
  }, [allSelected, data, onSelectionChange]);

  const handleSelectRow = useCallback(
    (row: T) => {
      if (!onSelectionChange) return;
      const key = keyExtractor(row);
      if (selectedKeys.has(key)) {
        onSelectionChange(selectedRows.filter((r) => keyExtractor(r) !== key));
      } else {
        onSelectionChange([...selectedRows, row]);
      }
    },
    [keyExtractor, onSelectionChange, selectedKeys, selectedRows]
  );

  const renderSortIcon = (key: string, isSortable: boolean) => {
    if (!isSortable && !sortable) return null;

    const isActive = internalSort.key === key;
    const direction = isActive ? internalSort.direction : null;

    return (
      <span className="ml-1 inline-flex">
        {direction === "asc" ? (
          <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : direction === "desc" ? (
          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronsUpDown className="w-4 h-4 text-gray-400" />
        )}
      </span>
    );
  };

  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length + (selectable ? 1 : 0)} />;
  }

  const isEmpty = sortedData.length === 0;

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-theme ${className}`}
      role="region"
      aria-label={caption || "Tabela de dados"}
    >
      <table className="min-w-full divide-y divide-theme">
        {caption && (
          <caption className={captionHidden ? "sr-only" : "text-lg font-semibold text-theme mb-4 text-left p-4"}>
            {caption}
          </caption>
        )}
        <thead
          className={`bg-theme-tertiary ${stickyHeader ? "sticky top-0 z-10" : ""}`}
        >
          <tr>
            {selectable && (
              <th scope="col" className="w-12 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                  aria-label="Selecionar todos"
                />
              </th>
            )}
            {columns.map((col) => {
              const isSortable = col.sortable || (sortable && col.sortable !== false);
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold text-theme-secondary uppercase tracking-wider ${
                    alignClasses[col.align || "left"]
                  } ${col.className || ""} ${isSortable ? "cursor-pointer select-none hover:text-theme" : ""}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={isSortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    internalSort.key === col.key
                      ? internalSort.direction === "asc"
                        ? "ascending"
                        : internalSort.direction === "desc"
                          ? "descending"
                          : "none"
                      : undefined
                  }
                >
                  <div className={`flex items-center ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""}`}>
                    {col.header}
                    {renderSortIcon(col.key, !!col.sortable)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-theme-card divide-y divide-theme">
          {isEmpty ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12"
              >
                <div className="flex flex-col items-center justify-center text-center">
                  {emptyIcon ? (
                    <div className="w-16 h-16 rounded-full bg-theme-tertiary flex items-center justify-center mb-4 text-theme-muted">
                      {emptyIcon}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-theme-tertiary flex items-center justify-center mb-4">
                      <Inbox className="w-8 h-8 text-theme-muted" />
                    </div>
                  )}
                  <p className="text-theme-muted">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => {
              const key = keyExtractor(row);
              const isSelected = selectedKeys.has(key);
              const isClickable = !!onRowClick;

              return (
                <tr
                  key={key}
                  onClick={isClickable ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    isClickable
                      ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                      : undefined
                  }
                  tabIndex={isClickable ? 0 : undefined}
                  role={isClickable ? "button" : undefined}
                  aria-selected={isSelected || undefined}
                  className={`
                    transition-colors
                    ${isClickable ? "cursor-pointer hover:bg-theme-hover focus:bg-theme-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" : "hover:bg-theme-hover"}
                    ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                  `}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(row)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar linha ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-theme ${
                        alignClasses[col.align || "left"]
                      } ${col.className || ""}`}
                    >
                      {col.render
                        ? col.render(row, index)
                        : ((row as Record<string, unknown>)[col.key] as ReactNode)}
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

export default DataTable;
