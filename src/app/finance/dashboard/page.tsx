"use client";

import Link from "next/link";
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Clock,
  ArrowRight, Loader2, BarChart3, CreditCard, Banknote, Calendar
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { SimpleAreaChart, DonutChart, ChartCard } from "@/components/charts";

export default function FinancialDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.financialKpis.useQuery();

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
            <h1 className="text-2xl font-bold text-theme">Dashboard Financeiro</h1>
            <p className="text-theme-muted">Visão geral do módulo financeiro</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/payables"
              className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
            >
              Contas a Pagar
            </Link>
            <Link
              href="/receivables"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Contas a Receber
            </Link>
          </div>
        </div>

        {/* Alertas */}
        {((kpis?.payables.overdue.count || 0) > 0 || (kpis?.receivables.overdue.count || 0) > 0) && (
          <div className="space-y-2">
            {(kpis?.payables.overdue.count || 0) > 0 && (
              <Link
                href="/payables?status=OVERDUE"
                className="flex items-center gap-3 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">Contas Vencidas:</span>{" "}
                  {kpis?.payables.overdue.count} títulos totalizando {formatCurrency(kpis?.payables.overdue.value || 0)}
                </div>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {(kpis?.receivables.overdue.count || 0) > 0 && (
              <Link
                href="/receivables?status=OVERDUE"
                className="flex items-center gap-3 p-4 rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-800"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">Recebíveis Vencidos:</span>{" "}
                  {kpis?.receivables.overdue.count} títulos totalizando {formatCurrency(kpis?.receivables.overdue.value || 0)}
                </div>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* KPIs - Contas a Pagar */}
        <div>
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Contas a Pagar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link href="/payables?status=OVERDUE" className="bg-theme-card rounded-xl border border-red-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-theme-muted">Vencidas</span>
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(kpis?.payables.overdue.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.payables.overdue.count || 0} títulos</p>
            </Link>

            <Link href="/payables?dueDate=today" className="bg-theme-card rounded-xl border border-yellow-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-theme-muted">Hoje</span>
              </div>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(kpis?.payables.today.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.payables.today.count || 0} títulos</p>
            </Link>

            <Link href="/payables?dueDate=week" className="bg-theme-card rounded-xl border border-blue-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-theme-muted">Esta Semana</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(kpis?.payables.week.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.payables.week.count || 0} títulos</p>
            </Link>

            <Link href="/payables?dueDate=month" className="bg-theme-card rounded-xl border border-theme p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-theme-muted" />
                <span className="text-sm text-theme-muted">Este Mês</span>
              </div>
              <p className="text-xl font-bold text-theme">{formatCurrency(kpis?.payables.month.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.payables.month.count || 0} títulos</p>
            </Link>

            <div className="bg-theme-card rounded-xl border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-theme-muted">Pago no Mês</span>
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(kpis?.payables.paidMonth.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.payables.paidMonth.count || 0} títulos</p>
            </div>
          </div>
        </div>

        {/* KPIs - Contas a Receber */}
        <div>
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Contas a Receber
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/receivables?status=OVERDUE" className="bg-theme-card rounded-xl border border-red-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-theme-muted">Vencidas</span>
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(kpis?.receivables.overdue.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.receivables.overdue.count || 0} títulos</p>
            </Link>

            <Link href="/receivables?dueDate=today" className="bg-theme-card rounded-xl border border-yellow-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-theme-muted">Hoje</span>
              </div>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(kpis?.receivables.today.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.receivables.today.count || 0} títulos</p>
            </Link>

            <Link href="/receivables?dueDate=week" className="bg-theme-card rounded-xl border border-blue-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-theme-muted">Esta Semana</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(kpis?.receivables.week.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.receivables.week.count || 0} títulos</p>
            </Link>

            <div className="bg-theme-card rounded-xl border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-theme-muted">Recebido no Mês</span>
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(kpis?.receivables.receivedMonth.value || 0)}</p>
              <p className="text-xs text-theme-muted">{kpis?.receivables.receivedMonth.count || 0} títulos</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fluxo de Caixa */}
          <ChartCard 
            title="Fluxo de Caixa Projetado" 
            subtitle="Próximos 30 dias"
            actions={
              <Link href="/treasury" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver tesouraria
              </Link>
            }
          >
            <SimpleAreaChart
              data={kpis?.cashFlow || []}
              dataKeys={[
                { key: "A Receber", color: "#10B981" },
                { key: "A Pagar", color: "#EF4444" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Pagamentos por Forma */}
          <ChartCard 
            title="Pagamentos por Forma" 
            subtitle="Últimos 30 dias"
          >
            <DonutChart
              data={kpis?.paymentsByMethod || []}
              dataKey="value"
              height={250}
            />
          </ChartCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/payables/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Nova Conta a Pagar</p>
              <p className="text-sm text-theme-muted">Lançar despesa</p>
            </div>
          </Link>

          <Link
            href="/receivables/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Nova Conta a Receber</p>
              <p className="text-sm text-theme-muted">Lançar receita</p>
            </div>
          </Link>

          <Link
            href="/payables/batch-payment"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Banknote className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Pagamento em Lote</p>
              <p className="text-sm text-theme-muted">Baixar múltiplos</p>
            </div>
          </Link>

          <Link
            href="/treasury"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Tesouraria</p>
              <p className="text-sm text-theme-muted">Gestão de caixa</p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
