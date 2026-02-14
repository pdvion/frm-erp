"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  FileSpreadsheet,
  Search,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "error" }> = {
  DRAFT: { label: "Rascunho", variant: "default" },
  POSTED: { label: "Efetivado", variant: "success" },
  REVERSED: { label: "Estornado", variant: "error" },
};

const statusOptions = [
  { value: "ALL", label: "Todos os status" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "POSTED", label: "Efetivado" },
  { value: "REVERSED", label: "Estornado" },
];

export default function AccountingEntriesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = trpc.accounting.listEntries.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? (statusFilter as "DRAFT" | "POSTED" | "REVERSED") : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lançamentos Contábeis"
        icon={<FileSpreadsheet className="w-6 h-6" />}
        backHref="/accounting"
        module="financeiro"
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <Input
              placeholder="Buscar por descrição ou documento..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-44">
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={statusOptions}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="error" title="Erro ao carregar lançamentos">{error.message}</Alert>
          </div>
        ) : !data?.entries?.length ? (
          <div className="text-center py-12">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhum lançamento encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Partidas</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.entries.map((entry) => {
                    const st = statusConfig[entry.status] ?? statusConfig.DRAFT;
                    const totalDebit = entry.items
                      .filter((i) => i.type === "DEBIT")
                      .reduce((sum, i) => sum + Number(i.amount), 0);
                    return (
                      <tr key={entry.id} className="hover:bg-theme-table-hover transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-theme">{entry.code}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-theme">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-theme">{entry.description}</div>
                          {entry.documentNumber && (
                            <div className="text-xs text-theme-muted">Doc: {entry.documentNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-theme">
                          {formatCurrency(totalDebit)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-theme-muted">
                          {entry._count.items}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href={`/accounting/entries/${entry.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                <div className="text-sm text-theme-muted">
                  Página {page} de {data.pagination.totalPages} ({data.pagination.total} lançamentos)
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setPage(page + 1)} disabled={page === data.pagination.totalPages}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
