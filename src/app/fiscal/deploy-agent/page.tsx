"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Package,
  ArrowRight,
  RefreshCw,
  Eye,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

export default function DeployAgentPage() {
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | undefined>(
    "PENDING"
  );

  const { data: stats, isLoading: statsLoading } = trpc.deployAgent.getStats.useQuery();
  const { data: imports, isLoading, refetch } = trpc.deployAgent.listPendingImports.useQuery({
    status: statusFilter,
    limit: 50,
  });

  const utils = trpc.useUtils();

  const executeMutation = trpc.deployAgent.executeImport.useMutation({
    onSuccess: () => {
      utils.deployAgent.listPendingImports.invalidate();
      utils.deployAgent.getStats.invalidate();
    },
  });

  const rejectMutation = trpc.deployAgent.rejectImport.useMutation({
    onSuccess: () => {
      utils.deployAgent.listPendingImports.invalidate();
      utils.deployAgent.getStats.invalidate();
    },
  });

  const handleApprove = async (invoiceId: string) => {
    await executeMutation.mutateAsync({
      invoiceId,
      importSuppliers: true,
      importMaterials: true,
      updateIfExists: false,
    });
  };

  const handleReject = async (invoiceId: string) => {
    await rejectMutation.mutateAsync({ invoiceId });
  };

  return (
    <div className="min-h-screen bg-theme p-4 md:p-6">
      <PageHeader
        title="Deploy Agent"
        subtitle="Importação inteligente de XMLs fiscais"
        icon={<Bot className="w-6 h-6" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-theme-card rounded-lg p-4 border border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-theme-muted">Pendentes</p>
              <p className="text-xl font-bold text-theme">
                {statsLoading ? "-" : stats?.pending || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-lg p-4 border border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-theme-muted">Aprovadas</p>
              <p className="text-xl font-bold text-theme">
                {statsLoading ? "-" : stats?.approved || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-lg p-4 border border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-theme-muted">Rejeitadas</p>
              <p className="text-xl font-bold text-theme">
                {statsLoading ? "-" : stats?.rejected || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-lg p-4 border border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-theme-muted">Fornecedores</p>
              <p className="text-xl font-bold text-theme">
                {statsLoading ? "-" : stats?.totalSuppliers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-lg p-4 border border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-theme-muted">Materiais</p>
              <p className="text-xl font-bold text-theme">
                {statsLoading ? "-" : stats?.totalMaterials || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-theme-card rounded-lg p-4 border border-theme mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "PENDING"
                  ? "bg-yellow-500 text-white"
                  : "bg-theme-input text-theme-secondary hover:bg-theme-hover"
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "APPROVED"
                  ? "bg-green-500 text-white"
                  : "bg-theme-input text-theme-secondary hover:bg-theme-hover"
              }`}
            >
              Aprovadas
            </button>
            <button
              onClick={() => setStatusFilter("REJECTED")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "REJECTED"
                  ? "bg-red-500 text-white"
                  : "bg-theme-input text-theme-secondary hover:bg-theme-hover"
              }`}
            >
              Rejeitadas
            </button>
            <button
              onClick={() => setStatusFilter(undefined)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === undefined
                  ? "bg-blue-500 text-white"
                  : "bg-theme-input text-theme-secondary hover:bg-theme-hover"
              }`}
            >
              Todas
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Import List */}
      <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-hover">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                  NFe
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                  Fornecedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                  Data
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                  Valor
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-theme-muted">
                    Carregando...
                  </td>
                </tr>
              ) : imports?.invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-theme-muted">
                    Nenhuma NFe encontrada
                  </td>
                </tr>
              ) : (
                imports?.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-theme-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-theme-muted" />
                        <div>
                          <p className="text-sm font-medium text-theme">
                            {invoice.invoiceNumber}/{invoice.series}
                          </p>
                          <p className="text-xs text-theme-muted truncate max-w-[200px]">
                            {invoice.accessKey}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-theme">{invoice.supplierName}</p>
                        <p className="text-xs text-theme-muted">{invoice.supplierCnpj}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-theme">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-theme text-right font-medium">
                      {formatCurrency(invoice.totalInvoice)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {invoice.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                      {invoice.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Aprovada
                        </span>
                      )}
                      {invoice.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                          <XCircle className="w-3 h-3" />
                          Rejeitada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/fiscal/deploy-agent/${invoice.id}`}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {invoice.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(invoice.id)}
                              disabled={executeMutation.isPending}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Aprovar e importar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(invoice.id)}
                              disabled={rejectMutation.isPending}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Rejeitar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/fiscal/nfe/import"
          className="flex items-center justify-between p-4 bg-theme-card rounded-lg border border-theme hover:border-blue-500 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-theme">Importar XMLs</p>
              <p className="text-sm text-theme-muted">Upload manual de arquivos XML</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-theme-muted group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link
          href="/suppliers"
          className="flex items-center justify-between p-4 bg-theme-card rounded-lg border border-theme hover:border-blue-500 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-theme">Fornecedores</p>
              <p className="text-sm text-theme-muted">Gerenciar cadastro de fornecedores</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-theme-muted group-hover:text-blue-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
