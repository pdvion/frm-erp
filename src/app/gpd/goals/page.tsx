"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import { Goal, Plus, Target, Users, TrendingUp, DollarSign, Briefcase } from "lucide-react";

type GoalCategory = "FINANCIAL" | "OPERATIONAL" | "CUSTOMER" | "GROWTH" | "PEOPLE" | undefined;

export default function GPDGoalsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory>(undefined);

  const { data: goals, isLoading } = trpc.gpd.listGoals.useQuery({
    year,
    category: categoryFilter,
  });

  const categoryColors: Record<string, string> = {
    FINANCIAL: "text-green-600 bg-green-100 dark:bg-green-900/30",
    OPERATIONAL: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    CUSTOMER: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    GROWTH: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    PEOPLE: "text-pink-600 bg-pink-100 dark:bg-pink-900/30",
  };

  const categoryLabels: Record<string, string> = {
    FINANCIAL: "Financeiro",
    OPERATIONAL: "Operacional",
    CUSTOMER: "Cliente",
    GROWTH: "Crescimento",
    PEOPLE: "Pessoas",
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    FINANCIAL: <DollarSign className="w-4 h-4" />,
    OPERATIONAL: <Briefcase className="w-4 h-4" />,
    CUSTOMER: <Users className="w-4 h-4" />,
    GROWTH: <TrendingUp className="w-4 h-4" />,
    PEOPLE: <Users className="w-4 h-4" />,
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    ACHIEVED: "text-green-600 bg-green-100 dark:bg-green-900/30",
    NOT_ACHIEVED: "text-red-600 bg-red-100 dark:bg-red-900/30",
    CANCELLED: "text-theme-secondary bg-theme-tertiary dark:bg-theme/30",
  };

  const statusLabels: Record<string, string> = {
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
          <LinkButton href="/gpd/goals/new" leftIcon={<Plus className="w-4 h-4" />}>
            Nova Meta
          </LinkButton>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <Button
              key={y}
              variant={year === y ? "primary" : "outline"}
              size="sm"
              onClick={() => setYear(y)}
            >
              {y}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant={!categoryFilter ? "primary" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(undefined)}
          >
            Todas
          </Button>
          {(["FINANCIAL", "OPERATIONAL", "CUSTOMER", "GROWTH", "PEOPLE"] as const).map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "primary" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className="flex items-center gap-1"
            >
              {categoryIcons[cat]}
              {categoryLabels[cat]}
            </Button>
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
                  Meta: <span className="font-semibold">{String(goal.targetValue)} {goal.unit}</span>
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
        <LinkButton href="/gpd" variant="ghost" size="sm">
          ← Voltar para GPD
        </LinkButton>
      </div>
    </div>
  );
}
