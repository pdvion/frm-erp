"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { toNumber } from "@/lib/precision";
import { PageHeader } from "@/components/PageHeader";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2,
  Plus,
  Calendar,
  PieChart,
  BarChart3,
  FileText,
} from "lucide-react";

type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { color: string; label: string }> = {
    OK: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "OK" },
    WARNING: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Atenção" },
    EXCEEDED: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Excedido" },
  };

  const { color, label } = config[status] || config.OK;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function VersionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    DRAFT: { color: "bg-theme-tertiary text-theme", label: "Rascunho" },
    APPROVED: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Aprovado" },
    LOCKED: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Bloqueado" },
  };

  const { color, label } = config[status] || config.DRAFT;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function BudgetDashboardPage() {
  const currentYear = new Date().getFullYear();
  const { data: dashboard, isLoading } = trpc.budget.getDashboard.useQuery(
    { year: currentYear },
    { refetchInterval: 60000 }
  );

  const { data: versions } = trpc.budget.listVersions.useQuery(
    { year: currentYear },
    { enabled: !isLoading }
  );

  const { data: alerts } = trpc.budget.listAlerts.useQuery(
    { isResolved: false },
    { enabled: !isLoading }
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const summary = dashboard?.summary || { budgeted: 0, actual: 0, variance: 0, variancePercent: 0 };
  const byAccount = dashboard?.byAccount || [];
  const activeAlerts = alerts || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão Orçamentária"
        icon={<Wallet className="h-6 w-6 text-emerald-600" />}
        module="REPORTS"
      >
        <Link
          href="/budget/accounts"
          className="flex items-center gap-2 rounded-lg border border-theme-input bg-theme-card px-4 py-2 text-theme-secondary hover:bg-theme-hover"
        >
          <FileText className="h-4 w-4" />
          Contas
        </Link>
        <Link
          href="/budget/versions"
          className="flex items-center gap-2 rounded-lg border border-theme-input bg-theme-card px-4 py-2 text-theme-secondary hover:bg-theme-hover"
        >
          <Calendar className="h-4 w-4" />
          Versões
        </Link>
        <Link
          href="/budget/planning"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Planejar
        </Link>
      </PageHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Versão Ativa */}
          {dashboard?.version && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">
                      Orçamento {currentYear}: {dashboard.version.name}
                    </p>
                    <p className="text-xs text-emerald-700">
                      Tipo: {dashboard.version.type === "ORIGINAL" ? "Original" : dashboard.version.type === "REVISED" ? "Revisado" : "Forecast"}
                    </p>
                  </div>
                </div>
                <VersionStatusBadge status={dashboard.version.status} />
              </div>
            </div>
          )}

          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <PieChart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Orçado (YTD)</p>
                  <p className="text-2xl font-bold text-theme">
                    {formatCurrency(summary.budgeted)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Realizado (YTD)</p>
                  <p className="text-2xl font-bold text-theme">
                    {formatCurrency(summary.actual)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${summary.variance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                  {summary.variance >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Variação</p>
                  <p className={`text-2xl font-bold ${summary.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(summary.variance)}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-theme-muted">
                {formatPercent(Math.abs(summary.variancePercent) / 100)} {summary.variance >= 0 ? "abaixo" : "acima"} do orçado
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${activeAlerts.length > 0 ? "bg-orange-100" : "bg-green-100"}`}>
                  {activeAlerts.length > 0 ? (
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Alertas</p>
                  <p className="text-2xl font-bold text-theme">{activeAlerts.length}</p>
                </div>
              </div>
              {activeAlerts.length > 0 && (
                <div className="mt-2 text-xs text-orange-600">
                  Contas com estouro
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Orçado vs Realizado por Conta */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Orçado vs Realizado</h2>
                <Link href="/budget/tracking" className="text-sm text-emerald-600 hover:text-emerald-800">
                  Ver detalhes →
                </Link>
              </div>
              <div className="space-y-3">
                {byAccount.slice(0, 8).map((account) => (
                  <div
                    key={account.id}
                    className="rounded-lg border border-theme bg-theme-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-theme-muted">{account.code}</span>
                          <p className="font-medium text-theme">{account.name}</p>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-theme-muted">
                          <span>Orçado: {formatCurrency(toNumber(account.budgeted))}</span>
                          <span>Realizado: {formatCurrency(toNumber(account.actual))}</span>
                        </div>
                      </div>
                      <StatusBadge status={account.status} />
                    </div>
                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-theme-tertiary">
                        <div
                          className={`h-2 rounded-full ${
                            account.status === "EXCEEDED"
                              ? "bg-red-500"
                              : account.status === "WARNING"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (toNumber(account.actual) / toNumber(account.budgeted)) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-theme-muted">
                        <span>{formatPercent(toNumber(account.actual) / toNumber(account.budgeted))} utilizado</span>
                        <span className={account.variance >= 0 ? "text-green-600" : "text-red-600"}>
                          {account.variance >= 0 ? "+" : ""}{formatCurrency(account.variance)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {byAccount.length === 0 && (
                  <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-8 text-center">
                    <Wallet className="mx-auto h-12 w-12 text-theme-muted" />
                    <p className="mt-2 text-sm text-theme-muted">Nenhum orçamento cadastrado</p>
                    <Link
                      href="/budget/planning"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800"
                    >
                      <Plus className="h-4 w-4" />
                      Criar orçamento
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Versões e Alertas */}
            <div className="space-y-8">
              {/* Versões de Orçamento */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-theme">Versões {currentYear}</h2>
                  <Link href="/budget/versions" className="text-sm text-emerald-600 hover:text-emerald-800">
                    Ver todas →
                  </Link>
                </div>
                <div className="space-y-3">
                  {versions?.slice(0, 4).map((version) => (
                    <Link
                      key={version.id}
                      href={`/budget/versions/${version.id}`}
                      className="block rounded-lg border border-theme bg-theme-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-theme">{version.name}</p>
                          <p className="mt-1 text-xs text-theme-muted">
                            {version.type === "ORIGINAL" ? "Original" : version.type === "REVISED" ? "Revisado" : "Forecast"}
                            {" • "}
                            {version._count.entries} lançamentos
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <VersionStatusBadge status={version.status} />
                          <ArrowRight className="h-4 w-4 text-theme-muted" />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {(!versions || versions.length === 0) && (
                    <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-6 text-center">
                      <Calendar className="mx-auto h-10 w-10 text-theme-muted" />
                      <p className="mt-2 text-sm text-theme-muted">Nenhuma versão criada</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Alertas Ativos */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-theme">Alertas Ativos</h2>
                  <Link href="/budget/alerts" className="text-sm text-emerald-600 hover:text-emerald-800">
                    Ver todos →
                  </Link>
                </div>
                <div className="space-y-3">
                  {activeAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-lg border border-orange-200 bg-orange-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div className="flex-1">
                          <p className="font-medium text-orange-900">
                            {alert.account.code} - {alert.account.name}
                          </p>
                          <p className="mt-1 text-xs text-orange-700">
                            Mês {alert.month} • Orçado: {formatCurrency(toNumber(alert.budgetAmount))} • Realizado: {formatCurrency(toNumber(alert.actualAmount))}
                          </p>
                          <p className="mt-1 text-xs font-medium text-red-600">
                            Variação: {formatCurrency(toNumber(alert.variance))} ({formatPercent(Math.abs(toNumber(alert.variancePercent)) / 100)})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeAlerts.length === 0 && (
                    <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-6 text-center">
                      <CheckCircle className="mx-auto h-10 w-10 text-green-400" />
                      <p className="mt-2 text-sm text-theme-muted">Nenhum alerta ativo</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
