"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Building2,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Factory,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  IN_PRODUCTION: { label: "Em Produção", color: "bg-purple-100 text-purple-800", icon: <Factory className="w-4 h-4" /> },
  READY: { label: "Pronto", color: "bg-indigo-100 text-indigo-800", icon: <Package className="w-4 h-4" /> },
  SHIPPED: { label: "Enviado", color: "bg-orange-100 text-orange-800", icon: <Truck className="w-4 h-4" /> },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function SalesOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.sales.listOrders.useQuery({
    search: search || undefined,
    status: statusFilter as "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "READY" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "ALL" | undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/sales" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-green-600" />
                <h1 className="text-xl font-semibold text-theme">Pedidos de Venda</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por cliente ou número da NF..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="PENDING">Pendentes</option>
                <option value="CONFIRMED">Confirmados</option>
                <option value="IN_PRODUCTION">Em Produção</option>
                <option value="READY">Prontos</option>
                <option value="SHIPPED">Enviados</option>
                <option value="DELIVERED">Entregues</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : !data?.orders.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-theme-muted">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Pedido
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Data
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Entrega
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Itens
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.orders.map((order) => {
                      const config = statusConfig[order.status] || statusConfig.PENDING;

                      return (
                        <tr key={order.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3">
                            <div className="font-medium text-theme">#{order.code}</div>
                            {order.invoiceNumber && (
                              <div className="text-xs text-theme-muted">NF: {order.invoiceNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div className="text-sm font-medium text-theme">
                                  {order.customer.companyName}
                                </div>
                                <div className="text-xs text-theme-muted">{order.customer.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                              <Calendar className="w-3 h-3 text-theme-muted" />
                              {formatDate(order.orderDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                            {formatDate(order.deliveryDate)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                            {order._count.items}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-theme">
                            {formatCurrency(order.totalValue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/sales/orders/${order.id}`}
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

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Página {page} de {data.pages} ({data.total} pedidos)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
