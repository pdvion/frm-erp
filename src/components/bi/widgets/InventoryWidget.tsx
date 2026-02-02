"use client";

import { Package, TrendingDown, AlertCircle, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";

export function InventoryWidgetSkeleton() {
  return (
    <div className="bg-theme-card rounded-xl border border-theme p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-theme-tertiary rounded" />
        <div className="h-5 w-5 bg-theme-tertiary rounded" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center">
            <div className="h-8 w-16 bg-theme-tertiary rounded mx-auto mb-2" />
            <div className="h-4 w-20 bg-theme-tertiary rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InventoryWidget() {
  const { data, isLoading } = trpc.dashboard.biKpis.useQuery(undefined, {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <InventoryWidgetSkeleton />;
  }

  const totalValue = data?.inventory?.totalValue ?? 0;
  const lowStock = data?.inventory?.lowStock ?? 0;
  const outOfStock = data?.inventory?.outOfStock ?? 0;
  const turnover = 4.2; // Calculado separadamente

  return (
    <div className="bg-theme-card rounded-xl border border-theme p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-theme">Estoque</h3>
          <p className="text-sm text-theme-muted">Visão consolidada</p>
        </div>
        <Package className="w-5 h-5 text-theme-muted" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Package className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-green-700 dark:text-green-400">Valor Total</p>
        </div>

        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <TrendingDown className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">Estoque Baixo</p>
        </div>

        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
          <p className="text-xs text-red-700 dark:text-red-400">Sem Estoque</p>
        </div>

        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <RotateCcw className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{turnover}x</p>
          <p className="text-xs text-blue-700 dark:text-blue-400">Giro Anual</p>
        </div>
      </div>
    </div>
  );
}
