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
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ExportButtons } from "@/components/ui/export-buttons";

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
        breadcrumbs={[
          { label: "Compras", href: "/purchase-orders" },
          { label: "Fornecedores" },
        ]}
        actions={
          <Link href="/suppliers/new">
            <Button leftIcon={<Plus className="w-5 h-5" />}>
              <span className="hidden sm:inline">Novo Fornecedor</span>
            </Button>
          </Link>
        }
      />

      {/* Main Content */}
      <div>
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <select
              value={statusFilter ?? ""}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter || undefined);
                setPage(1);
              }}
              className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="BLOCKED">Bloqueados</option>
            </select>
          </div>

          {/* Export Buttons */}
          <ExportButtons
            filename="fornecedores"
            title="Lista de Fornecedores"
            columns={[
              { header: "Código", key: "code", width: 10 },
              { header: "Razão Social", key: "companyName", width: 40 },
              { header: "Nome Fantasia", key: "tradeName", width: 30 },
              { header: "CNPJ", key: "cnpj", width: 20 },
              { header: "Cidade", key: "city", width: 20 },
              { header: "UF", key: "state", width: 5 },
              { header: "Telefone", key: "phone", width: 15 },
              { header: "Email", key: "email", width: 30 },
              { header: "Status", key: "status", width: 10 },
            ]}
            data={suppliers as unknown as Record<string, unknown>[]}
            disabled={isLoading}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400">Erro ao carregar fornecedores: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <TableSkeleton rows={5} columns={6} />
        )}

        {/* Suppliers Table */}
        {!isLoading && !error && (
          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Razão Social / Fantasia
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Cidade/UF
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      IQF
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-theme-muted">
                        Nenhum fornecedor encontrado.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-theme-table-hover transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-theme">
                            {supplier.code}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-theme max-w-xs truncate">
                            {supplier.companyName}
                          </div>
                          {supplier.tradeName && (
                            <div className="text-xs text-theme-muted truncate">
                              {supplier.tradeName}
                            </div>
                          )}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-theme-secondary font-mono">
                            {formatCNPJ(supplier.cnpj)}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-theme-secondary">
                            {supplier.city && supplier.state 
                              ? `${supplier.city}/${supplier.state}`
                              : supplier.city || supplier.state || "-"}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {supplier.phone && (
                              <div className="flex items-center gap-1 text-xs text-theme-secondary">
                                <Phone className="w-3 h-3" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1 text-xs text-theme-secondary">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{supplier.email}</span>
                              </div>
                            )}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-xs text-theme-muted">-</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            supplier.status === "ACTIVE" 
                              ? "bg-green-900/50 text-green-400"
                              : supplier.status === "INACTIVE"
                                ? "bg-theme-secondary text-theme-secondary"
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
                            <span className="text-xs text-theme-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/suppliers/${supplier.id}`}
                              className="p-1 text-theme-muted hover:text-green-400 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/suppliers/${supplier.id}/edit`}
                              className="p-1 text-theme-muted hover:text-blue-400 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              className="p-1 text-theme-muted hover:text-red-400 transition-colors"
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
              <div className="px-4 py-3 border-t border-theme flex items-center justify-between">
                <div className="text-sm text-theme-secondary">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} fornecedores
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-theme rounded-lg text-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-theme-hover hover:text-theme transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-theme-secondary">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="p-2 border border-theme rounded-lg text-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-theme-hover hover:text-theme transition-colors"
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
