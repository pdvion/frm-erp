"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  TrendingDown,
  Loader2,
  Play,
  Building,
  DollarSign,
  BarChart3,
} from "lucide-react";

export default function DepreciationPage() {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const utils = trpc.useUtils();

  const { data: summary, isLoading, isError, error } = trpc.assets.getSummary.useQuery();

  const processMutation = trpc.assets.processDepreciation.useMutation({
    onSuccess: (result) => {
      utils.assets.getSummary.invalidate();
      utils.assets.listAssets.invalidate();
      alert(`Depreciação processada: ${result.length} ativos depreciados.`);
    },
    onError: (err) => {
      alert(`Erro ao processar depreciação: ${err.message}`);
    },
  });

  const handleProcess = () => {
    const [year, month] = period.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    processMutation.mutate({ period: date });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Depreciação" icon={<TrendingDown className="w-6 h-6" />} backHref="/assets" module="financeiro" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Depreciação" icon={<TrendingDown className="w-6 h-6" />} backHref="/assets" module="financeiro" />
        <Alert variant="error" title="Erro ao carregar resumo">{error.message}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Depreciação"
        icon={<TrendingDown className="w-6 h-6" />}
        backHref="/assets"
        module="financeiro"
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-theme-muted">Total de Ativos</p>
            </div>
            <p className="text-2xl font-semibold text-theme">{summary.totalAssets}</p>
            <p className="text-xs text-theme-muted">{summary.byStatus?.find((s) => s.status === "ACTIVE")?.count ?? 0} ativos</p>
          </div>
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-xs text-theme-muted">Valor Total Aquisição</p>
            </div>
            <p className="text-2xl font-semibold text-theme">{formatCurrency(Number(summary.totalAcquisitionValue))}</p>
          </div>
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <p className="text-xs text-theme-muted">Valor Atual Total</p>
            </div>
            <p className="text-2xl font-semibold text-theme">{formatCurrency(Number(summary.totalNetBookValue))}</p>
          </div>
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-xs text-theme-muted">Depreciação Acumulada</p>
            </div>
            <p className="text-2xl font-semibold text-theme">{formatCurrency(Number(summary.totalAccumulatedDepreciation))}</p>
          </div>
        </div>
      )}

      {/* Process Depreciation */}
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <h3 className="text-sm font-semibold text-theme uppercase tracking-wider mb-4">Processar Depreciação Mensal</h3>
        <p className="text-sm text-theme-muted mb-4">
          Selecione o período e processe a depreciação para todos os ativos ativos.
        </p>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Período</label>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleProcess}
            isLoading={processMutation.isPending}
          >
            <Play className="w-4 h-4 mr-2" />
            Processar Depreciação
          </Button>
        </div>
      </div>

      {/* Category Breakdown */}
      {summary?.byCategory && summary.byCategory.length > 0 && (
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-sm font-semibold text-theme uppercase tracking-wider mb-4">Por Categoria</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-table-header border-b border-theme">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-theme-muted uppercase">Categoria</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-theme-muted uppercase">Qtd</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">Valor Aquisição</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">Valor Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {summary.byCategory.map((cat) => (
                  <tr key={cat.category} className="hover:bg-theme-table-hover transition-colors">
                    <td className="px-4 py-2 text-sm font-medium text-theme">{cat.category}</td>
                    <td className="px-4 py-2 text-sm text-center text-theme">{cat.count}</td>
                    <td className="px-4 py-2 text-sm text-right text-theme">{formatCurrency(Number(cat.acquisitionValue))}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-theme">{formatCurrency(Number(cat.netBookValue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
