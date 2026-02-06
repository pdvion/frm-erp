"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { ArrowLeftRight, Download, Loader2, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PurchasesBySupplierReportPage() {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = trpc.reports.purchasesBySupplier.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const filteredItems = data?.items.filter((item) =>
    item.supplier.toLowerCase().includes(search.toLowerCase()) ||
    item.cnpj.includes(search)
  );

  const handleExportCSV = () => {
    if (!filteredItems) return;

    const headers = ["Fornecedor", "CNPJ", "Qtd. Pedidos", "Valor Total"];
    const rows = filteredItems.map((item) => [
      item.supplier,
      item.cnpj,
      item.orderCount,
      item.totalValue,
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `compras-fornecedor-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras por Fornecedor"
        subtitle="Volume e valor por fornecedor"
        icon={<ArrowLeftRight className="w-6 h-6" />}
        backHref="/reports"
        module="reports"
        actions={
          <Button
            onClick={handleExportCSV}
            disabled={!filteredItems?.length}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Total de Fornecedores</p>
              <p className="text-2xl font-bold text-theme">{filteredItems?.length || 0}</p>
            </div>
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Total de Pedidos</p>
              <p className="text-2xl font-bold text-theme">{data.totals.totalOrders.toLocaleString("pt-BR")}</p>
            </div>
            <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-200 p-4">
              <p className="text-sm text-purple-700">Valor Total</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.totals.totalValue)}</p>
            </div>
          </div>
        )}

        <div className="bg-theme-card rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                placeholder="Buscar fornecedor ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-theme-muted" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-theme-muted">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        )}

        {!isLoading && filteredItems && (
          <div className="bg-theme-card rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Fornecedor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">CNPJ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd. Pedidos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredItems.map((item, idx) => {
                    const percent = data?.totals.totalValue ? (item.totalValue / data.totals.totalValue) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-theme-hover">
                        <td className="px-4 py-3 text-sm font-medium text-theme">{item.supplier}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-secondary">{item.cnpj || "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-theme">{item.orderCount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-theme">{formatCurrency(item.totalValue)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-theme-tertiary rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }} />
                            </div>
                            <span className="text-sm text-theme-secondary w-12 text-right">{percent.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <ArrowLeftRight className="w-12 h-12 text-theme-muted mx-auto mb-4" />
                <p className="text-theme-muted">Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
