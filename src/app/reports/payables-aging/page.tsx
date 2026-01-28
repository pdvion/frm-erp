"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";

import {
  TrendingDown,
  ChevronLeft,
  Download,
  Loader2,
  Calendar,
} from "lucide-react";

export default function PayablesAgingReportPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading } = trpc.reports.payablesAging.useQuery({
    asOfDate,
  });

  const handleExportCSV = () => {
    if (!data?.details) return;

    const headers = ["Fornecedor", "Descrição", "Vencimento", "Valor", "Dias Vencido"];
    const rows = data.details.map((item: { supplier: string; description: string; dueDate: Date; amount: number; daysOverdue: number }) => [
      item.supplier,
      item.description,
      formatDate(item.dueDate),
      item.amount,
      item.daysOverdue,
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row: (string | number | Date)[]) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `aging-pagar-${asOfDate}.csv`;
    link.click();
  };

  const agingBuckets = [
    { key: "current", label: "A Vencer", color: "bg-green-500" },
    { key: "days1to30", label: "1-30 dias", color: "bg-yellow-500" },
    { key: "days31to60", label: "31-60 dias", color: "bg-orange-500" },
    { key: "days61to90", label: "61-90 dias", color: "bg-red-400" },
    { key: "over90", label: "> 90 dias", color: "bg-red-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/reports" className="text-theme-muted hover:text-theme-secondary" aria-label="Voltar aos relatórios">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-theme">Aging Contas a Pagar</h1>
                <p className="text-sm text-theme-muted">Análise de vencimentos</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportCSV}
                disabled={!data?.details?.length}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
              
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Filter */}
        <div className="bg-theme-card rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-theme-muted" />
            <label htmlFor="as-of-date" className="text-sm font-medium text-theme-secondary">
              Data de Referência:
            </label>
            <input
              id="as-of-date"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        )}

        {/* Aging Summary */}
        {data && (
          <>
            {/* Total Card */}
            <div className="bg-theme-card rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-muted">Total em Aberto</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(data.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-theme-muted">Títulos</p>
                  <p className="text-2xl font-bold text-theme">
                    {Object.values(data.aging).reduce((acc, b) => acc + b.count, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Aging Buckets */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {agingBuckets.map((bucket) => {
                const agingData = data.aging[bucket.key as keyof typeof data.aging];
                const percentage = data.total > 0 ? (agingData.value / data.total) * 100 : 0;
                return (
                  <div key={bucket.key} className="bg-theme-card rounded-lg shadow-sm border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${bucket.color}`} />
                      <span className="text-sm font-medium text-theme-secondary">{bucket.label}</span>
                    </div>
                    <p className="text-xl font-bold text-theme">{formatCurrency(agingData.value)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-theme-muted">{agingData.count} títulos</span>
                      <span className="text-xs font-medium text-theme-secondary">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-theme-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bucket.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Details Table */}
            <div className="bg-theme-card rounded-lg shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-theme-tertiary">
                <h3 className="font-medium text-theme">Detalhamento</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Fornecedor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Vencimento</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Dias Vencido</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.details.map((item: { id: string; supplier: string; description: string; dueDate: Date; amount: number; daysOverdue: number }) => (
                      <tr key={item.id} className="hover:bg-theme-hover">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-theme">{item.supplier}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-theme-secondary">{item.description}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="text-sm text-theme-secondary">{formatDate(item.dueDate)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {item.daysOverdue > 0 ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.daysOverdue > 90 ? "bg-red-100 text-red-800" :
                              item.daysOverdue > 60 ? "bg-red-50 text-red-700" :
                              item.daysOverdue > 30 ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {item.daysOverdue} dias
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              A vencer
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-theme">{formatCurrency(item.amount)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.details.length === 0 && (
                <div className="text-center py-12">
                  <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-theme-muted">Nenhuma conta a pagar em aberto</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
