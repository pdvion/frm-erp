"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  GitBranch,
  ArrowLeft,
  Play,
} from "lucide-react";

export default function StartWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");

  const { data: definition, isLoading, error } = trpc.workflow.getDefinition.useQuery({ id });

  const startMutation = trpc.workflow.startWorkflow.useMutation({
    onSuccess: (data: { id: string }) => {
      router.push(`/workflow/instances/${data.id}`);
    },
  });

  const handleStart = async () => {
    await startMutation.mutateAsync({
      definitionId: id,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !definition) {
    return (
      <div className="p-8 text-center">
        <GitBranch className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
        <p className="text-red-500 mb-4">{error?.message || "Workflow não encontrado"}</p>
        <Link href="/workflow" className="text-violet-600 hover:underline">
          Voltar para workflows
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Iniciar: ${definition.name}`}
        icon={<Play className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Iniciar" },
        ]}
        actions={
          <Link
            href="/workflow"
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-theme mb-2">Informações do Workflow</h2>
              <p className="text-theme-muted">{definition.description || "Sem descrição"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Observações (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                placeholder="Adicione observações sobre esta execução..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Tipo de Entidade (opcional)
                </label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                >
                  <option value="">Nenhum</option>
                  <option value="PURCHASE_ORDER">Pedido de Compra</option>
                  <option value="SALES_ORDER">Pedido de Venda</option>
                  <option value="INVOICE">Nota Fiscal</option>
                  <option value="PAYMENT">Pagamento</option>
                  <option value="REQUISITION">Requisição</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  ID da Entidade (opcional)
                </label>
                <input
                  type="text"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  placeholder="UUID da entidade"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-theme">
              <Link
                href="/workflow"
                className="px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
              >
                Cancelar
              </Link>
              <button
                onClick={handleStart}
                disabled={startMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {startMutation.isPending ? "Iniciando..." : "Iniciar Workflow"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Steps Preview */}
        <div>
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Etapas</h2>
            <div className="space-y-3">
              {definition.steps && definition.steps.length > 0 ? (
                definition.steps.map((step: typeof definition.steps[number], index: number) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-theme">{step.name}</p>
                      <p className="text-xs text-theme-muted">{step.assigneeType}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-theme-muted text-sm">Nenhuma etapa configurada</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
