"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Building2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

export default function MaterialsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "BLOCKED" | undefined>();

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
        actions={
          <Link
            href="/materials/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Material</span>
          </Link>
        }
      />

      {/* Main Content */}
      <div>
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por descrição ou código..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-zinc-500" />
            <select
              value={statusFilter ?? ""}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter || undefined);
                setPage(1);
              }}
              className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="BLOCKED">Bloqueados</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400">Erro ao carregar materiais: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-zinc-400">Carregando materiais...</span>
            </div>
          </div>
        )}

        {/* Materials Table */}
        {!isLoading && !error && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Unidade
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Compartilhado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                        Nenhum material encontrado.
                      </td>
                    </tr>
                  ) : (
                    materials.map((material: typeof materials[number]) => (
                      <tr key={material.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {material.code}
                          </div>
                          {material.internalCode && (
                            <div className="text-xs text-zinc-500">
                              {material.internalCode}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-zinc-200 max-w-xs truncate">
                            {material.description}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-zinc-400">
                            {material.category?.name ?? "-"}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-zinc-400">
                            {material.unit}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            material.status === "ACTIVE" 
                              ? "bg-green-900/50 text-green-400"
                              : material.status === "INACTIVE"
                              ? "bg-zinc-800 text-zinc-400"
                              : "bg-red-900/50 text-red-400"
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
                            <span className="text-xs text-zinc-500">Não</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/materials/${material.id}`}
                              className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/materials/${material.id}/edit`}
                              className="p-1 text-zinc-500 hover:text-green-400 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
              <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} materiais
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-zinc-700 rounded-lg text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-zinc-400">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="p-2 border border-zinc-700 rounded-lg text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition-colors"
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
