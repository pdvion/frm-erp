"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Settings,
  DollarSign,
  User,
  Calendar,
  FileText,
} from "lucide-react";

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { color: string; label: string }> = {
    LOW: { color: "bg-theme-tertiary text-theme-secondary", label: "Baixa" },
    NORMAL: { color: "bg-blue-100 text-blue-700", label: "Normal" },
    HIGH: { color: "bg-orange-100 text-orange-700", label: "Alta" },
    URGENT: { color: "bg-red-100 text-red-700", label: "Urgente" },
  };

  const { color, label } = config[urgency] || config.NORMAL;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const config: Record<string, { color: string; label: string }> = {
    APPROVED: { color: "text-green-600", label: "Aprovou" },
    REJECTED: { color: "text-red-600", label: "Rejeitou" },
    DELEGATED: { color: "text-blue-600", label: "Delegou" },
  };

  const { color, label } = config[action] || { color: "text-theme-secondary", label: action };

  return <span className={`text-sm font-medium ${color}`}>{label}</span>;
}

export default function ApprovalsPage() {
  const { data: dashboard, isLoading } = trpc.approvals.getDashboard.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: myPending } = trpc.approvals.getMyPendingApprovals.useQuery(undefined, {
    enabled: !isLoading,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const status = dashboard?.status || {
    PENDING: { count: 0, total: 0 },
    APPROVED: { count: 0, total: 0 },
    REJECTED: { count: 0, total: 0 },
    CANCELLED: { count: 0, total: 0 },
    PAID: { count: 0, total: 0 },
  };
  const urgency = dashboard?.urgency || { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 };
  const myPendingCount = dashboard?.myPendingCount || 0;
  const recentApprovals = dashboard?.recentApprovals || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alçadas de Aprovação"
        icon={<Shield className="h-6 w-6 text-indigo-600" />}
        module="FINANCE"
      >
        <Link
          href="/treasury/approvals/levels"
          className="flex items-center gap-2 rounded-lg border border-theme-input bg-theme-card px-4 py-2 text-theme-secondary hover:bg-theme-hover"
        >
          <Settings className="h-4 w-4" />
          Configurar Níveis
        </Link>
        <Link
          href="/treasury/approvals/requests"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          <FileText className="h-4 w-4" />
          Ver Solicitações
        </Link>
      </PageHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Alerta de Pendências */}
          {myPendingCount > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">
                    Você tem {myPendingCount} solicitação(ões) aguardando sua aprovação
                  </p>
                  <p className="text-sm text-amber-600">
                    Clique abaixo para revisar e aprovar/rejeitar
                  </p>
                </div>
                <Link
                  href="/treasury/approvals/my-pending"
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Ver Pendências
                </Link>
              </div>
            </div>
          )}

          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-3">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Pendentes</p>
                  <p className="text-2xl font-bold text-theme">{status.PENDING.count}</p>
                  <p className="text-xs text-theme-muted">{formatCurrency(status.PENDING.total)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Aprovados</p>
                  <p className="text-2xl font-bold text-theme">{status.APPROVED.count}</p>
                  <p className="text-xs text-theme-muted">{formatCurrency(status.APPROVED.total)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Rejeitados</p>
                  <p className="text-2xl font-bold text-theme">{status.REJECTED.count}</p>
                  <p className="text-xs text-theme-muted">{formatCurrency(status.REJECTED.total)}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border p-6 shadow-sm ${urgency.URGENT > 0 ? "border-red-200 bg-red-50" : "border-theme bg-theme-card"}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${urgency.URGENT > 0 ? "bg-red-100" : "bg-orange-100"}`}>
                  <AlertTriangle className={`h-6 w-6 ${urgency.URGENT > 0 ? "text-red-600" : "text-orange-600"}`} />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Urgentes</p>
                  <p className="text-2xl font-bold text-theme">{urgency.URGENT + urgency.HIGH}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Minhas Pendências */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Minhas Pendências</h2>
                <Link href="/treasury/approvals/my-pending" className="text-sm text-indigo-600 hover:text-indigo-800">
                  Ver todas →
                </Link>
              </div>
              <div className="space-y-3">
                {myPending?.slice(0, 5).map((request) => (
                  <Link
                    key={request.id}
                    href={`/treasury/approvals/requests/${request.id}`}
                    className={`block rounded-lg border p-4 transition-shadow hover:shadow-md ${
                      request.urgency === "URGENT" ? "border-red-200 bg-red-50" :
                        request.urgency === "HIGH" ? "border-orange-200 bg-orange-50" :
                          "border-theme bg-theme-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-theme">{request.code}</p>
                          <UrgencyBadge urgency={request.urgency} />
                        </div>
                        <p className="mt-1 text-sm text-theme-secondary">
                          {request.payable.supplier.tradeName || request.payable.supplier.companyName}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-theme-muted">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(request.amount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(request.dueDate)}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-theme-muted" />
                    </div>
                  </Link>
                ))}
                {(!myPending || myPending.length === 0) && (
                  <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <p className="mt-2 text-sm text-theme-muted">Nenhuma pendência para você</p>
                  </div>
                )}
              </div>
            </section>

            {/* Urgências Pendentes */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Por Urgência</h2>
              </div>
              <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm text-theme-secondary">Urgente</span>
                    </div>
                    <span className="text-lg font-semibold text-theme">{urgency.URGENT}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500" />
                      <span className="text-sm text-theme-secondary">Alta</span>
                    </div>
                    <span className="text-lg font-semibold text-theme">{urgency.HIGH}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-theme-secondary">Normal</span>
                    </div>
                    <span className="text-lg font-semibold text-theme">{urgency.NORMAL}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-theme-tertiary" />
                      <span className="text-sm text-theme-secondary">Baixa</span>
                    </div>
                    <span className="text-lg font-semibold text-theme">{urgency.LOW}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Aprovações Recentes */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme">Aprovações Recentes</h2>
              <Link href="/treasury/approvals/history" className="text-sm text-indigo-600 hover:text-indigo-800">
                Ver histórico →
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-theme bg-theme-card shadow-sm">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Solicitação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Aprovador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Nível
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Ação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Data/Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table bg-theme-card">
                  {recentApprovals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-theme-hover">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-theme">
                        {approval.request.code}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        {approval.request.payable.supplier.companyName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {approval.approver.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        {approval.level.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <ActionBadge action={approval.action} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        {formatDateTime(approval.actionAt)}
                      </td>
                    </tr>
                  ))}
                  {recentApprovals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-theme-muted">
                        Nenhuma aprovação registrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
