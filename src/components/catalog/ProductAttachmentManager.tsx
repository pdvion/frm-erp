"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface ProductAttachment {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  sizeBytes?: number | null;
  type: string;
  order: number;
}

export interface ProductAttachmentManagerProps {
  productId: string;
  attachments: ProductAttachment[];
  onUpload: (file: File, type: string) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<unknown>;
  isUploading?: boolean;
}

const ATTACHMENT_TYPES = [
  { value: "datasheet", label: "Ficha Técnica", icon: "📋" },
  { value: "manual", label: "Manual", icon: "📖" },
  { value: "certificate", label: "Certificado", icon: "🏆" },
  { value: "brochure", label: "Catálogo", icon: "📄" },
  { value: "warranty", label: "Garantia", icon: "🛡️" },
];

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string): string {
  if (fileType.includes("pdf")) return "📕";
  if (fileType.includes("word") || fileType.includes("doc")) return "📘";
  if (fileType.includes("excel") || fileType.includes("sheet")) return "📗";
  if (fileType.includes("image")) return "🖼️";
  return "📄";
}

export function ProductAttachmentManager({
  productId,
  attachments,
  onUpload,
  onDelete,
  isUploading = false,
}: ProductAttachmentManagerProps) {
  const [selectedType, setSelectedType] = useState("datasheet");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await onUpload(file, selectedType);
      }
    },
    [onUpload, selectedType]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        await onUpload(file, selectedType);
      }
      e.target.value = "";
    },
    [onUpload, selectedType]
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      setDeletingId(attachmentId);
      try {
        await onDelete(attachmentId);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete]
  );

  const groupedAttachments = ATTACHMENT_TYPES.map((type) => ({
    ...type,
    items: attachments.filter((a) => a.type === type.value),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Anexos do Produto
        </h3>
        <span className="text-xs text-gray-500">
          {attachments.length} arquivo(s)
        </span>
      </div>

      {/* Type Selector + Upload */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
        >
          {ATTACHMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex-1 min-w-[200px] border-2 border-dashed rounded-lg p-3 text-center transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-300 dark:border-gray-600"
          )}
        >
          <input
            type="file"
            id={`attachment-upload-${productId}`}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor={`attachment-upload-${productId}`}
            className="cursor-pointer flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isUploading ? "Enviando..." : "Arraste ou clique para enviar"}
          </label>
        </div>
      </div>

      {/* Attachments by Type */}
      {groupedAttachments.some((g) => g.items.length > 0) && (
        <div className="space-y-4">
          {groupedAttachments
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.value}>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {group.icon} {group.label} ({group.items.length})
                </h4>
                <div className="space-y-1">
                  {group.items.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <span className="text-xl">
                        {getFileIcon(attachment.fileType)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.sizeBytes)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={attachment.url}
                          download={attachment.fileName}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded"
                          title="Baixar"
                        >
                          <Download size={16} />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(attachment.id)}
                          disabled={deletingId === attachment.id}
                          className="text-gray-500 hover:text-red-600"
                          title="Excluir"
                        >
                          {deletingId === attachment.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <FileText size={32} className="mx-auto mb-2 text-gray-400" />
          <p>Nenhum anexo adicionado</p>
          <p className="text-xs mt-1">
            Adicione manuais, fichas técnicas, certificados, etc.
          </p>
        </div>
      )}
    </div>
  );
}
