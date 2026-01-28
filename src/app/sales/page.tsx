"use client";

import React from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
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

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <ShoppingCart className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-theme">Vendas</h1>
          <p className="text-sm text-theme-muted">Dashboard comercial</p>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !dashboard ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhum dado disponível</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Vendas do Mês</span>
                </div>
                <div className="text-2xl font-bold text-theme">
                  {formatCurrency(dashboard.monthOrders.value)}
                </div>
                <div className="text-xs text-theme-muted">{dashboard.monthOrders.count} pedidos</div>
              </div>

              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Orçamentos Pendentes</span>
                </div>
                <div className="text-2xl font-bold text-theme">
                  {formatCurrency(dashboard.pendingQuotes.value)}
                </div>
                <div className="text-xs text-theme-muted">{dashboard.pendingQuotes.count} orçamentos</div>
              </div>

              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">Taxa de Conversão</span>
                </div>
                <div className="text-2xl font-bold text-theme">
                  {dashboard.conversionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-theme-muted">orçamentos aceitos</div>
              </div>

              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Leads Ativos</span>
                </div>
                <div className="text-2xl font-bold text-theme">
                  {dashboard.leadsByStatus
                    .filter(l => !["WON", "LOST"].includes(l.status))
                    .reduce((sum, l) => sum + l._count, 0)}
                </div>
                <div className="text-xs text-theme-muted">em negociação</div>
              </div>
            </div>

            {/* Pipeline de Leads */}
            <div className="bg-theme-card rounded-lg border border-theme p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-theme flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-theme-muted" />
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
                        <div className="text-xs text-theme-muted mt-1">
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
                className="bg-theme-card rounded-lg border border-theme p-6 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Users className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">Leads / CRM</h3>
                    <p className="text-sm text-theme-muted">Gerenciar oportunidades</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/sales/quotes"
                className="bg-theme-card rounded-lg border border-theme p-6 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">Orçamentos</h3>
                    <p className="text-sm text-theme-muted">Propostas comerciais</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/sales/orders"
                className="bg-theme-card rounded-lg border border-theme p-6 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">Pedidos</h3>
                    <p className="text-sm text-theme-muted">Pedidos de venda</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Pedidos por Status */}
            {dashboard.ordersByStatus.length > 0 && (
              <div className="bg-theme-card rounded-lg border border-theme p-6 mt-8">
                <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-theme-muted" />
                  Pedidos por Status
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {dashboard.ordersByStatus.map((item) => (
                    <div key={item.status} className="text-center p-3 bg-theme-tertiary rounded-lg">
                      <div className="text-xl font-bold text-theme">{item._count}</div>
                      <div className="text-xs text-theme-muted">{item.status}</div>
                      <div className="text-xs text-theme-muted mt-1">
                        {formatCurrency(item._sum.totalValue || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
