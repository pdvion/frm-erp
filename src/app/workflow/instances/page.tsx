"use client";

import { Suspense } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  GitBranch,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pendente", icon: <Clock className="h-3 w-3" /> },
    IN_PROGRESS: { color: "bg-blue-100 text-blue-800", label: "Em Andamento", icon: <Play className="h-3 w-3" /> },
    COMPLETED: { color: "bg-green-100 text-green-800", label: "Concluído", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { color: "bg-theme-tertiary text-theme", label: "Cancelado", icon: <XCircle className="h-3 w-3" /> },
    REJECTED: { color: "bg-red-100 text-red-800", label: "Rejeitado", icon: <XCircle className="h-3 w-3" /> },
  };

  const { color, label, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

function WorkflowInstancesContent() {
  const { filters, setFilter, setFilters } = useUrlFilters({
    defaults: { page: 1, search: "", status: undefined },
  });

  const search = (filters.search as string) || "";
  const page = (filters.page as number) || 1;
  const status = filters.status as string | undefined;

  const { data, isLoading, error } = trpc.workflow.listInstances.useQuery({
    status: status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED" | undefined,
  });

  const allInstances = data ?? [];
  const filteredInstances = search 
    ? allInstances.filter((i) => 
      i.definition?.name.toLowerCase().includes(search.toLowerCase()) ||
        String(i.code).includes(search)
    )
    : allInstances;
  const instances = filteredInstances.slice((page - 1) * 20, page * 20);
  const totalPages = Math.ceil(filteredInstances.length / 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Execuções de Workflow"
        icon={<GitBranch className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Execuções" },
        ]}
        actions={
          <Link
            href="/workflow"
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <Input
              type="text"
              placeholder="Buscar por workflow ou código..."
              value={search}
              onChange={(e) => {
                setFilters({ search: e.target.value, page: 1 });
              }}
              className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <NativeSelect
              value={status ?? ""}
              onChange={(e) => {
                setFilters({ status: e.target.value || undefined, page: 1 });
              }}
              className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
            >
              <option value="">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="REJECTED">Rejeitado</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-theme-muted">Carregando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erro: {error.message}</div>
        ) : instances.length === 0 ? (
          <div className="p-8 text-center text-theme-muted">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma execução encontrada</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-theme-secondary border-b border-theme">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Workflow</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Iniciado em</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {instances.map((instance) => (
                  <tr key={instance.id} className="hover:bg-theme-secondary/50">
                    <td className="px-4 py-3 text-sm text-theme">#{instance.code}</td>
                    <td className="px-4 py-3 text-sm text-theme">{instance.definition?.name || "N/A"}</td>
                    <td className="px-4 py-3"><StatusBadge status={instance.status} /></td>
                    <td className="px-4 py-3 text-sm text-theme-muted">
                      {new Date(instance.startedAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/workflow/instances/${instance.id}`}
                        className="text-violet-600 hover:text-violet-800"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                <p className="text-sm text-theme-muted">
                  Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setFilter("page", page - 1)}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-theme hover:bg-theme-secondary disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setFilter("page", page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-theme hover:bg-theme-secondary disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
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

export default function WorkflowInstancesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <WorkflowInstancesContent />
    </Suspense>
  );
}
