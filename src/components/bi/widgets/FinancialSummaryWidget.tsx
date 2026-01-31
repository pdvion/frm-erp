"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { KPISkeleton } from "@/components/ui/Skeleton";

export function FinancialSummaryWidget() {
  const { data: kpis, isLoading } = trpc.dashboard.biKpis.useQuery(undefined, {
    staleTime: 60 * 1000, // 1 minute cache
  });

  if (isLoading) {
    return <KPISkeleton count={4} />;
  }

  return (
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
  );
}

export function FinancialSummarySkeleton() {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6">
      <div className="h-6 w-48 bg-white/20 rounded animate-pulse mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 w-16 bg-white/20 rounded animate-pulse mb-2" />
            <div className="h-9 w-32 bg-white/20 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
