"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
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
  Phone,
  Mail,
  DollarSign,
  Calendar,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "Novo", color: "bg-blue-100 text-blue-800" },
  CONTACTED: { label: "Contatado", color: "bg-yellow-100 text-yellow-800" },
  QUALIFIED: { label: "Qualificado", color: "bg-purple-100 text-purple-800" },
  PROPOSAL: { label: "Proposta", color: "bg-indigo-100 text-indigo-800" },
  NEGOTIATION: { label: "Negociação", color: "bg-orange-100 text-orange-800" },
  WON: { label: "Ganho", color: "bg-green-100 text-green-800" },
  LOST: { label: "Perdido", color: "bg-red-100 text-red-800" },
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

  const { data, isLoading } = trpc.sales.listLeads.useQuery({
    search: search || undefined,
    status: statusFilter as "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST" | "ALL" | undefined,
    page,
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/sales" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-600" />
                <h1 className="text-xl font-semibold text-gray-900">Leads / CRM</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/sales/leads/new"
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="w-4 h-4" />
                Novo Lead
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por empresa, contato ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="NEW">Novos</option>
                <option value="CONTACTED">Contatados</option>
                <option value="QUALIFIED">Qualificados</option>
                <option value="PROPOSAL">Proposta</option>
                <option value="NEGOTIATION">Negociação</option>
                <option value="WON">Ganhos</option>
                <option value="LOST">Perdidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : !data?.leads.length ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum lead encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Lead
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contato
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Origem
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Valor Est.
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Prob.
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Previsão
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.leads.map((lead) => {
                      const config = statusConfig[lead.status] || statusConfig.NEW;

                      return (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{lead.companyName}</div>
                            <div className="text-xs text-gray-500">{lead.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            {lead.contactName && (
                              <div className="text-sm text-gray-900">{lead.contactName}</div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
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
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {sourceLabels[lead.source] || lead.source}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 text-sm font-medium text-gray-900">
                              <DollarSign className="w-3 h-3 text-gray-400" />
                              {formatCurrency(lead.estimatedValue)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {lead.probability}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {formatDate(lead.expectedCloseDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Página {page} de {data.pages} ({data.total} leads)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
