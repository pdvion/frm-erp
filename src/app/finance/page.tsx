"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  CreditCard,
  BarChart3,
  RefreshCw,
  Calendar,
  Building2,
  FileText,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function FinanceDashboardPage() {
  const { data: treasuryData, isLoading: loadingTreasury } = trpc.bankAccounts.dashboard.useQuery();
  const { data: payablesStats, isLoading: loadingPayables } = trpc.payables.stats.useQuery();
  const { data: receivablesStats, isLoading: loadingReceivables } = trpc.receivables.stats.useQuery();

  const isLoading = loadingTreasury || loadingPayables || loadingReceivables;

  const formatCurrency = (value: number | undefined | null) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const quickLinks = [
    { href: "/payables", label: "Contas a Pagar", icon: TrendingDown, color: "text-red-600 bg-red-50" },
    { href: "/receivables", label: "Contas a Receber", icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { href: "/payables/cashflow", label: "Fluxo de Caixa", icon: BarChart3, color: "text-blue-600 bg-blue-50" },
    { href: "/treasury", label: "Tesouraria", icon: Building2, color: "text-purple-600 bg-purple-50" },
    { href: "/treasury/reconciliation", label: "Conciliação", icon: RefreshCw, color: "text-indigo-600 bg-indigo-50" },
    { href: "/payables/cnab", label: "CNAB", icon: FileText, color: "text-gray-600 bg-gray-100" },
  ];

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
                <DollarSign className="w-6 h-6 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">Dashboard Financeiro</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <>
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Saldo Total */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 opacity-80" />
                  <span className="text-green-100 text-sm">Saldo em Caixa</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(treasuryData?.totalBalance)}</p>
                <p className="text-green-200 text-xs mt-1">
                  {treasuryData?.accounts.length || 0} conta(s) ativa(s)
                </p>
              </div>

              {/* A Pagar */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span className="text-gray-500 text-sm">A Pagar (Pendente)</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(payablesStats?.totalPending.value)}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {payablesStats?.totalPending.count || 0} título(s)
                </p>
              </div>

              {/* A Receber */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-gray-500 text-sm">A Receber (Pendente)</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(receivablesStats?.totalPending.value)}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {receivablesStats?.totalPending.count || 0} título(s)
                </p>
              </div>

              {/* Saldo Projetado */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-500 text-sm">Saldo Projetado (Mês)</span>
                </div>
                <p className={`text-2xl font-bold ${(treasuryData?.projectedBalance || 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {formatCurrency(treasuryData?.projectedBalance)}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Fluxo: {formatCurrency(treasuryData?.netFlowWeek)} (7 dias)
                </p>
              </div>
            </div>

            {/* Alertas */}
            {((payablesStats?.totalOverdue.count || 0) > 0 || (treasuryData?.pendingReconciliation || 0) > 0) && (
              <div className="mb-8 space-y-3">
                {(payablesStats?.totalOverdue.count || 0) > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">
                        {payablesStats?.totalOverdue.count} título(s) vencido(s)
                      </p>
                      <p className="text-red-600 text-sm">
                        Total: {formatCurrency(payablesStats?.totalOverdue.value)}
                      </p>
                    </div>
                    <Link
                      href="/payables?status=OVERDUE"
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                    >
                      Ver <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {(treasuryData?.pendingReconciliation || 0) > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-yellow-800 font-medium">
                        {treasuryData?.pendingReconciliation} transação(ões) pendente(s) de conciliação
                      </p>
                    </div>
                    <Link
                      href="/treasury/reconciliation"
                      className="text-yellow-600 hover:text-yellow-800 text-sm font-medium flex items-center gap-1"
                    >
                      Conciliar <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Próximos 7 Dias */}
              <div className="lg:col-span-2 space-y-6">
                {/* Resumo Semanal */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    Próximos 7 Dias
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700">A Pagar</span>
                      </div>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(treasuryData?.payablesWeek.value)}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        {treasuryData?.payablesWeek.count || 0} título(s)
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-700">A Receber</span>
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(treasuryData?.receivablesWeek.value)}
                      </p>
                      <p className="text-xs text-green-500 mt-1">
                        {treasuryData?.receivablesWeek.count || 0} título(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Fluxo Líquido (7 dias)</span>
                      <span className={`text-lg font-bold ${(treasuryData?.netFlowWeek || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {(treasuryData?.netFlowWeek || 0) >= 0 ? "+" : ""}{formatCurrency(treasuryData?.netFlowWeek)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aging de Contas a Pagar */}
                {payablesStats && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      Aging - Contas a Pagar
                    </h2>
                    
                    <div className="space-y-3">
                      {payablesStats.totalOverdue.value > 0 && (
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="text-red-700">Vencidos</span>
                          <span className="font-bold text-red-600">{formatCurrency(payablesStats.totalOverdue.value)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-700">Vence Hoje</span>
                        <span className="font-bold text-yellow-600">{formatCurrency(payablesStats.dueToday.value)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-700">Esta Semana</span>
                        <span className="font-bold text-blue-600">{formatCurrency(payablesStats.dueThisWeek.value)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Este Mês</span>
                        <span className="font-bold text-gray-600">{formatCurrency(payablesStats.dueThisMonth.value)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Acesso Rápido + Contas */}
              <div className="space-y-6">
                {/* Acesso Rápido */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${link.color}`}>
                          <link.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-gray-600 text-center">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Contas Bancárias */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      Contas
                    </h2>
                    <Link href="/treasury" className="text-sm text-blue-600 hover:text-blue-800">
                      Ver todas
                    </Link>
                  </div>
                  
                  <div className="space-y-3">
                    {treasuryData?.accounts.slice(0, 4).map((account) => (
                      <Link
                        key={account.id}
                        href={`/treasury/accounts/${account.id}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{account.name}</span>
                        </div>
                        <span className={`text-sm font-medium ${Number(account.currentBalance) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(Number(account.currentBalance))}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Status Geral */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-gray-400" />
                    Status
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pagos no Mês</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(payablesStats?.paidThisMonth.value)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Recebidos no Mês</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(receivablesStats?.receivedThisMonth?.value)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Conciliação Pendente</span>
                      <span className={`text-sm font-medium ${(treasuryData?.pendingReconciliation || 0) > 0 ? "text-yellow-600" : "text-green-600"}`}>
                        {treasuryData?.pendingReconciliation || 0} transação(ões)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
