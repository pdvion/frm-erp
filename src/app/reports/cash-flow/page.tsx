"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";

import {
  Wallet,
  ChevronLeft,
  Download,
  Loader2,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

export default function CashFlowReportPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading } = trpc.reports.cashFlow.useQuery({
    startDate,
    endDate,
  });

  const handleExportCSV = () => {
    if (!data?.flowData) return;

    const headers = ["Data", "Entradas", "Saídas", "Saldo Líquido", "Saldo Acumulado"];
    const rows = data.flowData.map((item) => [
      item.date,
      item.inflow,
      item.outflow,
      item.net,
      item.balance,
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fluxo-caixa-${startDate}-${endDate}.csv`;
    link.click();
  };

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
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-theme">Fluxo de Caixa</h1>
                <p className="text-sm text-theme-muted">Entradas e saídas por período</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportCSV}
                disabled={!data?.flowData?.length}
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
          <div className="flex flex-wrap items-center gap-4">
            <Calendar className="w-5 h-5 text-theme-muted" />
            <label htmlFor="start-date" className="text-sm font-medium text-theme-secondary">
              Período:
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <ArrowRight className="w-4 h-4 text-theme-muted" />
            <label htmlFor="end-date" className="sr-only">Data final</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        )}

        {/* Summary Cards */}
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-theme-card rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-theme-muted">Total Entradas</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totals.totalInflow)}</p>
              </div>

              <div className="bg-theme-card rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm text-theme-muted">Total Saídas</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totals.totalOutflow)}</p>
              </div>

              <div className="bg-theme-card rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    data.totals.netFlow >= 0 ? "bg-emerald-100" : "bg-orange-100"
                  }`}>
                    <Wallet className={`w-5 h-5 ${data.totals.netFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`} />
                  </div>
                  <span className="text-sm text-theme-muted">Saldo Líquido</span>
                </div>
                <p className={`text-2xl font-bold ${data.totals.netFlow >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                  {formatCurrency(data.totals.netFlow)}
                </p>
              </div>
            </div>

            {/* Flow Chart (Simple Bar Representation) */}
            {data.flowData.length > 0 && (
              <div className="bg-theme-card rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="font-medium text-theme mb-4">Fluxo Diário</h3>
                <div className="space-y-3">
                  {data.flowData.map((day) => {
                    const maxValue = Math.max(
                      ...data.flowData.map((d) => Math.max(d.inflow, d.outflow))
                    );
                    const inflowWidth = maxValue > 0 ? (day.inflow / maxValue) * 100 : 0;
                    const outflowWidth = maxValue > 0 ? (day.outflow / maxValue) * 100 : 0;

                    return (
                      <div key={day.date} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-theme-secondary">{formatDate(day.date)}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-6 bg-theme-tertiary rounded overflow-hidden relative">
                            <div
                              className="absolute left-0 top-0 h-full bg-green-500 rounded-l"
                              style={{ width: `${inflowWidth}%` }}
                            />
                          </div>
                          <div className="w-24 text-right text-sm text-green-600">
                            +{formatCurrency(day.inflow)}
                          </div>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-6 bg-theme-tertiary rounded overflow-hidden relative">
                            <div
                              className="absolute left-0 top-0 h-full bg-red-500 rounded-l"
                              style={{ width: `${outflowWidth}%` }}
                            />
                          </div>
                          <div className="w-24 text-right text-sm text-red-600">
                            -{formatCurrency(day.outflow)}
                          </div>
                        </div>
                        <div className={`w-28 text-right text-sm font-medium ${
                          day.net >= 0 ? "text-emerald-600" : "text-orange-600"
                        }`}>
                          {formatCurrency(day.net)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details Table */}
            <div className="bg-theme-card rounded-lg shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-theme-tertiary">
                <h3 className="font-medium text-theme">Detalhamento por Dia</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Data</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Entradas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Saídas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Saldo Dia</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.flowData.map((day) => (
                      <tr key={day.date} className="hover:bg-theme-hover">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-theme">{formatDate(day.date)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-green-600">+{formatCurrency(day.inflow)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-red-600">-{formatCurrency(day.outflow)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={`text-sm font-medium ${day.net >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                            {formatCurrency(day.net)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={`text-sm font-bold ${day.balance >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                            {formatCurrency(day.balance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.flowData.length === 0 && (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-theme-muted">Nenhuma movimentação no período</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
