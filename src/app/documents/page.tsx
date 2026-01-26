"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Trash2,
  FolderOpen,
  Upload,
  Tag,
  Calendar,
  FileIcon,
  FileSpreadsheet,
  File,
  X,
  History,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function getFileIcon(fileType: string) {
  if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
  if (fileType.includes("image")) return <FileIcon className="w-5 h-5 text-blue-500" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) 
    return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocumentsContent() {
  const { filters, setFilter, resetFilters } = useUrlFilters({
    defaults: { page: 1, search: "", categoryId: undefined, entityType: undefined },
  });

  const [showUploadModal, setShowUploadModal] = useState(false);

  const search = (filters.search as string) || "";
  const page = (filters.page as number) || 1;
  const categoryId = filters.categoryId as string | undefined;
  const entityType = filters.entityType as string | undefined;

  const hasActiveFilters = search || categoryId || entityType;

  const { data, isLoading, error, refetch } = trpc.documents.list.useQuery({
    search: search || undefined,
    categoryId,
    entityType: entityType as "SUPPLIER" | "CUSTOMER" | "EMPLOYEE" | "CONTRACT" | "PURCHASE_ORDER" | "SALES_ORDER" | "INVOICE" | "MATERIAL" | "PROJECT" | "GENERAL" | undefined,
    page,
    pageSize: 20,
  });

  const { data: categories } = trpc.documents.listCategories.useQuery({});
  const { data: stats } = trpc.documents.stats.useQuery();

  const documents = data?.documents ?? [];
  const pagination = data?.pagination;

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const logDownloadMutation = trpc.documents.logDownload.useMutation();

  const handleDownload = async (doc: { id: string; fileUrl: string; fileName: string }) => {
    await logDownloadMutation.mutateAsync({ id: doc.id });
    window.open(doc.fileUrl, "_blank");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        icon={<FileText className="w-6 h-6" />}
        module="DOCUMENTS"
        breadcrumbs={[
          { label: "Configurações", href: "/settings" },
          { label: "Documentos" },
        ]}
        actions={
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme">{stats.totalDocuments}</p>
                <p className="text-sm text-theme-muted">Documentos</p>
              </div>
            </div>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme">{stats.totalCategories}</p>
                <p className="text-sm text-theme-muted">Categorias</p>
              </div>
            </div>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme">{stats.totalSizeMB} MB</p>
                <p className="text-sm text-theme-muted">Armazenamento</p>
              </div>
            </div>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <History className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme">{stats.recentUploads.length}</p>
                <p className="text-sm text-theme-muted">Recentes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar por título, nome do arquivo ou tags..."
              value={search}
              onChange={(e) => {
                setFilter("search", e.target.value);
                setFilter("page", 1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-theme-muted" />
            <select
              value={categoryId ?? ""}
              onChange={(e) => {
                setFilter("categoryId", e.target.value || undefined);
                setFilter("page", 1);
              }}
              className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas categorias</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <select
              value={entityType ?? ""}
              onChange={(e) => {
                setFilter("entityType", e.target.value || undefined);
                setFilter("page", 1);
              }}
              className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="SUPPLIER">Fornecedor</option>
              <option value="CUSTOMER">Cliente</option>
              <option value="EMPLOYEE">Funcionário</option>
              <option value="CONTRACT">Contrato</option>
              <option value="INVOICE">Nota Fiscal</option>
              <option value="MATERIAL">Material</option>
              <option value="GENERAL">Geral</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-3 py-2 text-theme-muted hover:text-theme transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-theme-muted">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            Carregando documentos...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Erro ao carregar documentos: {error.message}
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-theme-muted">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum documento encontrado</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 text-blue-500 hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-theme-secondary border-b border-theme text-sm font-medium text-theme-muted">
              <div className="col-span-5">Documento</div>
              <div className="col-span-2">Categoria</div>
              <div className="col-span-2">Tamanho</div>
              <div className="col-span-2">Data</div>
              <div className="col-span-1">Ações</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-theme">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 hover:bg-theme-secondary/50 transition-colors"
                >
                  {/* Document Info */}
                  <div className="col-span-1 md:col-span-5 flex items-center gap-3">
                    {getFileIcon(doc.fileType)}
                    <div className="min-w-0">
                      <p className="font-medium text-theme truncate">{doc.title}</p>
                      <p className="text-sm text-theme-muted truncate">{doc.fileName}</p>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 3 && (
                            <span className="text-xs text-theme-muted">
                              +{doc.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-1 md:col-span-2 flex items-center">
                    {doc.category ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm"
                        style={{
                          backgroundColor: doc.category.color ? `${doc.category.color}20` : undefined,
                          color: doc.category.color || undefined,
                        }}
                      >
                        <FolderOpen className="w-4 h-4" />
                        {doc.category.name}
                      </span>
                    ) : (
                      <span className="text-theme-muted text-sm">Sem categoria</span>
                    )}
                  </div>

                  {/* Size */}
                  <div className="col-span-1 md:col-span-2 flex items-center text-sm text-theme-muted">
                    {formatFileSize(doc.fileSize)}
                    {doc.version > 1 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                        v{doc.version}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="col-span-1 md:col-span-2 flex items-center text-sm text-theme-muted">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDistanceToNow(new Date(doc.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 md:col-span-1 flex items-center gap-2">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="p-2 text-theme-muted hover:text-blue-500 transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-theme-muted hover:text-green-500 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-theme-muted hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                <p className="text-sm text-theme-muted">
                  Mostrando {(pagination.page - 1) * pagination.pageSize + 1} a{" "}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{" "}
                  {pagination.total} documentos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilter("page", pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-lg border border-theme hover:bg-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-theme">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilter("page", pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 rounded-lg border border-theme hover:bg-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal Placeholder */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme">Upload de Documento</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-theme-muted hover:text-theme"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-dashed border-theme rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-theme-muted" />
              <p className="text-theme-muted mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-theme-muted">
                PDF, Imagens, Planilhas (máx. 10MB)
              </p>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.xlsx,.xls,.csv,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Selecionar Arquivos
              </label>
            </div>
            <p className="mt-4 text-sm text-theme-muted text-center">
              Funcionalidade de upload será implementada na próxima fase
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
