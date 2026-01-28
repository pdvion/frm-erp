"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Goal, Plus, Target, Users, TrendingUp, DollarSign, Briefcase } from "lucide-react";
import Link from "next/link";

type GoalCategory = "FINANCIAL" | "OPERATIONAL" | "CUSTOMER" | "GROWTH" | "PEOPLE" | undefined;

export default function GPDGoalsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory>(undefined);

  const { data: goals, isLoading } = trpc.gpd.listGoals.useQuery({
    year,
    category: categoryFilter,
  });

  const categoryColors = {
    FINANCIAL: "text-green-600 bg-green-100 dark:bg-green-900/30",
    OPERATIONAL: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    CUSTOMER: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    GROWTH: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    PEOPLE: "text-pink-600 bg-pink-100 dark:bg-pink-900/30",
  };

  const categoryLabels = {
    FINANCIAL: "Financeiro",
    OPERATIONAL: "Operacional",
    CUSTOMER: "Cliente",
    GROWTH: "Crescimento",
    PEOPLE: "Pessoas",
  };

  const categoryIcons = {
    FINANCIAL: <DollarSign className="w-4 h-4" />,
    OPERATIONAL: <Briefcase className="w-4 h-4" />,
    CUSTOMER: <Users className="w-4 h-4" />,
    GROWTH: <TrendingUp className="w-4 h-4" />,
    PEOPLE: <Users className="w-4 h-4" />,
  };

  const statusColors = {
    ACTIVE: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    ACHIEVED: "text-green-600 bg-green-100 dark:bg-green-900/30",
    NOT_ACHIEVED: "text-red-600 bg-red-100 dark:bg-red-900/30",
    CANCELLED: "text-theme-secondary bg-theme-tertiary dark:bg-theme/30",
  };

  const statusLabels = {
    ACTIVE: "Ativa",
    ACHIEVED: "Atingida",
    NOT_ACHIEVED: "Não Atingida",
    CANCELLED: "Cancelada",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas GPD"
        icon={<Goal className="w-6 h-6" />}
        module="GPD"
        breadcrumbs={[
          { label: "GPD", href: "/gpd" },
          { label: "Metas" },
        ]}
        actions={
          <Link
            href="/gpd/goals/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </Link>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg text-sm ${year === y ? "bg-blue-600 text-white" : "bg-theme-card border border-theme text-theme"}`}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCategoryFilter(undefined)}
            className={`px-3 py-1.5 rounded-lg text-sm ${!categoryFilter ? "bg-blue-600 text-white" : "bg-theme-card border border-theme text-theme"}`}
          >
            Todas
          </button>
          {(["FINANCIAL", "OPERATIONAL", "CUSTOMER", "GROWTH", "PEOPLE"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${categoryFilter === cat ? "bg-blue-600 text-white" : "bg-theme-card border border-theme text-theme"}`}
            >
              {categoryIcons[cat]}
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals?.map((goal) => (
            <div key={goal.id} className="bg-theme-card border border-theme rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${categoryColors[goal.category]}`}>
                  {categoryIcons[goal.category]}
                  {categoryLabels[goal.category]}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${statusColors[goal.status]}`}>
                  {statusLabels[goal.status]}
                </span>
              </div>
              <h3 className="font-semibold text-theme mb-2">{goal.title}</h3>
              {goal.description && (
                <p className="text-sm text-theme-muted mb-3 line-clamp-2">{goal.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-theme-muted mb-3">
                <span>{goal.owner?.name || "Sem responsável"}</span>
                <span>{goal.department?.name || "Sem departamento"}</span>
              </div>
              {goal.targetValue && (
                <div className="text-sm text-theme mb-3">
                  Meta: <span className="font-semibold">{goal.targetValue} {goal.unit}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-theme-muted">
                <span>{goal._count.indicators} indicadores</span>
                <span>{goal._count.actionPlans} planos de ação</span>
              </div>
            </div>
          ))}
          {goals?.length === 0 && (
            <div className="col-span-full bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma meta encontrada</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/gpd" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para GPD
        </Link>
      </div>
    </div>
  );
}
