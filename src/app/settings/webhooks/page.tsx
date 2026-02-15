"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Webhook,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  Send,
  Copy,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "SUSPENDED", label: "Suspenso" },
];

const statusVariant: Record<string, "success" | "default" | "error" | "warning"> = {
  ACTIVE: "success",
  INACTIVE: "default",
  SUSPENDED: "warning",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
};

export default function WebhooksPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = trpc.webhooks.list.useQuery({
    search: search || undefined,
    status: (statusFilter as "ACTIVE" | "INACTIVE" | "SUSPENDED") || undefined,
  });

  const { data: eventTypes } = trpc.webhooks.eventTypes.useQuery();

  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      toast.success("Webhook excluído");
      refetch();
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  const sendTestMutation = trpc.webhooks.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Evento de teste enviado");
    },
    onError: (err) => {
      toast.error(`Erro ao enviar teste: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Webhooks" icon={<Webhook className="w-6 h-6" />} />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Webhooks" icon={<Webhook className="w-6 h-6" />} />
        <Alert variant="error" title="Erro ao carregar webhooks">
          {error.message}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks"
        icon={<Webhook className="w-6 h-6" />}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Webhook
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          <Input
            placeholder="Buscar por nome ou URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
        />
      </div>

      {!data?.webhooks?.length ? (
        <EmptyState
          title="Nenhum webhook configurado"
          description="Crie um webhook para receber notificações em tempo real sobre eventos do sistema."
          action={{
            label: "Criar Webhook",
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {data.webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-theme-card rounded-lg border border-theme p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-theme truncate">
                      {webhook.name}
                    </h3>
                    <Badge variant={statusVariant[webhook.status] ?? "default"}>
                      {statusLabel[webhook.status] ?? webhook.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-theme-muted mb-2">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate font-mono text-xs">{webhook.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {webhook.events.slice(0, 5).map((evt) => (
                      <Badge key={evt} variant="outline">
                        {evt}
                      </Badge>
                    ))}
                    {webhook.events.length > 5 && (
                      <Badge variant="outline">
                        +{webhook.events.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => sendTestMutation.mutate({ id: webhook.id })}
                    title="Enviar teste"
                    aria-label="Enviar teste"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/settings/webhooks/${webhook.id}`)}
                    title="Ver detalhes"
                    aria-label="Ver detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(webhook.id)}
                    title="Excluir"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-theme-muted">
                <span>{webhook.deliveryCount} entregas</span>
                <span>
                  Criado em{" "}
                  {new Date(webhook.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateWebhookModal
          eventTypes={eventTypes ?? []}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {deleteId && (
        <Modal
          isOpen
          onClose={() => setDeleteId(null)}
          title="Excluir Webhook"
        >
          <p className="text-sm text-theme-secondary mb-4">
            Tem certeza que deseja excluir este webhook? Todas as entregas e
            eventos associados serão removidos permanentemente.
          </p>
          <ModalFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id: deleteId })}
            >
              Excluir
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// CREATE MODAL
// ──────────────────────────────────────────────

interface CreateWebhookModalProps {
  eventTypes: { value: string; label: string }[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateWebhookModal({
  eventTypes,
  onClose,
  onCreated,
}: CreateWebhookModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const createMutation = trpc.webhooks.create.useMutation({
    onSuccess: (data) => {
      setCreatedSecret(data.secret);
      toast.success("Webhook criado com sucesso");
    },
    onError: (err) => {
      toast.error(`Erro ao criar: ${err.message}`);
    },
  });

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const selectAll = () => {
    if (selectedEvents.length === eventTypes.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(eventTypes.map((e) => e.value));
    }
  };

  if (createdSecret) {
    return (
      <Modal isOpen onClose={onCreated} title="Webhook Criado">
        <div className="space-y-4">
          <Alert variant="warning" title="Copie o secret agora">
            O secret não será exibido novamente. Salve-o em um local seguro.
          </Alert>
          <div className="bg-theme-secondary rounded-lg p-4">
            <label className="block text-xs font-medium text-theme-muted mb-1">
              Signing Secret
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-theme break-all">
                {createdSecret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(createdSecret).catch(() => {
                    toast.error("Falha ao copiar");
                  });
                  toast.success("Secret copiado");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button onClick={onCreated}>Fechar</Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Novo Webhook">
      <div className="space-y-4">
        <div>
          <label htmlFor="webhook-name" className="block text-sm font-medium text-theme mb-1">
            Nome
          </label>
          <Input
            id="webhook-name"
            placeholder="Ex: Integração ERP Externo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="webhook-url" className="block text-sm font-medium text-theme mb-1">
            URL
          </label>
          <Input
            id="webhook-url"
            placeholder="https://api.exemplo.com/webhooks"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="webhook-desc" className="block text-sm font-medium text-theme mb-1">
            Descrição (opcional)
          </label>
          <Input
            id="webhook-desc"
            placeholder="Descrição do webhook"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-theme">
              Eventos ({selectedEvents.length})
            </label>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedEvents.length === eventTypes.length
                ? "Desmarcar todos"
                : "Selecionar todos"}
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto border border-theme rounded-lg p-2 space-y-1">
            {eventTypes.map((evt) => (
              <label
                key={evt.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-theme-secondary cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedEvents.includes(evt.value)}
                  onChange={() => toggleEvent(evt.value)}
                />
                <span className="font-mono text-xs text-theme-muted">
                  {evt.value}
                </span>
                <span className="text-theme-secondary ml-auto text-xs">
                  {evt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          isLoading={createMutation.isPending}
          disabled={!name || !url || selectedEvents.length === 0}
          onClick={() =>
            createMutation.mutate({
              name,
              url,
              events: selectedEvents as Parameters<typeof createMutation.mutate>[0]["events"],
              description: description || undefined,
            })
          }
        >
          Criar Webhook
        </Button>
      </ModalFooter>
    </Modal>
  );
}
