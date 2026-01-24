"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Building2,
  Package,
  FileText,
  AlertTriangle,
  Loader2,
  Play,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

export default function DeployAgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showPreview, setShowPreview] = useState(false);

  const { data, isLoading, error } = trpc.deployAgent.getImportDetails.useQuery({ id });

  const utils = trpc.useUtils();

  const previewMutation = trpc.deployAgent.previewImport.useMutation();

  const executeMutation = trpc.deployAgent.executeImport.useMutation({
    onSuccess: () => {
      utils.deployAgent.getImportDetails.invalidate({ id });
      utils.deployAgent.listPendingImports.invalidate();
      utils.deployAgent.getStats.invalidate();
    },
  });

  const rejectMutation = trpc.deployAgent.rejectImport.useMutation({
    onSuccess: () => {
      router.push("/fiscal/deploy-agent");
    },
  });

  const handlePreview = async () => {
    await previewMutation.mutateAsync({
      invoiceId: id,
      importSuppliers: true,
      importMaterials: true,
    });
    setShowPreview(true);
  };

  const handleExecute = async () => {
    await executeMutation.mutateAsync({
      invoiceId: id,
      importSuppliers: true,
      importMaterials: true,
      updateIfExists: false,
    });
  };

  const handleReject = async () => {
    if (confirm("Tem certeza que deseja rejeitar esta importação?")) {
      await rejectMutation.mutateAsync({ invoiceId: id });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-theme p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error?.message || "NFe não encontrada"}
        </div>
      </div>
    );
  }

  const { invoice, suggestions } = data;

  return (
    <div className="min-h-screen bg-theme p-4 md:p-6">
      <PageHeader
        title={`NFe ${invoice.invoiceNumber}/${invoice.series}`}
        subtitle="Revisão de importação"
        icon={<Bot className="w-6 h-6" />}
      />

      <div className="mb-6">
        <Link
          href="/fiscal/deploy-agent"
          className="inline-flex items-center gap-2 px-4 py-2 bg-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dados da NFe
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-theme-muted">Número</p>
                <p className="text-sm font-medium text-theme">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-theme-muted">Série</p>
                <p className="text-sm font-medium text-theme">{invoice.series}</p>
              </div>
              <div>
                <p className="text-xs text-theme-muted">Data Emissão</p>
                <p className="text-sm font-medium text-theme">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-theme-muted">Valor Total</p>
                <p className="text-sm font-medium text-theme">{formatCurrency(invoice.totalInvoice)}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-theme">
              <p className="text-xs text-theme-muted mb-1">Chave de Acesso</p>
              <p className="text-xs font-mono text-theme bg-theme-input p-2 rounded">
                {invoice.accessKey}
              </p>
            </div>
          </div>

          {/* Supplier Suggestion */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Fornecedor
            </h2>

            {suggestions.supplier ? (
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    suggestions.supplier.exists ? "bg-green-500/10" : "bg-yellow-500/10"
                  }`}
                >
                  {suggestions.supplier.exists ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-theme">{invoice.supplierName}</p>
                  <p className="text-sm text-theme-muted">{invoice.supplierCnpj}</p>
                  <p
                    className={`text-sm mt-1 ${
                      suggestions.supplier.exists ? "text-green-500" : "text-yellow-500"
                    }`}
                  >
                    {suggestions.supplier.exists
                      ? "✓ Fornecedor já cadastrado"
                      : "⚠ Novo fornecedor será criado"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-theme-muted">Sem informações do fornecedor</p>
            )}
          </div>

          {/* Materials Suggestions */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Materiais ({suggestions.materials.length})
            </h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {suggestions.materials.map((material, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-theme-input rounded-lg"
                >
                  <div
                    className={`p-1.5 rounded ${
                      material.exists ? "bg-green-500/10" : "bg-yellow-500/10"
                    }`}
                  >
                    {material.exists ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme truncate">{material.name}</p>
                    <p className="text-xs text-theme-muted">Código: {material.code}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      material.exists
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {material.exists ? "Existente" : "Novo"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-theme flex gap-4 text-sm">
              <span className="text-green-500">
                {suggestions.materials.filter((m) => m.exists).length} existentes
              </span>
              <span className="text-yellow-500">
                {suggestions.materials.filter((m) => !m.exists).length} novos
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3">Status</h3>
            <div
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                invoice.status === "PENDING"
                  ? "bg-yellow-500/10 text-yellow-500"
                  : invoice.status === "APPROVED"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {invoice.status === "PENDING" && "Pendente de Revisão"}
              {invoice.status === "APPROVED" && "Aprovada"}
              {invoice.status === "REJECTED" && "Rejeitada"}
            </div>
          </div>

          {/* Preview */}
          {showPreview && previewMutation.data && (
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-sm font-medium text-theme-muted mb-3">Prévia da Importação</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Serão criados:</span>
                  <span className="text-green-500 font-medium">
                    {previewMutation.data.totalCreated}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Já existem:</span>
                  <span className="text-theme font-medium">
                    {previewMutation.data.totalSkipped}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {invoice.status === "PENDING" && (
            <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-3">
              <h3 className="text-sm font-medium text-theme-muted mb-3">Ações</h3>

              <button
                onClick={handlePreview}
                disabled={previewMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                {previewMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Simular Importação
              </button>

              <button
                onClick={handleExecute}
                disabled={executeMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {executeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Aprovar e Importar
              </button>

              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Rejeitar
              </button>
            </div>
          )}

          {/* Items Summary */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3">Itens da NFe</h3>
            <p className="text-2xl font-bold text-theme">{invoice.items.length}</p>
            <p className="text-sm text-theme-muted">produtos/serviços</p>
          </div>
        </div>
      </div>
    </div>
  );
}
