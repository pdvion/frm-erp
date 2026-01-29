"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

import {
  BarChart3,
  Loader2,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Factory,
  Settings,
  RefreshCw,
  Target,
} from "lucide-react";

const getOeeColor = (value: number) => {
  if (value >= 85) return "text-green-500";
  if (value >= 60) return "text-yellow-500";
  return "text-red-500";
};

const getOeeBgColor = (value: number) => {
  if (value >= 85) return "bg-green-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

export default function OeeDashboardPage() {
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("month");
  
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateRange) {
      case "today":
        return { startDate: today, endDate: new Date() };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return { startDate: weekStart, endDate: new Date() };
      case "month":
      default:
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: monthStart, endDate: new Date() };
    }
  };

  const { data: dashboard, isLoading, refetch } = trpc.oee.dashboard.useQuery(getDateRange());
  const currentYear = new Date().getFullYear();
  const { data: targets } = trpc.oee.getTargets.useQuery({ year: currentYear });

  const formatPercent = (value: number) => {
    return `${formatNumber(value)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calcular OEE consolidado
  const consolidatedOee = dashboard?.oeeByWorkCenter?.length
    ? dashboard.oeeByWorkCenter.reduce((acc, wc) => acc + wc.oee, 0) / dashboard.oeeByWorkCenter.length
    : 0;

  const consolidatedAvailability = dashboard?.oeeByWorkCenter?.length
    ? dashboard.oeeByWorkCenter.reduce((acc, wc) => acc + wc.availability, 0) / dashboard.oeeByWorkCenter.length
    : 0;

  const consolidatedPerformance = dashboard?.oeeByWorkCenter?.length
    ? dashboard.oeeByWorkCenter.reduce((acc, wc) => acc + wc.performance, 0) / dashboard.oeeByWorkCenter.length
    : 0;

  const consolidatedQuality = dashboard?.oeeByWorkCenter?.length
    ? dashboard.oeeByWorkCenter.reduce((acc, wc) => acc + wc.quality, 0) / dashboard.oeeByWorkCenter.length
    : 0;

  const oeeTarget = targets?.oeeTarget || 85;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard OEE"
        icon={<BarChart3 className="w-6 h-6" />}
        backHref="/production"
        module="production"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-theme-tertiary rounded-lg p-1">
              <button
                onClick={() => setDateRange("today")}
                className={`px-3 py-1 rounded text-sm ${dateRange === "today" ? "bg-theme-card shadow" : ""}`}
              >
                Hoje
              </button>
              <button
                onClick={() => setDateRange("week")}
                className={`px-3 py-1 rounded text-sm ${dateRange === "week" ? "bg-theme-card shadow" : ""}`}
              >
                Semana
              </button>
              <button
                onClick={() => setDateRange("month")}
                className={`px-3 py-1 rounded text-sm ${dateRange === "month" ? "bg-theme-card shadow" : ""}`}
              >
                Mês
              </button>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 text-theme-muted hover:text-theme-secondary rounded-lg hover:bg-theme-hover"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto">
        {/* OEE Consolidado */}
        <div className="bg-theme-card rounded-xl border border-theme p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-theme">OEE Consolidado</h2>
            <div className="flex items-center gap-2 text-sm text-theme-muted">
              <Target className="w-4 h-4" />
              Meta: {formatPercent(oeeTarget)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* OEE */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={consolidatedOee >= 85 ? "#22c55e" : consolidatedOee >= 60 ? "#eab308" : "#ef4444"}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(consolidatedOee / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${getOeeColor(consolidatedOee)}`}>
                    {formatNumber(consolidatedOee)}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-theme">OEE</p>
              <p className="text-xs text-theme-muted">Overall Equipment Effectiveness</p>
            </div>

            {/* Disponibilidade */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                  <circle
                    cx="64" cy="64" r="56"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(consolidatedAvailability / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatNumber(consolidatedAvailability)}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-theme">Disponibilidade</p>
              <p className="text-xs text-theme-muted">Tempo operacional / Tempo planejado</p>
            </div>

            {/* Performance */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                  <circle
                    cx="64" cy="64" r="56"
                    stroke="#8b5cf6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(consolidatedPerformance / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-purple-600">
                    {formatNumber(consolidatedPerformance)}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-theme">Performance</p>
              <p className="text-xs text-theme-muted">Produção real / Produção planejada</p>
            </div>

            {/* Qualidade */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                  <circle
                    cx="64" cy="64" r="56"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(consolidatedQuality / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-600">
                    {formatNumber(consolidatedQuality)}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-theme">Qualidade</p>
              <p className="text-xs text-theme-muted">Peças boas / Total produzido</p>
            </div>
          </div>
        </div>

        {/* Resumo de Produção */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <Factory className="w-4 h-4" />
              <span className="text-sm">Centros de Trabalho</span>
            </div>
            <p className="text-2xl font-bold">{dashboard?.oeeByWorkCenter?.length || 0}</p>
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Produzido</span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(dashboard?.productionSummary?.totalProduced || 0)}
            </p>
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Peças Boas</span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(dashboard?.productionSummary?.totalGood || 0)}
            </p>
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Refugo</span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(dashboard?.productionSummary?.totalScrap || 0)}
            </p>
          </div>
        </div>

        {/* OEE por Centro de Trabalho */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-theme-muted" />
            OEE por Centro de Trabalho
          </h2>

          {!dashboard?.oeeByWorkCenter?.length ? (
            <div className="text-center py-8">
              <Factory className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <p className="text-theme-muted">Nenhum dado de produção no período selecionado</p>
              <Link
                href="/production/work-centers"
                className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800"
              >
                <Settings className="w-4 h-4" />
                Gerenciar Centros de Trabalho
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Centro de Trabalho</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">OEE</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Disponibilidade</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Performance</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Qualidade</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.oeeByWorkCenter.map((wc) => (
                    <tr key={wc.workCenter.id} className="border-b border-theme hover:bg-theme-hover">
                      <td className="py-3 px-4">
                        <div className="font-medium">{wc.workCenter.name}</div>
                        <div className="text-xs text-theme-muted">{wc.workCenter.code}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getOeeBgColor(wc.oee)}`} />
                          <span className={`font-bold ${getOeeColor(wc.oee)}`}>
                            {formatPercent(wc.oee)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-blue-600">{formatPercent(wc.availability)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-purple-600">{formatPercent(wc.performance)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-600">{formatPercent(wc.quality)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {wc.oee >= oeeTarget ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Na meta
                          </span>
                        ) : wc.oee >= oeeTarget * 0.8 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            Atenção
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            <TrendingDown className="w-3 h-3" />
                            Abaixo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
