"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
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
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
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
            <select
              value={form.parentId ?? ""}
              onChange={(e) => setForm({ ...form, parentId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
            >
              <option value="">Nenhuma (meta principal)</option>
              {parentGoals?.map((goal) => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
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
