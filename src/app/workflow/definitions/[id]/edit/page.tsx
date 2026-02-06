"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  GitBranch,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";

type StepForm = {
  id?: string;
  name: string;
  description: string;
  stepOrder: number;
  assigneeType: string;
  assigneeId: string;
  isRequired: boolean;
};

export default function EditWorkflowDefinitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<StepForm[]>([]);

  const { data: definition, isLoading } = trpc.workflow.getDefinition.useQuery({ id });

  const updateMutation = trpc.workflow.updateDefinition.useMutation({
    onSuccess: () => {
      router.push("/workflow/definitions");
    },
  });

  useEffect(() => {
    if (definition) {
      setName(definition.name);
      setDescription(definition.description || "");
      setCategory(definition.category);
      setIsActive(definition.isActive);
      setSteps(
        definition.steps?.map((s) => ({
          id: s.id,
          name: s.name,
          description: "",
          stepOrder: s.sequence,
          assigneeType: s.assigneeType || "user",
          assigneeId: s.assigneeId || "",
          isRequired: s.isRequired,
        })) || []
      );
    }
  }, [definition]);

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      id,
      name,
      description: description || undefined,
      isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Workflow"
        icon={<GitBranch className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Definições", href: "/workflow/definitions" },
          { label: "Editar" },
        ]}
        actions={
          <Link
            href="/workflow/definitions"
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h2 className="text-lg font-semibold text-theme mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Nome *</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              />
            </div>
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
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-theme"
                />
                <span className="text-sm text-theme">Workflow ativo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Steps (read-only for now) */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme">Etapas do Workflow</h2>
            <span className="text-sm text-theme-muted">(Edição de etapas em desenvolvimento)</span>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id || index} className="border border-theme rounded-lg p-4 bg-theme-secondary/30">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-theme-muted">
                    <span className="font-medium">#{step.stepOrder}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-theme">{step.name}</p>
                    <p className="text-sm text-theme-muted">{step.assigneeType}</p>
                  </div>
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
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
