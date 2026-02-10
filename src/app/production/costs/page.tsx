"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

import {
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Search,
  Filter,
  Calculator,
  Clock,
  Lock,
  TrendingUp,
  TrendingDown,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Badge, colorToVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme", icon: <Clock className="w-4 h-4" /> },
  CALCULATED: { label: "Calculado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <Calculator className="w-4 h-4" /> },
  CLOSED: { label: "Fechado", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <Lock className="w-4 h-4" /> },
};

export default function ProductionCostsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data: dashboard, isLoading: loadingDashboard } = trpc.productionCosts.dashboard.useQuery();

  const { data: costsData, isLoading: loadingCosts } = trpc.productionCosts.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter as "DRAFT" | "CALCULATED" | "CLOSED" : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custos de Produção"
        icon={<DollarSign className="w-6 h-6" />}
        backHref="/production"
        module="production"
      />

      <main className="max-w-7xl mx-auto">
        {/* Dashboard Cards */}
        {loadingDashboard ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <Calculator className="w-4 h-4" />
                <span className="text-sm">Custos Calculados</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{dashboard?.calculatedCosts || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Custos Fechados</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{dashboard?.closedCosts || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total Mês</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(dashboard?.monthlyCosts?.total || 0)}
              </p>
              <p className="text-xs text-theme-muted">{dashboard?.monthlyCosts?.count || 0} OPs</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                {(Number(dashboard?.avgVariance) || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm">Variação Média</span>
              </div>
              <p className={`text-2xl font-bold ${(Number(dashboard?.avgVariance) || 0) >= 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(dashboard?.avgVariance || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                placeholder="Buscar por OP ou produto..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <NativeSelect
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="border border-theme-input rounded-lg px-3 py-2"
              >
                <option value="ALL">Todos Status</option>
                <option value="DRAFT">Rascunho</option>
                <option value="CALCULATED">Calculado</option>
                <option value="CLOSED">Fechado</option>
              </NativeSelect>
            </div>
          </div>
        </div>

        {/* Lista de Custos */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {loadingCosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : !costsData?.costs.length ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhum custo de produção encontrado</p>
              <p className="text-sm text-theme-muted mt-2">
                Calcule o custo de uma OP na página de detalhes da ordem
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">OP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Produto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Material</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">M.O.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">GGF</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Variação</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {costsData.costs.map((cost) => {
                      const statusCfg = statusConfig[cost.status] || statusConfig.DRAFT;
                      const variance = cost.totalVariance || 0;
                      return (
                        <tr key={cost.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3 font-medium text-theme">
                            OP #{cost.productionOrder?.code}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-theme-muted" />
                              <span className="text-sm">{cost.productionOrder?.product?.description}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrency(cost.materialCost)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrency(cost.laborCost)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrency(cost.overheadCost)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(cost.totalCost)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-medium ${Number(variance) > 0 ? "text-red-600" : Number(variance) < 0 ? "text-green-600" : "text-theme-muted"}`}>
                              {Number(variance) > 0 ? "+" : ""}{formatCurrency(variance)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={colorToVariant(statusCfg.color)}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/production/costs/${cost.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {costsData.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Página {page} de {costsData.pages} ({costsData.total} registros)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={() => setPage(page + 1)}
                      disabled={page === costsData.pages}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info sobre variação */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Sobre a Variação de Custos</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Variação positiva (vermelho)</strong>: Custo real maior que o padrão</li>
            <li>• <strong>Variação negativa (verde)</strong>: Custo real menor que o padrão</li>
            <li>• A variação ajuda a identificar ineficiências e oportunidades de melhoria</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
