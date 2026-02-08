"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Package, 
  Plus, 
  Filter, 
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Building2,
  X,
  HardHat,
  FileText,
  Barcode,
  Factory,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CompanyBadge } from "@/components/ui/CompanyBadge";
import { SemanticSearch } from "@/components/SemanticSearch";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useMultiTenant } from "@/hooks/useMultiTenant";

function MaterialsContent() {
  const router = useRouter();
  const { filters, setFilter, setFilters, resetFilters } = useUrlFilters({
    defaults: { page: 1, search: "", status: undefined },
  });
  const { showCompanyColumn } = useMultiTenant();

  const handleSemanticSelect = useCallback(
    (entity: { id: string }) => {
      router.push(`/materials/${entity.id}`);
    },
    [router]
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      setFilters({ search: query, page: 1 });
    },
    [setFilters]
  );

  const search = (filters.search as string) || "";
  const page = (filters.page as number) || 1;
  const statusFilter = filters.status as "ACTIVE" | "INACTIVE" | "BLOCKED" | undefined;

  const hasActiveFilters = search || statusFilter;

  const { data, isLoading, error } = trpc.materials.list.useQuery({
    search: search || undefined,
    status: statusFilter,
    page,
    limit: 10,
  });

  const materials = data?.materials ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Materiais" 
        icon={<Package className="w-6 h-6" />}
        module="MATERIALS"
        breadcrumbs={[
          { label: "Compras", href: "/purchase-orders" },
          { label: "Materiais" },
        ]}
        actions={
          <Link href="/materials/new">
            <Button leftIcon={<Plus className="w-5 h-5" />}>
              <span className="hidden sm:inline">Novo Material</span>
            </Button>
          </Link>
        }
      />

      {/* Main Content */}
      <div>
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search — semantic when embeddings available, text fallback otherwise */}
          <SemanticSearch
            entityType="material"
            onSelect={handleSemanticSelect}
            onQueryChange={handleQueryChange}
            placeholder="Buscar materiais..."
            className="flex-1"
          />

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <Select
              value={statusFilter ?? ""}
              onChange={(value) => {
                setFilters({ status: (value as "ACTIVE" | "INACTIVE" | "BLOCKED") || undefined, page: 1 });
              }}
              placeholder="Todos os status"
              options={[
                { value: "", label: "Todos os status" },
                { value: "ACTIVE", label: "Ativos" },
                { value: "INACTIVE", label: "Inativos" },
                { value: "BLOCKED", label: "Bloqueados" },
              ]}
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                leftIcon={<X className="w-4 h-4" />}
                title="Limpar filtros"
              >
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">Erro ao carregar materiais: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-theme-card rounded-xl border border-theme p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-theme-secondary">Carregando materiais...</span>
            </div>
          </div>
        )}

        {/* Materials Table */}
        {!isLoading && !error && (
          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Código
                    </th>
                    {showCompanyColumn && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                        Empresa
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Unidade
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Compartilhado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-theme-muted">
                        Nenhum material encontrado.
                      </td>
                    </tr>
                  ) : (
                    materials.map((material: typeof materials[number]) => (
                      <tr key={material.id} className="hover:bg-theme-table-hover transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-theme">
                            {material.code}
                          </div>
                          {material.internalCode && (
                            <div className="text-xs text-theme-muted">
                              {material.internalCode}
                            </div>
                          )}
                        </td>
                        {showCompanyColumn && (
                          <td className="px-4 py-3">
                            <CompanyBadge companyName={material.company?.name} />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="text-sm text-theme max-w-xs truncate">
                            {material.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {material.isEpi && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700" title="EPI">
                                <HardHat className="w-3 h-3" />
                                EPI
                              </span>
                            )}
                            {material.requiresQualityCheck && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700" title="Requer IQF">
                                <FileText className="w-3 h-3" />
                                IQF
                              </span>
                            )}
                            {material.barcode && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-theme-tertiary text-theme-secondary" title={material.barcode}>
                                <Barcode className="w-3 h-3" />
                              </span>
                            )}
                            {material.manufacturer && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700" title={material.manufacturer}>
                                <Factory className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-theme-secondary">
                            {material.category?.name ?? "-"}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-theme-secondary">
                            {material.unit}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            material.status === "ACTIVE" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                              : material.status === "INACTIVE"
                                ? "bg-theme-secondary text-theme-secondary"
                                : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400"
                          }`}>
                            {material.status === "ACTIVE" ? "Ativo" : material.status === "INACTIVE" ? "Inativo" : "Bloqueado"}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap">
                          {material.isShared ? (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                              <Building2 className="w-3 h-3" />
                              Sim
                            </span>
                          ) : (
                            <span className="text-xs text-theme-muted">Não</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/materials/${material.id}`}
                              className="p-1 text-theme-muted hover:text-blue-400 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/materials/${material.id}/edit`}
                              className="p-1 text-theme-muted hover:text-green-400 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 text-theme-muted hover:text-red-400"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
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
                  {pagination.total} materiais
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter("page", page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-theme-secondary">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter("page", page + 1)}
                    disabled={page === pagination.totalPages}
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

export default function MaterialsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <MaterialsContent />
    </Suspense>
  );
}
