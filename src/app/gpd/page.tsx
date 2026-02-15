"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatPercent } from "@/lib/formatters";
import { toNumber } from "@/lib/precision";
import { PageHeader } from "@/components/PageHeader";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  Plus,
  Calendar,
  Users,
  Flag,
  Activity,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

type StatusBadgeProps = {
  status: "BELOW" | "ON_TARGET" | "ABOVE";
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    BELOW: { variant: "error" as BadgeVariant, icon: TrendingDown, label: "Abaixo" },
    ON_TARGET: { variant: "success" as BadgeVariant, icon: CheckCircle, label: "Na Meta" },
    ABOVE: { variant: "info" as BadgeVariant, icon: TrendingUp, label: "Acima" },
  };

  const { variant, icon: Icon, label } = config[status];

  return (
    <Badge variant={variant}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const config: Record<number, { variant: BadgeVariant; label: string }> = {
    1: { variant: "error", label: "Urgente" },
    2: { variant: "orange", label: "Alta" },
    3: { variant: "info", label: "Normal" },
    4: { variant: "default", label: "Baixa" },
  };

  const { variant, label } = config[priority] || config[3];

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}

export default function GpdDashboardPage() {
  const currentYear = new Date().getFullYear();
  const { data: dashboard, isLoading } = trpc.gpd.getDashboard.useQuery(
    { year: currentYear },
    { refetchInterval: 60000 }
  );

  const { data: goals } = trpc.gpd.listGoals.useQuery(
    { year: currentYear, parentId: null },
    { enabled: !isLoading }
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const goalsData = dashboard?.goals || { total: 0, byStatus: {} };
  const indicatorsData = dashboard?.indicators || { total: 0, belowTarget: 0, onTarget: 0, aboveTarget: 0, list: [] };
  const actionsData = dashboard?.actionPlans || { total: 0, byStatus: {} };
  const pendingActions = dashboard?.pendingActions || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão por Diretrizes"
        icon={<Target className="h-6 w-6 text-purple-600" />}
        module="REPORTS"
      >
        <Link
          href="/gpd/goals"
          className="flex items-center gap-2 rounded-lg border border-theme-input bg-theme-card px-4 py-2 text-theme-secondary hover:bg-theme-hover"
        >
          <Flag className="h-4 w-4" />
          Metas
        </Link>
        <Link
          href="/gpd/actions"
          className="flex items-center gap-2 rounded-lg border border-theme-input bg-theme-card px-4 py-2 text-theme-secondary hover:bg-theme-hover"
        >
          <Activity className="h-4 w-4" />
          Planos de Ação
        </Link>
        <Link
          href="/gpd/goals/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </Link>
      </PageHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-3">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Metas {currentYear}</p>
                  <p className="text-2xl font-bold text-theme">{goalsData.total}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="text-green-600">
                  {(goalsData.byStatus as Record<string, number>)?.ACHIEVED || 0} atingidas
                </span>
                <span className="text-theme-muted">•</span>
                <span className="text-blue-600">
                  {(goalsData.byStatus as Record<string, number>)?.ACTIVE || 0} ativas
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Indicadores</p>
                  <p className="text-2xl font-bold text-theme">{indicatorsData.total}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="text-green-600">{indicatorsData.onTarget} na meta</span>
                <span className="text-theme-muted">•</span>
                <span className="text-red-600">{indicatorsData.belowTarget} abaixo</span>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Planos de Ação</p>
                  <p className="text-2xl font-bold text-theme">{actionsData.total}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="text-yellow-600">
                  {(actionsData.byStatus as Record<string, number>)?.IN_PROGRESS || 0} em andamento
                </span>
                <span className="text-theme-muted">•</span>
                <span className="text-green-600">
                  {(actionsData.byStatus as Record<string, number>)?.COMPLETED || 0} concluídos
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Ações Pendentes</p>
                  <p className="text-2xl font-bold text-theme">{pendingActions.length}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-orange-600">
                Próximos 7 dias
              </div>
            </div>
          </div>

          {/* Indicadores com Faróis */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme">Faróis dos Indicadores</h2>
              <Link href="/gpd/indicators" className="text-sm text-purple-600 hover:text-purple-800">
                Ver todos →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {indicatorsData.list.slice(0, 6).map((indicator) => (
                <div
                  key={indicator.id}
                  className="rounded-lg border border-theme bg-theme-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-theme">{indicator.name}</p>
                      <p className="mt-1 text-xs text-theme-muted">{indicator.goal?.title}</p>
                    </div>
                    <StatusBadge status={indicator.status as "BELOW" | "ON_TARGET" | "ABOVE"} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-theme">
                        {indicator.currentValue !== null ? toNumber(indicator.currentValue).toLocaleString("pt-BR") : "-"}
                      </span>
                      {indicator.targetExpected !== null && (
                        <span className="text-sm text-theme-muted">
                          / {toNumber(indicator.targetExpected).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                    {indicator.targetExpected !== null && indicator.currentValue !== null && (
                      <div className="mt-2">
                        <div className="h-2 w-full rounded-full bg-theme-tertiary">
                          <div
                            className={`h-2 rounded-full ${
                              indicator.status === "BELOW"
                                ? "bg-red-500"
                                : indicator.status === "ABOVE"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(100, (toNumber(indicator.currentValue) / toNumber(indicator.targetExpected)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-theme-muted">
                          {formatPercent(toNumber(indicator.currentValue) / toNumber(indicator.targetExpected))} da meta
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Metas Estratégicas */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Metas Estratégicas {currentYear}</h2>
                <Link href="/gpd/goals" className="text-sm text-purple-600 hover:text-purple-800">
                  Ver todas →
                </Link>
              </div>
              <div className="space-y-3">
                {goals?.slice(0, 5).map((goal) => (
                  <Link
                    key={goal.id}
                    href={`/gpd/goals/${goal.id}`}
                    className="block rounded-lg border border-theme bg-theme-card p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              goal.category === "FINANCIAL"
                                ? "bg-green-500"
                                : goal.category === "OPERATIONAL"
                                  ? "bg-blue-500"
                                  : goal.category === "CUSTOMER"
                                    ? "bg-purple-500"
                                    : goal.category === "GROWTH"
                                      ? "bg-orange-500"
                                      : "bg-teal-500"
                            }`}
                          />
                          <p className="font-medium text-theme">{goal.title}</p>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-theme-muted">
                          {goal.owner && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {goal.owner.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {goal._count.indicators} indicadores
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-theme-muted" />
                    </div>
                  </Link>
                ))}
                {(!goals || goals.length === 0) && (
                  <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-8 text-center">
                    <Target className="mx-auto h-12 w-12 text-theme-muted" />
                    <p className="mt-2 text-sm text-theme-muted">Nenhuma meta cadastrada</p>
                    <Link
                      href="/gpd/goals/new"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
                    >
                      <Plus className="h-4 w-4" />
                      Criar primeira meta
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Ações Pendentes */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Ações Próximas do Vencimento</h2>
                <Link href="/gpd/actions" className="text-sm text-purple-600 hover:text-purple-800">
                  Ver todas →
                </Link>
              </div>
              <div className="space-y-3">
                {pendingActions.map((action) => (
                  <Link
                    key={action.id}
                    href={`/gpd/actions/${action.id}`}
                    className="block rounded-lg border border-theme bg-theme-card p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-theme">{action.title}</p>
                        {action.goal && (
                          <p className="mt-1 text-xs text-theme-muted">{action.goal.title}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-theme-muted">
                          {action.responsible && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {action.responsible.name}
                            </span>
                          )}
                          {action.dueDate && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Calendar className="h-3 w-3" />
                              {new Date(action.dueDate).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <PriorityBadge priority={action.priority} />
                        <div className="flex items-center gap-1 text-xs text-theme-muted">
                          <Clock className="h-3 w-3" />
                          {action.progress}%
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {pendingActions.length === 0 && (
                  <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <p className="mt-2 text-sm text-theme-muted">Nenhuma ação pendente</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
