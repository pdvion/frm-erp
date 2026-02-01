"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Globe,
  GlobeLock,
  Package,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

type ViewMode = "grid" | "list";
type ProductStatus = "draft" | "active" | "inactive" | "discontinued";

const STATUS_LABELS: Record<ProductStatus, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  active: { label: "Ativo", color: "bg-green-100 text-green-700" },
  inactive: { label: "Inativo", color: "bg-yellow-100 text-yellow-700" },
  discontinued: { label: "Descontinuado", color: "bg-red-100 text-red-700" },
};

export default function CatalogPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: productsData, isLoading: loadingProducts } =
    trpc.productCatalog.listProducts.useQuery({
      search: search || undefined,
      status: statusFilter || undefined,
      categoryId: categoryFilter || undefined,
      page,
      limit: 12,
    });

  const { data: categories } = trpc.productCatalog.listCategories.useQuery();
  const { data: stats } = trpc.productCatalog.getStats.useQuery();

  const utils = trpc.useUtils();

  
  const deleteMutation = trpc.productCatalog.deleteProduct.useMutation({
    onSuccess: () => {
      utils.productCatalog.listProducts.invalidate();
      utils.productCatalog.getStats.invalidate();
    },
  });

  const products = productsData?.products ?? [];
  const totalPages = productsData?.pagination?.totalPages ?? 1;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Catálogo de Produtos"
        subtitle="Gerencie os produtos do seu catálogo para vendas e e-commerce"
        actions={
          <button
            onClick={() => router.push("/catalog/new")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.totalProducts ?? 0}
          </div>
          <div className="text-sm text-gray-500">Total de Produtos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {stats?.publishedProducts ?? 0}
          </div>
          <div className="text-sm text-gray-500">Publicados</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.draftProducts ?? 0}
          </div>
          <div className="text-sm text-gray-500">Rascunhos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">
            {stats?.totalCategories ?? 0}
          </div>
          <div className="text-sm text-gray-500">Categorias</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-600"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 border rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-blue-50 border-blue-300 text-blue-600"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Grid3X3 size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 border rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-blue-50 border-blue-300 text-blue-600"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => router.push("/catalog/categories")}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
          >
            Categorias
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ProductStatus | "");
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700"
            >
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="discontinued">Descontinuado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700"
            >
              <option value="">Todas</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setStatusFilter("");
              setCategoryFilter("");
              setSearch("");
              setPage(1);
            }}
            className="self-end px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Products Grid/List */}
      {loadingProducts ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Package size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            {search || statusFilter || categoryFilter
              ? "Tente ajustar os filtros de busca"
              : "Comece criando seu primeiro produto"}
          </p>
          {!search && !statusFilter && !categoryFilter && (
            <button
              onClick={() => router.push("/catalog/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Criar Produto
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].thumbnailUrl || product.images[0].url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={48} className="text-gray-400" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      STATUS_LABELS[product.status as ProductStatus]?.color ?? "bg-gray-100"
                    }`}
                  >
                    {STATUS_LABELS[product.status as ProductStatus]?.label ?? product.status}
                  </span>
                </div>
                {/* Published Badge */}
                <div className="absolute top-2 right-2">
                  {product.isPublished ? (
                    <Globe size={18} className="text-green-600" />
                  ) : (
                    <GlobeLock size={18} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="text-xs text-gray-500 mb-1">{product.code}</div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {product.name}
                </h3>
                {product.shortDescription && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {product.shortDescription}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    {product.salePrice ? (
                      <div>
                        <span className="text-lg font-bold text-green-600">
                          R$ {product.salePrice.toFixed(2)}
                        </span>
                        {product.listPrice && (
                          <span className="text-sm text-gray-400 line-through ml-2">
                            R$ {product.listPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ) : product.listPrice ? (
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        R$ {product.listPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Sem preço</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => router.push(`/catalog/${product.id}`)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Visualizar"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => router.push(`/catalog/${product.id}/edit`)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Publicado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].thumbnailUrl || product.images[0].url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </div>
                        {product.category && (
                          <div className="text-xs text-gray-500">
                            {product.category.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.code}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        STATUS_LABELS[product.status as ProductStatus]?.color ?? "bg-gray-100"
                      }`}
                    >
                      {STATUS_LABELS[product.status as ProductStatus]?.label ?? product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {product.listPrice ? (
                      <span className="font-medium">R$ {product.listPrice.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.isPublished ? (
                      <span className="text-green-600 text-sm">Sim</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Não</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/catalog/${product.id}`)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Visualizar"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/catalog/${product.id}/edit`)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este produto?")) {
                            deleteMutation.mutate({ id: product.id });
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
