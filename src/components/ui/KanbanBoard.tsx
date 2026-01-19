"use client";

import { useState, DragEvent } from "react";
import { LayoutGrid, List, GripVertical } from "lucide-react";

export interface KanbanColumn<T> {
  id: string;
  title: string;
  color: string;
  items: T[];
}

export interface KanbanCardProps<T> {
  item: T;
  onClick?: (item: T) => void;
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (props: KanbanCardProps<T>) => React.ReactNode;
  onCardClick?: (item: T) => void;
  onCardMove?: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  emptyMessage?: string;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onCardClick,
  onCardMove,
  emptyMessage = "Nenhum item encontrado",
}: KanbanBoardProps<T>) {
  const [draggedItem, setDraggedItem] = useState<{ id: string; columnId: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const totalItems = columns.reduce((sum, col) => sum + col.items.length, 0);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, itemId: string, columnId: string) => {
    setDraggedItem({ id: itemId, columnId });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ itemId, columnId }));
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, toColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedItem || !onCardMove) return;
    if (draggedItem.columnId === toColumnId) return;

    onCardMove(draggedItem.id, draggedItem.columnId, toColumnId);
    setDraggedItem(null);
  };

  if (totalItems === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const isDraggable = !!onCardMove;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className={`flex-shrink-0 w-72 bg-gray-50 rounded-lg transition-all ${
            dragOverColumn === column.id ? "ring-2 ring-blue-400 bg-blue-50" : ""
          }`}
          onDragOver={(e) => isDraggable && handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => isDraggable && handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div
            className="px-3 py-2 rounded-t-lg border-b-2"
            style={{ borderBottomColor: column.color }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{column.title}</h3>
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: column.color }}
              >
                {column.items.length}
              </span>
            </div>
          </div>

          {/* Column Content */}
          <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto min-h-[100px]">
            {column.items.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                {dragOverColumn === column.id ? "Solte aqui" : "Nenhum item"}
              </div>
            ) : (
              column.items.map((item) => (
                <div
                  key={item.id}
                  draggable={isDraggable}
                  onDragStart={(e) => isDraggable && handleDragStart(e, item.id, column.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onCardClick?.(item)}
                  className={`cursor-pointer transition-opacity ${
                    draggedItem?.id === item.id ? "opacity-50" : ""
                  } ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  {isDraggable && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                  {renderCard({ item, onClick: onCardClick })}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// View Toggle Component
interface ViewToggleProps {
  view: "list" | "kanban";
  onViewChange: (view: "list" | "kanban") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onViewChange("list")}
        className={`p-2 rounded-md transition-colors ${
          view === "list"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
        title="Visualização em lista"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange("kanban")}
        className={`p-2 rounded-md transition-colors ${
          view === "kanban"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
        title="Visualização Kanban"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
}

// Generic Kanban Card Component
interface GenericKanbanCardProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color: string;
  };
  footer?: React.ReactNode;
  className?: string;
}

export function KanbanCard({
  title,
  subtitle,
  badge,
  footer,
  className = "",
}: GenericKanbanCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{title}</h4>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge && (
          <span
            className="px-2 py-0.5 text-xs font-medium rounded-full text-white flex-shrink-0"
            style={{ backgroundColor: badge.color }}
          >
            {badge.text}
          </span>
        )}
      </div>
      {footer && <div className="mt-2 pt-2 border-t border-gray-100">{footer}</div>}
    </div>
  );
}
