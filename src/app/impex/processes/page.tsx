"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Ship,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ProcessCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme-secondary" },
  PENDING_SHIPMENT: { label: "Aguardando Embarque", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  IN_TRANSIT: { label: "Em Trânsito", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  ARRIVED: { label: "Chegou", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  IN_CLEARANCE: { label: "Em Desembaraço", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CLEARED: { label: "Desembaraçado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

type StatusKey = keyof typeof STATUS_LABELS;

export default function ImportProcessesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = trpc.impex.listProcesses.useQuery({
    search: search || undefined,
    status: (statusFilter || undefined) as "DRAFT" | "PENDING_SHIPMENT" | "IN_TRANSIT" | "ARRIVED" | "IN_CLEARANCE" | "CLEARED" | "DELIVERED" | "CANCELLED" | undefined,
    page,
    limit,
  });

  const processes = data?.items;
  const pagination = data?.pagination;

  const deleteMutation = trpc.impex.deleteProcess.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => toast.error(`Erro ao excluir processo: ${error.message}`),
  });

  const formatCurrency = (value: number | string | null | undefined, currency = "USD") => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(num);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleDelete = (id: string, processNumber: string) => {
    if (confirm(`Deseja excluir o processo ${processNumber}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processos de Importação"
        icon={<Ship className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Processos" },
        ]}
        actions={
          <Button
            onClick={() => window.location.href = "/impex/processes/new"}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Processo
          </Button>
        }
      />

      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
            <Input
              placeholder="Buscar por número, referência ou BL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-theme grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Status</label>
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusKey | "")}
                placeholder="Todos"
                options={[
                  { value: "", label: "Todos" },
                  ...Object.entries(STATUS_LABELS).map(([key, { label }]) => ({
                    value: key,
                    label,
                  })),
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <ProcessCardSkeleton count={3} />
      ) : !processes?.length ? (
        <div className="bg-theme-card border border-theme rounded-lg p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-theme-muted mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">Nenhum processo encontrado</h3>
          <p className="text-theme-muted mb-4">
            {search || statusFilter
              ? "Tente ajustar os filtros de busca"
              : "Comece criando seu primeiro processo de importação"}
          </p>
          {!search && !statusFilter && (
            <Button
              onClick={() => window.location.href = "/impex/processes/new"}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Novo Processo
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {processes.map((process) => (
            <div
              key={process.id}
              className="bg-theme-card border border-theme rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-theme">{process.processNumber}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        STATUS_LABELS[process.status]?.color || "bg-theme-tertiary text-theme-secondary"
                      }`}
                    >
                      {STATUS_LABELS[process.status]?.label || process.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-theme-muted">Fornecedor:</span>
                      <p className="text-theme">{process.supplier?.companyName || "-"}</p>
                    </div>
                    <div>
                      <span className="text-theme-muted">Incoterm:</span>
                      <p className="text-theme">{process.incoterm?.code || "-"}</p>
                    </div>
                    <div>
                      <span className="text-theme-muted">Origem → Destino:</span>
                      <p className="text-theme">
                        {process.originPort?.code || "-"} → {process.destinationPort?.code || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-theme-muted">Itens:</span>
                      <p className="text-theme">{process._count?.importProcessItems || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-theme-muted text-sm">
                      <Calendar className="w-4 h-4" />
                      ETA: {formatDate(process.eta)}
                    </div>
                    <div className="flex items-center gap-1 text-theme font-medium">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(Number(process.fobValue || 0), process.currency ?? undefined)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/impex/processes/${process.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/impex/processes/${process.id}/edit`}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(process.id, process.processNumber)}
                      disabled={deleteMutation.isPending}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>

              {process.blNumber && (
                <div className="mt-3 pt-3 border-t border-theme flex items-center gap-4 text-sm text-theme-muted">
                  <span>BL: {process.blNumber}</span>
                  {process.reference && <span>Ref: {process.reference}</span>}
                </div>
              )}
            </div>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} processos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-theme px-2">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
