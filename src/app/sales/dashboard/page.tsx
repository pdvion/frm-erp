"use client";

import Link from "next/link";
import { 
  ShoppingBag, FileText, Users, TrendingUp,
  ArrowRight, Loader2, BarChart3, DollarSign
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { SimpleBarChart, DonutChart, ChartCard } from "@/components/charts";

export default function SalesDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.salesKpis.useQuery();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard de Vendas"
          subtitle="Visão geral do módulo comercial"
          icon={<BarChart3 className="w-6 h-6" />}
          module="sales"
          actions={
            <div className="flex gap-2">
              <Link
                href="/sales"
                className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
              >
                Pedidos de Venda
              </Link>
              <Link
                href="/customers"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Clientes
              </Link>
            </div>
          }
        />

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pedidos de Venda */}
          <Link href="/sales" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Pedidos</p>
                <p className="text-2xl font-bold text-theme">{kpis?.orders.total || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Pendentes</span>
                <span className="font-medium text-yellow-600">{kpis?.orders.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Aprovados</span>
                <span className="font-medium text-blue-600">{kpis?.orders.approved || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Faturados</span>
                <span className="font-medium text-green-600">{kpis?.orders.invoiced || 0}</span>
              </div>
            </div>
          </Link>

          {/* Vendas do Mês */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Vendas do Mês</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(kpis?.orders.monthValue || 0)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-theme-muted">Total Geral</p>
              <p className="text-lg font-semibold text-theme">
                {formatCurrency(kpis?.orders.totalValue || 0)}
              </p>
            </div>
          </div>

          {/* NFes Emitidas */}
          <Link href="/billing" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">NFes Emitidas</p>
                <p className="text-2xl font-bold text-theme">{kpis?.invoices.thisMonth || 0}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-theme-muted">Valor Total</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(kpis?.invoices.totalValue || 0)}
              </p>
            </div>
          </Link>

          {/* Recebíveis */}
          <Link href="/receivables" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">A Receber</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(kpis?.receivables.pending || 0)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-theme-muted">Recebido no Mês</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(kpis?.receivables.received || 0)}
              </p>
            </div>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução de Vendas */}
          <ChartCard 
            title="Evolução de Vendas" 
            subtitle="Últimos 6 meses"
            actions={
              <Link href="/reports/sales" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver relatório
              </Link>
            }
          >
            <SimpleBarChart
              data={kpis?.salesEvolution || []}
              dataKeys={[
                { key: "Valor", color: "#10B981" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Vendas por Categoria */}
          <ChartCard 
            title="Vendas por Categoria" 
            subtitle="Últimos 30 dias"
          >
            <DonutChart
              data={kpis?.salesByCategory || []}
              dataKey="value"
              height={250}
            />
          </ChartCard>
        </div>

        {/* Top Clientes */}
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-theme">Top Clientes</h3>
              <p className="text-sm text-theme-muted">Últimos 30 dias por valor de venda</p>
            </div>
            <Link href="/customers" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-theme">
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Cliente</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-theme-muted">Pedidos</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-theme-muted">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {kpis?.topCustomers.map((customer, index) => (
                  <tr key={index} className="border-b border-theme last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-theme">{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-theme-secondary">{customer.count}</td>
                    <td className="py-3 px-4 text-right font-medium text-theme">
                      {formatCurrency(customer.total)}
                    </td>
                  </tr>
                ))}
                {(!kpis?.topCustomers || kpis.topCustomers.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-theme-muted">
                      Nenhuma venda registrada nos últimos 30 dias
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sales/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Novo Pedido</p>
              <p className="text-sm text-theme-muted">Criar pedido de venda</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>

          <Link
            href="/customers/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Novo Cliente</p>
              <p className="text-sm text-theme-muted">Cadastrar cliente</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>

          <Link
            href="/billing"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Faturamento</p>
              <p className="text-sm text-theme-muted">Emitir NF-e</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
