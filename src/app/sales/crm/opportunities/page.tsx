"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  TrendingUp,
  Search,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
  User,
  Building2,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "info" | "success" | "error" }> = {
  OPEN: { label: "Aberta", variant: "info" },
  WON: { label: "Ganha", variant: "success" },
  LOST: { label: "Perdida", variant: "error" },
};

export default function OpportunitiesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pipelineFilter, setPipelineFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data: pipelines } = trpc.crm.listPipelines.useQuery();

  const { data, isLoading, isError, error } = trpc.crm.listOpportunities.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? (statusFilter as "OPEN" | "WON" | "LOST") : undefined,
    pipelineId: pipelineFilter !== "ALL" ? pipelineFilter : undefined,
    page,
    limit: 20,
  });

  const pipelineOptions = [
    { value: "ALL", label: "Todos os pipelines" },
    ...(pipelines?.map((p) => ({ value: p.id, label: p.name })) ?? []),
  ];

  const statusOptions = [
    { value: "ALL", label: "Todos os status" },
    { value: "OPEN", label: "Abertas" },
    { value: "WON", label: "Ganhas" },
    { value: "LOST", label: "Perdidas" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oportunidades"
        icon={<TrendingUp className="w-6 h-6" />}
        backHref="/sales/crm"
        module="sales"
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={pipelineFilter}
              onChange={(v) => { setPipelineFilter(v); setPage(1); }}
              options={pipelineOptions}
            />
          </div>
          <div className="w-full md:w-40">
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={statusOptions}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="error" title="Erro ao carregar oportunidades">{error.message}</Alert>
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhuma oportunidade encontrada</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Oportunidade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Pipeline / Estágio</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Prob.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Previsão</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Responsável</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.items.map((opp) => {
                    const config = statusConfig[opp.status] ?? statusConfig.OPEN;
                    return (
                      <tr key={opp.id} className="hover:bg-theme-table-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-theme">{opp.title}</div>
                          <div className="text-xs text-theme-muted">#{opp.code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-theme">
                            <Building2 className="w-4 h-4 text-theme-muted" />
                            {opp.customer?.companyName ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-theme">{opp.pipeline?.name ?? "—"}</div>
                          <Badge variant="outline">{opp.stage}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 text-sm font-medium text-theme">
                            <DollarSign className="w-3 h-3 text-theme-muted" />
                            {formatCurrency(Number(opp.value))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                          {opp.probability}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                            <Calendar className="w-3 h-3 text-theme-muted" />
                            {opp.expectedCloseDate ? formatDate(opp.expectedCloseDate) : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                            <User className="w-3 h-3 text-theme-muted" />
                            {opp.assignedUser?.name ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href={`/sales/crm/opportunities/${opp.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                <div className="text-sm text-theme-muted">
                  Página {page} de {data.pagination.totalPages} ({data.pagination.total} oportunidades)
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
