"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Layers,
  Search,
  Loader2,
  ChevronRight,
  Package,
  Plus,
} from "lucide-react";

export default function BomListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.bom.listProducts.useQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-theme flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Estrutura de Produto (BOM)
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto por código ou descrição..."
              className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !data?.products.length ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">
                Nenhum produto com estrutura
              </h3>
              <p className="text-theme-muted mb-4">
                Adicione componentes a um produto para criar sua estrutura.
              </p>
              <Link
                href="/materials"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Ir para Materiais
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-theme-table">
              {data.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/engineering/bom/${product.id}`}
                  className="flex items-center justify-between p-4 hover:bg-theme-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-theme">
                        {product.description}
                      </div>
                      <div className="text-sm text-theme-muted">
                        Código: {product.code} • {product.category?.name || "Sem categoria"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-theme">
                        {product.bomItemCount} componentes
                      </div>
                      <div className="text-xs text-theme-muted">
                        {product.unit}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-muted" />
                  </div>
                </Link>
              ))}
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
      </main>
    </div>
  );
}
