"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { CompanyBadge } from "@/components/ui/CompanyBadge";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Building2,
  Briefcase,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  VACATION: { label: "Férias", variant: "info" },
  LEAVE: { label: "Afastado", variant: "warning" },
  SUSPENDED: { label: "Suspenso", variant: "orange" },
  TERMINATED: { label: "Desligado", variant: "default" },
};

const contractLabels: Record<string, string> = {
  CLT: "CLT",
  PJ: "PJ",
  TEMPORARY: "Temporário",
  INTERN: "Estagiário",
  APPRENTICE: "Aprendiz",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const { showCompanyColumn } = useMultiTenant();

  const { data, isLoading } = trpc.hr.listEmployees.useQuery({
    search: search || undefined,
    status: statusFilter as "ACTIVE" | "VACATION" | "LEAVE" | "SUSPENDED" | "TERMINATED" | "ALL" | undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários"
        icon={<Users className="w-6 h-6" />}
        backHref="/hr"
        module="hr"
        actions={
          <Link href="/hr/employees/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Novo
            </Button>
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto">
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <Select
                value={statusFilter}
                onChange={(value) => { setStatusFilter(value); setPage(1); }}
                options={[
                  { value: "ALL", label: "Todos" },
                  { value: "ACTIVE", label: "Ativos" },
                  { value: "VACATION", label: "Férias" },
                  { value: "LEAVE", label: "Afastados" },
                  { value: "TERMINATED", label: "Desligados" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : !data?.employees.length ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhum funcionário encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Funcionário</th>
                      {showCompanyColumn && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Empresa</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Departamento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Cargo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Contrato</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Admissão</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.employees.map((emp) => {
                      const config = statusConfig[emp.status] || statusConfig.ACTIVE;
                      return (
                        <tr key={emp.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3">
                            <div className="font-medium text-theme">{emp.name}</div>
                            <div className="text-xs text-theme-muted">#{emp.code}</div>
                          </td>
                          {showCompanyColumn && (
                            <td className="px-4 py-3">
                              <CompanyBadge companyName={emp.company?.name} />
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              {emp.department?.name || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                              <Briefcase className="w-4 h-4 text-theme-muted" />
                              {emp.position?.name || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                            {contractLabels[emp.contractType] || emp.contractType}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                              <Calendar className="w-3 h-3" />
                              {formatDate(emp.hireDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={config.variant}>
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/hr/employees/${emp.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
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
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">Página {page} de {data.pages}</div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page - 1)} 
                      disabled={page === 1} 
                      aria-label="Página anterior"
                      type="button"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page + 1)} 
                      disabled={page === data.pages} 
                      aria-label="Próxima página"
                      type="button"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
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
