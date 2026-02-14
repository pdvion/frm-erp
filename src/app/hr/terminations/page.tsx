"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  UserMinus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const typeLabels: Record<string, string> = {
  RESIGNATION: "Pedido de Demissão",
  DISMISSAL_WITH_CAUSE: "Justa Causa",
  DISMISSAL_NO_CAUSE: "Sem Justa Causa",
  MUTUAL_AGREEMENT: "Acordo Mútuo",
  CONTRACT_END: "Fim de Contrato",
  RETIREMENT: "Aposentadoria",
  DEATH: "Falecimento",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme" },
  CALCULATED: { label: "Calculado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  APPROVED: { label: "Aprovado", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  PAID: { label: "Pago", color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  HOMOLOGATED: { label: "Homologado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function TerminationsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.terminations.list.useQuery({
    type: typeFilter as "RESIGNATION" | "DISMISSAL_WITH_CAUSE" | "DISMISSAL_NO_CAUSE" | "MUTUAL_AGREEMENT" | "CONTRACT_END" | "RETIREMENT" | "DEATH" | "ALL",
    status: statusFilter as "DRAFT" | "CALCULATED" | "APPROVED" | "PAID" | "HOMOLOGATED" | "CANCELLED" | "ALL",
    page,
    limit: 20,
  });

  const filteredTerminations = data?.terminations.filter((t) =>
    t.employee.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rescisões"
        subtitle="Gerenciamento de rescisões contratuais"
        icon={<UserMinus className="w-6 h-6" />}
        module="hr"
        actions={
          <Link href="/hr/terminations/new">
            <Button leftIcon={<Plus className="w-4 h-4" />} variant="destructive">
              Nova Rescisão
            </Button>
          </Link>
        }
      />

      <div className="bg-theme-card rounded-lg shadow">
        <div className="p-4 border-b border-theme">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por funcionário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={(value) => { setTypeFilter(value); setPage(1); }}
              options={[
                { value: "ALL", label: "Todos os Tipos" },
                { value: "RESIGNATION", label: "Pedido de Demissão" },
                { value: "DISMISSAL_WITH_CAUSE", label: "Justa Causa" },
                { value: "DISMISSAL_NO_CAUSE", label: "Sem Justa Causa" },
                { value: "MUTUAL_AGREEMENT", label: "Acordo Mútuo" },
                { value: "CONTRACT_END", label: "Fim de Contrato" },
                { value: "RETIREMENT", label: "Aposentadoria" },
                { value: "DEATH", label: "Falecimento" },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(value) => { setStatusFilter(value); setPage(1); }}
              options={[
                { value: "ALL", label: "Todos os Status" },
                { value: "DRAFT", label: "Rascunho" },
                { value: "CALCULATED", label: "Calculado" },
                { value: "APPROVED", label: "Aprovado" },
                { value: "PAID", label: "Pago" },
                { value: "HOMOLOGATED", label: "Homologado" },
                { value: "CANCELLED", label: "Cancelado" },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Funcionário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Data Desligamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Aviso Prévio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Total Bruto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Total Líquido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {filteredTerminations?.map((termination) => (
                  <tr key={termination.id} className="hover:bg-theme-hover">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-theme">
                      {termination.employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-theme-tertiary text-theme">
                        {typeLabels[termination.type] || termination.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                      {formatDate(termination.terminationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                      {termination.noticePeriodWorked ? (
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">Trabalhado</span>
                      ) : termination.noticePeriodIndemnity ? (
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Indenizado</span>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme">
                      {formatCurrency(termination.totalGross)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-theme">
                      {formatCurrency(termination.totalNet)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[termination.status as keyof typeof statusConfig]?.color}`}>
                        {statusConfig[termination.status as keyof typeof statusConfig]?.label || termination.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link href={`/hr/terminations/${termination.id}`} className="text-red-600 hover:text-red-800">
                        <Eye className="w-4 h-4 inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!filteredTerminations || filteredTerminations.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-theme-muted">
                      Nenhuma rescisão encontrada
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
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm text-theme-secondary">Página {page} de {data.pages}</span>
            <Button
              variant="ghost"
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
  );
}
