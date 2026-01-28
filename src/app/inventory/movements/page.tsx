"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  History, 
  ChevronLeft, 
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Filter
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/formatters";

const movementTypeConfig = {
  ENTRY: { label: "Entrada", color: "bg-green-100 text-green-800", icon: ArrowDownCircle },
  EXIT: { label: "Saída", color: "bg-red-100 text-red-800", icon: ArrowUpCircle },
  TRANSFER: { label: "Transferência", color: "bg-blue-100 text-blue-800", icon: RefreshCw },
  ADJUSTMENT: { label: "Ajuste", color: "bg-yellow-100 text-yellow-800", icon: RefreshCw },
  RETURN: { label: "Devolução", color: "bg-purple-100 text-purple-800", icon: ArrowDownCircle },
  PRODUCTION: { label: "Produção", color: "bg-orange-100 text-orange-800", icon: RefreshCw },
};

export default function MovementsHistoryPage() {
  const [page, setPage] = useState(1);
  const [movementType, setMovementType] = useState<string | undefined>();

  const { data, isLoading, error } = trpc.inventory.listMovements.useQuery({
    movementType: movementType as keyof typeof movementTypeConfig | undefined,
    page,
    limit: 20,
  });

  const movements = data?.movements ?? [];
  const pagination = data?.pagination;


  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <History className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-theme">Histórico de Movimentações</h1>
          <p className="text-sm text-theme-muted">Todas as movimentações de estoque</p>
        </div>
      </div>

      <div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <label htmlFor="movement-type-filter" className="sr-only">Filtrar por tipo de movimento</label>
            <select
              id="movement-type-filter"
              value={movementType ?? ""}
              onChange={(e) => {
                setMovementType(e.target.value || undefined);
                setPage(1);
              }}
              aria-label="Filtrar por tipo de movimento"
              className="px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos os tipos</option>
              <option value="ENTRY">Entrada</option>
              <option value="EXIT">Saída</option>
              <option value="TRANSFER">Transferência</option>
              <option value="ADJUSTMENT">Ajuste</option>
              <option value="RETURN">Devolução</option>
              <option value="PRODUCTION">Produção</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar movimentações: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-theme-card rounded-xl border border-theme p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-theme-secondary">Carregando movimentações...</span>
            </div>
          </div>
        )}

        {/* Movements Table */}
        {!isLoading && !error && (
          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Custo Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Documento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-theme-muted">
                        Nenhuma movimentação encontrada.
                      </td>
                    </tr>
                  ) : (
                    movements.map((movement) => {
                      const config = movementTypeConfig[movement.movementType as keyof typeof movementTypeConfig];
                      const Icon = config?.icon ?? RefreshCw;
                      const isEntry = movement.movementType === "ENTRY" || movement.movementType === "RETURN";
                      
                      return (
                        <tr key={movement.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-theme">
                              {formatDateTime(movement.movementDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color ?? "bg-theme-tertiary text-theme"}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {config?.label ?? movement.movementType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {movement.inventory?.material?.id ? (
                              <Link 
                                href={`/materials/${movement.inventory.material.id}`}
                                className="text-sm font-medium text-theme hover:text-indigo-600"
                              >
                                {movement.inventory.material.code ?? "—"} - {movement.inventory.material.description ?? "—"}
                              </Link>
                            ) : (
                              <span className="text-sm text-theme-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className={`text-sm font-medium ${isEntry ? "text-green-600" : "text-red-600"}`}>
                              {isEntry ? "+" : "-"}{formatNumber(movement.quantity)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-theme-secondary">
                              {formatCurrency(movement.unitCost)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-theme">
                              {formatCurrency(movement.totalCost)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-theme-secondary">
                              {movement.documentType && movement.documentNumber 
                                ? `${movement.documentType} ${movement.documentNumber}`
                                : "-"
                              }
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-theme flex items-center justify-between">
                <div className="text-sm text-theme-secondary">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} movimentações
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Página anterior"
                    className="p-2 border border-theme-input rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-theme-hover"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-theme-secondary">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    aria-label="Próxima página"
                    className="p-2 border border-theme-input rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-theme-hover"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
