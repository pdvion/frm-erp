"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Package,
  ChevronLeft,
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
  RELEASED: { label: "Liberada", color: "bg-gray-100 text-gray-800", icon: <XCircle className="w-4 h-4" /> },
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

  const releaseMutation = trpc.inventory.releaseReservation.useMutation({
    onSuccess: () => refetch(),
  });

  const consumeMutation = trpc.inventory.consumeReservation.useMutation({
    onSuccess: () => refetch(),
  });

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/inventory" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Reservas de Estoque
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova Reserva
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os status</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !data?.reservations.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-gray-500">Crie uma nova reserva para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Consumido
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.reservations.map((reservation) => {
                    const config = statusConfig[reservation.status] || statusConfig.ACTIVE;

                    return (
                      <tr key={reservation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          #{reservation.code}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {reservation.material?.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            Cód: {reservation.material?.code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {documentTypeLabels[reservation.documentType] || reservation.documentType}
                          </div>
                          {reservation.documentNumber && (
                            <div className="text-sm text-gray-500">
                              #{reservation.documentNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-gray-900">
                            {formatNumber(reservation.quantity)} {reservation.material?.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-600">
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
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.total)} de {data.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= data.total}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </main>

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Nova Reserva de Estoque
        </h3>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar material..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {materials?.materials && materials.materials.length > 0 && search && (
              <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {materials.materials.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => {
                      setMaterialId(mat.id);
                      setSearch(mat.description);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    <span className="font-medium">{mat.code}</span> - {mat.description}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID do Documento</label>
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="UUID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número (opcional)</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: REQ-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Criando..." : "Criar Reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
