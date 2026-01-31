"use client";

import { Suspense } from "react";
import Link from "next/link";
import { 
  TrendingUp, DollarSign,
  Factory, Package, BarChart3, PieChart
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { KPISkeleton } from "@/components/ui/Skeleton";
import { FinancialSummaryWidget, FinancialSummarySkeleton } from "@/components/bi/widgets";
import { KPICardsWidget } from "@/components/bi/widgets";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";

// Componente para indicadores detalhados
function DetailedIndicatorsWidget() {
  const { data: kpis, isLoading } = trpc.dashboard.biKpis.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return <KPISkeleton count={2} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Comparativo Vendas vs Compras */}
      <div className="bg-theme-card rounded-xl border border-theme p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-theme">Vendas vs Compras</h3>
            <p className="text-sm text-theme-muted">Comparativo mensal</p>
          </div>
          <BarChart3 className="w-5 h-5 text-theme-muted" />
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-theme-muted">Vendas</span>
              <span className="font-medium text-green-600">{formatCurrency(kpis?.sales.currentMonth || 0)}</span>
            </div>
            <div className="w-full bg-theme-tertiary rounded-full h-4">
              <div 
                className="h-4 rounded-full bg-green-500"
                style={{ 
                  width: `${Math.min(
                    ((kpis?.sales.currentMonth || 0) / Math.max((kpis?.sales.currentMonth || 0), (kpis?.purchases.currentMonth || 0), 1)) * 100, 
                    100
                  )}%` 
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-theme-muted">Compras</span>
              <span className="font-medium text-blue-600">{formatCurrency(kpis?.purchases.currentMonth || 0)}</span>
            </div>
            <div className="w-full bg-theme-tertiary rounded-full h-4">
              <div 
                className="h-4 rounded-full bg-blue-500"
                style={{ 
                  width: `${Math.min(
                    ((kpis?.purchases.currentMonth || 0) / Math.max((kpis?.sales.currentMonth || 0), (kpis?.purchases.currentMonth || 0), 1)) * 100, 
                    100
                  )}%` 
                }}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-theme">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-theme">Saldo</span>
              <span className={`font-bold ${((kpis?.sales.currentMonth || 0) - (kpis?.purchases.currentMonth || 0)) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency((kpis?.sales.currentMonth || 0) - (kpis?.purchases.currentMonth || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores de Estoque */}
      <div className="bg-theme-card rounded-xl border border-theme p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-theme">Saúde do Estoque</h3>
            <p className="text-sm text-theme-muted">Situação atual</p>
          </div>
          <PieChart className="w-5 h-5 text-theme-muted" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis?.inventory.totalValue || 0)}
            </p>
            <p className="text-xs text-green-700">Valor Total</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <Package className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{kpis?.inventory.lowStock || 0}</p>
            <p className="text-xs text-yellow-700">Estoque Baixo</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <Package className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{kpis?.inventory.outOfStock || 0}</p>
            <p className="text-xs text-red-700">Sem Estoque</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BIDashboardPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard BI & Gestão"
          subtitle="Indicadores estratégicos consolidados"
          icon={<BarChart3 className="w-6 h-6" />}
          module="bi"
          actions={
            <div className="flex gap-2">
              <LinkButton href="/bi/reports" variant="outline">
                Relatórios BI
              </LinkButton>
              <LinkButton href="/bi/analytics">
                Analytics
              </LinkButton>
            </div>
          }
        />

        {/* Resumo Financeiro - Com Suspense */}
        <Suspense fallback={<FinancialSummarySkeleton />}>
          <FinancialSummaryWidget />
        </Suspense>

        {/* KPIs Cards - Com Suspense */}
        <Suspense fallback={<KPISkeleton count={4} />}>
          <KPICardsWidget />
        </Suspense>

        {/* Indicadores Detalhados - Com Suspense */}
        <Suspense fallback={<KPISkeleton count={2} />}>
          <DetailedIndicatorsWidget />
        </Suspense>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/bi/sales"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Análise de Vendas</p>
              <p className="text-sm text-theme-muted">Tendências e previsões</p>
            </div>
          </Link>

          <Link
            href="/bi/financial"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Análise Financeira</p>
              <p className="text-sm text-theme-muted">Fluxo de caixa</p>
            </div>
          </Link>

          <Link
            href="/bi/production"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Factory className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Análise de Produção</p>
              <p className="text-sm text-theme-muted">OEE e eficiência</p>
            </div>
          </Link>

          <Link
            href="/bi/inventory"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Análise de Estoque</p>
              <p className="text-sm text-theme-muted">Giro e cobertura</p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
