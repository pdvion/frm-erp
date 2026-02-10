"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDateTime, formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  History,
  Eye,
  CheckCheck,
  HelpCircle,
  XOctagon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";

type ManifestacaoTipo = "CIENCIA" | "CONFIRMACAO" | "DESCONHECIMENTO" | "NAO_REALIZADA";

const manifestacaoConfig: Record<ManifestacaoTipo, { label: string; color: string; icon: React.ReactNode }> = {
  CIENCIA: { label: "Ciência", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <Eye className="w-3 h-3" /> },
  CONFIRMACAO: { label: "Confirmação", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCheck className="w-3 h-3" /> },
  DESCONHECIMENTO: { label: "Desconhecimento", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: <HelpCircle className="w-3 h-3" /> },
  NAO_REALIZADA: { label: "Não Realizada", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: <XOctagon className="w-3 h-3" /> },
};

export default function ManifestacaoHistoryPage() {
  const [tipoFilter, setTipoFilter] = useState<ManifestacaoTipo | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = trpc.sefaz.listManifestacoes.useQuery({
    tipo: tipoFilter || undefined,
    page,
    limit: 20,
  });

  const formatChaveAcesso = (chave: string) => {
    return chave.replace(/(\d{4})/g, "$1 ").trim();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Histórico de Manifestações"
        subtitle="Registro de todas as manifestações do destinatário enviadas à SEFAZ"
        icon={<History className="w-6 h-6" />}
        backHref="/invoices/pending"
        module="fiscal"
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-theme-secondary">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtrar por tipo:</span>
          </div>
          <NativeSelect
            value={tipoFilter}
            onChange={(e) => {
              setTipoFilter(e.target.value as ManifestacaoTipo | "");
              setPage(1);
            }}
            className="border border-theme-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Todos os tipos</option>
            {(Object.keys(manifestacaoConfig) as ManifestacaoTipo[]).map((tipo) => (
              <option key={tipo} value={tipo}>
                {manifestacaoConfig[tipo].label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Content */}
      <div className="bg-theme-card rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-600">
            <XCircle className="w-12 h-12 mb-2" />
            <p>Erro ao carregar histórico</p>
          </div>
        ) : !data?.manifestacoes?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-theme-muted">
            <FileText className="w-12 h-12 mb-2 text-theme-muted" />
            <p className="font-medium">Nenhuma manifestação encontrada</p>
            <p className="text-sm">As manifestações registradas aparecerão aqui</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-tertiary border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Chave de Acesso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Emitente
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Protocolo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.manifestacoes.map((manifestacao) => {
                    const config = manifestacaoConfig[manifestacao.tipo as ManifestacaoTipo];
                    return (
                      <tr key={manifestacao.id} className="hover:bg-theme-hover">
                        <td className="px-4 py-3 text-sm text-theme-secondary">
                          {formatDateTime(manifestacao.dataManifestacao)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-theme-secondary">
                            {formatChaveAcesso(manifestacao.chaveAcesso)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {manifestacao.pendingNfe ? (
                            <div>
                              <div className="text-sm font-medium text-theme">
                                {manifestacao.pendingNfe.nomeEmitente || "N/A"}
                              </div>
                              <div className="text-xs text-theme-muted">
                                {manifestacao.pendingNfe.cnpjEmitente?.replace(
                                  /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                  "$1.$2.$3/$4-$5"
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-theme-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-theme">
                          {manifestacao.pendingNfe?.valorTotal
                            ? formatCurrency(Number(manifestacao.pendingNfe.valorTotal))
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                          >
                            {config.icon}
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {manifestacao.status === "SUCESSO" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              Sucesso
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              title={manifestacao.errorMessage || "Erro desconhecido"}
                            >
                              <XCircle className="w-3 h-3" />
                              Erro
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-theme-secondary font-mono">
                          {manifestacao.protocolo || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-theme-tertiary">
                <div className="text-sm text-theme-secondary">
                  Página {page} de {data.pages} ({data.total} registros)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="p-2 rounded-lg hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
