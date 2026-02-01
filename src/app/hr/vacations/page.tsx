"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LinkButton } from "@/components/ui/LinkButton";

const statusConfig: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Programada", color: "bg-theme-tertiary text-theme" },
  APPROVED: { label: "Aprovada", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "Em Andamento", color: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Concluída", color: "bg-theme-tertiary text-theme-secondary" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800" },
};

export default function VacationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.vacations.list.useQuery({
    status: statusFilter as "SCHEDULED" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "ALL",
    year,
    page,
    limit: 20,
  });

  const { data: overdueEmployees } = trpc.vacations.listOverdue.useQuery();

  const filteredVacations = data?.vacations.filter((v) =>
    v.employee.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Férias"
        subtitle="Gerenciamento de férias dos funcionários"
        icon={<Calendar className="w-6 h-6" />}
        module="hr"
        actions={
          <LinkButton
            href="/hr/vacations/new"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Programar Férias
          </LinkButton>
        }
      />

      <div>
        {overdueEmployees && overdueEmployees.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
              <AlertTriangle className="w-5 h-5" />
            Férias Vencidas ou a Vencer
            </div>
            <p className="text-sm text-yellow-600">
              {overdueEmployees.length} funcionário(s) com férias pendentes
            </p>
          </div>
        )}

        <div className="bg-theme-card rounded-lg shadow">
          <div className="p-4 border-b border-theme">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-4 h-4 z-10" />
                <Input
                  placeholder="Buscar por funcionário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(value) => { setStatusFilter(value); setPage(1); }}
                options={[
                  { value: "ALL", label: "Todos os Status" },
                  { value: "SCHEDULED", label: "Programada" },
                  { value: "APPROVED", label: "Aprovada" },
                  { value: "IN_PROGRESS", label: "Em Andamento" },
                  { value: "COMPLETED", label: "Concluída" },
                  { value: "CANCELLED", label: "Cancelada" },
                ]}
              />
              <Select
                value={String(year)}
                onChange={(value) => { setYear(Number(value)); setPage(1); }}
                options={[2024, 2025, 2026, 2027].map((y) => ({
                  value: String(y),
                  label: String(y),
                }))}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Funcionário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Dias</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Abono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Valor Líquido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredVacations?.map((vacation) => (
                    <tr key={vacation.id} className="hover:bg-theme-hover">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-theme">
                        {vacation.employee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                        {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                        {vacation.enjoyedDays} dias
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                        {vacation.soldDays > 0 ? `${vacation.soldDays} dias` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme">
                        {formatCurrency(vacation.totalNet)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[vacation.status]?.color || "bg-theme-tertiary"}`}>
                          {statusConfig[vacation.status]?.label || vacation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/hr/vacations/${vacation.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!filteredVacations || filteredVacations.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-theme-muted">
                      Nenhuma férias encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-theme">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-sm text-theme-secondary">
              Página {page} de {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
