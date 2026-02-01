"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
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
      <PageHeader
        title="Clientes"
        subtitle="Gerencie seus clientes"
        icon={<Users className="w-6 h-6" />}
        module="sales"
        actions={
          <Link href="/customers/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Novo Cliente
            </Button>
          </Link>
        }
      />

      <div>
        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
              <Input
                placeholder="Buscar por nome, código, CNPJ ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <Select
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "Todos os status" },
                  { value: "ACTIVE", label: "Ativos" },
                  { value: "INACTIVE", label: "Inativos" },
                  { value: "BLOCKED", label: "Bloqueados" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : !data?.customers.length ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-theme-muted mb-4" />
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
                            <LinkButton
                              href={`/customers/${customer.id}`}
                              variant="ghost"
                              size="sm"
                              leftIcon={<Eye className="w-4 h-4" />}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Ver
                            </LinkButton>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
