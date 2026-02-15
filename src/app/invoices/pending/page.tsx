"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { formatChaveAcesso } from "@/lib/nfe-parser";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import {
  FileText,
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
import { Input } from "@/components/ui/Input";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

type SituacaoNfe = "PENDENTE" | "PROCESSANDO" | "IMPORTADA" | "IGNORADA" | "ERRO";

const situacaoConfig: Record<SituacaoNfe, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  PENDENTE: { label: "Pendente", variant: "amber", icon: <Clock className="w-3 h-3" /> },
  PROCESSANDO: { label: "Processando", variant: "info", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  IMPORTADA: { label: "Importada", variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
  IGNORADA: { label: "Ignorada", variant: "default", icon: <Ban className="w-3 h-3" /> },
  ERRO: { label: "Erro", variant: "error", icon: <AlertCircle className="w-3 h-3" /> },
};

type ManifestacaoTipo = "CIENCIA" | "CONFIRMACAO" | "DESCONHECIMENTO" | "NAO_REALIZADA";

const manifestacaoConfig: Record<ManifestacaoTipo, { label: string; variant: BadgeVariant; icon: React.ReactNode; description: string }> = {
  CIENCIA: { label: "Ciência", variant: "info", icon: <Eye className="w-3 h-3" />, description: "Ciência da operação - Você tomou conhecimento da NFe" },
  CONFIRMACAO: { label: "Confirmação", variant: "success", icon: <CheckCheck className="w-3 h-3" />, description: "Confirmação da operação - Você confirma o recebimento" },
  DESCONHECIMENTO: { label: "Desconhecimento", variant: "amber", icon: <HelpCircle className="w-3 h-3" />, description: "Desconhecimento da operação - Você não reconhece a NFe" },
  NAO_REALIZADA: { label: "Não Realizada", variant: "error", icon: <XOctagon className="w-3 h-3" />, description: "Operação não realizada - A operação não foi concluída" },
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
              <Button
                onClick={() => setShowBatchManifestModal(true)}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Manifestar ({selectedNfes.length})
              </Button>
            )}
            <LinkButton
              href="/invoices/manifestacoes"
              variant="outline"
              leftIcon={<History className="w-4 h-4" />}
            >
              Histórico
            </LinkButton>
            {!syncStatus?.configured && (
              <LinkButton
                href="/settings/sefaz"
                variant="outline"
                leftIcon={<AlertCircle className="w-4 h-4" />}
                className="text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
              >
                Configurar SEFAZ
              </LinkButton>
            )}
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={!syncStatus?.configured}
              isLoading={syncMutation.isPending}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Sincronizar SEFAZ
            </Button>
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

          <Select
            value={situacaoFilter}
            onChange={(value) => {
              setSituacaoFilter(value as SituacaoNfe | "");
              setPage(1);
            }}
            placeholder="Todas as situações"
            options={[
              { value: "", label: "Todas as situações" },
              { value: "PENDENTE", label: "Pendente" },
              { value: "PROCESSANDO", label: "Processando" },
              { value: "IMPORTADA", label: "Importada" },
              { value: "IGNORADA", label: "Ignorada" },
              { value: "ERRO", label: "Erro" },
            ]}
          />

          {situacaoFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSituacaoFilter("");
                setPage(1);
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-theme-card rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
                      <Input
                        type="checkbox"
                        checked={selectedNfes.length > 0 && selectedNfes.length === (data?.nfes?.filter((n) => n.situacao === "PENDENTE" && !n.manifestacao).length || 0)}
                        onChange={(e) => e.target.checked ? selectAllPending() : setSelectedNfes([])}
                        className="rounded border-theme text-blue-600 focus:ring-blue-500"
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
                            <Input
                              type="checkbox"
                              checked={selectedNfes.includes(nfe.id)}
                              onChange={() => toggleNfeSelection(nfe.id)}
                              className="rounded border-theme text-blue-600 focus:ring-blue-500"
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
                          {nfe.valorTotal ? formatCurrency(Number(nfe.valorTotal)) : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {manConfig ? (
                            <span title={manConfig.description}>
                              <Badge variant={manConfig.variant}>
                                {manConfig.icon}
                                {manConfig.label}
                              </Badge>
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openManifestModal(nfe.id, nfe.chaveAcesso)}
                              disabled={nfe.situacao !== "PENDENTE"}
                              title="Registrar manifestação"
                              className="text-xs"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Manifestar
                            </Button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={sitConfig.variant}>
                            {sitConfig.icon}
                            {sitConfig.label}
                          </Badge>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleImport(nfe.id)}
                                  disabled={importMutation.isPending}
                                  title="Importar NFe"
                                  className="text-green-600 hover:bg-green-50"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openIgnoreModal(nfe.id)}
                                  title="Ignorar NFe"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {nfe.situacao === "ERRO" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleImport(nfe.id)}
                                disabled={importMutation.isPending}
                                title="Tentar novamente"
                                className="text-amber-600 hover:bg-amber-50"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            {nfe.situacao === "IMPORTADA" && nfe.receivedInvoiceId && (
                              <Link
                                href={`/invoices/${nfe.receivedInvoiceId}`}
                                className="p-1.5 text-blue-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ignore Modal */}
      <Modal
        isOpen={showIgnoreModal}
        onClose={() => { setShowIgnoreModal(false); setSelectedNfe(null); setIgnoreMotivo(""); }}
        title="Ignorar NFe"
        description="Tem certeza que deseja ignorar esta NFe? Ela não será importada para o sistema."
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="ignore-motivo" className="block text-sm font-medium text-theme-secondary mb-1">
              Motivo (opcional)
            </label>
            <Textarea
              id="ignore-motivo"
              value={ignoreMotivo}
              onChange={(e) => setIgnoreMotivo(e.target.value)}
              placeholder="Ex: NFe de devolução, já lançada manualmente..."
              rows={3}
            />
          </div>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => { setShowIgnoreModal(false); setSelectedNfe(null); setIgnoreMotivo(""); }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleIgnore}
              disabled={ignoreMutation.isPending}
              isLoading={ignoreMutation.isPending}
            >
              Ignorar NFe
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Manifest Modal - Individual */}
      <Modal
        isOpen={showManifestModal}
        onClose={() => { setShowManifestModal(false); setSelectedNfe(null); setSelectedNfeChave(""); setManifestTipo("CIENCIA"); setManifestJustificativa(""); }}
        title="Manifestação do Destinatário"
        description="Selecione o tipo de manifestação para registrar na SEFAZ."
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {(Object.keys(manifestacaoConfig) as ManifestacaoTipo[]).map((tipo) => {
              const config = manifestacaoConfig[tipo];
              return (
                <label
                  key={tipo}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    manifestTipo === tipo
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-theme hover:border-theme"
                  }`}
                >
                  <Input
                    type="radio"
                    name="manifestTipo"
                    value={tipo}
                    checked={manifestTipo === tipo}
                    onChange={() => setManifestTipo(tipo)}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>
                        {config.icon}
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-theme-muted mt-1">{config.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {manifestTipo === "NAO_REALIZADA" && (
            <div>
              <label htmlFor="manifest-justificativa" className="block text-sm font-medium text-theme-secondary mb-1">
                Justificativa <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="manifest-justificativa"
                value={manifestJustificativa}
                onChange={(e) => setManifestJustificativa(e.target.value)}
                placeholder="Informe o motivo da operação não realizada (mínimo 15 caracteres)"
                rows={3}
              />
              {manifestJustificativa.length > 0 && manifestJustificativa.length < 15 && (
                <p className="text-xs text-red-500 mt-1">
                  Mínimo 15 caracteres ({manifestJustificativa.length}/15)
                </p>
              )}
            </div>
          )}

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => { setShowManifestModal(false); setSelectedNfe(null); setSelectedNfeChave(""); setManifestTipo("CIENCIA"); setManifestJustificativa(""); }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleManifest}
              disabled={
                manifestMutation.isPending ||
                (manifestTipo === "NAO_REALIZADA" && manifestJustificativa.length < 15)
              }
              isLoading={manifestMutation.isPending}
            >
              Registrar Manifestação
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Batch Manifest Modal */}
      <Modal
        isOpen={showBatchManifestModal}
        onClose={() => { setShowBatchManifestModal(false); setManifestTipo("CIENCIA"); setManifestJustificativa(""); }}
        title="Manifestação em Lote"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-theme-secondary text-sm">
            Você está prestes a manifestar <strong>{selectedNfes.length}</strong> NFe(s).
            Selecione o tipo de manifestação.
          </p>

          <div className="space-y-3">
            {(Object.keys(manifestacaoConfig) as ManifestacaoTipo[]).map((tipo) => {
              const config = manifestacaoConfig[tipo];
              return (
                <label
                  key={tipo}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    manifestTipo === tipo
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-theme hover:border-theme"
                  }`}
                >
                  <Input
                    type="radio"
                    name="batchManifestTipo"
                    value={tipo}
                    checked={manifestTipo === tipo}
                    onChange={() => setManifestTipo(tipo)}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>
                        {config.icon}
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-theme-muted mt-1">{config.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {manifestTipo === "NAO_REALIZADA" && (
            <div>
              <label htmlFor="batch-manifest-justificativa" className="block text-sm font-medium text-theme-secondary mb-1">
                Justificativa <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="batch-manifest-justificativa"
                value={manifestJustificativa}
                onChange={(e) => setManifestJustificativa(e.target.value)}
                placeholder="Informe o motivo da operação não realizada (mínimo 15 caracteres)"
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
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              Erro ao processar manifestações. Tente novamente.
            </div>
          )}

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => { setShowBatchManifestModal(false); setManifestTipo("CIENCIA"); setManifestJustificativa(""); }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBatchManifest}
              disabled={
                batchManifestMutation.isPending ||
                (manifestTipo === "NAO_REALIZADA" && manifestJustificativa.length < 15)
              }
              isLoading={batchManifestMutation.isPending}
            >
              Manifestar {selectedNfes.length} NFe(s)
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
