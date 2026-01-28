"use client";

import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";

export default function BIFinancialPage() {
  const { data: dashboard, isLoading } = trpc.dashboard.financialKpis.useQuery();

  const receivablesTotal = dashboard?.receivables?.week?.value || 0;
  const payablesTotal = dashboard?.payables?.week?.value || 0;
  const balance = receivablesTotal - payablesTotal;

  const cards = [
    {
      title: "Contas a Receber",
      value: formatCurrency(receivablesTotal),
      subtitle: `${dashboard?.receivables?.overdue?.count || 0} vencidas`,
      icon: <ArrowUpRight className="w-5 h-5" />,
      color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
      trend: "up",
    },
    {
      title: "Contas a Pagar",
      value: formatCurrency(payablesTotal),
      subtitle: `${dashboard?.payables?.overdue?.count || 0} vencidas`,
      icon: <ArrowDownRight className="w-5 h-5" />,
      color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
      trend: "down",
    },
    {
      title: "Saldo Projetado",
      value: formatCurrency(balance),
      subtitle: balance >= 0 ? "Positivo" : "Negativo",
      icon: <Wallet className="w-5 h-5" />,
      color: balance >= 0
        ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30"
        : "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
      trend: balance >= 0 ? "up" : "down",
    },
    {
      title: "Pagos no Mês",
      value: formatCurrency(dashboard?.payables?.paidMonth?.value || 0),
      subtitle: `${dashboard?.payables?.paidMonth?.count || 0} títulos`,
      icon: <PiggyBank className="w-5 h-5" />,
      color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
      trend: "up",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="BI Financeiro"
        icon={<DollarSign className="w-6 h-6" />}
        module="BI"
        breadcrumbs={[
          { label: "BI", href: "/bi" },
          { label: "Financeiro" },
        ]}
      />

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <>
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="bg-theme-card border border-theme rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    {card.icon}
                  </div>
                  {card.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-theme">{card.value}</p>
                <p className="text-sm text-theme-muted">{card.title}</p>
                <p className="text-xs text-theme-muted mt-1">{card.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-theme-card border border-theme rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">
                Fluxo de Caixa Mensal
              </h3>
              <div className="h-64 flex items-center justify-center border border-dashed border-theme rounded-lg">
                <div className="text-center text-theme-muted">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Gráfico de fluxo de caixa</p>
                </div>
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">
                Distribuição de Despesas
              </h3>
              <div className="h-64 flex items-center justify-center border border-dashed border-theme rounded-lg">
                <div className="text-center text-theme-muted">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Gráfico de despesas por categoria</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/receivables"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <ArrowUpRight className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-semibold text-theme">Contas a Receber</h4>
              <p className="text-sm text-theme-muted">Gerenciar recebíveis</p>
            </Link>
            <Link
              href="/payables"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <ArrowDownRight className="w-6 h-6 text-red-600 mb-2" />
              <h4 className="font-semibold text-theme">Contas a Pagar</h4>
              <p className="text-sm text-theme-muted">Gerenciar pagáveis</p>
            </Link>
            <Link
              href="/treasury"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <Wallet className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-semibold text-theme">Tesouraria</h4>
              <p className="text-sm text-theme-muted">Gestão de caixa</p>
            </Link>
          </div>
        </>
      )}

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
