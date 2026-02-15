"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  CalendarClock,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  RefreshCw,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  PREVENTIVE: "Preventiva",
  PREDICTIVE: "Preditiva",
};

const frequencyLabels: Record<string, string> = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
  CUSTOM: "Personalizada",
};

const typeOptions = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "PREVENTIVE", label: "Preventiva" },
  { value: "PREDICTIVE", label: "Preditiva" },
];

export default function MaintenancePlansPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = trpc.maintenance.listPlans.useQuery({
    type: typeFilter !== "ALL" ? (typeFilter as "PREVENTIVE" | "PREDICTIVE") : undefined,
    page,
    limit: 20,
  });

  const utils = trpc.useUtils();

  const generateMutation = trpc.maintenance.generateOrders.useMutation({
    onSuccess: (result) => {
      utils.maintenance.listOrders.invalidate();
      alert(`${result.generated} ordens geradas com sucesso!`);
    },
    onError: (err: { message: string }) => {
      alert(`Erro ao gerar ordens: ${err.message}`);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos de Manutenção"
        icon={<CalendarClock className="w-6 h-6" />}
        backHref="/maintenance"
        module="producao"
        actions={
          <Button
            variant="outline"
            onClick={() => generateMutation.mutate()}
            isLoading={generateMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Gerar Ordens Pendentes
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-44">
            <Select
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPage(1); }}
              options={typeOptions}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="error" title="Erro ao carregar planos">{error.message}</Alert>
          </div>
        ) : !data?.items?.length ? (
          <div className="text-center py-12">
            <CalendarClock className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhum plano de manutenção encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Plano</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Equipamento</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Tipo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Frequência</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Próxima Execução</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.items.map((plan: {
                    id: string;
                    name: string;
                    description?: string | null;
                    type: string;
                    frequency: string;
                    isActive: boolean;
                    nextDueDate?: string | Date | null;
                    equipment?: { id: string; code: string; name: string } | null;
                  }) => (
                    <tr key={plan.id} className="hover:bg-theme-table-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-theme">{plan.name}</div>
                        {plan.description && (
                          <div className="text-xs text-theme-muted line-clamp-1">{plan.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {plan.equipment ? (
                          <div className="flex items-center gap-2 text-sm text-theme">
                            <Cpu className="w-4 h-4 text-theme-muted" />
                            <div>
                              <div>{plan.equipment.name}</div>
                              <div className="text-xs text-theme-muted">{plan.equipment.code}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-theme-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={plan.type === "PREVENTIVE" ? "info" : "purple"}>
                          {typeLabels[plan.type] ?? plan.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-theme-secondary">
                          {frequencyLabels[plan.frequency] ?? plan.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-theme-secondary">
                          {plan.nextDueDate ? formatDate(plan.nextDueDate) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={plan.isActive ? "success" : "default"}>
                          {plan.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                <div className="text-sm text-theme-muted">
                  Página {page} de {data.pagination.totalPages} ({data.pagination.total} planos)
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setPage(page + 1)} disabled={page === data.pagination.totalPages}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
