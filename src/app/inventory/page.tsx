"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Warehouse, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";

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
  RAW_MATERIAL: "bg-blue-100 text-blue-800",
  SEMI_FINISHED: "bg-yellow-100 text-yellow-800",
  FINISHED: "bg-green-100 text-green-800",
  CRITICAL: "bg-red-100 text-red-800",
  DEAD: "bg-gray-100 text-gray-800",
  SCRAP: "bg-orange-100 text-orange-800",
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const getStockStatus = (item: InventoryItem) => {
    const min = item.material.minQuantity ?? 0;
    const max = item.material.maxQuantity ?? Infinity;
    
    if (item.quantity <= 0) return { status: "empty", color: "text-red-600", icon: AlertTriangle };
    if (item.quantity < min) return { status: "low", color: "text-orange-600", icon: TrendingDown };
    if (item.quantity > max) return { status: "high", color: "text-blue-600", icon: TrendingUp };
    return { status: "ok", color: "text-green-600", icon: null };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Estoque</h1>
                <p className="text-sm text-gray-500">EST10 - Controle de Estoque</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por descrição ou código do material..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={inventoryType ?? ""}
              onChange={(e) => {
                setInventoryType(e.target.value || undefined);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Todos os tipos</option>
              <option value="RAW_MATERIAL">Matéria Prima</option>
              <option value="SEMI_FINISHED">Semi-Acabado</option>
              <option value="FINISHED">Acabado</option>
              <option value="CRITICAL">Crítico</option>
              <option value="DEAD">Morto</option>
              <option value="SCRAP">Sucata</option>
            </select>
          </div>

          {/* Below Minimum Filter */}
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={belowMinimum}
              onChange={(e) => {
                setBelowMinimum(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Abaixo do mínimo</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </label>

          {/* Movement Buttons */}
          <div className="flex gap-2">
            <Link
              href="/inventory/entry"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowDownCircle className="w-5 h-5" />
              <span>Entrada</span>
            </Link>
            <Link
              href="/inventory/exit"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowUpCircle className="w-5 h-5" />
              <span>Saída</span>
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar estoque: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Carregando estoque...</span>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reservado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disponível
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Custo Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Custo Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        Nenhum item de estoque encontrado.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.material.code} - {item.material.description}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.material.category?.name ?? "Sem categoria"} • {item.material.unit}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inventoryTypeColors[item.inventoryType]}`}>
                              {inventoryTypeLabels[item.inventoryType]}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className={`text-sm font-medium ${stockStatus.color}`}>
                              {formatNumber(item.quantity)}
                            </div>
                            {item.material.minQuantity && (
                              <div className="text-xs text-gray-400">
                                Mín: {formatNumber(item.material.minQuantity)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-600">
                              {formatNumber(item.reservedQty)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatNumber(item.availableQty)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-600">
                              {formatCurrency(item.unitCost)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.totalCost)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {stockStatus.icon && (
                              <stockStatus.icon className={`w-5 h-5 mx-auto ${stockStatus.color}`} />
                            )}
                            {!stockStatus.icon && (
                              <span className="text-green-600 text-sm">OK</span>
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
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} itens
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
