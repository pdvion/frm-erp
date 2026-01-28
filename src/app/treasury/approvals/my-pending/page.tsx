"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

type ActionType = "approve" | "reject" | null;

export default function MyPendingApprovalsPage() {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");

  const { data: pendingApprovals, isLoading, refetch } = trpc.approvals.getMyPendingApprovals.useQuery();
  const { data: dashboard } = trpc.approvals.getDashboard.useQuery();

  const approveMutation = trpc.approvals.approve.useMutation({
    onSuccess: () => {
      setSelectedRequest(null);
      setActionType(null);
      setComments("");
      refetch();
    },
    onError: (err) => setError(err.message),
  });

  const rejectMutation = trpc.approvals.reject.useMutation({
    onSuccess: () => {
      setSelectedRequest(null);
      setActionType(null);
      setComments("");
      refetch();
    },
    onError: (err) => setError(err.message),
  });

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;
    setError("");

    if (actionType === "approve") {
      approveMutation.mutate({
        requestId: selectedRequest,
        comments: comments || undefined,
      });
    } else {
      if (!comments.trim()) {
        setError("Motivo da rejeição é obrigatório");
        return;
      }
      rejectMutation.mutate({
        requestId: selectedRequest,
        comments: comments.trim(),
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      URGENT: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      HIGH: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      NORMAL: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      LOW: "bg-theme-tertiary text-theme-secondary dark:text-theme-muted",
    };
    const labels: Record<string, string> = {
      URGENT: "Urgente",
      HIGH: "Alta",
      NORMAL: "Normal",
      LOW: "Baixa",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[urgency] || styles.NORMAL}`}>
        {labels[urgency] || urgency}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Aprovações Pendentes"
        icon={<ClipboardCheck className="w-6 h-6" />}
        module="TREASURY"
        breadcrumbs={[
          { label: "Tesouraria", href: "/treasury" },
          { label: "Aprovações", href: "/treasury/approvals" },
          { label: "Pendentes" },
        ]}
      />

      {/* Cards de resumo */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Minhas Pendências</p>
                <p className="text-2xl font-bold text-theme">{dashboard.myPendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Urgentes</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {dashboard.urgency.URGENT}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Aprovadas (Total)</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {dashboard.status.APPROVED.count}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Valor Pendente</p>
                <p className="text-lg font-bold text-theme">
                  {formatCurrency(dashboard.status.PENDING.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de pendências */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="p-4 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme">Solicitações Aguardando Aprovação</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-theme-muted">Carregando...</div>
        ) : !pendingApprovals || pendingApprovals.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-theme-muted">Nenhuma aprovação pendente</p>
            <p className="text-sm text-theme-muted mt-1">
              Você está em dia com suas aprovações!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-theme">
            {pendingApprovals.map((request) => (
              <div key={request.id} className="p-4 hover:bg-theme-secondary transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-theme-muted">
                        #{request.code}
                      </span>
                      {getUrgencyBadge(request.urgency)}
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                        {request.currentLevel?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-theme-muted" />
                      <span className="font-medium text-theme">
                        {request.payable?.supplier?.companyName || "—"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-theme-muted">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Solicitante: {request.requester?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Vencimento: {formatDate(request.dueDate)}</span>
                      </div>
                    </div>

                    {request.justification && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-theme-muted mt-0.5" />
                        <span className="text-theme-muted">{request.justification}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-xl font-bold text-theme">
                      {formatCurrency(request.amount)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request.id);
                          setActionType("approve");
                          setComments("");
                          setError("");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request.id);
                          setActionType("reject");
                          setComments("");
                          setError("");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/treasury/approvals"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para Aprovações
        </Link>
        <Link
          href="/treasury/approvals/history"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Ver Histórico →
        </Link>
      </div>

      {/* Modal de ação */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4">
              {actionType === "approve" ? "Aprovar Solicitação" : "Rejeitar Solicitação"}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  {actionType === "approve" ? "Comentários (opcional)" : "Motivo da Rejeição *"}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder={
                    actionType === "approve"
                      ? "Adicione um comentário..."
                      : "Informe o motivo da rejeição..."
                  }
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setComments("");
                  setError("");
                }}
                className="flex-1 px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {approveMutation.isPending || rejectMutation.isPending
                  ? "Processando..."
                  : actionType === "approve"
                    ? "Confirmar Aprovação"
                    : "Confirmar Rejeição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
