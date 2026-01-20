"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  FileText,
  ArrowLeft,
  RefreshCw,
  Download,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Ban,
} from "lucide-react";

type SituacaoNfe = "PENDENTE" | "PROCESSANDO" | "IMPORTADA" | "IGNORADA" | "ERRO";

const situacaoConfig: Record<SituacaoNfe, { label: string; color: string; icon: React.ReactNode }> = {
  PENDENTE: { label: "Pendente", color: "bg-amber-100 text-amber-800", icon: <Clock className="w-3 h-3" /> },
  PROCESSANDO: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  IMPORTADA: { label: "Importada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  IGNORADA: { label: "Ignorada", color: "bg-gray-100 text-gray-800", icon: <Ban className="w-3 h-3" /> },
  ERRO: { label: "Erro", color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-3 h-3" /> },
};

export default function PendingInvoicesPage() {
  const [situacaoFilter, setSituacaoFilter] = useState<SituacaoNfe | "">("");
  const [page, setPage] = useState(1);
  const [selectedNfe, setSelectedNfe] = useState<string | null>(null);
  const [ignoreMotivo, setIgnoreMotivo] = useState("");
  const [showIgnoreModal, setShowIgnoreModal] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.sefaz.listPendingNfes.useQuery({
    situacao: situacaoFilter || undefined,
    page,
    limit: 20,
  });

  const { data: syncStatus } = trpc.sefaz.status.useQuery();

  const syncMutation = trpc.sefaz.executarSincronizacao.useMutation({
    onSuccess: () => {
      utils.sefaz.listPendingNfes.invalidate();
    },
  });

  const importMutation = trpc.sefaz.importPendingNfe.useMutation({
    onSuccess: () => {
      utils.sefaz.listPendingNfes.invalidate();
    },
  });

  const ignoreMutation = trpc.sefaz.ignorePendingNfe.useMutation({
    onSuccess: () => {
      utils.sefaz.listPendingNfes.invalidate();
      setShowIgnoreModal(false);
      setSelectedNfe(null);
      setIgnoreMotivo("");
    },
  });

  const handleImport = (nfeId: string) => {
    importMutation.mutate({ pendingNfeId: nfeId });
  };

  const handleIgnore = () => {
    if (selectedNfe) {
      ignoreMutation.mutate({ pendingNfeId: selectedNfe, motivo: ignoreMotivo || undefined });
    }
  };

  const openIgnoreModal = (nfeId: string) => {
    setSelectedNfe(nfeId);
    setShowIgnoreModal(true);
  };

  const formatChaveAcesso = (chave: string) => {
    return chave.replace(/(\d{4})/g, "$1 ").trim();
  };

  const pendingCount = data?.nfes?.filter((n) => n.situacao === "PENDENTE").length || 0;
  const errorCount = data?.nfes?.filter((n) => n.situacao === "ERRO").length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/invoices"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Voltar para Notas Fiscais"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NFe Pendentes SEFAZ</h1>
            <p className="text-gray-600">Notas fiscais aguardando importação da SEFAZ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!syncStatus?.configured && (
            <Link
              href="/settings/sefaz"
              className="px-4 py-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Configurar SEFAZ
            </Link>
          )}
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !syncStatus?.configured}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sincronizar SEFAZ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Importadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.nfes?.filter((n) => n.situacao === "IMPORTADA").length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Com Erro</p>
              <p className="text-2xl font-bold text-gray-900">{errorCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
          </div>

          <select
            value={situacaoFilter}
            onChange={(e) => {
              setSituacaoFilter(e.target.value as SituacaoNfe | "");
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Filtrar por situação"
          >
            <option value="">Todas as situações</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PROCESSANDO">Processando</option>
            <option value="IMPORTADA">Importada</option>
            <option value="IGNORADA">Ignorada</option>
            <option value="ERRO">Erro</option>
          </select>

          {situacaoFilter && (
            <button
              onClick={() => {
                setSituacaoFilter("");
                setPage(1);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-600">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p>Erro ao carregar NFes pendentes</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        ) : data?.nfes?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-medium">Nenhuma NFe pendente encontrada</p>
            <p className="text-sm">
              {syncStatus?.configured
                ? "Clique em 'Sincronizar SEFAZ' para buscar novas notas"
                : "Configure a integração SEFAZ para começar"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chave de Acesso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emitente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Emissão
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Situação
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.nfes?.map((nfe) => {
                    const config = situacaoConfig[nfe.situacao as SituacaoNfe];
                    return (
                      <tr key={nfe.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-gray-600">
                            {formatChaveAcesso(nfe.chaveAcesso)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {nfe.nomeEmitente || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {nfe.cnpjEmitente?.replace(
                              /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                              "$1.$2.$3/$4-$5"
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {nfe.dataEmissao ? formatDateTime(nfe.dataEmissao) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {nfe.valorTotal ? formatCurrency(nfe.valorTotal) : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                          >
                            {config.icon}
                            {config.label}
                          </span>
                          {nfe.situacao === "ERRO" && nfe.errorMessage && (
                            <div className="text-xs text-red-600 mt-1" title={nfe.errorMessage}>
                              {nfe.errorMessage.substring(0, 30)}...
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {nfe.situacao === "PENDENTE" && (
                              <>
                                <button
                                  onClick={() => handleImport(nfe.id)}
                                  disabled={importMutation.isPending}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Importar NFe"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openIgnoreModal(nfe.id)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Ignorar NFe"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {nfe.situacao === "ERRO" && (
                              <button
                                onClick={() => handleImport(nfe.id)}
                                disabled={importMutation.isPending}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Tentar novamente"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            {nfe.situacao === "IMPORTADA" && nfe.receivedInvoiceId && (
                              <Link
                                href={`/invoices/${nfe.receivedInvoiceId}`}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Ver NFe importada"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Página {page} de {data.pages} ({data.total} registros)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ignore Modal */}
      {showIgnoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ignorar NFe</h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja ignorar esta NFe? Ela não será importada para o sistema.
            </p>
            <div className="mb-4">
              <label htmlFor="ignore-motivo" className="block text-sm font-medium text-gray-700 mb-1">
                Motivo (opcional)
              </label>
              <textarea
                id="ignore-motivo"
                value={ignoreMotivo}
                onChange={(e) => setIgnoreMotivo(e.target.value)}
                placeholder="Ex: NFe de devolução, já lançada manualmente..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowIgnoreModal(false);
                  setSelectedNfe(null);
                  setIgnoreMotivo("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleIgnore}
                disabled={ignoreMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {ignoreMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Ignorar NFe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
