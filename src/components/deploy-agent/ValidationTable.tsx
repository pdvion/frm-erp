"use client";

import { useState } from "react";
import { Check, X, Edit2, AlertTriangle } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Button } from "@/components/ui/Button";

export interface ValidationItem {
  id: string;
  type: "material" | "supplier" | "customer" | "fiscal_rule";
  name: string;
  description?: string;
  action: "create" | "update" | "skip" | "review";
  confidence: number;
  reason?: string;
  data?: Record<string, unknown>;
}

interface ValidationTableProps {
  items: ValidationItem[];
  onApprove: (ids: string[]) => void;
  onReject: (ids: string[]) => void;
  onEdit: (id: string) => void;
  isApplying?: boolean;
}

const ACTION_LABELS = {
  create: { label: "Criar", color: "text-green-600" },
  update: { label: "Atualizar", color: "text-blue-600" },
  skip: { label: "Ignorar", color: "text-gray-500" },
  review: { label: "Revisar", color: "text-yellow-600" },
};

const TYPE_LABELS = {
  material: "Material",
  supplier: "Fornecedor",
  customer: "Cliente",
  fiscal_rule: "Regra Fiscal",
};

export function ValidationTable({
  items,
  onApprove,
  onReject,
  onEdit,
  isApplying,
}: ValidationTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApproveSelected = () => {
    onApprove(selectedIds);
    setSelectedIds([]);
  };

  const handleRejectSelected = () => {
    onReject(selectedIds);
    setSelectedIds([]);
  };

  const getActionIcon = (action: ValidationItem["action"]) => {
    switch (action) {
      case "create":
        return <Check size={14} className="text-green-600" />;
      case "update":
        return <Edit2 size={14} className="text-blue-600" />;
      case "skip":
        return <X size={14} className="text-gray-500" />;
      case "review":
        return <AlertTriangle size={14} className="text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedIds.length} selecionado(s)
          </span>
          <Button
            variant="success"
            size="sm"
            onClick={handleApproveSelected}
            disabled={isApplying}
            leftIcon={<Check size={14} />}
          >
            Aprovar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRejectSelected}
            disabled={isApplying}
            leftIcon={<X size={14} />}
          >
            Rejeitar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === items.length && items.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ação
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Confiança
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Motivo
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-750 ${
                  selectedIds.includes(item.id) ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleToggleSelect(item.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {TYPE_LABELS[item.type]}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-500">{item.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-sm ${ACTION_LABELS[item.action].color}`}>
                    {getActionIcon(item.action)}
                    {ACTION_LABELS[item.action].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ConfidenceBadge confidence={item.confidence} size="sm" />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                  {item.reason || "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item.id)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum item para validar
          </div>
        )}
      </div>
    </div>
  );
}
