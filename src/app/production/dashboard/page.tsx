"use client";

import Link from "next/link";
import { 
  Factory, Settings, AlertTriangle, TrendingUp,
  ArrowRight, Loader2, BarChart3, Clock, CheckCircle
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { SimpleBarChart, ChartCard } from "@/components/charts";

export default function ProductionDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.productionKpis.useQuery();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  const oeePercentage = (kpis?.oee.average || 0) * 100;
  const availabilityPercentage = (kpis?.oee.availability || 0) * 100;
  const performancePercentage = (kpis?.oee.performance || 0) * 100;
  const qualityPercentage = (kpis?.oee.quality || 0) * 100;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard de Produção"
          subtitle="Visão geral do módulo de produção"
          icon={<Factory className="w-6 h-6" />}
          module="production"
          actions={
            <div className="flex gap-2">
              <Link
                href="/production"
                className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
              >
                Ordens de Produção
              </Link>
              <Link
                href="/oee"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                OEE
              </Link>
            </div>
          }
        />

        {/* Alertas */}
        {(kpis?.orders.delayed || 0) > 0 && (
          <Link
            href="/production?status=delayed"
            className="flex items-center gap-3 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium">Ordens Atrasadas:</span>{" "}
              {kpis?.orders.delayed} ordens com prazo vencido
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ordens de Produção */}
          <Link href="/production" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Factory className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Ordens</p>
                <p className="text-2xl font-bold text-theme">{kpis?.orders.total || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Pendentes</span>
                <span className="font-medium text-yellow-600">{kpis?.orders.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Em Produção</span>
                <span className="font-medium text-blue-600">{kpis?.orders.inProgress || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Concluídas</span>
                <span className="font-medium text-green-600">{kpis?.orders.completed || 0}</span>
              </div>
            </div>
          </Link>

          {/* Produção do Mês */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Produção do Mês</p>
                <p className="text-2xl font-bold text-green-600">{kpis?.monthProduction.count || 0}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-theme-muted">Quantidade Produzida</p>
              <p className="text-lg font-semibold text-theme">
                {(kpis?.monthProduction.quantity || 0).toLocaleString("pt-BR")} un
              </p>
            </div>
          </div>

          {/* OEE Médio */}
          <Link href="/oee" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">OEE Médio</p>
                <p className={`text-2xl font-bold ${oeePercentage >= 85 ? "text-green-600" : oeePercentage >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                  {oeePercentage.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="w-full bg-theme-tertiary rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${oeePercentage >= 85 ? "bg-green-500" : oeePercentage >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(oeePercentage, 100)}%` }}
              />
            </div>
          </Link>

          {/* Atrasadas */}
          <Link href="/production?status=delayed" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{kpis?.orders.delayed || 0}</p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              Ordens com prazo vencido
            </div>
          </Link>
        </div>

        {/* OEE Breakdown */}
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Indicadores OEE (Últimos 30 dias)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Disponibilidade */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-theme-muted">Disponibilidade</span>
                <span className={`font-medium ${availabilityPercentage >= 90 ? "text-green-600" : availabilityPercentage >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                  {availabilityPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-theme-tertiary rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${availabilityPercentage >= 90 ? "bg-green-500" : availabilityPercentage >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(availabilityPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Performance */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-theme-muted">Performance</span>
                <span className={`font-medium ${performancePercentage >= 95 ? "text-green-600" : performancePercentage >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                  {performancePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-theme-tertiary rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${performancePercentage >= 95 ? "bg-green-500" : performancePercentage >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(performancePercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Qualidade */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-theme-muted">Qualidade</span>
                <span className={`font-medium ${qualityPercentage >= 99 ? "text-green-600" : qualityPercentage >= 95 ? "text-yellow-600" : "text-red-600"}`}>
                  {qualityPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-theme-tertiary rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${qualityPercentage >= 99 ? "bg-green-500" : qualityPercentage >= 95 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(qualityPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução da Produção */}
          <ChartCard 
            title="Evolução da Produção" 
            subtitle="Últimos 6 meses"
            actions={
              <Link href="/reports/production" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver relatório
              </Link>
            }
          >
            <SimpleBarChart
              data={kpis?.productionEvolution || []}
              dataKeys={[
                { key: "Quantidade", color: "#8B5CF6" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Produção por Produto */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-theme">Top Produtos Produzidos</h3>
              <p className="text-sm text-theme-muted">Este mês</p>
            </div>
            <div className="space-y-4">
              {kpis?.productionByProduct.map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm font-medium text-purple-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-theme">{product.name}</p>
                    <div className="w-full bg-theme-tertiary rounded-full h-2 mt-1">
                      <div 
                        className="h-2 rounded-full bg-purple-500"
                        style={{ width: `${Math.min((product.quantity / (kpis?.productionByProduct[0]?.quantity || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-semibold text-theme">{product.quantity.toLocaleString("pt-BR")}</span>
                </div>
              ))}
              {(!kpis?.productionByProduct || kpis.productionByProduct.length === 0) && (
                <div className="py-8 text-center text-theme-muted">
                  Nenhuma produção registrada este mês
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/production/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Factory className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Nova Ordem</p>
              <p className="text-sm text-theme-muted">Criar ordem de produção</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>

          <Link
            href="/production/mrp"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">MRP</p>
              <p className="text-sm text-theme-muted">Planejamento de materiais</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>

          <Link
            href="/oee"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">OEE</p>
              <p className="text-sm text-theme-muted">Eficiência de equipamentos</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
