"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewGPDGoalPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    year: currentYear,
    title: "",
    description: "",
    category: "OPERATIONAL" as "FINANCIAL" | "OPERATIONAL" | "CUSTOMER" | "GROWTH" | "PEOPLE",
    targetValue: undefined as number | undefined,
    unit: "",
    weight: 1,
    ownerId: undefined as string | undefined,
    departmentId: undefined as string | undefined,
    parentId: undefined as string | undefined,
  });

  const { data: parentGoals } = trpc.gpd.listGoals.useQuery({ year: form.year, parentId: null });

  const createMutation = trpc.gpd.createGoal.useMutation({
    onSuccess: () => {
      router.push("/gpd/goals");
    },
  });

  const categoryLabels = {
    FINANCIAL: "Financeiro",
    OPERATIONAL: "Operacional",
    CUSTOMER: "Cliente",
    GROWTH: "Crescimento",
    PEOPLE: "Pessoas",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Meta GPD"
        icon={<PlusCircle className="w-6 h-6" />}
        module="GPD"
        breadcrumbs={[
          { label: "GPD", href: "/gpd" },
          { label: "Metas", href: "/gpd/goals" },
          { label: "Nova" },
        ]}
      />

      <div className="bg-theme-card border border-theme rounded-lg p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ano"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            />
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Categoria</label>
              <Select
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value as typeof form.category })}
                options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
              />
            </div>
          </div>

          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Aumentar faturamento em 20%"
          />

          <div>
            <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Valor Meta"
              type="number"
              value={form.targetValue ?? ""}
              onChange={(e) => setForm({ ...form, targetValue: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Ex: 1000000"
            />
            <Input
              label="Unidade"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="Ex: R$, %, un"
            />
            <Input
              label="Peso (1-10)"
              type="number"
              min={1}
              max={10}
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-theme mb-1">Meta Pai (desdobramento)</label>
            <Select
              value={form.parentId ?? ""}
              onChange={(value) => setForm({ ...form, parentId: value || undefined })}
              placeholder="Nenhuma (meta principal)"
              options={parentGoals?.map((goal) => ({ value: goal.id, label: goal.title })) || []}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-theme">
          <Link
            href="/gpd/goals"
            className="px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-hover"
          >
            Cancelar
          </Link>
          <Button
            onClick={() => createMutation.mutate(form)}
            disabled={!form.title}
            isLoading={createMutation.isPending}
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
