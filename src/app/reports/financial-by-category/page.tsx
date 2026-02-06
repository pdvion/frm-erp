"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  PieChart,
  Download,
  Loader2,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CategoryItem {
  category: string;
  revenue: number;
  expense: number;
  net: number;
}


export default function FinancialByCategoryPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(startOfMonth.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading } = trpc.reports.financialByCategory.useQuery({
    startDate,
    endDate,
  });

  const handleExportCSV = () => {
    if (!data?.items) return;

    const headers = ["Categoria", "Receita", "Despesa", "Saldo", "% do Total"];
    const totalMovement = data.totals.totalRevenue + data.totals.totalExpense;
    const rows = data.items.map((item: CategoryItem) => {
      const pct = totalMovement > 0
        ? (((item.revenue + item.expense) / totalMovement) * 100).toFixed(1)
        : "0.0";
      return [
        item.category,
        item.revenue.toFixed(2),
        item.expense.toFixed(2),
        item.net.toFixed(2),
        pct,
      ];
    });

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro-categoria-${startDate}-${endDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análise por Categoria"
        subtitle="Receitas e despesas agrupadas por categoria"
        icon={<PieChart className="w-6 h-6" />}
        backHref="/reports"
        module="reports"
        actions={
          <Button
            onClick={handleExportCSV}
            disabled={!data?.items?.length}
            variant="primary"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar CSV
          </Button>
        }
      />

      <div>
        {/* Date Filter */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <Calendar className="w-5 h-5 text-theme-muted" />
            <label htmlFor="cat-start" className="text-sm font-medium text-theme-secondary">
              Período:
            </label>
            <Input
              id="cat-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="max-w-[180px]"
            />
            <ArrowRight className="w-4 h-4 text-theme-muted" />
            <label htmlFor="cat-end" className="sr-only">Data final</label>
            <Input
              id="cat-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="max-w-[180px]"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Total Receitas</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.totals.totalRevenue)}
                </p>
              </div>

              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">Total Despesas</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.totals.totalExpense)}
                </p>
              </div>

              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-theme-muted mb-1">
                  {data.totals.netResult >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">Resultado Líquido</span>
                </div>
                <p className={`text-2xl font-bold ${data.totals.netResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(data.totals.netResult)}
                </p>
              </div>
            </div>

            {/* Category Table */}
            <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-theme-table-header border-b border-theme">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Receita
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Despesa
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Saldo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        % do Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-theme-muted">
                          Nenhum dado encontrado para o período selecionado.
                        </td>
                      </tr>
                    ) : (
                      data.items.map((item, idx) => {
                        const totalMovement = data.totals.totalRevenue + data.totals.totalExpense;
                        const pctOfTotal = totalMovement > 0
                          ? ((item.revenue + item.expense) / totalMovement) * 100
                          : 0;

                        return (
                          <tr key={idx} className="hover:bg-theme-hover">
                            <td className="px-6 py-3 font-medium text-theme">
                              {item.category}
                            </td>
                            <td className="px-6 py-3 text-right text-green-600">
                              {item.revenue > 0 ? formatCurrency(item.revenue) : "-"}
                            </td>
                            <td className="px-6 py-3 text-right text-red-600">
                              {item.expense > 0 ? formatCurrency(item.expense) : "-"}
                            </td>
                            <td className={`px-6 py-3 text-right font-medium ${item.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(item.net)}
                            </td>
                            <td className="px-6 py-3 text-right text-theme-muted text-sm">
                              {pctOfTotal.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {data.items.length > 0 && (
                    <tfoot className="bg-theme-tertiary border-t-2 border-theme font-semibold">
                      <tr>
                        <td className="px-6 py-3 text-theme">Total</td>
                        <td className="px-6 py-3 text-right text-green-600">
                          {formatCurrency(data.totals.totalRevenue)}
                        </td>
                        <td className="px-6 py-3 text-right text-red-600">
                          {formatCurrency(data.totals.totalExpense)}
                        </td>
                        <td className={`px-6 py-3 text-right ${data.totals.netResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(data.totals.netResult)}
                        </td>
                        <td className="px-6 py-3 text-right text-theme-muted">100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
