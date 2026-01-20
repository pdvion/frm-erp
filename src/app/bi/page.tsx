"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Factory,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Plus,
  Settings,
  RefreshCw,
} from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  status?: "success" | "warning" | "danger" | "neutral";
  icon?: React.ReactNode;
};

function KpiCard({ title, value, subtitle, trend, trendLabel, status = "neutral", icon }: KpiCardProps) {
  const statusColors = {
    success: "border-l-green-500 bg-green-50",
    warning: "border-l-yellow-500 bg-yellow-50",
    danger: "border-l-red-500 bg-red-50",
    neutral: "border-l-blue-500 bg-white",
  };

  const trendColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-500",
  };

  const trendDirection = trend === undefined ? "neutral" : trend >= 0 ? "positive" : "negative";

  return (
    <div className={`rounded-lg border-l-4 p-4 shadow-sm ${statusColors[status]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-sm ${trendColors[trendDirection]}`}>
              {trendDirection === "positive" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : trendDirection === "negative" ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : null}
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trendLabel && <span className="text-gray-500">{trendLabel}</span>}
            </div>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}

export default function BiDashboardPage() {

  const { data: financial, isLoading: loadingFinancial } = trpc.bi.getFinancialKpis.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const { data: inventory, isLoading: loadingInventory } = trpc.bi.getInventoryKpis.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const { data: purchasing, isLoading: loadingPurchasing } = trpc.bi.getPurchasingKpis.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const { data: production, isLoading: loadingProduction } = trpc.bi.getProductionKpis.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const { data: sales, isLoading: loadingSales } = trpc.bi.getSalesKpis.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const { data: dashboards } = trpc.bi.listDashboards.useQuery();

  const isLoading = loadingFinancial || loadingInventory || loadingPurchasing || loadingProduction || loadingSales;

  const handleRefresh = () => {
    // Refresh handled by React Query refetch
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Business Intelligence"
        icon={<BarChart3 className="h-6 w-6 text-indigo-600" />}
        module="REPORTS"
      >
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
        <Link
          href="/bi/dashboards"
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" />
          Dashboards
        </Link>
        <Link
          href="/bi/kpis"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Configurar KPIs
        </Link>
      </PageHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Financeiro */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Financeiro</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Contas a Receber (Mês)"
                  value={formatCurrency(financial?.receivables.thisMonth || 0)}
                  trend={calculateTrend(financial?.receivables.thisMonth || 0, financial?.receivables.lastMonth || 0)}
                  trendLabel="vs mês anterior"
                  status="success"
                  icon={<TrendingUp className="h-6 w-6" />}
                />
                <KpiCard
                  title="Contas a Pagar (Mês)"
                  value={formatCurrency(financial?.payables.thisMonth || 0)}
                  trend={calculateTrend(financial?.payables.thisMonth || 0, financial?.payables.lastMonth || 0)}
                  trendLabel="vs mês anterior"
                  status="neutral"
                  icon={<TrendingDown className="h-6 w-6" />}
                />
                <KpiCard
                  title="Inadimplência"
                  value={formatCurrency(financial?.receivables.overdue || 0)}
                  subtitle={`${financial?.receivables.overdueCount || 0} títulos vencidos`}
                  status={(financial?.receivables.overdueCount || 0) > 0 ? "danger" : "success"}
                  icon={<AlertTriangle className="h-6 w-6" />}
                />
                <KpiCard
                  title="Fluxo de Caixa (Mês)"
                  value={formatCurrency(financial?.cashFlow.thisMonth || 0)}
                  trend={calculateTrend(financial?.cashFlow.thisMonth || 0, financial?.cashFlow.lastMonth || 0)}
                  trendLabel="vs mês anterior"
                  status={(financial?.cashFlow.thisMonth || 0) >= 0 ? "success" : "danger"}
                  icon={<DollarSign className="h-6 w-6" />}
                />
              </div>
            </section>

            {/* Estoque */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Estoque</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Itens em Estoque"
                  value={inventory?.totalItems || 0}
                  subtitle={`${(inventory?.totalQuantity || 0).toLocaleString("pt-BR")} unidades`}
                  status="neutral"
                  icon={<Package className="h-6 w-6" />}
                />
                <KpiCard
                  title="Valor Total"
                  value={formatCurrency(inventory?.totalValue || 0)}
                  status="neutral"
                  icon={<DollarSign className="h-6 w-6" />}
                />
                <KpiCard
                  title="Abaixo do Mínimo"
                  value={inventory?.lowStockCount || 0}
                  subtitle="itens precisam reposição"
                  status={(inventory?.lowStockCount || 0) > 0 ? "warning" : "success"}
                  icon={<AlertTriangle className="h-6 w-6" />}
                />
                <KpiCard
                  title="Movimentações (30d)"
                  value={inventory?.movements30d || 0}
                  subtitle="entradas e saídas"
                  status="neutral"
                  icon={<RefreshCw className="h-6 w-6" />}
                />
              </div>
            </section>

            {/* Compras */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Compras</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Cotações Pendentes"
                  value={purchasing?.pendingQuotes || 0}
                  status={(purchasing?.pendingQuotes || 0) > 5 ? "warning" : "neutral"}
                  icon={<Clock className="h-6 w-6" />}
                />
                <KpiCard
                  title="Pedidos em Aberto"
                  value={purchasing?.pendingOrders || 0}
                  status="neutral"
                  icon={<ShoppingCart className="h-6 w-6" />}
                />
                <KpiCard
                  title="Pedidos no Mês"
                  value={purchasing?.ordersThisMonth || 0}
                  subtitle={formatCurrency(purchasing?.valueThisMonth || 0)}
                  status="neutral"
                  icon={<CheckCircle className="h-6 w-6" />}
                />
                <KpiCard
                  title="Lead Time Médio"
                  value={`${purchasing?.avgLeadTimeDays || 0} dias`}
                  subtitle="últimos 90 dias"
                  status={(purchasing?.avgLeadTimeDays || 0) > 15 ? "warning" : "success"}
                  icon={<Clock className="h-6 w-6" />}
                />
              </div>
            </section>

            {/* Produção */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Factory className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Produção</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                  title="OPs em Andamento"
                  value={production?.activeOrders || 0}
                  status="neutral"
                  icon={<Factory className="h-6 w-6" />}
                />
                <KpiCard
                  title="Concluídas no Mês"
                  value={production?.completedThisMonth || 0}
                  status="success"
                  icon={<CheckCircle className="h-6 w-6" />}
                />
                <KpiCard
                  title="OEE Médio (30d)"
                  value={formatPercent((production?.avgOee || 0) / 100)}
                  status={(production?.avgOee || 0) >= 85 ? "success" : (production?.avgOee || 0) >= 70 ? "warning" : "danger"}
                  icon={<BarChart3 className="h-6 w-6" />}
                />
              </div>
            </section>

            {/* Vendas */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-semibold text-gray-900">Vendas</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Leads no Mês"
                  value={sales?.leadsThisMonth || 0}
                  status="neutral"
                  icon={<Users className="h-6 w-6" />}
                />
                <KpiCard
                  title="Pedidos no Mês"
                  value={sales?.ordersThisMonth || 0}
                  status="neutral"
                  icon={<ShoppingCart className="h-6 w-6" />}
                />
                <KpiCard
                  title="Faturamento (Mês)"
                  value={formatCurrency(sales?.revenueThisMonth || 0)}
                  trend={calculateTrend(sales?.revenueThisMonth || 0, sales?.revenueLastMonth || 0)}
                  trendLabel="vs mês anterior"
                  status={(sales?.revenueThisMonth || 0) >= (sales?.revenueLastMonth || 0) ? "success" : "warning"}
                  icon={<TrendingUp className="h-6 w-6" />}
                />
                <KpiCard
                  title="Taxa de Conversão"
                  value={`${sales?.conversionRate || 0}%`}
                  subtitle="últimos 90 dias"
                  status={(sales?.conversionRate || 0) >= 30 ? "success" : (sales?.conversionRate || 0) >= 15 ? "warning" : "danger"}
                  icon={<CheckCircle className="h-6 w-6" />}
                />
              </div>
            </section>

            {/* Dashboards Personalizados */}
            {dashboards && dashboards.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Meus Dashboards</h2>
                  </div>
                  <Link href="/bi/dashboards" className="text-sm text-indigo-600 hover:text-indigo-800">
                    Ver todos →
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {dashboards.slice(0, 3).map((dashboard) => (
                    <Link
                      key={dashboard.id}
                      href={`/bi/dashboards/${dashboard.id}`}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{dashboard.name}</h3>
                          {dashboard.description && (
                            <p className="mt-1 text-sm text-gray-500">{dashboard.description}</p>
                          )}
                        </div>
                        {dashboard.isDefault && (
                          <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                            Padrão
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span>{dashboard._count.widgets} widgets</span>
                        {dashboard.creator && <span>por {dashboard.creator.name}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
