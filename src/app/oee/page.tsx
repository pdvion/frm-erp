"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Activity,
  ChevronLeft,
  Loader2,
  Gauge,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Factory,
  Wrench,
  Package,
  Timer,
  XCircle,
} from "lucide-react";

const stopTypeLabels: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Planejada", color: "bg-blue-100 text-blue-800" },
  UNPLANNED: { label: "Não Planejada", color: "bg-red-100 text-red-800" },
  SETUP: { label: "Setup", color: "bg-yellow-100 text-yellow-800" },
  MAINTENANCE: { label: "Manutenção", color: "bg-orange-100 text-orange-800" },
  QUALITY: { label: "Qualidade", color: "bg-purple-100 text-purple-800" },
  MATERIAL: { label: "Material", color: "bg-gray-100 text-gray-800" },
  OTHER: { label: "Outros", color: "bg-gray-100 text-gray-600" },
};

function OeeGauge({ value, target, label }: { value: number; target: number; label: string }) {
  const isGood = value >= target;
  const percentage = Math.min(value, 100);

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.51} 251`}
            className={isGood ? "text-green-500" : "text-red-500"}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${isGood ? "text-green-600" : "text-red-600"}`}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-xs text-gray-500">Meta: {target}%</div>
    </div>
  );
}

export default function OeeDashboardPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(startOfMonth.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const { data: dashboard, isLoading } = trpc.oee.dashboard.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });

  const { data: targets } = trpc.oee.getTargets.useQuery({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">Dashboard OEE</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <span className="text-gray-500">até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : !dashboard ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum dado disponível</p>
          </div>
        ) : (
          <>
            {/* OEE Geral */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-600" />
                OEE Geral do Período
              </h2>
              <div className="grid grid-cols-4 gap-8">
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-2 ${
                    dashboard.averageOee >= (targets?.oeeTarget || 85) ? "text-green-600" : "text-red-600"
                  }`}>
                    {dashboard.averageOee.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">OEE Médio</div>
                  <div className="text-xs text-gray-400 mt-1">Meta: {targets?.oeeTarget || 85}%</div>
                </div>
                <OeeGauge
                  value={dashboard.oeeByWorkCenter.length > 0
                    ? dashboard.oeeByWorkCenter.reduce((sum, o) => sum + o.availability, 0) / dashboard.oeeByWorkCenter.length
                    : 0}
                  target={targets?.availabilityTarget || 90}
                  label="Disponibilidade"
                />
                <OeeGauge
                  value={dashboard.oeeByWorkCenter.length > 0
                    ? dashboard.oeeByWorkCenter.reduce((sum, o) => sum + o.performance, 0) / dashboard.oeeByWorkCenter.length
                    : 0}
                  target={targets?.performanceTarget || 95}
                  label="Performance"
                />
                <OeeGauge
                  value={dashboard.oeeByWorkCenter.length > 0
                    ? dashboard.oeeByWorkCenter.reduce((sum, o) => sum + o.quality, 0) / dashboard.oeeByWorkCenter.length
                    : 0}
                  target={targets?.qualityTarget || 99}
                  label="Qualidade"
                />
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm font-medium">Tempo Planejado</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatMinutes(dashboard.productionSummary.totalPlannedTime)}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Tempo Parado</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatMinutes(dashboard.productionSummary.totalStopTime)}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Produção Boa</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboard.productionSummary.totalGood.toLocaleString("pt-BR")}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Refugo</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboard.productionSummary.totalScrap.toLocaleString("pt-BR")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OEE por Centro de Trabalho */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-gray-400" />
                  OEE por Centro de Trabalho
                </h3>
                {dashboard.oeeByWorkCenter.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhum centro de trabalho</p>
                ) : (
                  <div className="space-y-4">
                    {dashboard.oeeByWorkCenter.map((item) => {
                      const isGood = item.oee >= (targets?.oeeTarget || 85);
                      return (
                        <div key={item.workCenter.id} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">
                                {item.workCenter.name}
                              </span>
                              <span className={`font-bold ${isGood ? "text-green-600" : "text-red-600"}`}>
                                {item.oee.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${isGood ? "bg-green-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(item.oee, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>D: {item.availability.toFixed(0)}%</span>
                              <span>P: {item.performance.toFixed(0)}%</span>
                              <span>Q: {item.quality.toFixed(0)}%</span>
                            </div>
                          </div>
                          {isGood ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Paradas por Tipo */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-gray-400" />
                  Paradas por Tipo
                </h3>
                {dashboard.stopsByType.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhuma parada registrada</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.stopsByType.map((stop) => {
                      const config = stopTypeLabels[stop.stopType] || stopTypeLabels.OTHER;
                      const totalMinutes = stop._sum.durationMinutes || 0;

                      return (
                        <div key={stop.stopType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-sm text-gray-600">
                              {stop._count} ocorrências
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatMinutes(totalMinutes)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/oee/work-centers"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <Factory className="w-8 h-8 text-indigo-600" />
                <div>
                  <div className="font-medium text-gray-900">Centros de Trabalho</div>
                  <div className="text-sm text-gray-500">Gerenciar</div>
                </div>
              </Link>

              <Link
                href="/oee/production-logs"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <Package className="w-8 h-8 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Registros</div>
                  <div className="text-sm text-gray-500">Apontamentos</div>
                </div>
              </Link>

              <Link
                href="/oee/stops"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <Clock className="w-8 h-8 text-red-600" />
                <div>
                  <div className="font-medium text-gray-900">Paradas</div>
                  <div className="text-sm text-gray-500">Histórico</div>
                </div>
              </Link>

              <Link
                href="/mrp"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <Activity className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="font-medium text-gray-900">MRP</div>
                  <div className="text-sm text-gray-500">Planejamento</div>
                </div>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
