"use client";

import React from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ShoppingCart,
  ChevronLeft,
  Loader2,
  Users,
  FileText,
  Package,
  TrendingUp,
  DollarSign,
  Target,
  ArrowRight,
} from "lucide-react";

const leadStatusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  QUALIFIED: "bg-purple-100 text-purple-800",
  PROPOSAL: "bg-indigo-100 text-indigo-800",
  NEGOTIATION: "bg-orange-100 text-orange-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

const leadStatusLabels: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  PROPOSAL: "Proposta",
  NEGOTIATION: "Negociação",
  WON: "Ganho",
  LOST: "Perdido",
};

export default function SalesDashboardPage() {
  const { data: dashboard, isLoading } = trpc.sales.dashboard.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
                <ShoppingCart className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Vendas</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !dashboard ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum dado disponível</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Vendas do Mês</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboard.monthOrders.value)}
                </div>
                <div className="text-xs text-gray-500">{dashboard.monthOrders.count} pedidos</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Orçamentos Pendentes</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboard.pendingQuotes.value)}
                </div>
                <div className="text-xs text-gray-500">{dashboard.pendingQuotes.count} orçamentos</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">Taxa de Conversão</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboard.conversionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">orçamentos aceitos</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Leads Ativos</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboard.leadsByStatus
                    .filter(l => !["WON", "LOST"].includes(l.status))
                    .reduce((sum, l) => sum + l._count, 0)}
                </div>
                <div className="text-xs text-gray-500">em negociação</div>
              </div>
            </div>

            {/* Pipeline de Leads */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  Pipeline de Leads
                </h2>
                <Link
                  href="/sales/leads"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"].map((status) => {
                  const data = dashboard.leadsByStatus.find(l => l.status === status);
                  const count = data?._count || 0;
                  const value = data?._sum.estimatedValue || 0;

                  return (
                    <div key={status} className="text-center">
                      <div className={`rounded-lg p-3 ${leadStatusColors[status]}`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs">{leadStatusLabels[status]}</div>
                      </div>
                      {value > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatCurrency(value)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/sales/leads"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Users className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Leads / CRM</h3>
                    <p className="text-sm text-gray-500">Gerenciar oportunidades</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/sales/quotes"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Orçamentos</h3>
                    <p className="text-sm text-gray-500">Propostas comerciais</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/sales/orders"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Pedidos</h3>
                    <p className="text-sm text-gray-500">Pedidos de venda</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Pedidos por Status */}
            {dashboard.ordersByStatus.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  Pedidos por Status
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {dashboard.ordersByStatus.map((item) => (
                    <div key={item.status} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-900">{item._count}</div>
                      <div className="text-xs text-gray-500">{item.status}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatCurrency(item._sum.totalValue || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
