"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Eye,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme", icon: <Clock className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  IN_TRANSIT: { label: "Em Trânsito", color: "bg-purple-100 text-purple-800", icon: <Truck className="w-4 h-4" /> },
  COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function TransfersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.transfers.list.useQuery({
    status: statusFilter !== "ALL" ? statusFilter as "PENDING" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED" : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <ArrowRightLeft className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme">Transferências de Estoque</h1>
            <p className="text-sm text-theme-muted">Movimentações entre locais</p>
          </div>
        </div>
        <Link
          href="/transfers/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Nova Transferência
        </Link>
      </div>

      <div>
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-theme-input rounded-lg px-3 py-2"
            >
              <option value="ALL">Todos os status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="PENDING">Pendentes</option>
              <option value="APPROVED">Aprovados</option>
              <option value="IN_TRANSIT">Em Trânsito</option>
              <option value="COMPLETED">Concluídos</option>
            </select>
          </div>
        </div>

        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : !data?.transfers.length ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhuma transferência encontrada</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Origem</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Destino</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Itens</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Data</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.transfers.map((transfer) => {
                      const config = statusConfig[transfer.status] || statusConfig.DRAFT;
                      return (
                        <tr key={transfer.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3 font-medium text-theme">#{transfer.code}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                              <MapPin className="w-4 h-4 text-red-400" />
                              {transfer.fromLocation.name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                              <MapPin className="w-4 h-4 text-green-400" />
                              {transfer.toLocation.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                              <Package className="w-3 h-3" />
                              {transfer._count.items}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                              <Calendar className="w-3 h-3" />
                              {formatDate(transfer.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/transfers/${transfer.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">Página {page} de {data.pages}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setPage(page + 1)} disabled={page === data.pages} className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
