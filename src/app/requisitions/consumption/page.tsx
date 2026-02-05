"use client";

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
        <PageHeader
          title="Relatório de Consumo"
          subtitle="Análise de consumo de materiais por requisições"
          icon={<BarChart3 className="w-6 h-6" />}
          module="inventory"
          actions={
            <Button
              onClick={handleExport}
              disabled={!data || data.data.length === 0}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exportar CSV
            </Button>
          }
        />

        {/* Filtros */}
        <div className="rounded-lg border border-theme bg-theme-card p-4 dark:border-theme dark:bg-theme-card">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-theme-secondary">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Data Inicial"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              label="Data Final"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Input
              label="Centro de Custo"
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              placeholder="Filtrar por CC..."
            />
            <Input
              label="Departamento"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Filtrar por depto..."
            />
          </div>

          {/* Agrupamento */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-theme-secondary">
              Agrupar por
            </label>
            <div className="flex flex-wrap gap-2">
              {groupByOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={groupBy === option.value ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setGroupBy(option.value)}
                  leftIcon={option.icon}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        {data && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-theme bg-theme-card p-4 dark:border-theme dark:bg-theme-card">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Total Grupos</p>
                  <p className="text-xl font-bold text-theme">
                    {data.data.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-theme bg-theme-card p-4 dark:border-theme dark:bg-theme-card">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Total Itens</p>
                  <p className="text-xl font-bold text-theme">
                    {data.totals.totalItems}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-theme bg-theme-card p-4 dark:border-theme dark:bg-theme-card">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Quantidade Total</p>
                  <p className="text-xl font-bold text-theme">
                    {data.totals.totalQty.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-theme bg-theme-card p-4 dark:border-theme dark:bg-theme-card">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
                  <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Valor Total</p>
                  <p className="text-xl font-bold text-theme">
                    {formatCurrency(data.totals.totalValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Resultados */}
        <div className="rounded-lg border border-theme bg-theme-card dark:border-theme dark:bg-theme-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-theme bg-theme-secondary dark:border-theme dark:bg-theme">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">
                    {groupByOptions.find((o) => o.value === groupBy)?.label || "Grupo"}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-theme-secondary">
                    Itens
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-theme-secondary">
                    Quantidade
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-theme-secondary">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-theme-secondary">
                    % do Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                      Carregando...
                    </td>
                  </tr>
                ) : !data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                      Nenhum dado encontrado para o período selecionado
                    </td>
                  </tr>
                ) : (
                  data.data.map((group: { key: string; label: string; items: number; totalQty: number; totalValue: number }) => (
                    <tr
                      key={group.key}
                      className="hover:bg-theme-secondary dark:hover:bg-theme-secondary"
                    >
                      <td className="px-4 py-3 text-sm text-theme">
                        {group.label}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-theme-muted">
                        {group.items}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-theme-muted">
                        {group.totalQty.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-theme">
                        {formatCurrency(group.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-theme-muted">
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
                <tfoot className="border-t-2 border-theme bg-theme-tertiary dark:border-theme dark:bg-theme">
                  <tr className="font-bold">
                    <td className="px-4 py-3 text-sm text-theme">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-theme">
                      {data.totals.totalItems}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-theme">
                      {data.totals.totalQty.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-theme">
                      {formatCurrency(data.totals.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-theme">
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
