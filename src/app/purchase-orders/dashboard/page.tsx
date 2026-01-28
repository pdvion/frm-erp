"use client";

import Link from "next/link";
import { 
  ShoppingCart, FileText, Package, Users, TrendingUp,
  ArrowRight, Loader2, BarChart3
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { SimpleBarChart, DonutChart, ChartCard } from "@/components/charts";

export default function PurchasesDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.purchasesKpis.useQuery();

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme">Dashboard de Compras</h1>
            <p className="text-theme-muted">Visão geral do módulo de compras</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/quotes"
              className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
            >
              Cotações
            </Link>
            <Link
              href="/purchase-orders"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Pedidos de Compra
            </Link>
          </div>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cotações */}
          <Link href="/quotes" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Cotações</p>
                <p className="text-2xl font-bold text-theme">{kpis?.quotes.total || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Pendentes</span>
                <span className="font-medium text-yellow-600">{kpis?.quotes.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Enviadas</span>
                <span className="font-medium text-blue-600">{kpis?.quotes.sent || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Aprovadas</span>
                <span className="font-medium text-green-600">{kpis?.quotes.approved || 0}</span>
              </div>
            </div>
          </Link>

          {/* Pedidos de Compra */}
          <Link href="/purchase-orders" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-teal-600" />
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
                <span className="text-theme-muted">Em Andamento</span>
                <span className="font-medium text-blue-600">{(kpis?.orders.approved || 0) + (kpis?.orders.sent || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Parciais</span>
                <span className="font-medium text-orange-600">{kpis?.orders.partial || 0}</span>
              </div>
            </div>
          </Link>

          {/* NFes Recebidas */}
          <Link href="/invoices" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">NFes no Mês</p>
                <p className="text-2xl font-bold text-theme">{kpis?.nfes.thisMonth || 0}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-theme-muted">Valor Total</p>
              <p className="text-lg font-semibold text-indigo-600">
                {formatCurrency(kpis?.nfes.totalValue || 0)}
              </p>
            </div>
          </Link>

          {/* Valor Total em Pedidos */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Valor em Pedidos</p>
                <p className="text-2xl font-bold text-theme">
                  {formatCurrency(kpis?.orders.totalValue || 0)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-theme-muted">Cotações em Aberto</p>
              <p className="text-lg font-semibold text-purple-600">
                {formatCurrency(kpis?.quotes.totalValue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução de Compras */}
          <ChartCard 
            title="Evolução de Compras" 
            subtitle="Últimos 6 meses"
            actions={
              <Link href="/reports/purchases" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver relatório
              </Link>
            }
          >
            <SimpleBarChart
              data={kpis?.purchasesEvolution || []}
              dataKeys={[
                { key: "Valor", color: "#6366F1" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Compras por Categoria */}
          <ChartCard 
            title="Compras por Categoria" 
            subtitle="Últimos 30 dias"
          >
            <DonutChart
              data={kpis?.purchasesByCategory || []}
              dataKey="value"
              height={250}
            />
          </ChartCard>
        </div>

        {/* Top Fornecedores */}
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-theme">Top Fornecedores</h3>
              <p className="text-sm text-theme-muted">Últimos 30 dias por valor de compra</p>
            </div>
            <Link href="/suppliers" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-theme">
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Fornecedor</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-theme-muted">NFes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-theme-muted">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {kpis?.topSuppliers.map((supplier, index) => (
                  <tr key={index} className="border-b border-theme last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-theme-tertiary rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-theme-secondary" />
                        </div>
                        <span className="font-medium text-theme">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-theme-secondary">{supplier.count}</td>
                    <td className="py-3 px-4 text-right font-medium text-theme">
                      {formatCurrency(supplier.total)}
                    </td>
                  </tr>
                ))}
                {(!kpis?.topSuppliers || kpis.topSuppliers.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-theme-muted">
                      Nenhuma compra registrada nos últimos 30 dias
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
            href="/quotes/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Nova Cotação</p>
              <p className="text-sm text-theme-muted">Solicitar orçamento</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>

          <Link
            href="/purchase-orders/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Novo Pedido</p>
              <p className="text-sm text-theme-muted">Criar pedido de compra</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>

          <Link
            href="/invoices/import"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Importar NFe</p>
              <p className="text-sm text-theme-muted">Importar XML de NFe</p>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-muted ml-auto" />
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
