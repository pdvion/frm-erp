"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Eye,
  Phone,
  Mail,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Badge, colorToVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "Novo", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  CONTACTED: { label: "Contatado", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  QUALIFIED: { label: "Qualificado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  PROPOSAL: { label: "Proposta", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  NEGOTIATION: { label: "Negociação", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  WON: { label: "Ganho", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  LOST: { label: "Perdido", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const sourceLabels: Record<string, string> = {
  WEBSITE: "Site",
  REFERRAL: "Indicação",
  COLD_CALL: "Prospecção",
  TRADE_SHOW: "Feira",
  SOCIAL_MEDIA: "Redes Sociais",
  EMAIL: "Email",
  OTHER: "Outros",
};

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.leads.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter as "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST" : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads / CRM"
        icon={<Users className="w-6 h-6" />}
        backHref="/sales"
        module="sales"
        actions={
          <Link
            href="/sales/leads/new"
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus className="w-4 h-4" />
            Novo Lead
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                placeholder="Buscar por empresa, contato ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <NativeSelect
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="NEW">Novos</option>
                <option value="CONTACTED">Contatados</option>
                <option value="QUALIFIED">Qualificados</option>
                <option value="PROPOSAL">Proposta</option>
                <option value="NEGOTIATION">Negociação</option>
                <option value="WON">Ganhos</option>
                <option value="LOST">Perdidos</option>
              </NativeSelect>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : !data?.leads.length ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhum lead encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Lead
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Contato
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Origem
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Valor Est.
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Prob.
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Previsão
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
                    {data.leads.map((lead) => {
                      const config = statusConfig[lead.status] || statusConfig.NEW;

                      return (
                        <tr key={lead.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3">
                            <div className="font-medium text-theme">{lead.companyName}</div>
                            <div className="text-xs text-theme-muted">{lead.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            {lead.contactName && (
                              <div className="text-sm text-theme">{lead.contactName}</div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-theme-muted">
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </span>
                              )}
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-theme-secondary">
                            {sourceLabels[lead.source] || lead.source}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 text-sm font-medium text-theme">
                              <DollarSign className="w-3 h-3 text-theme-muted" />
                              {formatCurrency(lead.estimatedValue)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                            {lead.probability}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                              <Calendar className="w-3 h-3 text-theme-muted" />
                              {formatDate(lead.expectedCloseDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={colorToVariant(config.color)}>
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/sales/leads/${lead.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
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
                    Página {page} de {data.pages} ({data.total} leads)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
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
