"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Building2,
  Phone,
  Mail
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

interface Supplier {
  id: string;
  code: number;
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  isShared: boolean;
  qualityIndex: number | null;
}

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "BLOCKED" | undefined>();

  const { data, isLoading, error } = trpc.suppliers.list.useQuery({
    search: search || undefined,
    status: statusFilter,
    page,
    limit: 10,
  });

  const suppliers = (data?.suppliers ?? []) as Supplier[];
  const pagination = data?.pagination;

  const formatCNPJ = (cnpj: string | null) => {
    if (!cnpj) return "-";
    // Remove non-digits and format
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return cnpj;
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fornecedores" 
        icon={<Users className="w-6 h-6" />}
        module="SUPPLIERS"
        actions={
          <Link
            href="/suppliers/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Fornecedor</span>
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
              placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            <p className="text-red-400">Erro ao carregar fornecedores: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-3 text-zinc-400">Carregando fornecedores...</span>
            </div>
          </div>
        )}

        {/* Suppliers Table */}
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
                      Razão Social / Fantasia
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Cidade/UF
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      IQF
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                        Nenhum fornecedor encontrado.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {supplier.code}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-zinc-200 max-w-xs truncate">
                            {supplier.companyName}
                          </div>
                          {supplier.tradeName && (
                            <div className="text-xs text-zinc-500 truncate">
                              {supplier.tradeName}
                            </div>
                          )}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-zinc-400 font-mono">
                            {formatCNPJ(supplier.cnpj)}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-zinc-400">
                            {supplier.city && supplier.state 
                              ? `${supplier.city}/${supplier.state}`
                              : supplier.city || supplier.state || "-"}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {supplier.phone && (
                              <div className="flex items-center gap-1 text-xs text-zinc-400">
                                <Phone className="w-3 h-3" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1 text-xs text-zinc-400">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{supplier.email}</span>
                              </div>
                            )}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-xs text-zinc-500">-</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            supplier.status === "ACTIVE" 
                              ? "bg-green-900/50 text-green-400"
                              : supplier.status === "INACTIVE"
                              ? "bg-zinc-800 text-zinc-400"
                              : "bg-red-900/50 text-red-400"
                          }`}>
                            {supplier.status === "ACTIVE" ? "Ativo" : supplier.status === "INACTIVE" ? "Inativo" : "Bloqueado"}
                          </span>
                          {supplier.isShared && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-blue-400" title="Compartilhado">
                              <Building2 className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                        <td className="hidden xl:table-cell px-4 py-3 whitespace-nowrap">
                          {supplier.qualityIndex !== null ? (
                            <div className={`text-sm font-medium ${
                              supplier.qualityIndex >= 80 
                                ? "text-green-400" 
                                : supplier.qualityIndex >= 60 
                                ? "text-yellow-400" 
                                : "text-red-400"
                            }`}>
                              {supplier.qualityIndex.toFixed(1)}%
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/suppliers/${supplier.id}`}
                              className="p-1 text-zinc-500 hover:text-green-400 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/suppliers/${supplier.id}/edit`}
                              className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"
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
                  {pagination.total} fornecedores
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
