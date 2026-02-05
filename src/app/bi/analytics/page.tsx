"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";

type Period = "7d" | "30d" | "90d" | "365d";

export default function BIAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const { data: dashboard, isLoading, refetch } = trpc.dashboard.kpis.useQuery();

  const periodOptions: { value: Period; label: string }[] = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "365d", label: "1 ano" },
  ];

  const metrics = [
    {
      title: "Contas a Pagar",
      value: formatCurrency(dashboard?.financial?.dueThisWeek?.value || 0),
      change: `${dashboard?.financial?.overdue?.count || 0} vencidas`,
      trend: "down",
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Pedidos Compra",
      value: dashboard?.purchases?.openPurchaseOrders?.toString() || "0",
      change: "Em aberto",
      trend: "up",
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Itens em Estoque",
      value: dashboard?.inventory?.totalItems?.toString() || "0",
      change: `${dashboard?.inventory?.lowStockCount || 0} críticos`,
      trend: "down",
      icon: <Package className="w-5 h-5" />,
      color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "NFes Pendentes",
      value: dashboard?.purchases?.pendingInvoices?.toString() || "0",
      change: "Aguardando",
      trend: "up",
      icon: <Users className="w-5 h-5" />,
      color: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        icon={<LineChart className="w-6 h-6" />}
        module="BI"
        breadcrumbs={[
          { label: "BI", href: "/bi" },
          { label: "Analytics" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-theme-secondary rounded-lg p-1">
              {periodOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={period === opt.value ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      {/* Métricas principais */}
      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="bg-theme-card border border-theme rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <span
                    className={`flex items-center gap-1 text-sm ${
                      metric.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {metric.trend === "up" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {metric.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-theme">{metric.value}</p>
                <p className="text-sm text-theme-muted">{metric.title}</p>
              </div>
            ))}
          </div>

          {/* Gráfico placeholder */}
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">
              Tendência de Receita
            </h3>
            <div className="h-64 flex items-center justify-center border border-dashed border-theme rounded-lg">
              <div className="text-center text-theme-muted">
                <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Gráfico de tendência</p>
                <p className="text-sm">Período: {periodOptions.find(p => p.value === period)?.label}</p>
              </div>
            </div>
          </div>

          {/* Links rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/bi/financial"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <DollarSign className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-theme">BI Financeiro</h4>
              <p className="text-sm text-theme-muted">Análise detalhada de finanças</p>
            </Link>
            <Link
              href="/bi/inventory"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <Package className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-theme">BI Estoque</h4>
              <p className="text-sm text-theme-muted">Análise de inventário</p>
            </Link>
            <Link
              href="/bi/sales"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-theme">BI Vendas</h4>
              <p className="text-sm text-theme-muted">Análise de vendas</p>
            </Link>
          </div>
        </>
      )}

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/bi"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para BI
        </Link>
      </div>
    </div>
  );
}
