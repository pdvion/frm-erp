"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  WorkflowEditor,
  NodePalette,
  NodeConfigPanel,
  type WorkflowStep,
  type WorkflowTransition,
} from "@/components/workflow";
import {
  GitBranch,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react";

export default function VisualWorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowStep | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: definition, isLoading } = trpc.workflow.getDefinition.useQuery({ id });

  useEffect(() => {
    if (definition?.steps && !initialized) {
      const mappedSteps: WorkflowStep[] = definition.steps.map((step, index) => ({
        id: step.id,
        code: step.code,
        name: step.name,
        type: step.type as WorkflowStep["type"],
        config: {},
        position: { x: 250, y: 100 + index * 150 },
      }));
      setSteps(mappedSteps);

      const mappedTransitions: WorkflowTransition[] = definition.transitions?.map((t) => ({
        id: t.id,
        fromStepId: t.fromStepId,
        toStepId: t.toStepId,
        condition: t.condition ?? undefined,
        label: t.label ?? undefined,
      })) ?? [];
      setTransitions(mappedTransitions);
      setInitialized(true);
    }
  }, [definition, initialized]);

  const handleStepsChange = useCallback((newSteps: WorkflowStep[]) => {
    setSteps(newSteps);
    setHasChanges(true);
  }, []);

  const handleTransitionsChange = useCallback((newTransitions: WorkflowTransition[]) => {
    setTransitions(newTransitions);
    setHasChanges(true);
  }, []);

  const handleNodeSelect = useCallback((node: WorkflowStep | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback((updatedNode: WorkflowStep) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === updatedNode.id ? updatedNode : s))
    );
    setSelectedNode(updatedNode);
    setHasChanges(true);
  }, []);

  const handleAddNode = useCallback((type: string) => {
    const newNode: WorkflowStep = {
      id: `node-${Date.now()}`,
      code: `STEP_${steps.length + 1}`,
      name: type === "START" ? "Início" : type === "END" ? "Fim" : `Novo ${type}`,
      type: type as WorkflowStep["type"],
      config: {},
      position: { x: 250, y: 100 + steps.length * 150 },
    };
    setSteps((prev) => [...prev, newNode]);
    setHasChanges(true);
  }, [steps.length]);

  const handleSave = async () => {
    // TODO: Implementar salvamento via tRPC
    console.log("Saving workflow:", { steps, transitions });
    setHasChanges(false);
    router.push("/workflow/definitions");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editor Visual: ${definition?.name || "Workflow"}`}
        icon={<GitBranch className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Definições", href: "/workflow/definitions" },
          { label: "Editor Visual" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/workflow/definitions"
              className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Paleta de Nós */}
        <div className="col-span-2">
          <NodePalette onAddNode={handleAddNode} />
        </div>

        {/* Editor Visual */}
        <div className="col-span-7">
          <WorkflowEditor
            steps={steps}
            transitions={transitions}
            onStepsChange={handleStepsChange}
            onTransitionsChange={handleTransitionsChange}
            onNodeSelect={handleNodeSelect}
          />
        </div>

        {/* Painel de Configuração */}
        <div className="col-span-3">
          {selectedNode ? (
            <NodeConfigPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleNodeUpdate}
            />
          ) : (
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted text-center">
                Selecione um nó para configurar
              </p>
            </div>
          )}

          {/* Resumo */}
          <div className="mt-4 bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="text-sm font-semibold text-theme mb-3">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Nós:</span>
                <span className="text-theme font-medium">{steps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Conexões:</span>
                <span className="text-theme font-medium">{transitions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Status:</span>
                <span className={hasChanges ? "text-amber-500" : "text-green-500"}>
                  {hasChanges ? "Não salvo" : "Salvo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
