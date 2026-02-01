"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import {
  Activity,
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
  MATERIAL: { label: "Material", color: "bg-theme-tertiary text-theme" },
  OTHER: { label: "Outros", color: "bg-theme-tertiary text-theme-secondary" },
};

function OeeGauge({ value, target, label }: { value: number; target: number; label: string }) {
  const isGood = value >= target;
  const percentage = Math.min(value, 100);

  return (
    <div className="text-center">
      <div className="relative mx-auto mb-2 h-24 w-24">
        <svg className="h-24 w-24 -rotate-90 transform">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-theme-muted"
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
      <div className="text-theme-secondary text-sm font-medium">{label}</div>
      <div className="text-theme-muted text-xs">Meta: {target}%</div>
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
    <div className="space-y-6">
      <PageHeader
        title="Dashboard OEE"
        subtitle="Eficiência global de equipamentos"
        icon={<Activity className="h-6 w-6" />}
        module="production"
        actions={
          <div className="flex items-center gap-2">
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
        }
      />

      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : !dashboard ? (
          <div className="py-12 text-center">
            <Activity className="text-theme-muted mx-auto mb-4 h-12 w-12" />
            <p className="text-theme-muted">Nenhum dado disponível</p>
          </div>
        ) : (
          <>
            {/* OEE Geral */}
            <div className="bg-theme-card border-theme mb-8 rounded-lg border p-6">
              <h2 className="text-theme mb-6 flex items-center gap-2 text-lg font-medium">
                <Gauge className="h-5 w-5 text-blue-600" />
                OEE Geral do Período
              </h2>
              <div className="grid grid-cols-4 gap-8">
                <div className="text-center">
                  <div
                    className={`mb-2 text-5xl font-bold ${
                      dashboard.averageOee >= (targets?.oeeTarget || 85)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dashboard.averageOee.toFixed(1)}%
                  </div>
                  <div className="text-theme-muted text-sm">OEE Médio</div>
                  <div className="text-theme-muted mt-1 text-xs">
                    Meta: {targets?.oeeTarget || 85}%
                  </div>
                </div>
                <OeeGauge
                  value={
                    dashboard.oeeByWorkCenter.length > 0
                      ? dashboard.oeeByWorkCenter.reduce((sum, o) => sum + o.availability, 0) /
                        dashboard.oeeByWorkCenter.length
                      : 0
                  }
                  target={targets?.availabilityTarget || 90}
                  label="Disponibilidade"
                />
                <OeeGauge
                  value={
                    dashboard.oeeByWorkCenter.length > 0
                      ? dashboard.oeeByWorkCenter.reduce((sum, o) => sum + o.performance, 0) /
                        dashboard.oeeByWorkCenter.length
                      : 0
                  }
                  target={targets?.performanceTarget || 95}
                  label="Performance"
                />
                <OeeGauge
                  value={
                    dashboard.oeeByWorkCenter.length > 0
                      ? dashboard.oeeByWorkCenter.reduce((sum, o) => sum + o.quality, 0) /
                        dashboard.oeeByWorkCenter.length
                      : 0
                  }
                  target={targets?.qualityTarget || 99}
                  label="Qualidade"
                />
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-theme-card border-theme rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-blue-600">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm font-medium">Tempo Planejado</span>
                </div>
                <div className="text-theme text-2xl font-bold">
                  {formatMinutes(dashboard.productionSummary.totalPlannedTime)}
                </div>
              </div>

              <div className="bg-theme-card border-theme rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Tempo Parado</span>
                </div>
                <div className="text-theme text-2xl font-bold">
                  {formatMinutes(dashboard.productionSummary.totalStopTime)}
                </div>
              </div>

              <div className="bg-theme-card border-theme rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Produção Boa</span>
                </div>
                <div className="text-theme text-2xl font-bold">
                  {dashboard.productionSummary.totalGood.toLocaleString("pt-BR")}
                </div>
              </div>

              <div className="bg-theme-card border-theme rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Refugo</span>
                </div>
                <div className="text-theme text-2xl font-bold">
                  {dashboard.productionSummary.totalScrap.toLocaleString("pt-BR")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* OEE por Centro de Trabalho */}
              <div className="bg-theme-card border-theme rounded-lg border p-6">
                <h3 className="text-theme mb-4 flex items-center gap-2 text-lg font-medium">
                  <Factory className="text-theme-muted h-5 w-5" />
                  OEE por Centro de Trabalho
                </h3>
                {dashboard.oeeByWorkCenter.length === 0 ? (
                  <p className="text-theme-muted py-4 text-center">Nenhum centro de trabalho</p>
                ) : (
                  <div className="space-y-4">
                    {dashboard.oeeByWorkCenter.map((item) => {
                      const isGood = item.oee >= (targets?.oeeTarget || 85);
                      return (
                        <div key={item.workCenter.id} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-theme font-medium">{item.workCenter.name}</span>
                              <span
                                className={`font-bold ${isGood ? "text-green-600" : "text-red-600"}`}
                              >
                                {item.oee.toFixed(1)}%
                              </span>
                            </div>
                            <div className="bg-theme-tertiary h-2 w-full rounded-full">
                              <div
                                className={`h-2 rounded-full ${isGood ? "bg-green-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(item.oee, 100)}%` }}
                              />
                            </div>
                            <div className="text-theme-muted mt-1 flex justify-between text-xs">
                              <span>D: {item.availability.toFixed(0)}%</span>
                              <span>P: {item.performance.toFixed(0)}%</span>
                              <span>Q: {item.quality.toFixed(0)}%</span>
                            </div>
                          </div>
                          {isGood ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Paradas por Tipo */}
              <div className="bg-theme-card border-theme rounded-lg border p-6">
                <h3 className="text-theme mb-4 flex items-center gap-2 text-lg font-medium">
                  <Wrench className="text-theme-muted h-5 w-5" />
                  Paradas por Tipo
                </h3>
                {dashboard.stopsByType.length === 0 ? (
                  <p className="text-theme-muted py-4 text-center">Nenhuma parada registrada</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.stopsByType.map((stop) => {
                      const config = stopTypeLabels[stop.stopType] || stopTypeLabels.OTHER;
                      const totalMinutes = stop._sum.durationMinutes || 0;

                      return (
                        <div
                          key={stop.stopType}
                          className="bg-theme-tertiary flex items-center justify-between rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded px-2 py-1 text-xs font-medium ${config.color}`}
                            >
                              {config.label}
                            </span>
                            <span className="text-theme-secondary text-sm">
                              {stop._count} ocorrências
                            </span>
                          </div>
                          <div className="text-theme text-sm font-medium">
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
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Link
                href="/oee/work-centers"
                className="bg-theme-card border-theme flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                <Factory className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-theme font-medium">Centros de Trabalho</div>
                  <div className="text-theme-muted text-sm">Gerenciar</div>
                </div>
              </Link>

              <Link
                href="/oee/production-logs"
                className="bg-theme-card border-theme flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                <Package className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-theme font-medium">Registros</div>
                  <div className="text-theme-muted text-sm">Apontamentos</div>
                </div>
              </Link>

              <Link
                href="/oee/stops"
                className="bg-theme-card border-theme flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                <Clock className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-theme font-medium">Paradas</div>
                  <div className="text-theme-muted text-sm">Histórico</div>
                </div>
              </Link>

              <Link
                href="/mrp"
                className="bg-theme-card border-theme flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                <Activity className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-theme font-medium">MRP</div>
                  <div className="text-theme-muted text-sm">Planejamento</div>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
