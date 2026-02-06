"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function DREReportPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(startOfMonth.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading } = trpc.reports.dre.useQuery({
    startDate,
    endDate,
  });

  const handleExportCSV = () => {
    if (!data?.lines) return;

    const headers = ["Descrição", "Valor", "% Receita"];
    const rows = data.lines.map((line) => {
      const pct = data.totals.grossRevenue > 0
        ? ((Math.abs(line.value) / data.totals.grossRevenue) * 100).toFixed(1)
        : "0.0";
      return [
        line.label,
        line.value.toFixed(2),
        pct,
      ];
    });

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dre-${startDate}-${endDate}.csv`;
    link.click();
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="DRE Simplificado"
        subtitle="Demonstrativo de Resultado do Exercício"
        icon={<FileText className="w-6 h-6" />}
        backHref="/reports"
        module="reports"
        actions={
          <Button
            onClick={handleExportCSV}
            disabled={!data?.lines?.length}
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
            <label htmlFor="dre-start" className="text-sm font-medium text-theme-secondary">
              Período:
            </label>
            <Input
              id="dre-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="max-w-[180px]"
            />
            <ArrowRight className="w-4 h-4 text-theme-muted" />
            <label htmlFor="dre-end" className="sr-only">Data final</label>
            <Input
              id="dre-end"
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
            <span className="ml-3 text-theme-secondary">Calculando DRE...</span>
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Margin KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-theme-muted mb-1">
                  <Percent className="w-4 h-4" />
                  <span className="text-sm">Margem Bruta</span>
                </div>
                <p className={`text-2xl font-bold ${data.margins.grossMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(data.margins.grossMargin)}
                </p>
              </div>

              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-theme-muted mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Margem Operacional</span>
                </div>
                <p className={`text-2xl font-bold ${data.margins.operatingMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(data.margins.operatingMargin)}
                </p>
              </div>

              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-theme-muted mb-1">
                  {data.margins.netMargin >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">Margem Líquida</span>
                </div>
                <p className={`text-2xl font-bold ${data.margins.netMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(data.margins.netMargin)}
                </p>
              </div>
            </div>

            {/* DRE Table */}
            <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-theme-table-header border-b border-theme">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Valor (R$)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        % Receita
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.lines.map((line, idx) => {
                      const pctOfRevenue = data.totals.grossRevenue > 0
                        ? (Math.abs(line.value) / data.totals.grossRevenue) * 100
                        : 0;

                      return (
                        <tr
                          key={idx}
                          className={`${line.isTotal ? "bg-theme-tertiary font-semibold" : ""} ${
                            line.level === 1 ? "text-theme-secondary" : "text-theme"
                          }`}
                        >
                          <td className={`px-6 py-3 ${line.level === 1 ? "pl-10" : ""}`}>
                            {line.label}
                          </td>
                          <td className={`px-6 py-3 text-right ${
                            line.isTotal && line.value >= 0 ? "text-green-600" : ""
                          } ${line.isTotal && line.value < 0 ? "text-red-600" : ""}`}>
                            {formatCurrency(line.value)}
                          </td>
                          <td className="px-6 py-3 text-right text-theme-muted text-sm">
                            {line.isTotal ? formatPercent(pctOfRevenue) : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
