"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { TrendingUp, ChevronLeft, Download, Loader2, Search } from "lucide-react";

export default function ReceivablesAgingReportPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = trpc.reports.receivablesAging.useQuery();

  const filteredDetails = data?.details.filter((item) =>
    item.customer.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!filteredDetails) return;

    const headers = ["Cliente", "Descrição", "Vencimento", "Dias Vencido", "Valor"];
    const rows = filteredDetails.map((item) => [
      item.customer,
      item.description,
      new Date(item.dueDate).toLocaleDateString("pt-BR"),
      item.daysOverdue,
      item.amount,
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `aging-receber-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getAgingColor = (days: number) => {
    if (days <= 0) return "text-green-600";
    if (days <= 30) return "text-blue-600";
    if (days <= 60) return "text-yellow-600";
    if (days <= 90) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <header className="bg-theme-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/reports" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-theme">Aging Contas a Receber</h1>
                <p className="text-sm text-theme-muted">Análise de vencimentos por faixa</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportCSV}
                disabled={!filteredDetails?.length}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
              <p className="text-sm text-green-700">A Vencer ({data.aging.current.count})</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(data.aging.current.value)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
              <p className="text-sm text-blue-700">1-30 dias ({data.aging.days1to30.count})</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(data.aging.days1to30.value)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
              <p className="text-sm text-yellow-700">31-60 dias ({data.aging.days31to60.count})</p>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(data.aging.days31to60.value)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-4">
              <p className="text-sm text-orange-700">61-90 dias ({data.aging.days61to90.count})</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(data.aging.days61to90.value)}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
              <p className="text-sm text-red-700">+90 dias ({data.aging.over90.count})</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(data.aging.over90.value)}</p>
            </div>
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Total Geral</p>
              <p className="text-xl font-bold text-theme">{formatCurrency(data.total)}</p>
            </div>
          </div>
        )}

        <div className="bg-theme-card rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        )}

        {!isLoading && filteredDetails && (
          <div className="bg-theme-card rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Vencimento</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Dias Vencido</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredDetails.map((item) => (
                    <tr key={item.id} className="hover:bg-theme-hover">
                      <td className="px-4 py-3 text-sm font-medium text-theme">{item.customer}</td>
                      <td className="px-4 py-3 text-sm text-theme-secondary">{item.description || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-theme">
                        {formatDate(item.dueDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`text-sm font-medium ${getAgingColor(item.daysOverdue)}`}>
                          {item.daysOverdue > 0 ? `${item.daysOverdue} dias` : "A vencer"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-theme">{formatCurrency(item.amount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredDetails.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-theme-muted">Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
