"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { formatChaveAcesso } from "@/lib/nfe-parser";
import { PageHeader } from "@/components/PageHeader";
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
  Send,
  CheckCheck,
  HelpCircle,
  XOctagon,
  History,
} from "lucide-react";

type SituacaoNfe = "PENDENTE" | "PROCESSANDO" | "IMPORTADA" | "IGNORADA" | "ERRO";

const situacaoConfig: Record<SituacaoNfe, { label: string; color: string; icon: React.ReactNode }> = {
  PENDENTE: { label: "Pendente", color: "bg-amber-100 text-amber-800", icon: <Clock className="w-3 h-3" /> },
  PROCESSANDO: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  IMPORTADA: { label: "Importada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  IGNORADA: { label: "Ignorada", color: "bg-theme-tertiary text-theme", icon: <Ban className="w-3 h-3" /> },
  ERRO: { label: "Erro", color: "bg-red-100 text-red-800", icon: <AlertCircle className="w-3 h-3" /> },
};

type ManifestacaoTipo = "CIENCIA" | "CONFIRMACAO" | "DESCONHECIMENTO" | "NAO_REALIZADA";

const manifestacaoConfig: Record<ManifestacaoTipo, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  CIENCIA: { label: "Ciência", color: "bg-blue-100 text-blue-800", icon: <Eye className="w-3 h-3" />, description: "Ciência da operação - Você tomou conhecimento da NFe" },
  CONFIRMACAO: { label: "Confirmação", color: "bg-green-100 text-green-800", icon: <CheckCheck className="w-3 h-3" />, description: "Confirmação da operação - Você confirma o recebimento" },
  DESCONHECIMENTO: { label: "Desconhecimento", color: "bg-amber-100 text-amber-800", icon: <HelpCircle className="w-3 h-3" />, description: "Desconhecimento da operação - Você não reconhece a NFe" },
  NAO_REALIZADA: { label: "Não Realizada", color: "bg-red-100 text-red-800", icon: <XOctagon className="w-3 h-3" />, description: "Operação não realizada - A operação não foi concluída" },
};

export default function PendingInvoicesPage() {
  const [situacaoFilter, setSituacaoFilter] = useState<SituacaoNfe | "">("");
  const [page, setPage] = useState(1);
  const [selectedNfe, setSelectedNfe] = useState<string | null>(null);
  const [selectedNfeChave, setSelectedNfeChave] = useState<string>("");
  const [ignoreMotivo, setIgnoreMotivo] = useState("");
  const [showIgnoreModal, setShowIgnoreModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [manifestTipo, setManifestTipo] = useState<ManifestacaoTipo>("CIENCIA");
  const [manifestJustificativa, setManifestJustificativa] = useState("");
  const [selectedNfes, setSelectedNfes] = useState<string[]>([]);
  const [showBatchManifestModal, setShowBatchManifestModal] = useState(false);

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

  const manifestMutation = trpc.sefaz.manifestar.useMutation({
    onSuccess: () => {
      utils.sefaz.listPendingNfes.invalidate();
      setShowManifestModal(false);
      setSelectedNfe(null);
      setSelectedNfeChave("");
      setManifestTipo("CIENCIA");
      setManifestJustificativa("");
    },
  });

  const batchManifestMutation = trpc.sefaz.manifestarEmLote.useMutation({
    onSuccess: () => {
      utils.sefaz.listPendingNfes.invalidate();
      setShowBatchManifestModal(false);
      setSelectedNfes([]);
      setManifestTipo("CIENCIA");
      setManifestJustificativa("");
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

  const openManifestModal = (nfeId: string, chaveAcesso: string) => {
    setSelectedNfe(nfeId);
    setSelectedNfeChave(chaveAcesso);
    setShowManifestModal(true);
  };

  const handleManifest = () => {
    if (selectedNfe && selectedNfeChave) {
      manifestMutation.mutate({
        chaveAcesso: selectedNfeChave,
        tipo: manifestTipo,
        justificativa: manifestTipo === "NAO_REALIZADA" ? manifestJustificativa : undefined,
        pendingNfeId: selectedNfe,
      });
    }
  };

  const handleBatchManifest = () => {
    if (selectedNfes.length > 0) {
      batchManifestMutation.mutate({
        nfeIds: selectedNfes,
        tipo: manifestTipo,
        justificativa: manifestTipo === "NAO_REALIZADA" ? manifestJustificativa : undefined,
      });
    }
  };

  const toggleNfeSelection = (nfeId: string) => {
    setSelectedNfes((prev) =>
      prev.includes(nfeId) ? prev.filter((id) => id !== nfeId) : [...prev, nfeId]
    );
  };

  const selectAllPending = () => {
    const pendingIds = data?.nfes?.filter((n) => n.situacao === "PENDENTE" && !n.manifestacao).map((n) => n.id) || [];
    setSelectedNfes(pendingIds);
  };

  const pendingCount = data?.nfes?.filter((n) => n.situacao === "PENDENTE").length || 0;
  const errorCount = data?.nfes?.filter((n) => n.situacao === "ERRO").length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="NFe Pendentes SEFAZ"
        subtitle="Notas fiscais aguardando importação da SEFAZ"
        icon={<Clock className="w-6 h-6" />}
        backHref="/invoices"
        module="fiscal"
        actions={
          <div className="flex items-center gap-3">
            {selectedNfes.length > 0 && (
              <button
                onClick={() => setShowBatchManifestModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Manifestar ({selectedNfes.length})
              </button>
            )}
            <Link
              href="/invoices/manifestacoes"
              className="px-4 py-2 text-theme-secondary bg-theme-card border border-theme-input rounded-lg hover:bg-theme-hover transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Histórico
            </Link>
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
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-theme-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-theme-secondary">Pendentes</p>
              <p className="text-2xl font-bold text-theme">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-theme-secondary">Importadas</p>
              <p className="text-2xl font-bold text-theme">
                {data?.nfes?.filter((n) => n.situacao === "IMPORTADA").length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-theme-secondary">Com Erro</p>
              <p className="text-2xl font-bold text-theme">{errorCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-theme-secondary">Total</p>
              <p className="text-2xl font-bold text-theme">{data?.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-theme-card rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-muted" />
            <span className="text-sm font-medium text-theme-secondary">Filtrar por:</span>
          </div>

          <select
            value={situacaoFilter}
            onChange={(e) => {
              setSituacaoFilter(e.target.value as SituacaoNfe | "");
              setPage(1);
            }}
            className="border border-theme-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
      <div className="bg-theme-card rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-600">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p>Erro ao carregar NFes pendentes</p>
            <p className="text-sm text-theme-muted">{error.message}</p>
          </div>
        ) : data?.nfes?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-theme-muted">
            <FileText className="w-12 h-12 mb-3 text-theme-muted" />
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
                <thead className="bg-theme-tertiary border-b">
                  <tr>
                    <th className="px-4 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedNfes.length > 0 && selectedNfes.length === (data?.nfes?.filter((n) => n.situacao === "PENDENTE" && !n.manifestacao).length || 0)}
                        onChange={(e) => e.target.checked ? selectAllPending() : setSelectedNfes([])}
                        className="rounded border-theme text-indigo-600 focus:ring-indigo-500"
                        aria-label="Selecionar todas"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Chave de Acesso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Emitente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Data Emissão
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Manifestação
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Situação
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data?.nfes?.map((nfe) => {
                    const sitConfig = situacaoConfig[nfe.situacao as SituacaoNfe];
                    const manConfig = nfe.manifestacao ? manifestacaoConfig[nfe.manifestacao as ManifestacaoTipo] : null;
                    const canSelect = nfe.situacao === "PENDENTE" && !nfe.manifestacao;
                    return (
                      <tr key={nfe.id} className={`hover:bg-theme-hover ${selectedNfes.includes(nfe.id) ? "bg-indigo-50" : ""}`}>
                        <td className="px-4 py-3 text-center">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={selectedNfes.includes(nfe.id)}
                              onChange={() => toggleNfeSelection(nfe.id)}
                              className="rounded border-theme text-indigo-600 focus:ring-indigo-500"
                              aria-label={`Selecionar NFe ${nfe.chaveAcesso}`}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-theme-secondary">
                            {formatChaveAcesso(nfe.chaveAcesso)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-theme">
                            {nfe.nomeEmitente || "N/A"}
                          </div>
                          <div className="text-xs text-theme-muted">
                            {nfe.cnpjEmitente?.replace(
                              /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                              "$1.$2.$3/$4-$5"
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-theme-secondary">
                          {nfe.dataEmissao ? formatDateTime(nfe.dataEmissao) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-theme">
                          {nfe.valorTotal ? formatCurrency(nfe.valorTotal) : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {manConfig ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${manConfig.color}`}
                              title={manConfig.description}
                            >
                              {manConfig.icon}
                              {manConfig.label}
                            </span>
                          ) : (
                            <button
                              onClick={() => openManifestModal(nfe.id, nfe.chaveAcesso)}
                              disabled={nfe.situacao !== "PENDENTE"}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-theme-tertiary text-theme-secondary hover:bg-purple-100 hover:text-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Registrar manifestação"
                            >
                              <Send className="w-3 h-3" />
                              Manifestar
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sitConfig.color}`}
                          >
                            {sitConfig.icon}
                            {sitConfig.label}
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
                                  className="p-1.5 text-theme-secondary hover:bg-theme-hover rounded-lg transition-colors"
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
              <div className="flex items-center justify-between px-4 py-3 border-t bg-theme-tertiary">
                <div className="text-sm text-theme-secondary">
                  Página {page} de {data.pages} ({data.total} registros)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="p-2 rounded-lg hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-theme-card rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4">Ignorar NFe</h3>
            <p className="text-theme-secondary mb-4">
              Tem certeza que deseja ignorar esta NFe? Ela não será importada para o sistema.
            </p>
            <div className="mb-4">
              <label htmlFor="ignore-motivo" className="block text-sm font-medium text-theme-secondary mb-1">
                Motivo (opcional)
              </label>
              <textarea
                id="ignore-motivo"
                value={ignoreMotivo}
                onChange={(e) => setIgnoreMotivo(e.target.value)}
                placeholder="Ex: NFe de devolução, já lançada manualmente..."
                className="w-full border border-theme-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                className="px-4 py-2 text-theme-secondary hover:bg-theme-hover rounded-lg transition-colors"
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

      {/* Manifest Modal - Individual */}
      {showManifestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600" />
              Manifestação do Destinatário
            </h3>
            <p className="text-theme-secondary mb-4 text-sm">
              Selecione o tipo de manifestação para registrar na SEFAZ.
            </p>
            
            <div className="space-y-3 mb-4">
              {(Object.keys(manifestacaoConfig) as ManifestacaoTipo[]).map((tipo) => {
                const config = manifestacaoConfig[tipo];
                return (
                  <label
                    key={tipo}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      manifestTipo === tipo
                        ? "border-purple-500 bg-purple-50"
                        : "border-theme hover:border-theme"
                    }`}
                  >
                    <input
                      type="radio"
                      name="manifestTipo"
                      value={tipo}
                      checked={manifestTipo === tipo}
                      onChange={() => setManifestTipo(tipo)}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-theme-muted mt-1">{config.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {manifestTipo === "NAO_REALIZADA" && (
              <div className="mb-4">
                <label htmlFor="manifest-justificativa" className="block text-sm font-medium text-theme-secondary mb-1">
                  Justificativa <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="manifest-justificativa"
                  value={manifestJustificativa}
                  onChange={(e) => setManifestJustificativa(e.target.value)}
                  placeholder="Informe o motivo da operação não realizada (mínimo 15 caracteres)"
                  className="w-full border border-theme-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                />
                {manifestJustificativa.length > 0 && manifestJustificativa.length < 15 && (
                  <p className="text-xs text-red-500 mt-1">
                    Mínimo 15 caracteres ({manifestJustificativa.length}/15)
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowManifestModal(false);
                  setSelectedNfe(null);
                  setSelectedNfeChave("");
                  setManifestTipo("CIENCIA");
                  setManifestJustificativa("");
                }}
                className="px-4 py-2 text-theme-secondary hover:bg-theme-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleManifest}
                disabled={
                  manifestMutation.isPending ||
                  (manifestTipo === "NAO_REALIZADA" && manifestJustificativa.length < 15)
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {manifestMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Registrar Manifestação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Manifest Modal */}
      {showBatchManifestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600" />
              Manifestação em Lote
            </h3>
            <p className="text-theme-secondary mb-4 text-sm">
              Você está prestes a manifestar <strong>{selectedNfes.length}</strong> NFe(s).
              Selecione o tipo de manifestação.
            </p>
            
            <div className="space-y-3 mb-4">
              {(Object.keys(manifestacaoConfig) as ManifestacaoTipo[]).map((tipo) => {
                const config = manifestacaoConfig[tipo];
                return (
                  <label
                    key={tipo}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      manifestTipo === tipo
                        ? "border-purple-500 bg-purple-50"
                        : "border-theme hover:border-theme"
                    }`}
                  >
                    <input
                      type="radio"
                      name="batchManifestTipo"
                      value={tipo}
                      checked={manifestTipo === tipo}
                      onChange={() => setManifestTipo(tipo)}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-theme-muted mt-1">{config.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {manifestTipo === "NAO_REALIZADA" && (
              <div className="mb-4">
                <label htmlFor="batch-manifest-justificativa" className="block text-sm font-medium text-theme-secondary mb-1">
                  Justificativa <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="batch-manifest-justificativa"
                  value={manifestJustificativa}
                  onChange={(e) => setManifestJustificativa(e.target.value)}
                  placeholder="Informe o motivo da operação não realizada (mínimo 15 caracteres)"
                  className="w-full border border-theme-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                />
                {manifestJustificativa.length > 0 && manifestJustificativa.length < 15 && (
                  <p className="text-xs text-red-500 mt-1">
                    Mínimo 15 caracteres ({manifestJustificativa.length}/15)
                  </p>
                )}
              </div>
            )}

            {batchManifestMutation.isError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                Erro ao processar manifestações. Tente novamente.
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBatchManifestModal(false);
                  setManifestTipo("CIENCIA");
                  setManifestJustificativa("");
                }}
                className="px-4 py-2 text-theme-secondary hover:bg-theme-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBatchManifest}
                disabled={
                  batchManifestMutation.isPending ||
                  (manifestTipo === "NAO_REALIZADA" && manifestJustificativa.length < 15)
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {batchManifestMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Manifestar {selectedNfes.length} NFe(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
