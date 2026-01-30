"use client";

import Link from "next/link";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Factory, Package, Loader2, BarChart3, PieChart
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";

export default function BIDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.biKpis.useQuery();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  const salesGrowthPositive = (kpis?.sales.growth || 0) >= 0;
  const oeePercentage = (kpis?.production.oee || 0) * 100;

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
              <Link
                href="/bi/reports"
                className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
              >
                Relatórios BI
              </Link>
              <Link
                href="/bi/analytics"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Analytics
              </Link>
            </div>
          }
        />

        {/* Resumo Financeiro */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-4 opacity-90">Resumo Financeiro (Ano)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm opacity-75">Receita</p>
              <p className="text-3xl font-bold">{formatCurrency(kpis?.financial.revenue || 0)}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Despesas</p>
              <p className="text-3xl font-bold">{formatCurrency(kpis?.financial.expenses || 0)}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Lucro</p>
              <p className={`text-3xl font-bold ${(kpis?.financial.profit || 0) >= 0 ? "text-green-300" : "text-red-300"}`}>
                {formatCurrency(kpis?.financial.profit || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-75">Margem</p>
              <p className="text-3xl font-bold">{(kpis?.financial.margin || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vendas do Mês */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${salesGrowthPositive ? "text-green-600" : "text-red-600"}`}>
                {salesGrowthPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(kpis?.sales.growth || 0).toFixed(1)}%
              </div>
            </div>
            <p className="text-sm text-theme-muted">Vendas do Mês</p>
            <p className="text-2xl font-bold text-theme">{formatCurrency(kpis?.sales.currentMonth || 0)}</p>
            <p className="text-xs text-theme-muted mt-1">
              Mês anterior: {formatCurrency(kpis?.sales.previousMonth || 0)}
            </p>
          </div>

          {/* Compras do Mês */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-theme-muted">Compras do Mês</p>
            <p className="text-2xl font-bold text-theme">{formatCurrency(kpis?.purchases.currentMonth || 0)}</p>
            <p className="text-xs text-theme-muted mt-1">
              Mês anterior: {formatCurrency(kpis?.purchases.previousMonth || 0)}
            </p>
          </div>

          {/* Produção */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Factory className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-theme-muted">Produção do Mês</p>
            <p className="text-2xl font-bold text-theme">{kpis?.production.orders || 0} ordens</p>
            <p className="text-xs text-theme-muted mt-1">
              OEE: <span className={oeePercentage >= 85 ? "text-green-600" : oeePercentage >= 60 ? "text-yellow-600" : "text-red-600"}>
                {oeePercentage.toFixed(1)}%
              </span>
            </p>
          </div>

          {/* Estoque */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-theme-muted">Valor em Estoque</p>
            <p className="text-2xl font-bold text-theme">{formatCurrency(kpis?.inventory.totalValue || 0)}</p>
            <div className="flex gap-4 mt-1 text-xs">
              <span className="text-yellow-600">{kpis?.inventory.lowStock || 0} baixo</span>
              <span className="text-red-600">{kpis?.inventory.outOfStock || 0} zerado</span>
            </div>
          </div>
        </div>

        {/* Indicadores Detalhados */}
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
