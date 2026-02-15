"use client";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownUp,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Plus,
} from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "default" | "info"> = {
  PENDING: "warning",
  PROCESSING: "info",
  PROCESSED: "success",
  ERROR: "error",
  CANCELLED: "default",
  ACTIVE: "success",
  INACTIVE: "default",
  TESTING: "info",
};

const MSG_TYPE_LABELS: Record<string, string> = {
  ORDERS: "Pedido (ORDERS)",
  ORDRSP: "Confirmação (ORDRSP)",
  DESADV: "Aviso Despacho (DESADV)",
  INVOIC: "Fatura (INVOIC)",
  RECADV: "Conf. Recebimento (RECADV)",
  PRICAT: "Catálogo (PRICAT)",
  INVRPT: "Inventário (INVRPT)",
  OTHER: "Outro",
};

export default function EdiPage() {
  const statsQuery = trpc.edi.stats.useQuery();
  const partnersQuery = trpc.edi.listPartners.useQuery();
  const messagesQuery = trpc.edi.listMessages.useQuery({ limit: 10 });

  const processMutation = trpc.edi.processMessage.useMutation({
    onSuccess: () => { messagesQuery.refetch(); statsQuery.refetch(); },
    onError: (err) => { console.warn("Process error:", err.message); },
  });

  const retryMutation = trpc.edi.retryMessage.useMutation({
    onSuccess: () => { messagesQuery.refetch(); statsQuery.refetch(); },
    onError: (err) => { console.warn("Retry error:", err.message); },
  });

  if (statsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="EDI" icon={<ArrowDownUp className="w-6 h-6" />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (statsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="EDI" icon={<ArrowDownUp className="w-6 h-6" />} />
        <Alert variant="error" title="Erro ao carregar">{statsQuery.error.message}</Alert>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="EDI — Troca Eletrônica de Dados"
        icon={<ArrowDownUp className="w-6 h-6" />}
        actions={
          <Button variant="primary" onClick={() => { /* TODO: modal criar parceiro */ }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Parceiro
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <div className="flex items-center gap-2 text-sm text-theme-muted mb-1">
            <Building2 className="w-4 h-4" /> Parceiros Ativos
          </div>
          <p className="text-2xl font-bold text-theme">{stats?.activePartners ?? 0} <span className="text-sm font-normal text-theme-muted">/ {stats?.totalPartners ?? 0}</span></p>
        </div>
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <div className="flex items-center gap-2 text-sm text-theme-muted mb-1">
            <Clock className="w-4 h-4" /> Pendentes
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.pendingMessages ?? 0}</p>
        </div>
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <div className="flex items-center gap-2 text-sm text-theme-muted mb-1">
            <AlertCircle className="w-4 h-4" /> Com Erro
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.errorMessages ?? 0}</p>
        </div>
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <div className="flex items-center gap-2 text-sm text-theme-muted mb-1">
            <CheckCircle2 className="w-4 h-4" /> Processadas Hoje
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.processedToday ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partners */}
        <div className="bg-theme-card rounded-lg border border-theme">
          <div className="px-4 py-3 border-b border-theme flex items-center justify-between">
            <h2 className="font-semibold text-theme">Parceiros EDI</h2>
            <span className="text-xs text-theme-muted">{partnersQuery.data?.length ?? 0} parceiro(s)</span>
          </div>
          <div className="p-4">
            {partnersQuery.isLoading && <Skeleton className="h-20" />}
            {partnersQuery.data?.length === 0 && (
              <EmptyState title="Nenhum parceiro" description="Cadastre um parceiro EDI para começar." />
            )}
            <div className="space-y-2">
              {partnersQuery.data?.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-theme-secondary">
                  <div>
                    <p className="font-medium text-theme text-sm">{p.name}</p>
                    <p className="text-xs text-theme-muted">{p.code} • {p.format} • {p._count.messages} msg</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[p.status] ?? "default"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-theme-card rounded-lg border border-theme">
          <div className="px-4 py-3 border-b border-theme flex items-center justify-between">
            <h2 className="font-semibold text-theme">Mensagens Recentes</h2>
            <span className="text-xs text-theme-muted">{messagesQuery.data?.total ?? 0} total</span>
          </div>
          <div className="p-4">
            {messagesQuery.isLoading && <Skeleton className="h-20" />}
            {messagesQuery.data?.items.length === 0 && (
              <EmptyState title="Nenhuma mensagem" description="Nenhuma mensagem EDI registrada." />
            )}
            <div className="space-y-2">
              {messagesQuery.data?.items.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-theme-secondary">
                  <div className="flex items-center gap-2">
                    {m.direction === "INBOUND" ? (
                      <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-theme text-sm">
                        {MSG_TYPE_LABELS[m.messageType] ?? m.messageType}
                      </p>
                      <p className="text-xs text-theme-muted">
                        {m.partner.name} • {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                        {m.referenceNumber && ` • Ref: ${m.referenceNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[m.status] ?? "default"}>{m.status}</Badge>
                    {m.status === "PENDING" && (
                      <Button variant="ghost" size="icon" onClick={() => processMutation.mutate({ id: m.id })}
                        disabled={processMutation.isPending}>
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {m.status === "ERROR" && (
                      <Button variant="ghost" size="icon" onClick={() => retryMutation.mutate({ id: m.id })}
                        disabled={retryMutation.isPending}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
