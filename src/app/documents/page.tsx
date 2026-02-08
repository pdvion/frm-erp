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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LinkButton } from "@/components/ui/LinkButton";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DocumentUpload } from "@/components/documents/DocumentUpload";

function getFileIcon(fileType: string) {
  if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
  if (fileType.includes("image")) return <FileIcon className="w-5 h-5 text-blue-500" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) 
    return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  return <File className="w-5 h-5 text-theme-muted" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocumentsContent() {
  const { filters, setFilter, setFilters, resetFilters } = useUrlFilters({
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

  const utils = trpc.useUtils();

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      refetch();
      utils.documents.stats.invalidate();
    },
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
          <div className="flex items-center gap-2">
            <LinkButton
              href="/documents/categories"
              variant="outline"
              leftIcon={<FolderOpen className="w-5 h-5" />}
            >
              <span className="hidden sm:inline">Categorias</span>
            </LinkButton>
            <Button
              onClick={() => setShowUploadModal(true)}
              leftIcon={<Upload className="w-5 h-5" />}
            >
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
            <Input
              placeholder="Buscar por título, nome do arquivo ou tags..."
              value={search}
              onChange={(e) => {
                setFilters({ search: e.target.value, page: 1 });
              }}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-theme-muted" />
            <Select
              value={categoryId ?? ""}
              onChange={(value) => {
                setFilters({ categoryId: value || undefined, page: 1 });
              }}
              placeholder="Todas categorias"
              options={[
                { value: "", label: "Todas categorias" },
                ...(categories?.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                })) || []),
              ]}
            />
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <Select
              value={entityType ?? ""}
              onChange={(value) => {
                setFilters({ entityType: value || undefined, page: 1 });
              }}
              placeholder="Todos os tipos"
              options={[
                { value: "", label: "Todos os tipos" },
                { value: "SUPPLIER", label: "Fornecedor" },
                { value: "CUSTOMER", label: "Cliente" },
                { value: "EMPLOYEE", label: "Funcionário" },
                { value: "CONTRACT", label: "Contrato" },
                { value: "INVOICE", label: "Nota Fiscal" },
                { value: "MATERIAL", label: "Material" },
                { value: "GENERAL", label: "Geral" },
              ]}
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              leftIcon={<X className="w-4 h-4" />}
            >
              Limpar
            </Button>
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
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="mt-2"
              >
                Limpar filtros
              </Button>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                      className="text-theme-muted hover:text-green-500"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      title="Excluir"
                      className="text-theme-muted hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter("page", pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm text-theme">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter("page", pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUpload
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            refetch();
            utils.documents.stats.invalidate();
            setShowUploadModal(false);
          }}
          categories={categories ?? []}
        />
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
