"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import {
  GitBranch,
  Plus,
  Loader2,
  Layers,
} from "lucide-react";

interface PipelineStage {
  order: number;
  name: string;
  probability: number;
}

export default function PipelinesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();

  const { data: pipelines, isLoading, isError, error } = trpc.crm.listPipelines.useQuery(
    { includeInactive: true },
  );

  const createMutation = trpc.crm.createPipeline.useMutation({
    onSuccess: () => {
      utils.crm.listPipelines.invalidate();
      setShowCreate(false);
      setName("");
      setDescription("");
    },
    onError: (err) => {
      alert(`Erro ao criar pipeline: ${err.message}`);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pipelines" icon={<GitBranch className="w-6 h-6" />} backHref="/sales/crm" module="sales" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pipelines" icon={<GitBranch className="w-6 h-6" />} backHref="/sales/crm" module="sales" />
        <Alert variant="error" title="Erro ao carregar pipelines">{error.message}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipelines"
        icon={<GitBranch className="w-6 h-6" />}
        backHref="/sales/crm"
        module="sales"
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Pipeline
          </Button>
        }
      />

      {!pipelines?.length ? (
        <div className="bg-theme-card rounded-lg border border-theme p-12 text-center">
          <GitBranch className="w-12 h-12 mx-auto text-theme-muted mb-4" />
          <p className="text-theme-muted mb-4">Nenhum pipeline cadastrado</p>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Pipeline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline) => {
            const stages = (pipeline.stages as unknown as PipelineStage[]) || [];
            return (
              <div
                key={pipeline.id}
                className="bg-theme-card rounded-lg border border-theme p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-theme">{pipeline.name}</h3>
                    {pipeline.description && (
                      <p className="text-sm text-theme-muted mt-1">{pipeline.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {pipeline.isDefault && <Badge variant="info">Padrão</Badge>}
                    <Badge variant={pipeline.isActive ? "success" : "default"}>
                      {pipeline.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm text-theme-muted mb-2">
                    <Layers className="w-4 h-4" />
                    {stages.length} estágio{stages.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stages
                      .sort((a, b) => a.order - b.order)
                      .map((stage) => (
                        <Badge key={stage.name} variant="outline">
                          {stage.name} ({stage.probability}%)
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar Pipeline */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Novo Pipeline"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Nome *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vendas B2B"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do pipeline"
            />
          </div>
          <p className="text-xs text-theme-muted">
            Estágios padrão serão criados automaticamente. Você pode editá-los depois.
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isLoading={createMutation.isPending}
            disabled={!name.trim()}
          >
            Criar Pipeline
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
