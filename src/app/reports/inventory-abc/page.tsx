"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Package, Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const classColors: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: "bg-green-100", text: "text-green-800", label: "Classe A (80%)" },
  B: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Classe B (15%)" },
  C: { bg: "bg-red-100", text: "text-red-800", label: "Classe C (5%)" },
};

export default function InventoryAbcReportPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("");

  const { data, isLoading } = trpc.reports.inventoryAbc.useQuery();

  const filteredItems = data?.items.filter((item) => {
    const matchesSearch =
      item.materialDescription.toLowerCase().includes(search.toLowerCase()) ||
      item.materialCode.toString().includes(search);
    const matchesClass = !classFilter || item.classification === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleExportCSV = () => {
    if (!filteredItems) return;

    const headers = ["Código", "Descrição", "Categoria", "Quantidade", "Custo Total", "% do Total", "% Acumulado", "Classificação"];
    const rows = filteredItems.map((item) => [
      item.materialCode,
      item.materialDescription,
      item.category,
      item.quantity,
      item.totalCost,
      item.percentOfTotal.toFixed(2),
      item.cumulativePercent.toFixed(2),
      item.classification,
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `curva-abc-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curva ABC de Estoque"
        subtitle="Classificação de itens por valor"
        icon={<Package className="w-6 h-6" />}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Total de Itens</p>
              <p className="text-2xl font-bold text-theme">{data.summary.totalItems.toLocaleString("pt-BR")}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
              <p className="text-sm text-green-700">Classe A ({data.summary.classA.count} itens)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.classA.value)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
              <p className="text-sm text-yellow-700">Classe B ({data.summary.classB.count} itens)</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(data.summary.classB.value)}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
              <p className="text-sm text-red-700">Classe C ({data.summary.classC.count} itens)</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data.summary.classC.value)}</p>
            </div>
          </div>
        )}

        <div className="bg-theme-card rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                placeholder="Buscar material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setClassFilter("")}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${!classFilter ? "bg-blue-600 text-white" : "bg-theme-tertiary text-theme-secondary"}`}
              >
                Todos
              </Button>
              {["A", "B", "C"].map((cls) => (
                <Button
                  key={cls}
                  onClick={() => setClassFilter(cls)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${classFilter === cls ? classColors[cls].bg + " " + classColors[cls].text : "bg-theme-tertiary text-theme-secondary"}`}
                >
                  Classe {cls}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && filteredItems && (
          <div className="bg-theme-card rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Quantidade</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Custo Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">% Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">% Acum.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Classe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredItems.map((item) => {
                    const cls = classColors[item.classification];
                    return (
                      <tr key={item.id} className="hover:bg-theme-hover">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-theme">{item.materialCode}</td>
                        <td className="px-4 py-3 text-sm text-theme">{item.materialDescription}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-secondary">{item.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-theme">{formatNumber(item.quantity)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-theme">{formatCurrency(item.totalCost)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-theme-secondary">{item.percentOfTotal.toFixed(2)}%</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-theme-secondary">{item.cumulativePercent.toFixed(2)}%</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${cls.bg} ${cls.text}`}>
                            {item.classification}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-theme-muted mx-auto mb-4" />
                <p className="text-theme-muted">Nenhum item encontrado</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
