"use client";

import { Factory, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function ProductionWidgetSkeleton() {
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

export function ProductionWidget() {
  const { data, isLoading } = trpc.dashboard.biKpis.useQuery(undefined, {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <ProductionWidgetSkeleton />;
  }

  const oee = data?.production?.oee ?? 85;
  const ordersInProgress = data?.production?.orders ?? 12;
  const quantity = data?.production?.quantity ?? 0;
  const efficiency = Math.round((oee / 100) * 100);

  return (
    <div className="bg-theme-card rounded-xl border border-theme p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-theme">Produção</h3>
          <p className="text-sm text-theme-muted">Indicadores em tempo real</p>
        </div>
        <Factory className="w-5 h-5 text-theme-muted" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">{oee}%</p>
          <p className="text-xs text-purple-700 dark:text-purple-400">OEE</p>
        </div>

        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Factory className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{ordersInProgress}</p>
          <p className="text-xs text-blue-700 dark:text-blue-400">Em Produção</p>
        </div>

        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{efficiency}%</p>
          <p className="text-xs text-green-700 dark:text-green-400">Eficiência</p>
        </div>

        <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-600">{quantity}</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">Quantidade</p>
        </div>
      </div>
    </div>
  );
}
