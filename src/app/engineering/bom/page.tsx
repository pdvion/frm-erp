"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader
        title="Estrutura de Produto (BOM)"
        icon={<Layers className="w-6 h-6" />}
        module="engineering"
      />

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
              className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.products.length ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">
                Nenhum produto com estrutura
              </h3>
              <p className="text-theme-muted mb-4">
                Adicione componentes a um produto para criar sua estrutura.
              </p>
              <Link
                href="/materials"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                      <Package className="w-5 h-5 text-blue-600" />
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= data.total}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
