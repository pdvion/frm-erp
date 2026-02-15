"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { trpc } from "@/lib/trpc";
import { Key, Plus, Copy, RotateCcw, Trash2, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";

const PERMISSION_LABELS: Record<string, string> = {
  ALL: "Acesso Total",
  PRODUCTS_READ: "Produtos (leitura)",
  PRODUCTS_WRITE: "Produtos (escrita)",
  CUSTOMERS_READ: "Clientes (leitura)",
  CUSTOMERS_WRITE: "Clientes (escrita)",
  ORDERS_READ: "Pedidos (leitura)",
  ORDERS_WRITE: "Pedidos (escrita)",
  INVOICES_READ: "Notas Fiscais (leitura)",
  STOCK_READ: "Estoque (leitura)",
  PURCHASE_ORDERS_READ: "Compras (leitura)",
  PURCHASE_ORDERS_WRITE: "Compras (escrita)",
  SUPPLIERS_READ: "Fornecedores (leitura)",
  SUPPLIERS_WRITE: "Fornecedores (escrita)",
};

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showRevoke, setShowRevoke] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const utils = trpc.useUtils();
  const { data, isLoading, isError, error } = trpc.apiKeys.list.useQuery();

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (result) => {
      setCreatedKey(result.key);
      setNewKeyName("");
      utils.apiKeys.list.invalidate();
      toast.success("Chave criada com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao criar chave: ${err.message}`);
    },
  });

  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      setShowRevoke(null);
      utils.apiKeys.list.invalidate();
      toast.success("Chave revogada com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao revogar: ${err.message}`);
    },
  });

  const rotateMutation = trpc.apiKeys.rotate.useMutation({
    onSuccess: (result) => {
      setCreatedKey(result.key);
      utils.apiKeys.list.invalidate();
      toast.success("Chave rotacionada com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao rotacionar: ${err.message}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copiado!"),
      () => toast.error("Erro ao copiar")
    );
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chaves de API"
        icon={<Key className="w-6 h-6" />}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Chave
          </Button>
        }
      />

      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex items-start gap-3 text-sm text-theme-secondary">
          <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-theme mb-1">API REST Pública</p>
            <p>
              Use chaves de API para integrar sistemas externos com o ERP via REST API.
              Base URL: <code className="bg-theme-tertiary px-1.5 py-0.5 rounded text-xs">/api/v1/</code>
            </p>
            <p className="mt-1">
              Endpoints: <code className="text-xs">/products</code>, <code className="text-xs">/customers</code>,{" "}
              <code className="text-xs">/orders</code>, <code className="text-xs">/invoices</code>,{" "}
              <code className="text-xs">/stock</code>, <code className="text-xs">/purchase-orders</code>,{" "}
              <code className="text-xs">/suppliers</code>
            </p>
          </div>
        </div>
      </div>

      {!data?.keys?.length ? (
        <EmptyState
          title="Nenhuma chave de API"
          description="Crie uma chave para começar a usar a API REST."
        />
      ) : (
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          <table className="w-full">
            <thead className="bg-theme-table-header border-b border-theme">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Prefixo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Permissões</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Último Uso</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-table">
              {data.keys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-theme-table-hover transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-theme">{apiKey.name}</td>
                  <td className="px-4 py-3 text-sm text-theme-muted font-mono">{apiKey.keyPrefix}...</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {apiKey.permissions.slice(0, 3).map((p) => (
                        <Badge key={p} variant="default" className="text-xs">
                          {PERMISSION_LABELS[p] || p}
                        </Badge>
                      ))}
                      {apiKey.permissions.length > 3 && (
                        <Badge variant="default" className="text-xs">
                          +{apiKey.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-theme-muted">
                    {apiKey.lastUsedAt
                      ? new Date(apiKey.lastUsedAt).toLocaleDateString("pt-BR")
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={apiKey.isActive ? "success" : "error"}>
                      {apiKey.isActive ? "Ativa" : "Revogada"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {apiKey.isActive && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => rotateMutation.mutate({ id: apiKey.id })}
                          title="Rotacionar chave"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowRevoke(apiKey.id)}
                          title="Revogar chave"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate && !createdKey}
        onClose={() => {
          setShowCreate(false);
          setNewKeyName("");
        }}
        title="Nova Chave de API"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nome da Chave"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Ex: Integração ERP-WMS"
          />
          <ModalFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setNewKeyName(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate({ name: newKeyName })}
              disabled={!newKeyName.trim() || createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              Criar Chave
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Show Created Key Modal */}
      <Modal
        isOpen={!!createdKey}
        onClose={() => {
          setCreatedKey(null);
          setShowCreate(false);
        }}
        title="Chave Criada"
        size="md"
      >
        <div className="space-y-4">
          <Alert variant="warning" title="Atenção">
            Copie a chave agora. Ela não será exibida novamente.
          </Alert>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={showKey ? createdKey || "" : "•".repeat(36)}
              className="font-mono text-sm"
            />
            <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdKey || "")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <ModalFooter>
            <Button onClick={() => { setCreatedKey(null); setShowCreate(false); }}>
              Fechar
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Revoke Confirmation Modal */}
      <Modal
        isOpen={!!showRevoke}
        onClose={() => setShowRevoke(null)}
        title="Revogar Chave"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-theme-secondary">
            Tem certeza que deseja revogar esta chave? Integrações que a utilizam deixarão de funcionar.
          </p>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowRevoke(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => showRevoke && revokeMutation.mutate({ id: showRevoke })}
              isLoading={revokeMutation.isPending}
            >
              Revogar
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
