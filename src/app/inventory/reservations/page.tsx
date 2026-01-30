"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Package,
  Loader2,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Play,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE: { label: "Ativa", color: "bg-blue-100 text-blue-800", icon: <Clock className="w-4 h-4" /> },
  CONSUMED: { label: "Consumida", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  RELEASED: { label: "Liberada", color: "bg-theme-tertiary text-theme", icon: <XCircle className="w-4 h-4" /> },
  EXPIRED: { label: "Expirada", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="w-4 h-4" /> },
};

const documentTypeLabels: Record<string, string> = {
  REQUISITION: "Requisição",
  PRODUCTION_ORDER: "Ordem de Produção",
  SALES_ORDER: "Pedido de Venda",
};

export default function ReservationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, refetch } = trpc.inventory.listReservations.useQuery(
    statusFilter || documentTypeFilter
      ? {
        status: statusFilter ? statusFilter as "ACTIVE" | "CONSUMED" | "RELEASED" | "EXPIRED" : undefined,
        documentType: documentTypeFilter || undefined,
        page,
        limit: 20,
      }
      : { page, limit: 20 }
  );

  const [mutationError, setMutationError] = useState<string | null>(null);

  const releaseMutation = trpc.inventory.releaseReservation.useMutation({
    onSuccess: () => {
      setMutationError(null);
      refetch();
    },
    onError: (error) => {
      setMutationError(`Erro ao liberar reserva: ${error.message}`);
    },
  });

  const consumeMutation = trpc.inventory.consumeReservation.useMutation({
    onSuccess: () => {
      setMutationError(null);
      refetch();
    },
    onError: (error) => {
      setMutationError(`Erro ao consumir reserva: ${error.message}`);
    },
  });

  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas de Estoque"
        subtitle="Gerenciar reservas de materiais"
        icon={<Package className="w-6 h-6" />}
        module="inventory"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova Reserva
          </button>
        }
      />

      <div>
        {/* Erro de mutation */}
        {mutationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{mutationError}</p>
              <button 
                onClick={() => setMutationError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
                aria-label="Fechar mensagem de erro"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label htmlFor="status-filter" className="sr-only">Filtrar por status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrar por status"
                className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doctype-filter" className="sr-only">Filtrar por tipo de documento</label>
              <select
                id="doctype-filter"
                value={documentTypeFilter}
                onChange={(e) => setDocumentTypeFilter(e.target.value)}
                aria-label="Filtrar por tipo de documento"
                className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os tipos</option>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.reservations.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-theme-muted">Crie uma nova reserva para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Consumido
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.reservations.map((reservation) => {
                    const config = statusConfig[reservation.status] || statusConfig.ACTIVE;

                    return (
                      <tr key={reservation.id} className="hover:bg-theme-hover">
                        <td className="px-6 py-4 text-sm font-medium text-theme">
                          #{reservation.code}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-theme">
                            {reservation.material?.description}
                          </div>
                          <div className="text-sm text-theme-muted">
                            Cód: {reservation.material?.code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-theme">
                            {documentTypeLabels[reservation.documentType] || reservation.documentType}
                          </div>
                          {reservation.documentNumber && (
                            <div className="text-sm text-theme-muted">
                              #{reservation.documentNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-theme">
                            {formatNumber(reservation.quantity)} {reservation.material?.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-theme-secondary">
                            {formatNumber(reservation.consumedQty || 0)} {reservation.material?.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                            {config.icon}
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {reservation.status === "ACTIVE" && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => consumeMutation.mutate({ reservationId: reservation.id })}
                                disabled={consumeMutation.isPending}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                title="Consumir reserva"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => releaseMutation.mutate({ reservationId: reservation.id, reason: "Liberação manual" })}
                                disabled={releaseMutation.isPending}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Liberar reserva"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-theme-muted">
              Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.total)} de {data.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-theme-input rounded-lg disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= data.total}
                className="px-3 py-1 border border-theme-input rounded-lg disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateReservationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CreateReservationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [documentType, setDocumentType] = useState("REQUISITION");
  const [documentId, setDocumentId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const { data: materials } = trpc.materials.list.useQuery({
    search: search || undefined,
    limit: 10,
  });

  const createMutation = trpc.inventory.createReservation.useMutation({
    onSuccess,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-reserva"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 id="modal-title-reserva" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Nova Reserva de Estoque
        </h3>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Material</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar material..."
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {materials?.materials && materials.materials.length > 0 && search && (
              <div className="mt-1 border border-theme rounded-lg max-h-40 overflow-y-auto">
                {materials.materials.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => {
                      setMaterialId(mat.id);
                      setSearch(mat.description);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-theme-hover text-sm"
                  >
                    <span className="font-medium">{mat.code}</span> - {mat.description}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Quantidade</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Tipo de Documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">ID do Documento</label>
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="UUID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Número (opcional)</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: REQ-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {createMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {createMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              createMutation.mutate({
                materialId,
                quantity: parseFloat(quantity) || 0,
                documentType,
                documentId,
                documentNumber: documentNumber || undefined,
                notes: notes || undefined,
              })
            }
            disabled={!materialId || !quantity || !documentId || createMutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Criando..." : "Criar Reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
