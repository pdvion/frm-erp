"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { KanbanBoard, KanbanCard, ViewToggle } from "@/components/ui";
import type { KanbanColumn } from "@/components/ui";
import {
  ShoppingCart,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  AlertCircle,
  Filter,
  Package,
  FileText,
  Calendar,
} from "lucide-react";
import { Badge, colorToVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-secondary text-theme-muted", icon: <FileText className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <CheckCircle className="w-4 h-4" /> },
  SENT: { label: "Enviado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: <Truck className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: <Package className="w-4 h-4" /> },
  COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle className="w-4 h-4" /> },
};

const statusColors: Record<string, string> = {
  DRAFT: "#9CA3AF",
  PENDING: "#F59E0B",
  APPROVED: "#3B82F6",
  SENT: "#8B5CF6",
  PARTIAL: "#F97316",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
};

interface PurchaseOrder {
  id: string;
  code: number;
  status: string;
  createdAt: Date | string;
  totalValue: number;
  supplier: {
    code: number;
    companyName: string;
    tradeName: string | null;
  };
  _count: {
    items: number;
  };
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "kanban">("list");

  const { data, isLoading, error, refetch } = trpc.purchaseOrders.list.useQuery({
    search: search || undefined,
    status: statusFilter ? (statusFilter as "DRAFT" | "PENDING" | "APPROVED" | "SENT" | "PARTIAL" | "COMPLETED" | "CANCELLED") : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = trpc.purchaseOrders.stats.useQuery();


  // Prepare Kanban columns
  const kanbanColumns = useMemo((): KanbanColumn<PurchaseOrder>[] => {
    if (!data?.orders) return [];

    const statusOrder = ["DRAFT", "PENDING", "APPROVED", "SENT", "PARTIAL", "COMPLETED"];
    
    return statusOrder.map((status) => ({
      id: status,
      title: statusConfig[status]?.label || status,
      color: statusColors[status] || "#6B7280",
      items: data.orders.filter((o) => o.status === status) as PurchaseOrder[],
    }));
  }, [data]);

  const handleCardClick = (order: PurchaseOrder) => {
    router.push(`/purchase-orders/${order.id}`);
  };

  const updateStatusMutation = trpc.purchaseOrders.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCardMove = (itemId: string, _fromColumnId: string, toColumnId: string) => {
    const validStatuses = ["DRAFT", "PENDING", "APPROVED", "SENT", "PARTIAL", "COMPLETED", "CANCELLED"] as const;
    if (validStatuses.includes(toColumnId as typeof validStatuses[number])) {
      updateStatusMutation.mutate({
        id: itemId,
        status: toColumnId as typeof validStatuses[number],
      });
    }
  };

  const renderOrderCard = ({ item }: { item: PurchaseOrder }) => (
    <KanbanCard
      title={`#${item.code.toString().padStart(6, "0")}`}
      subtitle={item.supplier.tradeName || item.supplier.companyName}
      footer={
        <div className="flex items-center justify-between text-xs text-theme-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(item.createdAt)}
          </span>
          <span className="font-medium text-white">
            {formatCurrency(item.totalValue)}
          </span>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pedidos de Compra" 
        icon={<ShoppingCart className="w-6 h-6" />}
        module="QUOTES"
        breadcrumbs={[
          { label: "Compras" },
          { label: "Pedidos de Compra" },
        ]}
      >
        <Link href="/purchase-orders/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Novo Pedido
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-theme-card rounded-lg p-4 border border-theme">
            <div className="text-2xl font-bold text-theme">{stats.total}</div>
            <div className="text-sm text-theme-secondary">Total</div>
          </div>
          {stats.byStatus.map((s) => {
            const config = statusConfig[s.status];
            return (
              <div
                key={s.status}
                className={`bg-theme-card rounded-lg p-4 border cursor-pointer transition-colors ${statusFilter === s.status ? "border-teal-500" : "border-theme hover:border-theme-hover"}`}
                onClick={() => setStatusFilter(statusFilter === s.status ? "" : s.status)}
              >
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded ${config.color}`}>
                    {config.icon}
                  </span>
                  <div className="text-xl font-bold text-theme">{s.count}</div>
                </div>
                <div className="text-sm text-theme-secondary">{config.label}</div>
                <div className="text-xs text-theme-muted mt-1">
                  {formatCurrency(s.totalValue)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
            <Input
              placeholder="Buscar por fornecedor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              placeholder="Todos os status"
              options={[
                { value: "", label: "Todos os status" },
                ...Object.entries(statusConfig).map(([key, config]) => ({
                  value: key,
                  label: config.label,
                })),
              ]}
            />
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-600 dark:text-red-400">Erro ao carregar pedidos</span>
        </div>
      ) : data?.orders.length === 0 ? (
        <div className="bg-theme-card rounded-lg border border-theme p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-theme-secondary mb-4">
            {search || statusFilter
              ? "Tente ajustar os filtros de busca"
              : "Comece criando seu primeiro pedido de compra"}
          </p>
          <Link
            href="/purchase-orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            Novo Pedido
          </Link>
        </div>
      ) : view === "kanban" ? (
        /* Kanban View */
        <KanbanBoard
          columns={kanbanColumns}
          renderCard={renderOrderCard}
          onCardClick={handleCardClick}
          onCardMove={handleCardMove}
          emptyMessage="Nenhum pedido encontrado"
        />
      ) : (
        <>
          {/* Table View */}
          <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-table-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Fornecedor
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Data
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Cotação
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Itens
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data?.orders.map((order) => {
                    const config = statusConfig[order.status];
                    return (
                      <tr key={order.id} className="hover:bg-theme-table-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-medium text-theme">
                          PC-{order.code.toString().padStart(6, "0")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-theme">
                            {order.supplier.tradeName || order.supplier.companyName}
                          </div>
                          <div className="text-sm text-theme-muted">
                          Cód: {order.supplier.code}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                          {formatDate(order.orderDate)}
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                          {order.quote ? (
                            <Link
                              href={`/quotes/${order.quote.id}`}
                              className="text-sm text-blue-400 hover:text-blue-300 font-mono"
                            >
                            #{order.quote.code.toString().padStart(6, "0")}
                            </Link>
                          ) : (
                            <span className="text-sm text-theme-muted">-</span>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                          {order._count.items} {order._count.items === 1 ? "item" : "itens"}
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-theme">
                            {formatCurrency(order.totalValue)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={colorToVariant(config.color)}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/purchase-orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-teal-400 hover:text-teal-300 hover:bg-teal-900/20 rounded-lg transition-colors"
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
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-theme-secondary">
                Mostrando {((page - 1) * 20) + 1} a{" "}
                {Math.min(page * 20, data.pagination.total)} de{" "}
                {data.pagination.total} pedidos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="px-4 py-2 text-sm text-theme-secondary">
                  {page} / {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.totalPages}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
