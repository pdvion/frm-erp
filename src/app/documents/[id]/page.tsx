"use client";

import { use } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Download,
  History,
  Eye,
  Calendar,
  Tag,
  FolderOpen,
  Link as LinkIcon,
  Clock,
  FileIcon,
  Upload,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const entityTypeLabels: Record<string, string> = {
  SUPPLIER: "Fornecedor",
  CUSTOMER: "Cliente",
  EMPLOYEE: "Funcionário",
  CONTRACT: "Contrato",
  PURCHASE_ORDER: "Pedido de Compra",
  SALES_ORDER: "Pedido de Venda",
  INVOICE: "Nota Fiscal",
  MATERIAL: "Material",
  PROJECT: "Projeto",
  GENERAL: "Geral",
};

const actionLabels: Record<string, { label: string; color: string }> = {
  VIEW: { label: "Visualizou", color: "text-blue-500" },
  DOWNLOAD: { label: "Baixou", color: "text-green-500" },
  EDIT: { label: "Editou", color: "text-yellow-500" },
  DELETE: { label: "Excluiu", color: "text-red-500" },
  CREATE: { label: "Criou", color: "text-purple-500" },
  SHARE: { label: "Compartilhou", color: "text-cyan-500" },
};

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: document, isLoading, error } = trpc.documents.byId.useQuery({ id });
  const logDownloadMutation = trpc.documents.logDownload.useMutation();

  const handleDownload = async () => {
    if (!document) return;
    await logDownloadMutation.mutateAsync({ id: document.id });
    window.open(document.fileUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
        <p className="text-red-500 mb-4">
          {error?.message || "Documento não encontrado"}
        </p>
        <Link
          href="/documents"
          className="text-blue-500 hover:underline flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para documentos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.title}
        icon={<FileText className="w-6 h-6" />}
        module="DOCUMENTS"
        breadcrumbs={[
          { label: "Documentos", href: "/documents" },
          { label: document.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview */}
          <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
            <div className="p-4 border-b border-theme">
              <h2 className="font-semibold text-theme flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Visualização
              </h2>
            </div>
            <div className="p-4">
              {document.fileType.includes("pdf") ? (
                <iframe
                  src={document.fileUrl}
                  className="w-full h-[600px] rounded-lg border border-theme"
                  title={document.title}
                />
              ) : document.fileType.includes("image") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={document.fileUrl}
                  alt={document.title}
                  className="max-w-full h-auto rounded-lg mx-auto"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-theme-muted">
                  <FileIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p className="mb-4">Visualização não disponível para este tipo de arquivo</p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="w-5 h-5" />
                    Baixar arquivo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Versions */}
          {document.versions && document.versions.length > 0 && (
            <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
              <div className="p-4 border-b border-theme">
                <h2 className="font-semibold text-theme flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Versões
                </h2>
              </div>
              <div className="divide-y divide-theme">
                {document.versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 flex items-center justify-between hover:bg-theme-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded">
                        v{version.version}
                      </span>
                      <div>
                        <p className="text-sm text-theme">{version.fileName}</p>
                        <p className="text-xs text-theme-muted">
                          {formatFileSize(version.fileSize)} •{" "}
                          {format(new Date(version.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <a
                      href={version.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-theme-muted hover:text-blue-500"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Access Logs */}
          {document.accessLogs && document.accessLogs.length > 0 && (
            <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
              <div className="p-4 border-b border-theme">
                <h2 className="font-semibold text-theme flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Histórico de Acessos
                </h2>
              </div>
              <div className="divide-y divide-theme max-h-64 overflow-y-auto">
                {document.accessLogs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center gap-3 text-sm">
                    <span
                      className={`font-medium ${
                        actionLabels[log.action]?.color || "text-theme"
                      }`}
                    >
                      {actionLabels[log.action]?.label || log.action}
                    </span>
                    <span className="text-theme-muted">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Info */}
          <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
            <div className="p-4 border-b border-theme">
              <h2 className="font-semibold text-theme">Informações</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* File Name */}
              <div>
                <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                  Arquivo
                </p>
                <p className="text-sm text-theme">{document.fileName}</p>
              </div>

              {/* File Type */}
              <div>
                <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                  Tipo
                </p>
                <p className="text-sm text-theme">{document.fileType}</p>
              </div>

              {/* File Size */}
              <div>
                <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                  Tamanho
                </p>
                <p className="text-sm text-theme">{formatFileSize(document.fileSize)}</p>
              </div>

              {/* Version */}
              <div>
                <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                  Versão
                </p>
                <p className="text-sm text-theme">
                  v{document.version}
                  {document.isLatestVersion && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                      Atual
                    </span>
                  )}
                </p>
              </div>

              {/* Category */}
              {document.category && (
                <div>
                  <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                    Categoria
                  </p>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm"
                    style={{
                      backgroundColor: document.category.color
                        ? `${document.category.color}20`
                        : undefined,
                      color: document.category.color || undefined,
                    }}
                  >
                    <FolderOpen className="w-4 h-4" />
                    {document.category.name}
                  </span>
                </div>
              )}

              {/* Entity Link */}
              {document.entityType && (
                <div>
                  <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                    Vinculado a
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-theme-secondary rounded-lg text-sm text-theme">
                    <LinkIcon className="w-4 h-4" />
                    {entityTypeLabels[document.entityType] || document.entityType}
                  </span>
                </div>
              )}

              {/* Tags */}
              {document.tags && document.tags.length > 0 && (
                <div>
                  <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {document.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {document.description && (
                <div>
                  <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                    Descrição
                  </p>
                  <p className="text-sm text-theme">{document.description}</p>
                </div>
              )}

              {/* Created At */}
              <div>
                <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                  Criado em
                </p>
                <p className="text-sm text-theme flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(document.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>

              {/* Updated At */}
              <div>
                <p className="text-xs text-theme-muted uppercase tracking-wide mb-1">
                  Atualizado em
                </p>
                <p className="text-sm text-theme">
                  {formatDistanceToNow(new Date(document.updatedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-theme-card border border-theme rounded-lg p-4 space-y-3">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-5 h-5" />
              Nova Versão
            </button>
            <Link
              href="/documents"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-theme text-theme rounded-lg hover:bg-theme-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
