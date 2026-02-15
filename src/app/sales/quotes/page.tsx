"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Eye,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Rascunho", variant: "default" },
  SENT: { label: "Enviado", variant: "info" },
  VIEWED: { label: "Visualizado", variant: "purple" },
  ACCEPTED: { label: "Aceito", variant: "success" },
  REJECTED: { label: "Rejeitado", variant: "error" },
  EXPIRED: { label: "Expirado", variant: "warning" },
  CONVERTED: { label: "Convertido", variant: "indigo" },
};

export default function SalesQuotesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.salesQuotes.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter as "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED" : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos de Venda"
        icon={<FileText className="w-6 h-6" />}
        backHref="/sales"
        module="sales"
        actions={
          <LinkButton href="/sales/quotes/new" leftIcon={<Plus className="w-4 h-4" />}>
            Novo
          </LinkButton>
        }
      />

      <main className="max-w-7xl mx-auto">
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                placeholder="Buscar por cliente..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <NativeSelect
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="border border-theme-input rounded-lg px-3 py-2"
              >
                <option value="ALL">Todos</option>
                <option value="DRAFT">Rascunhos</option>
                <option value="SENT">Enviados</option>
                <option value="ACCEPTED">Aceitos</option>
                <option value="REJECTED">Rejeitados</option>
                <option value="CONVERTED">Convertidos</option>
              </NativeSelect>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.quotes.length ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhum orcamento encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Orcamento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Cliente</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Emissao</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Validade</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Itens</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.quotes.map((quote) => {
                      const config = statusConfig[quote.status] || statusConfig.DRAFT;
                      return (
                        <tr key={quote.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3 font-medium text-theme">#{quote.code}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <span className="text-sm">{quote.customer.companyName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">{formatDate(quote.issueDate)}</td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">{formatDate(quote.validUntil)}</td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">{quote._count.items}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-theme">{formatCurrency(quote.totalValue)}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <LinkButton
                              href={`/sales/quotes/${quote.id}`}
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
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">Pagina {page} de {data.pages}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page === data.pages}>
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
