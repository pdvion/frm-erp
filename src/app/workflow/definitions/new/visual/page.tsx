"use client";

import { useState, useCallback } from "react";
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
import { AIChatPanel } from "@/components/workflow/AIChatPanel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  GitBranch,
  ArrowLeft,
  Save,
  Loader2,
  Settings,
  Sparkles,
} from "lucide-react";
import type { GeneratedWorkflow } from "@/lib/ai/workflowGenerator";
import { Textarea } from "@/components/ui/Textarea";
import { NativeSelect } from "@/components/ui/NativeSelect";

export default function NewVisualWorkflowPage() {
  const router = useRouter();
  
  // Workflow metadata
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"PURCHASE" | "PAYMENT" | "HR" | "PRODUCTION" | "SALES" | "GENERAL">("GENERAL");
  const [showSettings, setShowSettings] = useState(true);
  
  // Visual editor state
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: "start-node",
      code: "START",
      name: "Início",
      type: "START",
      config: {},
      position: { x: 250, y: 50 },
    },
    {
      id: "end-node",
      code: "END",
      name: "Fim",
      type: "END",
      config: {},
      position: { x: 250, y: 400 },
    },
  ]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowStep | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const createMutation = trpc.workflow.createDefinition.useMutation();
  const addStepMutation = trpc.workflow.addStep.useMutation();
  const addTransitionMutation = trpc.workflow.addTransition.useMutation();

  const handleStepsChange = useCallback((newSteps: WorkflowStep[]) => {
    setSteps(newSteps);
  }, []);

  const handleTransitionsChange = useCallback((newTransitions: WorkflowTransition[]) => {
    setTransitions(newTransitions);
  }, []);

  const handleNodeSelect = useCallback((node: WorkflowStep | null) => {
    setSelectedNode(node);
    if (node) setShowSettings(false);
  }, []);

  const handleNodeUpdate = useCallback((updatedNode: WorkflowStep) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === updatedNode.id ? updatedNode : s))
    );
    setSelectedNode(updatedNode);
  }, []);

  const handleAddNode = useCallback((type: string) => {
    const newNode: WorkflowStep = {
      id: `node-${Date.now()}`,
      code: `STEP_${steps.length + 1}`,
      name: type === "START" ? "Início" : type === "END" ? "Fim" : `Novo ${type}`,
      type: type as WorkflowStep["type"],
      config: {},
      position: { x: 250, y: 100 + steps.length * 100 },
    };
    setSteps((prev) => [...prev, newNode]);
  }, [steps.length]);

  const handleAIWorkflowGenerated = useCallback((workflow: GeneratedWorkflow) => {
    // Update metadata
    setName(workflow.name);
    setDescription(workflow.description);
    setCategory(workflow.category);

    // Convert AI steps to WorkflowStep format
    const newSteps: WorkflowStep[] = workflow.steps.map((step) => ({
      id: step.id,
      code: step.code,
      name: step.name,
      type: step.type as WorkflowStep["type"],
      config: {
        ...step.config,
        formFields: step.formFields,
        assigneeType: step.assigneeType,
        assigneeRole: step.assigneeRole,
      },
      position: step.position,
    }));

    // Convert AI transitions to WorkflowTransition format
    const newTransitions: WorkflowTransition[] = workflow.transitions.map((t) => ({
      id: t.id,
      fromStepId: t.fromStepId,
      toStepId: t.toStepId,
      condition: t.condition,
      label: t.label,
    }));

    setSteps(newSteps);
    setTransitions(newTransitions);
    setShowAIChat(false);
    setShowSettings(true);
  }, []);

  const mapStepType = (type: WorkflowStep["type"]): "START" | "APPROVAL" | "TASK" | "DECISION" | "NOTIFICATION" | "END" => {
    const typeMap: Record<WorkflowStep["type"], "START" | "APPROVAL" | "TASK" | "DECISION" | "NOTIFICATION" | "END"> = {
      START: "START",
      END: "END",
      ACTION: "TASK",
      CONDITION: "DECISION",
      APPROVAL: "APPROVAL",
      NOTIFICATION: "NOTIFICATION",
    };
    return typeMap[type];
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Por favor, preencha o nome do workflow");
      setShowSettings(true);
      return;
    }

    setIsSaving(true);
    try {
      const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 20);
      
      // Create the workflow definition
      const definition = await createMutation.mutateAsync({
        code,
        name,
        description: description || undefined,
        category,
        triggerType: "MANUAL",
      });

      // Create a map of temporary IDs to real IDs
      const idMap = new Map<string, string>();

      // Add all steps
      for (const step of steps) {
        const createdStep = await addStepMutation.mutateAsync({
          definitionId: definition.id,
          code: step.code,
          name: step.name,
          type: mapStepType(step.type),
          config: step.config as Record<string, string | number | boolean>,
        });
        idMap.set(step.id, createdStep.id);
      }

      // Add all transitions with mapped IDs
      for (const transition of transitions) {
        const fromId = idMap.get(transition.fromStepId);
        const toId = idMap.get(transition.toStepId);
        
        if (fromId && toId) {
          await addTransitionMutation.mutateAsync({
            definitionId: definition.id,
            fromStepId: fromId,
            toStepId: toId,
            condition: transition.condition,
            label: transition.label,
          });
        }
      }

      router.push("/workflow/definitions");
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert("Erro ao salvar workflow");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <PageHeader
        title={name || "Novo Workflow"}
        icon={<GitBranch className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Definições", href: "/workflow/definitions" },
          { label: "Novo (Visual)" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showAIChat ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowAIChat(!showAIChat)}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Criar com IA
            </Button>
            <Button
              variant={showSettings ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4 mr-1" />
              Configurações
            </Button>
            <Link href="/workflow/definitions">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        }
      />

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Panel - Node Palette or Settings */}
        <div className="col-span-2 space-y-4 overflow-y-auto">
          {showSettings ? (
            <div className="bg-theme-card border border-theme rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-theme flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurações
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Nome *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aprovação de Compras"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Categoria
                </label>
                <NativeSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                  className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                >
                  <option value="GENERAL">Geral</option>
                  <option value="PURCHASE">Compras</option>
                  <option value="PAYMENT">Pagamentos</option>
                  <option value="HR">RH</option>
                  <option value="PRODUCTION">Produção</option>
                  <option value="SALES">Vendas</option>
                </NativeSelect>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Descrição
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo deste workflow..."
                  rows={3}
                  className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme resize-none"
                />
              </div>

              <div className="pt-2 border-t border-theme">
                <p className="text-xs text-theme-muted">
                  Arraste os nós da paleta para o canvas para criar o fluxo.
                </p>
              </div>
            </div>
          ) : null}
          
          <NodePalette onAddNode={handleAddNode} />
        </div>

        {/* Center - Visual Editor */}
        <div className={showAIChat ? "col-span-5" : "col-span-7"}>
          <WorkflowEditor
            steps={steps}
            transitions={transitions}
            onStepsChange={handleStepsChange}
            onTransitionsChange={handleTransitionsChange}
            onNodeSelect={handleNodeSelect}
          />
        </div>

        {/* Right Panel - Node Config or AI Chat */}
        <div className={showAIChat ? "col-span-5" : "col-span-3"} style={{ height: "calc(100vh - 180px)" }}>
          {showAIChat ? (
            <AIChatPanel
              onWorkflowGenerated={handleAIWorkflowGenerated}
              currentWorkflow={
                steps.length > 2
                  ? { name, description, category, steps, transitions }
                  : undefined
              }
              onClose={() => setShowAIChat(false)}
            />
          ) : selectedNode ? (
            <NodeConfigPanel
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onClose={() => setSelectedNode(null)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
