"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  documentId?: string;
}

interface DocumentUploadProps {
  onClose: () => void;
  onSuccess: () => void;
  categories?: Array<{ id: string; name: string }>;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({ onClose, onSuccess, categories }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");
  const [entityType, setEntityType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadUrlMutation = trpc.documents.getUploadUrl.useMutation();
  const createDocumentMutation = trpc.documents.create.useMutation();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Tipo de arquivo não permitido";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Arquivo muito grande (máx. 10MB)";
    }
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const filesToAdd: UploadFile[] = [];
    
    Array.from(newFiles).forEach((file) => {
      const error = validateFile(file);
      filesToAdd.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: error ? "error" : "pending",
        error: error ?? undefined,
      });
    });

    setFiles((prev) => [...prev, ...filesToAdd]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 10 } : f
        )
      );

      // Get signed upload URL
      const { uploadUrl, filePath, publicUrl } = await getUploadUrlMutation.mutateAsync({
        fileName: uploadFile.file.name,
        fileType: uploadFile.file.type,
        fileSize: uploadFile.file.size,
      });

      // Update progress
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 30 } : f))
      );

      // Upload to Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadFile.file,
        headers: {
          "Content-Type": uploadFile.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Falha no upload do arquivo");
      }

      // Update progress
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 70 } : f))
      );

      // Create document record
      const document = await createDocumentMutation.mutateAsync({
        title: uploadFile.file.name.replace(/\.[^/.]+$/, ""),
        fileName: uploadFile.file.name,
        fileType: uploadFile.file.type,
        fileSize: uploadFile.file.size,
        fileUrl: publicUrl,
        filePath,
        categoryId: categoryId || undefined,
        entityType: entityType as "SUPPLIER" | "CUSTOMER" | "EMPLOYEE" | "CONTRACT" | "PURCHASE_ORDER" | "SALES_ORDER" | "INVOICE" | "MATERIAL" | "PROJECT" | "GENERAL" | undefined,
        tags: [],
      });

      // Update to success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "success" as const, progress: 100, documentId: document.id }
            : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Erro no upload",
              }
            : f
        )
      );
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsUploading(false);

    // Check if all uploads were successful
    const allSuccess = files.every((f) => f.status === "success" || f.status === "error");
    if (allSuccess) {
      const hasSuccess = files.some((f) => f.status === "success");
      if (hasSuccess) {
        onSuccess();
      }
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-card border border-theme rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme">Upload de Documentos</h2>
          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme rounded-lg hover:bg-theme-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragging 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-theme hover:border-blue-400 hover:bg-theme-secondary"
              }
            `}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-blue-500" : "text-theme-muted"}`} />
            <p className="text-theme mb-2">
              {isDragging ? "Solte os arquivos aqui" : "Arraste arquivos aqui ou clique para selecionar"}
            </p>
            <p className="text-sm text-theme-muted">
              PDF, Imagens, Planilhas, Documentos (máx. 10MB cada)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.xlsx,.xls,.csv,.doc,.docx"
              onChange={handleFileSelect}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              >
                <option value="">Sem categoria</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Tipo de Entidade</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              >
                <option value="">Geral</option>
                <option value="SUPPLIER">Fornecedor</option>
                <option value="CUSTOMER">Cliente</option>
                <option value="EMPLOYEE">Funcionário</option>
                <option value="CONTRACT">Contrato</option>
                <option value="INVOICE">Nota Fiscal</option>
                <option value="MATERIAL">Material</option>
              </select>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-theme">Arquivos ({files.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-theme-secondary rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-theme-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-theme truncate">{file.file.name}</p>
                      <p className="text-xs text-theme-muted">
                        {(file.file.size / 1024).toFixed(1)} KB
                      </p>
                      {file.status === "uploading" && (
                        <div className="mt-1 h-1 bg-theme rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                      {file.error && (
                        <p className="text-xs text-red-500 mt-1">{file.error}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {file.status === "pending" && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-theme-muted hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {file.status === "uploading" && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {file.status === "success" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-theme bg-theme-secondary">
          <div className="text-sm text-theme-muted">
            {successCount > 0 && (
              <span className="text-green-500">{successCount} enviado(s)</span>
            )}
            {successCount > 0 && pendingCount > 0 && " • "}
            {pendingCount > 0 && <span>{pendingCount} pendente(s)</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-theme-muted hover:text-theme transition-colors"
            >
              {successCount > 0 ? "Fechar" : "Cancelar"}
            </button>
            <button
              onClick={handleUpload}
              disabled={pendingCount === 0 || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar {pendingCount > 0 ? `(${pendingCount})` : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
