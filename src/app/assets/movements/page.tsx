"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowRightLeft,
  Loader2,
  Building,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  ACQUISITION: "Aquisição",
  DEPRECIATION: "Depreciação",
  DISPOSAL: "Baixa",
  TRANSFER: "Transferência",
  REVALUATION: "Reavaliação",
  IMPAIRMENT: "Impairment",
};

const typeVariants: Record<string, "success" | "warning" | "error" | "info" | "default" | "purple"> = {
  ACQUISITION: "success",
  DEPRECIATION: "warning",
  DISPOSAL: "error",
  TRANSFER: "info",
  REVALUATION: "purple",
  IMPAIRMENT: "error",
};

const typeOptions = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "ACQUISITION", label: "Aquisição" },
  { value: "DEPRECIATION", label: "Depreciação" },
  { value: "DISPOSAL", label: "Baixa" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "REVALUATION", label: "Reavaliação" },
  { value: "IMPAIRMENT", label: "Impairment" },
];

export default function AssetMovementsPage() {
  const [typeFilter, setTypeFilter] = useState("ALL");

  const { data: movements, isLoading, isError, error } = trpc.assets.getMovements.useQuery({
    type: typeFilter !== "ALL" ? (typeFilter as "ACQUISITION" | "DEPRECIATION" | "DISPOSAL" | "TRANSFER" | "REVALUATION" | "IMPAIRMENT") : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações Patrimoniais"
        icon={<ArrowRightLeft className="w-6 h-6" />}
        backHref="/assets"
        module="financeiro"
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48">
            <Select
              value={typeFilter}
              onChange={(v) => setTypeFilter(v)}
              options={typeOptions}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="error" title="Erro ao carregar movimentações">{error.message}</Alert>
          </div>
        ) : !movements?.length ? (
          <div className="text-center py-12">
            <ArrowRightLeft className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhuma movimentação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-table-header border-b border-theme">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Ativo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-theme-table-hover transition-colors">
                    <td className="px-4 py-3 text-sm text-theme">
                      {formatDate(mov.date)}
                    </td>
                    <td className="px-4 py-3">
                      {mov.asset ? (
                        <div className="flex items-center gap-2 text-sm text-theme">
                          <Building className="w-4 h-4 text-theme-muted" />
                          <div>
                            <div>{mov.asset.name}</div>
                            <div className="text-xs text-theme-muted">{mov.asset.code}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-theme-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={typeVariants[mov.type] ?? "default"}>
                        {typeLabels[mov.type] ?? mov.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-theme">
                      {formatCurrency(Number(mov.value))}
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-muted">
                      {mov.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
