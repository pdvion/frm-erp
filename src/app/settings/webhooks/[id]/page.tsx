"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Webhook,
  Send,
  RotateCcw,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

const deliveryStatusVariant: Record<string, "success" | "error" | "warning" | "default"> = {
  SUCCESS: "success",
  FAILED: "error",
  DEAD_LETTER: "warning",
  PENDING: "default",
};

const deliveryStatusLabel: Record<string, string> = {
  SUCCESS: "Sucesso",
  FAILED: "Falhou",
  DEAD_LETTER: "Dead Letter",
  PENDING: "Pendente",
};

const deliveryStatusIcon: Record<string, React.ReactNode> = {
  SUCCESS: <CheckCircle className="w-4 h-4 text-green-500" />,
  FAILED: <XCircle className="w-4 h-4 text-red-500" />,
  DEAD_LETTER: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  PENDING: <Clock className="w-4 h-4 text-gray-400" />,
};

const statusFilterOptions = [
  { value: "", label: "Todos" },
  { value: "SUCCESS", label: "Sucesso" },
  { value: "FAILED", label: "Falhou" },
  { value: "DEAD_LETTER", label: "Dead Letter" },
  { value: "PENDING", label: "Pendente" },
];

export default function WebhookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const webhookId = params.id as string;

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);

  const { data: webhook, isLoading, isError, error, refetch } =
    trpc.webhooks.byId.useQuery({ id: webhookId });

  const { data: stats } = trpc.webhooks.deliveryStats.useQuery({
    id: webhookId,
    periodDays: 7,
  });

  const { data: deliveriesData, refetch: refetchDeliveries } =
    trpc.webhooks.listDeliveries.useQuery({
      webhookId,
      status: (statusFilter as "PENDING" | "SUCCESS" | "FAILED" | "DEAD_LETTER") || undefined,
      page,
      limit: 20,
    });

  const sendTestMutation = trpc.webhooks.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Evento de teste enviado");
      refetchDeliveries();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const rotateSecretMutation = trpc.webhooks.rotateSecret.useMutation({
    onSuccess: (data) => {
      setNewSecret(data.secret);
      toast.success("Secret rotacionado");
      refetch();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      toast.success("Webhook excluído");
      router.push("/settings/webhooks");
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateMutation = trpc.webhooks.update.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      refetch();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Webhook" icon={<Webhook className="w-6 h-6" />} backHref="/settings/webhooks" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !webhook) {
    return (
      <div className="space-y-6">
        <PageHeader title="Webhook" icon={<Webhook className="w-6 h-6" />} backHref="/settings/webhooks" />
        <Alert variant="error" title="Erro">
          {error?.message ?? "Webhook não encontrado"}
        </Alert>
      </div>
    );
  }

  const webhookStatus = webhook.status as string;

  return (
    <div className="space-y-6">
      <PageHeader
        title={webhook.name}
        icon={<Webhook className="w-6 h-6" />}
        backHref="/settings/webhooks"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                updateMutation.mutate({
                  id: webhookId,
                  status: webhookStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                })
              }
              isLoading={updateMutation.isPending}
            >
              {webhookStatus === "ACTIVE" ? "Desativar" : "Ativar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => sendTestMutation.mutate({ id: webhookId })}
              isLoading={sendTestMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Testar
            </Button>
          </div>
        }
      />

      {/* Config Card */}
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-theme-muted mb-1">URL</h3>
            <p className="text-sm font-mono text-theme break-all">{webhook.url}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-theme-muted mb-1">Status</h3>
            <Badge
              variant={
                deliveryStatusVariant[webhookStatus] ?? "default"
              }
            >
              {webhookStatus === "ACTIVE"
                ? "Ativo"
                : webhookStatus === "INACTIVE"
                  ? "Inativo"
                  : "Suspenso"}
            </Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium text-theme-muted mb-1">Secret</h3>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-theme">{webhook.secret}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRotateModal(true)}
                title="Rotacionar secret"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-theme-muted mb-1">Configuração</h3>
            <p className="text-sm text-theme">
              Timeout: {(webhook.timeoutMs / 1000).toFixed(0)}s · Max retries:{" "}
              {webhook.maxRetries}
            </p>
          </div>
          {webhook.description && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-theme-muted mb-1">Descrição</h3>
              <p className="text-sm text-theme-secondary">{webhook.description}</p>
            </div>
          )}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-theme-muted mb-2">Eventos Assinados</h3>
            <div className="flex flex-wrap gap-1.5">
              {webhook.events.map((evt: string) => (
                <Badge key={evt} variant="outline">
                  {evt}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-theme">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Webhook
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} icon={<Activity className="w-5 h-5" />} />
          <StatCard label="Sucesso" value={stats.success} icon={<CheckCircle className="w-5 h-5 text-green-500" />} />
          <StatCard label="Falhas" value={stats.failed} icon={<XCircle className="w-5 h-5 text-red-500" />} />
          <StatCard label="Dead Letter" value={stats.deadLetter} icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />} />
          <StatCard label="Latência Média" value={`${stats.avgDurationMs}ms`} icon={<Clock className="w-5 h-5 text-blue-500" />} />
        </div>
      )}

      {/* Deliveries */}
      <div className="bg-theme-card rounded-lg border border-theme">
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-base font-semibold text-theme">Entregas</h2>
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />
        </div>

        {!deliveriesData?.deliveries?.length ? (
          <div className="p-8 text-center text-sm text-theme-muted">
            Nenhuma entrega encontrada
          </div>
        ) : (
          <div className="divide-y divide-theme">
            {deliveriesData.deliveries.map((delivery) => (
              <div key={delivery.id} className="p-4">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() =>
                    setExpandedDelivery(
                      expandedDelivery === delivery.id ? null : delivery.id
                    )
                  }
                >
                  {deliveryStatusIcon[delivery.status]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={deliveryStatusVariant[delivery.status] ?? "default"}
                      >
                        {deliveryStatusLabel[delivery.status] ?? delivery.status}
                      </Badge>
                      <span className="text-xs font-mono text-theme-muted">
                        {delivery.event.eventType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-theme-muted flex-shrink-0">
                    <div>
                      {delivery.responseStatus
                        ? `HTTP ${delivery.responseStatus}`
                        : "—"}
                    </div>
                    <div>
                      {delivery.durationMs ? `${delivery.durationMs}ms` : "—"}
                    </div>
                  </div>
                  <div className="text-xs text-theme-muted flex-shrink-0">
                    {new Date(delivery.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>

                {expandedDelivery === delivery.id && (
                  <div className="mt-3 ml-7 space-y-3">
                    {delivery.errorMessage && (
                      <div>
                        <h4 className="text-xs font-medium text-theme-muted mb-1">
                          Erro
                        </h4>
                        <pre className="text-xs text-red-500 bg-theme-secondary rounded p-2 overflow-x-auto">
                          {delivery.errorMessage}
                        </pre>
                      </div>
                    )}
                    {delivery.responseBody && (
                      <div>
                        <h4 className="text-xs font-medium text-theme-muted mb-1">
                          Response Body
                        </h4>
                        <pre className="text-xs text-theme bg-theme-secondary rounded p-2 overflow-x-auto max-h-32">
                          {delivery.responseBody}
                        </pre>
                      </div>
                    )}
                    <div className="text-xs text-theme-muted">
                      Tentativa #{delivery.attemptNumber} · ID: {delivery.id}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {deliveriesData && deliveriesData.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-theme">
            <span className="text-sm text-theme-muted">
              {deliveriesData.total} entregas · Página {page} de{" "}
              {deliveriesData.pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= deliveriesData.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Rotate Secret Modal */}
      {showRotateModal && (
        <Modal
          isOpen
          onClose={() => {
            setShowRotateModal(false);
            setNewSecret(null);
          }}
          title="Rotacionar Secret"
        >
          {newSecret ? (
            <div className="space-y-4">
              <Alert variant="warning" title="Copie o novo secret agora">
                O secret anterior foi invalidado. Atualize sua integração.
              </Alert>
              <div className="bg-theme-secondary rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-theme break-all">
                    {newSecret}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(newSecret).catch(() => {
                        toast.error("Falha ao copiar");
                      });
                      toast.success("Secret copiado");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <ModalFooter>
                <Button
                  onClick={() => {
                    setShowRotateModal(false);
                    setNewSecret(null);
                  }}
                >
                  Fechar
                </Button>
              </ModalFooter>
            </div>
          ) : (
            <>
              <p className="text-sm text-theme-secondary mb-4">
                Ao rotacionar o secret, o anterior será invalidado imediatamente.
                Certifique-se de atualizar sua integração com o novo secret.
              </p>
              <ModalFooter>
                <Button variant="outline" onClick={() => setShowRotateModal(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  isLoading={rotateSecretMutation.isPending}
                  onClick={() => rotateSecretMutation.mutate({ id: webhookId })}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rotacionar
                </Button>
              </ModalFooter>
            </>
          )}
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          isOpen
          onClose={() => setShowDeleteModal(false)}
          title="Excluir Webhook"
        >
          <p className="text-sm text-theme-secondary mb-4">
            Tem certeza que deseja excluir <strong>{webhook.name}</strong>?
            Todas as entregas e eventos serão removidos permanentemente.
          </p>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id: webhookId })}
            >
              Excluir
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-theme-card rounded-lg border border-theme p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-theme-muted">{label}</span>
      </div>
      <p className="text-xl font-bold text-theme">{value}</p>
    </div>
  );
}
