"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  url?: string;
}

export interface FileUploadProps {
  /** Tipos de arquivo aceitos (ex: ".pdf,.doc,.xlsx" ou "image/*") */
  accept?: string;
  /** Tamanho máximo do arquivo em bytes (padrão: 10MB) */
  maxSize?: number;
  /** Permitir múltiplos arquivos */
  multiple?: boolean;
  /** Callback quando arquivos são selecionados */
  onFilesSelected?: (files: File[]) => void;
  /** Callback para upload de arquivo (retorna URL) */
  onUpload?: (file: File, onProgress: (progress: number) => void) => Promise<string>;
  /** Callback quando upload é concluído */
  onUploadComplete?: (files: UploadedFile[]) => void;
  /** Callback quando arquivo é removido */
  onRemove?: (file: UploadedFile) => void;
  /** Arquivos já carregados */
  value?: UploadedFile[];
  /** Desabilitar upload */
  disabled?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Texto do placeholder */
  placeholder?: string;
  /** Mostrar lista de arquivos */
  showFileList?: boolean;
  /** Número máximo de arquivos */
  maxFiles?: number;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return "🖼️";
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv")) return "📊";
  if (type.includes("zip") || type.includes("rar")) return "📦";
  return "📎";
};

export function FileUpload({
  accept,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = false,
  onFilesSelected,
  onUpload,
  onUploadComplete,
  onRemove,
  value = [],
  disabled = false,
  className,
  placeholder = "Arraste arquivos aqui ou clique para selecionar",
  showFileList = true,
  maxFiles = 10,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(value);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `Arquivo muito grande (máx. ${formatFileSize(maxSize)})`;
    }
    if (accept) {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", "/"));
        }
        return file.type === type;
      });
      if (!isAccepted) {
        return "Tipo de arquivo não permitido";
      }
    }
    return null;
  }, [accept, maxSize]);

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const filesToAdd: UploadedFile[] = [];
    const currentCount = files.length;
    const availableSlots = maxFiles - currentCount;

    Array.from(newFiles).slice(0, availableSlots).forEach((file) => {
      const error = validateFile(file);
      filesToAdd.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        file,
        progress: 0,
        status: error ? "error" : "pending",
        error: error ?? undefined,
      });
    });

    if (filesToAdd.length === 0) return;

    const updatedFiles = multiple ? [...files, ...filesToAdd] : filesToAdd;
    setFiles(updatedFiles);

    onFilesSelected?.(filesToAdd.filter((f) => f.status === "pending").map((f) => f.file));

    // Auto-upload se onUpload estiver definido
    if (onUpload) {
      setIsUploading(true);
      const uploadPromises = filesToAdd
        .filter((f) => f.status === "pending")
        .map(async (uploadFile) => {
          try {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id ? { ...f, status: "uploading" as const } : f
              )
            );

            const url = await onUpload(uploadFile.file, (progress) => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress } : f
                )
              );
            });

            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: "success" as const, progress: 100, url }
                  : f
              )
            );

            return { ...uploadFile, status: "success" as const, url };
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erro no upload";
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: "error" as const, error: errorMessage }
                  : f
              )
            );
            return { ...uploadFile, status: "error" as const, error: errorMessage };
          }
        });

      const results = await Promise.all(uploadPromises);
      setIsUploading(false);
      onUploadComplete?.(results);
    }
  }, [files, maxFiles, multiple, onFilesSelected, onUpload, onUploadComplete, validateFile]);

  const removeFile = useCallback((id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove) {
      onRemove?.(fileToRemove);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, [files, onRemove]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  }, [addFiles]);

  const openFileDialog = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-[var(--frm-primary)] bg-[var(--frm-primary)]/5"
            : "border-theme-input hover:border-[var(--frm-primary)]/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <Loader2 className="w-10 h-10 text-[var(--frm-primary)] animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-theme-muted" />
          )}
          <div>
            <p className="text-sm text-theme-secondary font-medium">{placeholder}</p>
            <p className="text-xs text-theme-muted mt-1">
              Máximo {formatFileSize(maxSize)} por arquivo
              {maxFiles > 1 && ` • Até ${maxFiles} arquivos`}
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {showFileList && files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="flex items-center gap-3 p-3 bg-theme-secondary rounded-lg border border-theme"
            >
              <span className="text-2xl">{getFileIcon(uploadFile.file.type)}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-theme truncate">
                  {uploadFile.file.name}
                </p>
                <p className="text-xs text-theme-muted">
                  {formatFileSize(uploadFile.file.size)}
                </p>

                {uploadFile.status === "uploading" && (
                  <div className="mt-1 h-1.5 bg-theme-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--frm-primary)] transition-all duration-300"
                      style={{ width: `${uploadFile.progress}%` }}
                    />
                  </div>
                )}

                {uploadFile.status === "error" && (
                  <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {uploadFile.status === "uploading" && (
                  <Loader2 className="w-4 h-4 text-[var(--frm-primary)] animate-spin" />
                )}
                {uploadFile.status === "success" && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {uploadFile.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(uploadFile.id);
                  }}
                  disabled={uploadFile.status === "uploading"}
                  className="p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
