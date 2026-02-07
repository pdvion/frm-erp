"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "PAID" | undefined;

export default function ApprovalsHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.approvals.listRequests.useQuery({
    status: statusFilter,
    search: search || undefined,
    page,
    limit: 20,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
      APPROVED: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      CANCELLED: "bg-theme-tertiary text-theme-secondary dark:text-theme-muted",
      PAID: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    };
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      APPROVED: "Aprovado",
      REJECTED: "Rejeitado",
      CANCELLED: "Cancelado",
      PAID: "Pago",
    };
    const icons: Record<string, React.ReactNode> = {
      PENDING: <Clock className="w-3 h-3" />,
      APPROVED: <CheckCircle2 className="w-3 h-3" />,
      REJECTED: <XCircle className="w-3 h-3" />,
      CANCELLED: <XCircle className="w-3 h-3" />,
      PAID: <CheckCircle2 className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${styles[status] || styles.PENDING}`}>
        {icons[status]}
        {labels[status] || status}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      URGENT: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      HIGH: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      NORMAL: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      LOW: "bg-theme-tertiary text-theme-secondary dark:text-theme-muted",
    };
    const labels: Record<string, string> = {
      URGENT: "Urgente",
      HIGH: "Alta",
      NORMAL: "Normal",
      LOW: "Baixa",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[urgency] || styles.NORMAL}`}>
        {labels[urgency] || urgency}
      </span>
    );
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: undefined, label: "Todos" },
    { value: "PENDING", label: "Pendentes" },
    { value: "APPROVED", label: "Aprovados" },
    { value: "REJECTED", label: "Rejeitados" },
    { value: "CANCELLED", label: "Cancelados" },
    { value: "PAID", label: "Pagos" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Aprovações"
        icon={<History className="w-6 h-6" />}
        module="TREASURY"
        breadcrumbs={[
          { label: "Tesouraria", href: "/treasury" },
          { label: "Aprovações", href: "/treasury/approvals" },
          { label: "Histórico" },
        ]}
      />

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por código ou fornecedor..."
                className="pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme w-72"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <NativeSelect
                value={statusFilter || ""}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter || undefined);
                  setPage(1);
                }}
                className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value || ""}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          <Button
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-secondary transition-colors"
            onClick={() => {
              // TODO: Implementar exportação
              toast.info("Exportação em desenvolvimento");
            }}
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Fornecedor
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Solicitante
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Data
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                  Urgência
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-theme-muted">
                  Valor
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Nível Atual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-theme-muted">
                    Carregando...
                  </td>
                </tr>
              ) : !data?.requests || data.requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-theme-muted">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                data.requests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-theme-secondary transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-theme">
                        #{request.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme">
                          {request.payable?.supplier?.companyName || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme text-sm">
                          {request.requester?.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme text-sm">
                          {formatDateTime(request.requestedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getUrgencyBadge(request.urgency)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-theme">
                      {formatCurrency(Number(request.amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-muted">
                      {request.currentLevel?.name || "—"}
                      {request._count.approvals > 0 && (
                        <span className="ml-1 text-xs">
                          ({request._count.approvals} aprovação(ões))
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
            <p className="text-sm text-theme-muted">
              Mostrando página {page} de {data.pages} ({data.total} registros)
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-theme rounded-lg text-theme hover:bg-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="flex items-center gap-1 px-3 py-1.5 border border-theme rounded-lg text-theme hover:bg-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/treasury/approvals"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para Aprovações
        </Link>
        <Link
          href="/treasury/approvals/my-pending"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Minhas Pendências →
        </Link>
      </div>
    </div>
  );
}
