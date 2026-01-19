"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
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

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800" },
  SENT: { label: "Enviado", color: "bg-blue-100 text-blue-800" },
  VIEWED: { label: "Visualizado", color: "bg-purple-100 text-purple-800" },
  ACCEPTED: { label: "Aceito", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Expirado", color: "bg-yellow-100 text-yellow-800" },
  CONVERTED: { label: "Convertido", color: "bg-indigo-100 text-indigo-800" },
};

export default function SalesQuotesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.sales.listQuotes.useQuery({
    search: search || undefined,
    status: statusFilter as "DRAFT" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED" | "ALL" | undefined,
    page,
    limit: 20,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/sales" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Orcamentos de Venda</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link href="/sales/quotes/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Novo
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="ALL">Todos</option>
                <option value="DRAFT">Rascunhos</option>
                <option value="SENT">Enviados</option>
                <option value="ACCEPTED">Aceitos</option>
                <option value="REJECTED">Rejeitados</option>
                <option value="CONVERTED">Convertidos</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.quotes.length ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum orcamento encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orcamento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Emissao</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Validade</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Itens</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.quotes.map((quote) => {
                      const config = statusConfig[quote.status] || statusConfig.DRAFT;
                      return (
                        <tr key={quote.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">#{quote.code}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{quote.customer.companyName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{formatDate(quote.issueDate)}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{formatDate(quote.validUntil)}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{quote._count.items}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(quote.totalValue)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/sales/quotes/${quote.id}`} className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">Pagina {page} de {data.pages}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setPage(page + 1)} disabled={page === data.pages} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
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
