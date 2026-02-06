"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  GitBranch,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Workflow,
} from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { NativeSelect } from "@/components/ui/NativeSelect";

type StepForm = {
  name: string;
  description: string;
  stepOrder: number;
  assigneeType: string;
  assigneeId: string;
  isRequired: boolean;
};

export default function NewWorkflowDefinitionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [steps, setSteps] = useState<StepForm[]>([
    { name: "", description: "", stepOrder: 1, assigneeType: "user", assigneeId: "", isRequired: true },
  ]);

  const createMutation = trpc.workflow.createDefinition.useMutation({
    onSuccess: () => {
      router.push("/workflow/definitions");
    },
  });

  const addStepMutation = trpc.workflow.addStep.useMutation();

  const addStep = () => {
    setSteps([
      ...steps,
      { name: "", description: "", stepOrder: steps.length + 1, assigneeType: "user", assigneeId: "", isRequired: true },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      setSteps(newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 })));
    }
  };

  const updateStep = (index: number, field: keyof StepForm, value: string | number | boolean) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 20);
    const definition = await createMutation.mutateAsync({
      code,
      name,
      description: description || undefined,
      category: category as "PURCHASE" | "PAYMENT" | "HR" | "PRODUCTION" | "SALES" | "GENERAL",
      triggerType: "MANUAL" as const,
    });

    // Add steps after creating definition
    for (const step of steps) {
      if (step.name) {
        await addStepMutation.mutateAsync({
          definitionId: definition.id,
          code: step.name.toUpperCase().replace(/\s+/g, "_").slice(0, 20),
          name: step.name,
          type: step.stepOrder === 1 ? "START" : "TASK",
          assigneeType: step.assigneeType.toUpperCase() as "USER" | "ROLE" | "DEPARTMENT" | "DYNAMIC",
          assigneeId: step.assigneeId || undefined,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Workflow"
        icon={<GitBranch className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Definições", href: "/workflow/definitions" },
          { label: "Novo" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/workflow/definitions/new/visual"
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              <Workflow className="w-4 h-4" />
              Editor Visual
            </Link>
            <Link
              href="/workflow/definitions"
              className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancelar
            </Link>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h2 className="text-lg font-semibold text-theme mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Aprovação de Compras"
            />
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Categoria</label>
              <NativeSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                placeholder="Descreva o objetivo deste workflow..."
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme">Etapas do Workflow</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              className="bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Adicionar Etapa
            </Button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="border border-theme rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 text-theme-muted">
                    <GripVertical className="w-4 h-4" />
                    <span className="font-medium">#{step.stepOrder}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Nome da Etapa *"
                      value={step.name}
                      onChange={(e) => updateStep(index, "name", e.target.value)}
                      required
                      placeholder="Ex: Aprovação Gerente"
                    />
                    <div>
                      <label className="block text-sm font-medium text-theme mb-1">Tipo de Responsável</label>
                      <NativeSelect
                        value={step.assigneeType}
                        onChange={(e) => updateStep(index, "assigneeType", e.target.value)}
                        className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                      >
                        <option value="user">Usuário Específico</option>
                        <option value="department">Departamento</option>
                        <option value="role">Cargo</option>
                        <option value="requester_manager">Gestor do Solicitante</option>
                      </NativeSelect>
                    </div>
                    <Input
                      label="ID do Responsável"
                      value={step.assigneeId}
                      onChange={(e) => updateStep(index, "assigneeId", e.target.value)}
                      placeholder="UUID ou deixe vazio"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    disabled={steps.length === 1}
                    className="p-2 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/workflow/definitions"
            className="px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            Cancelar
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            isLoading={createMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Criar Workflow
          </Button>
        </div>
      </form>
    </div>
  );
}
