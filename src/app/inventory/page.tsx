"use client";

import { useState } from "react";
import { 
  Warehouse, 
  Search, 
  Filter, 
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LinkButton } from "@/components/ui/LinkButton";

interface InventoryItem {
  id: string;
  materialId: string;
  inventoryType: "RAW_MATERIAL" | "SEMI_FINISHED" | "FINISHED" | "CRITICAL" | "DEAD" | "SCRAP";
  quantity: number;
  reservedQty: number;
  availableQty: number;
  unitCost: number;
  totalCost: number;
  lastMovementAt: string | null;
  material: {
    id: string;
    code: number;
    description: string;
    unit: string;
    minQuantity: number | null;
    maxQuantity: number | null;
    category: {
      id: string;
      name: string;
    } | null;
  };
}

const inventoryTypeLabels: Record<string, string> = {
  RAW_MATERIAL: "Matéria Prima",
  SEMI_FINISHED: "Semi-Acabado",
  FINISHED: "Acabado",
  CRITICAL: "Crítico",
  DEAD: "Morto",
  SCRAP: "Sucata",
};

const inventoryTypeColors: Record<string, string> = {
  RAW_MATERIAL: "bg-blue-500/20 text-blue-400",
  SEMI_FINISHED: "bg-yellow-500/20 text-yellow-400",
  FINISHED: "bg-green-500/20 text-green-400",
  CRITICAL: "bg-red-500/20 text-red-400",
  DEAD: "bg-theme-secondary0/20 text-theme-muted",
  SCRAP: "bg-orange-500/20 text-orange-400",
};

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inventoryType, setInventoryType] = useState<string | undefined>();
  const [belowMinimum, setBelowMinimum] = useState(false);

  const { data, isLoading, error } = trpc.inventory.list.useQuery({
    search: search || undefined,
    inventoryType: inventoryType as InventoryItem["inventoryType"] | undefined,
    belowMinimum,
    page,
    limit: 15,
  });

  const inventory = (data?.inventory ?? []) as InventoryItem[];
  const pagination = data?.pagination;

  const getStockStatus = (item: InventoryItem) => {
    const min = item.material.minQuantity ?? 0;
    const max = item.material.maxQuantity ?? Infinity;
    
    if (item.quantity <= 0) return { status: "empty", color: "text-red-600", icon: AlertTriangle };
    if (item.quantity < min) return { status: "low", color: "text-orange-600", icon: TrendingDown };
    if (item.quantity > max) return { status: "high", color: "text-blue-600", icon: TrendingUp };
    return { status: "ok", color: "text-green-600", icon: null };
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Estoque" 
        icon={<Warehouse className="w-6 h-6" />}
        module="INVENTORY"
      />

      {/* Main Content */}
      <div>
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
            <Input
              placeholder="Buscar por descrição ou código do material..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <Select
              value={inventoryType ?? ""}
              onChange={(value) => {
                setInventoryType(value || undefined);
                setPage(1);
              }}
              placeholder="Todos os tipos"
              options={[
                { value: "", label: "Todos os tipos" },
                { value: "RAW_MATERIAL", label: "Matéria Prima" },
                { value: "SEMI_FINISHED", label: "Semi-Acabado" },
                { value: "FINISHED", label: "Acabado" },
                { value: "CRITICAL", label: "Crítico" },
                { value: "DEAD", label: "Morto" },
                { value: "SCRAP", label: "Sucata" },
              ]}
            />
          </div>

          {/* Below Minimum Filter */}
          <label className="flex items-center gap-2 px-3 py-2 border border-theme-input rounded-lg cursor-pointer hover:bg-theme-hover">
            <input
              type="checkbox"
              checked={belowMinimum}
              onChange={(e) => {
                setBelowMinimum(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-theme-secondary">Abaixo do mínimo</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </label>

          {/* Movement Buttons */}
          <div className="flex gap-2">
            <LinkButton
              href="/inventory/movements"
              variant="outline"
            >
              Histórico
            </LinkButton>
            <LinkButton
              href="/inventory/entry"
              leftIcon={<ArrowDownCircle className="w-4 h-4" />}
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              Entrada
            </LinkButton>
            <LinkButton
              href="/inventory/exit"
              leftIcon={<ArrowUpCircle className="w-4 h-4" />}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              Saída
            </LinkButton>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">Erro ao carregar estoque: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {/* Inventory Table */}
        {!isLoading && !error && (
          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Material
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Reservado
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Disponível
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Custo Unit.
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Custo Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-theme-muted">
                        Nenhum item de estoque encontrado.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr key={item.id} className="hover:bg-theme-hover transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <div>
                                <div className="text-sm font-medium text-theme">
                                  {item.material.code} - {item.material.description}
                                </div>
                                <div className="text-xs text-theme-muted">
                                  {item.material.category?.name ?? "Sem categoria"} • {item.material.unit}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inventoryTypeColors[item.inventoryType]}`}>
                              {inventoryTypeLabels[item.inventoryType]}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className={`text-sm font-medium ${stockStatus.color}`}>
                              {formatNumber(item.quantity)}
                            </div>
                            {item.material.minQuantity && (
                              <div className="text-xs text-theme-muted">
                                Mín: {formatNumber(item.material.minQuantity)}
                              </div>
                            )}
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-theme-secondary">
                              {formatNumber(item.reservedQty)}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-theme">
                              {formatNumber(item.availableQty)}
                            </div>
                          </td>
                          <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-theme-secondary">
                              {formatCurrency(item.unitCost)}
                            </div>
                          </td>
                          <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-theme">
                              {formatCurrency(item.totalCost)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {stockStatus.icon && (
                              <stockStatus.icon className={`w-5 h-5 mx-auto ${stockStatus.color}`} />
                            )}
                            {!stockStatus.icon && (
                              <span className="text-green-500 text-sm">OK</span>
                            )}
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
                <div className="text-sm text-theme-muted">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} itens
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-theme-muted">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
