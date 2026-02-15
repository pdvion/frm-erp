"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import {
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/Textarea";
import { Modal, ModalFooter } from "@/components/ui/Modal";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export default function TimeclockAdjustmentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [page, setPage] = useState(1);
  const [selectedAdjustment, setSelectedAdjustment] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data, isLoading, refetch } = trpc.timeclock.listAdjustments.useQuery({
    status: statusFilter,
    page,
    limit: 20,
  });

  const reviewMutation = trpc.timeclock.reviewAdjustment.useMutation({
    onSuccess: () => {
      setSelectedAdjustment(null);
      setReviewNotes("");
      refetch();
    },
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
      APPROVED: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      APPROVED: "Aprovado",
      REJECTED: "Rejeitado",
    };
    const icons: Record<string, React.ReactNode> = {
      PENDING: <AlertCircle className="w-3 h-3" />,
      APPROVED: <CheckCircle2 className="w-3 h-3" />,
      REJECTED: <XCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${styles[status] || styles.PENDING}`}>
        {icons[status]}
        {labels[status] || status}
      </span>
    );
  };

  const getAdjustmentTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      ADD: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      MODIFY: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      DELETE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };
    const labels: Record<string, string> = {
      ADD: "Inclusão",
      MODIFY: "Alteração",
      DELETE: "Exclusão",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[type] || styles.ADD}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getClockTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CLOCK_IN: "Entrada",
      CLOCK_OUT: "Saída",
      BREAK_START: "Início Intervalo",
      BREAK_END: "Fim Intervalo",
    };
    return labels[type] || type;
  };

  const handleReview = (approved: boolean) => {
    if (!selectedAdjustment) return;
    reviewMutation.mutate({
      id: selectedAdjustment,
      approved,
      notes: reviewNotes || undefined,
    });
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "PENDING", label: "Pendentes" },
    { value: "APPROVED", label: "Aprovados" },
    { value: "REJECTED", label: "Rejeitados" },
    { value: "ALL", label: "Todos" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajustes de Ponto"
        icon={<Edit className="w-6 h-6" />}
        module="HR"
        breadcrumbs={[
          { label: "RH", href: "/hr" },
          { label: "Ponto", href: "/hr/timeclock" },
          { label: "Ajustes" },
        ]}
      />

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-muted" />
            <span className="text-sm text-theme-muted">Status:</span>
          </div>
          <div className="flex gap-2">
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={statusFilter === opt.value ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Marcação
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Horário Original
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Novo Horário
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Motivo
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                  Ações
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
              ) : !data?.adjustments || data.adjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-theme-muted">
                    Nenhum ajuste encontrado
                  </td>
                </tr>
              ) : (
                data.adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-theme-secondary transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme">{formatDate(adj.date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getAdjustmentTypeBadge(adj.adjustmentType)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme text-sm">
                          {getClockTypeLabel(adj.clockType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-theme">
                      {formatTime(adj.originalTime)}
                    </td>
                    <td className="px-4 py-3 font-medium text-theme">
                      {formatTime(adj.newTime)}
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-muted max-w-xs truncate">
                      {adj.reason}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(adj.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {adj.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAdjustment(adj.id)}
                          className="text-sm text-blue-600 dark:text-blue-400"
                        >
                          Revisar
                        </Button>
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
              Página {page} de {data.pages} ({data.total} registros)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/hr/timeclock"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para Ponto Eletrônico
        </Link>
      </div>

      {/* Modal de revisão */}
      <Modal
        isOpen={!!selectedAdjustment}
        onClose={() => { setSelectedAdjustment(null); setReviewNotes(""); }}
        title="Revisar Ajuste de Ponto"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Observações (opcional)
            </label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              placeholder="Adicione observações sobre a revisão..."
              className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme resize-none"
            />
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => { setSelectedAdjustment(null); setReviewNotes(""); }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => handleReview(false)}
              disabled={reviewMutation.isPending}
            >
              Rejeitar
            </Button>
            <Button
              onClick={() => handleReview(true)}
              disabled={reviewMutation.isPending}
            >
              Aprovar
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
