"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { KPISkeleton } from "@/components/ui/Skeleton";
import { TrendingUp, TrendingDown, ShoppingCart, Factory, Package } from "lucide-react";

export function KPICardsWidget() {
  const { data: kpis, isLoading } = trpc.dashboard.biKpis.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return <KPISkeleton count={4} />;
  }

  const salesGrowthPositive = (kpis?.sales.growth || 0) >= 0;
  const oeePercentage = (kpis?.production.oee || 0) * 100;

  return (
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
  );
}
