"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  ClipboardList,
  Search,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Clock,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "info" | "warning" | "success" | "error" }> = {
  PLANNED: { label: "Planejada", variant: "default" },
  APPROVED: { label: "Aprovada", variant: "info" },
  IN_PROGRESS: { label: "Em Andamento", variant: "warning" },
  ON_HOLD: { label: "Aguardando", variant: "warning" },
  COMPLETED: { label: "Concluída", variant: "success" },
  CANCELLED: { label: "Cancelada", variant: "error" },
};

const typeLabels: Record<string, string> = {
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Corretiva",
  PREDICTIVE: "Preditiva",
  IMPROVEMENT: "Melhoria",
};

const priorityConfig: Record<string, { label: string; variant: "error" | "warning" | "info" | "default" }> = {
  EMERGENCY: { label: "Emergência", variant: "error" },
  URGENT: { label: "Urgente", variant: "error" },
  HIGH: { label: "Alta", variant: "warning" },
  NORMAL: { label: "Normal", variant: "info" },
  LOW: { label: "Baixa", variant: "default" },
};

const statusOptions = [
  { value: "ALL", label: "Todos os status" },
  { value: "PLANNED", label: "Planejada" },
  { value: "APPROVED", label: "Aprovada" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "ON_HOLD", label: "Aguardando" },
  { value: "COMPLETED", label: "Concluída" },
  { value: "CANCELLED", label: "Cancelada" },
];

const typeOptions = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "PREVENTIVE", label: "Preventiva" },
  { value: "CORRECTIVE", label: "Corretiva" },
  { value: "PREDICTIVE", label: "Preditiva" },
  { value: "IMPROVEMENT", label: "Melhoria" },
];

export default function MaintenanceOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = trpc.maintenance.listOrders.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? (statusFilter as "PLANNED" | "APPROVED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED") : undefined,
    type: typeFilter !== "ALL" ? (typeFilter as "PREVENTIVE" | "CORRECTIVE" | "PREDICTIVE" | "IMPROVEMENT") : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Serviço"
        icon={<ClipboardList className="w-6 h-6" />}
        backHref="/maintenance"
        module="producao"
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <Input
              placeholder="Buscar por código ou descrição..."
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
          <div className="w-full md:w-44">
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={statusOptions}
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
            <Alert variant="error" title="Erro ao carregar ordens">{error.message}</Alert>
          </div>
        ) : !data?.items?.length ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhuma ordem de serviço encontrada</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Equipamento</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Tipo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Prioridade</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Abertura</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.items.map((order: {
                    id: string;
                    code: number;
                    title: string;
                    description?: string | null;
                    type: string;
                    priority: string;
                    status: string;
                    createdAt: string | Date;
                    equipment?: { id: string; code: string; name: string } | null;
                  }) => {
                    const st = statusConfig[order.status] ?? statusConfig.OPEN;
                    const pr = priorityConfig[order.priority] ?? priorityConfig.NORMAL;
                    return (
                      <tr key={order.id} className="hover:bg-theme-table-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-theme">{order.title}</div>
                          <div className="text-xs text-theme-muted">OS #{order.code}</div>
                        </td>
                        <td className="px-4 py-3">
                          {order.equipment ? (
                            <div className="flex items-center gap-2 text-sm text-theme">
                              <Cpu className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div>{order.equipment.name}</div>
                                <div className="text-xs text-theme-muted">{order.equipment.code}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-theme-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline">{typeLabels[order.type] ?? order.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={pr.variant}>{pr.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                            <Clock className="w-3 h-3 text-theme-muted" />
                            {formatDate(order.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href={`/maintenance/orders/${order.id}`}>
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
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                <div className="text-sm text-theme-muted">
                  Página {page} de {data.pagination.totalPages} ({data.pagination.total} ordens)
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
