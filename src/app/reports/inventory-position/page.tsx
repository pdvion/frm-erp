"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Package,
  ChevronLeft,
  Download,
  Filter,
  AlertTriangle,
  Loader2,
  Search,
} from "lucide-react";

const inventoryTypeLabels: Record<string, string> = {
  RAW_MATERIAL: "Matéria-Prima",
  FINISHED_PRODUCT: "Produto Acabado",
  PACKAGING: "Embalagem",
  CONSUMABLE: "Consumível",
  SPARE_PART: "Peça Reposição",
};

export default function InventoryPositionReportPage() {
  const [inventoryType, setInventoryType] = useState<string>("");
  const [belowMinimum, setBelowMinimum] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = trpc.reports.inventoryPosition.useQuery({
    inventoryType: inventoryType as "RAW_MATERIAL" | "FINISHED_PRODUCT" | "PACKAGING" | "CONSUMABLE" | "SPARE_PART" | undefined || undefined,
    belowMinimum: belowMinimum || undefined,
  });

  const filteredItems = data?.items.filter((item) =>
    item.materialDescription.toLowerCase().includes(search.toLowerCase()) ||
    item.materialCode.toString().includes(search)
  );

  const handleExportCSV = () => {
    if (!filteredItems) return;

    const headers = ["Código", "Descrição", "Categoria", "Unidade", "Quantidade", "Reservado", "Disponível", "Custo Unit.", "Custo Total", "Mínimo", "Máximo"];
    const rows = filteredItems.map((item) => [
      item.materialCode,
      item.materialDescription,
      item.category,
      item.unit,
      item.quantity,
      item.reservedQty,
      item.availableQty,
      item.unitCost,
      item.totalCost,
      item.minQuantity || "",
      item.maxQuantity || "",
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `posicao-estoque-${new Date().toISOString().split("T")[0]}.csv`;
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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-theme">Posição de Estoque</h1>
                <p className="text-sm text-theme-muted">Visão geral do estoque atual</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportCSV}
                disabled={!filteredItems?.length}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Total de Itens</p>
              <p className="text-2xl font-bold text-theme">{data.totals.totalItems.toLocaleString("pt-BR")}</p>
            </div>
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Quantidade Total</p>
              <p className="text-2xl font-bold text-theme">{formatNumber(data.totals.totalQuantity)}</p>
            </div>
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totals.totalValue)}</p>
            </div>
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Abaixo do Mínimo</p>
              <p className="text-2xl font-bold text-red-600">{data.totals.belowMinimum.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-theme-card rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-theme-muted" />
              <span className="text-sm font-medium text-theme-secondary">Filtros:</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <label htmlFor="inventory-type" className="sr-only">Tipo de Estoque</label>
            <select
              id="inventory-type"
              value={inventoryType}
              onChange={(e) => setInventoryType(e.target.value)}
              className="px-3 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(inventoryTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={belowMinimum}
                onChange={(e) => setBelowMinimum(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-theme-secondary">Apenas abaixo do mínimo</span>
            </label>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Table */}
        {!isLoading && filteredItems && (
          <div className="bg-theme-card rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Quantidade</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Disponível</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Custo Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Custo Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-theme-hover ${item.isBelowMinimum ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-theme">{item.materialCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/materials/${item.id}`}
                          className="text-sm text-theme hover:text-blue-600"
                        >
                          {item.materialDescription}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-theme-secondary">{item.category}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-theme-muted">
                          {inventoryTypeLabels[item.inventoryType] || item.inventoryType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-theme">{formatNumber(item.quantity)} {item.unit}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${item.isBelowMinimum ? "text-red-600" : "text-theme"}`}>
                          {formatNumber(item.availableQty)} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-theme-secondary">{formatCurrency(item.unitCost)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-theme">{formatCurrency(item.totalCost)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {item.isBelowMinimum ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3" />
                            Baixo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-theme-muted">Nenhum item encontrado</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
