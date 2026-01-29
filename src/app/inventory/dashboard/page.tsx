"use client";

import Link from "next/link";
import { 
  Warehouse, Package, AlertTriangle,
  ArrowRight, Loader2, BarChart3, MapPin, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { SimpleBarChart, DonutChart, ChartCard } from "@/components/charts";

export default function InventoryDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.inventoryKpis.useQuery();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard de Estoque"
          subtitle="Visão geral do módulo de estoque"
          icon={<Warehouse className="w-6 h-6" />}
          module="inventory"
          actions={
            <div className="flex gap-2">
              <Link
                href="/inventory"
                className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
              >
                Posição de Estoque
              </Link>
              <Link
                href="/inventory/movements"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Movimentações
              </Link>
            </div>
          }
        />

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total em Estoque */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Valor em Estoque</p>
                <p className="text-2xl font-bold text-theme">
                  {formatCurrency(kpis?.summary.totalValue || 0)}
                </p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              {kpis?.summary.totalItems || 0} itens cadastrados
            </div>
          </div>

          {/* Entradas (30 dias) */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Entradas (30d)</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(kpis?.movements.entriesValue || 0)}
                </p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              {kpis?.movements.entries || 0} movimentações
            </div>
          </div>

          {/* Saídas (30 dias) */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Saídas (30d)</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(kpis?.movements.exitsValue || 0)}
                </p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              {kpis?.movements.exits || 0} movimentações
            </div>
          </div>

          {/* Alertas de Estoque */}
          <Link href="/inventory?belowMinimum=true" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Alertas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(kpis?.summary.lowStock || 0) + (kpis?.summary.zeroStock || 0)}
                </p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Estoque baixo</span>
                <span className="font-medium text-yellow-600">{kpis?.summary.lowStock || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Sem estoque</span>
                <span className="font-medium text-red-600">{kpis?.summary.zeroStock || 0}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução do Estoque */}
          <ChartCard 
            title="Movimentação de Estoque" 
            subtitle="Últimos 6 meses"
            actions={
              <Link href="/reports/inventory" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver relatório
              </Link>
            }
          >
            <SimpleBarChart
              data={kpis?.stockEvolution || []}
              dataKeys={[
                { key: "Entradas", color: "#10B981" },
                { key: "Saídas", color: "#EF4444" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Estoque por Categoria */}
          <ChartCard 
            title="Estoque por Categoria" 
            subtitle="Valor em estoque"
          >
            <DonutChart
              data={kpis?.stockByCategory || []}
              dataKey="value"
              height={250}
            />
          </ChartCard>
        </div>

        {/* Estoque por Localização */}
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-theme">Estoque por Localização</h3>
              <p className="text-sm text-theme-muted">Distribuição do estoque por local</p>
            </div>
            <Link href="/locations" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              Gerenciar locais
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis?.stockByLocation.map((location, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-theme-hover rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-theme">{location.name}</p>
                  <p className="text-sm text-theme-muted">{location.count} itens</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-theme">{formatCurrency(location.value)}</p>
                </div>
              </div>
            ))}
            {(!kpis?.stockByLocation || kpis.stockByLocation.length === 0) && (
              <div className="col-span-full py-8 text-center text-theme-muted">
                Nenhum local de estoque cadastrado
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/inventory/entry"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Entrada de Estoque</p>
              <p className="text-sm text-theme-muted">Registrar entrada manual</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>

          <Link
            href="/inventory/exit"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Saída de Estoque</p>
              <p className="text-sm text-theme-muted">Registrar saída manual</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>

          <Link
            href="/requisitions"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Requisições</p>
              <p className="text-sm text-theme-muted">Gerenciar requisições</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
