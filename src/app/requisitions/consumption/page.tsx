"use client";

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import {
  Package,
  Building2,
  Users,
  Tag,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

type GroupBy = "material" | "costCenter" | "department" | "type";

export default function ConsumptionReportPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState<GroupBy>("material");
  const [materialId] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [department, setDepartment] = useState("");

  const { data, isLoading } = trpc.requisitions.consumptionReport.useQuery(
    {
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      groupBy,
      materialId: materialId || undefined,
      costCenter: costCenter || undefined,
      department: department || undefined,
    },
    { enabled: !!dateFrom && !!dateTo }
  );

  const groupByOptions: { value: GroupBy; label: string; icon: React.ReactNode }[] = [
    { value: "material", label: "Material", icon: <Package className="h-4 w-4" /> },
    { value: "costCenter", label: "Centro de Custo", icon: <Building2 className="h-4 w-4" /> },
    { value: "department", label: "Departamento", icon: <Users className="h-4 w-4" /> },
    { value: "type", label: "Tipo", icon: <Tag className="h-4 w-4" /> },
  ];

  const handleExport = () => {
    if (!data) return;

    const csvContent = [
      ["Grupo", "Total Itens", "Quantidade Total", "Valor Total"].join(";"),
      ...data.data.map((g: { label: string; items: number; totalQty: number; totalValue: number }) =>
        [g.label, g.items, g.totalQty.toFixed(2), g.totalValue.toFixed(2)].join(";")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `consumo-materiais-${dateFrom}-${dateTo}.csv`;
    link.click();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Relatório de Consumo
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Análise de consumo de materiais por requisições
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={!data || data.data.length === 0}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Final
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Centro de Custo
              </label>
              <input
                type="text"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                placeholder="Filtrar por CC..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Departamento
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Filtrar por depto..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Agrupamento */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Agrupar por
            </label>
            <div className="flex flex-wrap gap-2">
              {groupByOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGroupBy(option.value)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    groupBy === option.value
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        {data && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Grupos</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {data.data.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Itens</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {data.totals.totalItems}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Quantidade Total</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {data.totals.totalQty.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
                  <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valor Total</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data.totals.totalValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Resultados */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    {groupByOptions.find((o) => o.value === groupBy)?.label || "Grupo"}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    Itens
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantidade
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    % do Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : !data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nenhum dado encontrado para o período selecionado
                    </td>
                  </tr>
                ) : (
                  data.data.map((group: { key: string; label: string; items: number; totalQty: number; totalValue: number }) => (
                    <tr
                      key={group.key}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {group.label}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {group.items}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {group.totalQty.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(group.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {data.totals.totalValue > 0
                          ? ((group.totalValue / data.totals.totalValue) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data && data.data.length > 0 && (
                <tfoot className="border-t-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-900">
                  <tr className="font-bold">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      {data.totals.totalItems}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      {data.totals.totalQty.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      {formatCurrency(data.totals.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      100%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
