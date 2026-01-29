"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Factory,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Package,
  Wrench,
  Calendar,
} from "lucide-react";

// Dados mockados para KPIs de produção
const productionKPIs = {
  oee: 78.5,
  oeeTarget: 85,
  availability: 92.3,
  performance: 88.7,
  quality: 96.1,
  productionToday: 1250,
  productionTarget: 1500,
  scrapRate: 2.3,
  downtime: 45,
  setupTime: 28,
};

const productionByLine = [
  { line: "Linha 1", produced: 450, target: 500, oee: 82.5, status: "running" },
  { line: "Linha 2", produced: 380, target: 400, oee: 76.2, status: "running" },
  { line: "Linha 3", produced: 0, target: 300, oee: 0, status: "maintenance" },
  { line: "Linha 4", produced: 420, target: 450, oee: 85.1, status: "running" },
];

const recentOrders = [
  { id: "OP-2026-001", product: "Produto A", qty: 500, completed: 450, status: "in_progress" },
  { id: "OP-2026-002", product: "Produto B", qty: 300, completed: 300, status: "completed" },
  { id: "OP-2026-003", product: "Produto C", qty: 200, completed: 0, status: "pending" },
  { id: "OP-2026-004", product: "Produto D", qty: 150, completed: 100, status: "in_progress" },
];

const statusColors: Record<string, string> = {
  running: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  stopped: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const statusLabels: Record<string, string> = {
  running: "Em operação",
  maintenance: "Manutenção",
  stopped: "Parada",
  in_progress: "Em produção",
  completed: "Concluída",
  pending: "Pendente",
};

export default function BIProductionPage() {
  const [period, setPeriod] = useState("today");

  const getOEEColor = (oee: number) => {
    if (oee >= 85) return "text-green-600";
    if (oee >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (current: number, target: number) => {
    const pct = (current / target) * 100;
    if (pct >= 90) return "bg-green-500";
    if (pct >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="BI Produção"
        subtitle="Dashboard de indicadores de produção"
        icon={<Factory className="w-6 h-6" />}
        module="BI"
        backHref="/bi"
        backLabel="Voltar"
      />

      {/* Filtro de Período */}
      <div className="flex gap-2">
        {[
          { value: "today", label: "Hoje" },
          { value: "week", label: "Semana" },
          { value: "month", label: "Mês" },
          { value: "year", label: "Ano" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-blue-600 text-white"
                : "bg-theme-secondary text-theme hover:bg-theme-tertiary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* OEE Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 bg-theme-card border border-theme rounded-xl p-6">
          <div className="text-center">
            <div className="text-sm text-theme-muted mb-2">OEE Geral</div>
            <div className={`text-5xl font-bold ${getOEEColor(productionKPIs.oee)}`}>
              {productionKPIs.oee}%
            </div>
            <div className="text-sm text-theme-muted mt-2">
              Meta: {productionKPIs.oeeTarget}%
            </div>
            <div className="mt-4 h-2 bg-theme-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(productionKPIs.oee, productionKPIs.oeeTarget)}`}
                style={{ width: `${Math.min(100, (productionKPIs.oee / productionKPIs.oeeTarget) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-3 gap-4">
          <div className="bg-theme-card border border-theme rounded-xl p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Disponibilidade</span>
            </div>
            <div className="text-3xl font-bold text-theme">{productionKPIs.availability}%</div>
            <div className="mt-2 h-1.5 bg-theme-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${productionKPIs.availability}%` }} />
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-xl p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <Gauge className="w-4 h-4" />
              <span className="text-sm">Performance</span>
            </div>
            <div className="text-3xl font-bold text-theme">{productionKPIs.performance}%</div>
            <div className="mt-2 h-1.5 bg-theme-secondary rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${productionKPIs.performance}%` }} />
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-xl p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Qualidade</span>
            </div>
            <div className="text-3xl font-bold text-theme">{productionKPIs.quality}%</div>
            <div className="mt-2 h-1.5 bg-theme-secondary rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${productionKPIs.quality}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-theme-muted">Produção Hoje</div>
              <div className="text-2xl font-bold text-theme">{productionKPIs.productionToday.toLocaleString()}</div>
              <div className="text-xs text-theme-muted">Meta: {productionKPIs.productionTarget.toLocaleString()}</div>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-theme-muted">Taxa de Refugo</div>
              <div className="text-2xl font-bold text-red-600">{productionKPIs.scrapRate}%</div>
              <div className="flex items-center gap-1 text-xs text-red-600">
                <TrendingUp className="w-3 h-3" />
                <span>+0.3% vs ontem</span>
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-theme-muted">Tempo Parado</div>
              <div className="text-2xl font-bold text-theme">{productionKPIs.downtime} min</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingDown className="w-3 h-3" />
                <span>-15 min vs ontem</span>
              </div>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-theme-muted">Tempo Setup</div>
              <div className="text-2xl font-bold text-theme">{productionKPIs.setupTime} min</div>
              <div className="text-xs text-theme-muted">Média por troca</div>
            </div>
            <Wrench className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Linhas de Produção e Ordens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Linhas */}
        <div className="bg-theme-card border border-theme rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Status das Linhas</h3>
          <div className="space-y-4">
            {productionByLine.map((line) => (
              <div key={line.line} className="flex items-center gap-4">
                <div className="w-20 font-medium text-theme">{line.line}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-theme-muted">{line.produced}/{line.target}</span>
                    <span className={getOEEColor(line.oee)}>{line.oee}% OEE</span>
                  </div>
                  <div className="h-2 bg-theme-secondary rounded-full overflow-hidden">
                    <div
                      className={getProgressColor(line.produced, line.target)}
                      style={{ width: `${(line.produced / line.target) * 100}%` }}
                    />
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[line.status]}`}>
                  {statusLabels[line.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ordens de Produção */}
        <div className="bg-theme-card border border-theme rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme">Ordens de Produção</h3>
            <Calendar className="w-5 h-5 text-theme-muted" />
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg">
                <div>
                  <div className="font-medium text-theme">{order.id}</div>
                  <div className="text-sm text-theme-muted">{order.product}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-theme">{order.completed}/{order.qty}</div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
