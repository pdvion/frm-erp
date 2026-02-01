"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  FileText,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  Package,
  Eye,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  VALIDATED: { label: "Validado", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-theme-tertiary text-theme-muted", icon: <XCircle className="w-4 h-4" /> },
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [xmlContent, setXmlContent] = useState("");

  const { data, isLoading, refetch } = trpc.receivedInvoices.list.useQuery({
    search: search || undefined,
    status: statusFilter ? (statusFilter as "PENDING" | "VALIDATED" | "APPROVED" | "REJECTED" | "CANCELLED") : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = trpc.receivedInvoices.stats.useQuery();

  const uploadMutation = trpc.receivedInvoices.uploadXml.useMutation({
    onSuccess: () => {
      setShowUploadModal(false);
      setXmlContent("");
      refetch();
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setXmlContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = () => {
    if (xmlContent) {
      uploadMutation.mutate({ xmlContent });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="NFe Recebidas"
        subtitle="Gerencie notas fiscais recebidas"
        icon={<FileText className="w-6 h-6" />}
        module="fiscal"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/invoices/pending"
              className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-blue-600 rounded-lg hover:bg-indigo-50"
            >
              <Clock className="w-4 h-4" />
            NFe Pendentes SEFAZ
            </Link>
            <Button
              onClick={() => setShowUploadModal(true)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
            Importar XML
            </Button>
          </div>
        }
      />

      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const stat = stats?.find((s) => s.status === status);
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  statusFilter === status
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-theme bg-theme-card hover:border-theme"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1 rounded ${config.color}`}>{config.icon}</span>
                  <span className="text-sm font-medium text-theme-secondary">{config.label}</span>
                </div>
                <div className="text-2xl font-bold text-theme">{stat?.count ?? 0}</div>
                <div className="text-sm text-theme-muted">{formatCurrency(stat?.total ?? 0)}</div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
              <Input
                placeholder="Buscar por chave, número ou fornecedor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter("")}
                className="px-4 py-2 text-sm text-theme-secondary hover:text-theme"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : data?.invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">Nenhuma NFe encontrada</h3>
              <p className="text-theme-muted mb-4">Importe um XML para começar</p>
              <Button
                onClick={() => setShowUploadModal(true)}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Importar XML
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Emissão
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Itens
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data?.invoices.map((invoice) => {
                      const config = statusConfig[invoice.status];
                      return (
                        <tr key={invoice.id} className="hover:bg-theme-hover">
                          <td className="px-6 py-4">
                            <div className="font-medium text-theme">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-theme-muted font-mono">
                              {invoice.accessKey.slice(0, 20)}...
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div className="font-medium text-theme">
                                  {invoice.supplier?.companyName || invoice.supplierName}
                                </div>
                                <div className="text-sm text-theme-muted">
                                  {invoice.supplierCnpj}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-theme-secondary">
                              <Calendar className="w-4 h-4 text-theme-muted" />
                              {formatDate(invoice.issueDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-theme">
                            {formatCurrency(invoice.totalInvoice)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-theme-secondary">
                              <Package className="w-4 h-4 text-theme-muted" />
                              {invoice._count.items}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg"
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
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Mostrando {(page - 1) * 20 + 1} a{" "}
                    {Math.min(page * 20, data.pagination.total)} de {data.pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="px-4 py-2 text-sm text-theme-secondary">
                      {page} / {data.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pagination.totalPages}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-xml-title"
          onKeyDown={(e) => e.key === "Escape" && setShowUploadModal(false)}
        >
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 id="upload-xml-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Importar XML NFe
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Arquivo XML
              </label>
              <input
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {xmlContent && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">XML carregado</span>
                </div>
                <div className="text-sm text-green-600 mt-1">
                  {xmlContent.length.toLocaleString()} caracteres
                </div>
              </div>
            )}

            {uploadMutation.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Erro ao importar</span>
                </div>
                <div className="text-sm text-red-600 mt-1">
                  {uploadMutation.error.message}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setXmlContent("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!xmlContent}
                isLoading={uploadMutation.isPending}
                className="flex-1"
              >
                {uploadMutation.isPending ? "Importando..." : "Importar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
