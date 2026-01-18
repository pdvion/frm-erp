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
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Fornecedores" 
        icon={<Users className="w-6 h-6 text-green-600" />}
        module="SUPPLIERS"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter ?? ""}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter || undefined);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="BLOCKED">Bloqueados</option>
            </select>
          </div>

          {/* Add Button */}
          <Link
            href="/suppliers/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Fornecedor</span>
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar fornecedores: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Carregando fornecedores...</span>
            </div>
          </div>
        )}

        {/* Suppliers Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Razão Social / Fantasia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade/UF
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IQF
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        Nenhum fornecedor encontrado.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.code}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {supplier.companyName}
                          </div>
                          {supplier.tradeName && (
                            <div className="text-xs text-gray-500 truncate">
                              {supplier.tradeName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600 font-mono">
                            {formatCNPJ(supplier.cnpj)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {supplier.city && supplier.state 
                              ? `${supplier.city}/${supplier.state}`
                              : supplier.city || supplier.state || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {supplier.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{supplier.email}</span>
                              </div>
                            )}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            supplier.status === "ACTIVE" 
                              ? "bg-green-100 text-green-800"
                              : supplier.status === "INACTIVE"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {supplier.status === "ACTIVE" ? "Ativo" : supplier.status === "INACTIVE" ? "Inativo" : "Bloqueado"}
                          </span>
                          {supplier.isShared && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-blue-600" title="Compartilhado">
                              <Building2 className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {supplier.qualityIndex !== null ? (
                            <div className={`text-sm font-medium ${
                              supplier.qualityIndex >= 80 
                                ? "text-green-600" 
                                : supplier.qualityIndex >= 60 
                                ? "text-yellow-600" 
                                : "text-red-600"
                            }`}>
                              {supplier.qualityIndex.toFixed(1)}%
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/suppliers/${supplier.id}`}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/suppliers/${supplier.id}/edit`}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} fornecedores
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
