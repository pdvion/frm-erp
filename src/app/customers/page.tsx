"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Eye,
  Building2,
  Mail,
  Phone,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Ativo", color: "bg-green-100 text-green-800" },
  INACTIVE: { label: "Inativo", color: "bg-theme-tertiary text-theme-secondary" },
  BLOCKED: { label: "Bloqueado", color: "bg-red-100 text-red-800" },
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.customers.list.useQuery({
    search: search || undefined,
    status: statusFilter as "ACTIVE" | "INACTIVE" | "BLOCKED" | "ALL" | undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-theme">Clientes</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/customers/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por nome, código, CNPJ ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="ACTIVE">Ativos</option>
                <option value="INACTIVE">Inativos</option>
                <option value="BLOCKED">Bloqueados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.customers.length ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-theme-muted">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        CNPJ/CPF
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Contato
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Títulos
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.customers.map((customer) => {
                      const config = statusConfig[customer.status] || statusConfig.ACTIVE;

                      return (
                        <tr key={customer.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3 text-sm font-medium text-theme">
                            {customer.code}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div className="text-sm font-medium text-theme">
                                  {customer.companyName}
                                </div>
                                {customer.tradeName && (
                                  <div className="text-xs text-theme-muted">
                                    {customer.tradeName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-theme-secondary">
                            {customer.cnpj || customer.cpf || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center gap-1 text-xs text-theme-muted">
                                  <Mail className="w-3 h-3" />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center gap-1 text-xs text-theme-muted">
                                  <Phone className="w-3 h-3" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                            {customer._count.receivables}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/customers/${customer.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Página {page} de {data.pages} ({data.total} clientes)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
