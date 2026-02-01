"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileUp,
  Trash2,
  Eye,
  Loader2,
  Search,
} from "lucide-react";

interface FileWithContent {
  file: File;
  content: string;
  status: "pending" | "validating" | "valid" | "invalid" | "importing" | "success" | "error" | "duplicate";
  error?: string;
  invoiceNumber?: number;
  chaveAcesso?: string;
}

export default function ImportNFePage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileWithContent[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const importMutation = trpc.nfe.import.useMutation();
  const importBatchMutation = trpc.nfe.importBatch.useMutation();

  // Ler conteúdo do arquivo
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsText(file);
    });
  };

  // Adicionar arquivos
  const handleFiles = useCallback(async (fileList: FileList) => {
    const xmlFiles = Array.from(fileList).filter(
      (f) => f.name.toLowerCase().endsWith(".xml")
    );

    if (xmlFiles.length === 0) {
      alert("Selecione apenas arquivos XML");
      return;
    }

    const newFiles: FileWithContent[] = [];

    for (const file of xmlFiles) {
      // Verificar se já foi adicionado
      if (files.some((f) => f.file.name === file.name)) {
        continue;
      }

      try {
        const content = await readFileContent(file);
        newFiles.push({
          file,
          content,
          status: "pending",
        });
      } catch {
        newFiles.push({
          file,
          content: "",
          status: "error",
          error: "Erro ao ler arquivo",
        });
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, [files]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // Remover arquivo
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Importar um arquivo
  const importSingle = async (index: number) => {
    const fileItem = files[index];
    if (!fileItem || fileItem.status !== "pending") return;

    try {
      const result = await importMutation.mutateAsync({
        xmlContent: fileItem.content,
      });

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "success", invoiceNumber: result.invoice.invoiceNumber }
            : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
              ...f,
              status: "error",
              error: error instanceof Error ? error.message : "Erro ao importar",
            }
            : f
        )
      );
    }
  };

  // Importar todos
  const importAll = async () => {
    setIsImporting(true);

    const pendingFiles = files.filter((f) => f.status === "pending");

    if (pendingFiles.length === 0) {
      setIsImporting(false);
      return;
    }

    try {
      const result = await importBatchMutation.mutateAsync({
        xmlContents: pendingFiles.map((f) => f.content),
      });

      // Atualizar status dos arquivos
      let resultIndex = 0;
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== "pending") return f;
          const res = result.results[resultIndex++];
          return {
            ...f,
            status: res.success ? "success" : "error",
            invoiceNumber: res.invoiceNumber,
            error: res.error,
          };
        })
      );
    } catch (error) {
      console.error("Erro no import em lote:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // Validar arquivos antes de importar
  const validateFiles = async () => {
    setIsValidating(true);
    const pendingFiles = files.filter((f) => f.status === "pending");
    
    for (let i = 0; i < pendingFiles.length; i++) {
      const fileItem = pendingFiles[i];
      const fileIndex = files.findIndex((f) => f.file.name === fileItem.file.name);
      
      // Marcar como validando
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex ? { ...f, status: "validating" as const } : f
        )
      );
      
      // Validação básica do XML
      try {
        const hasNFeTag = fileItem.content.includes("<NFe") || fileItem.content.includes("<nfeProc");
        const chaveMatch = fileItem.content.match(/<chNFe>([0-9]{44})<\/chNFe>/);
        
        if (!hasNFeTag) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "invalid" as const, error: "Arquivo não é uma NFe válida" } : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "valid" as const, chaveAcesso: chaveMatch?.[1] } : f
            )
          );
        }
      } catch {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "invalid" as const, error: "Erro ao validar XML" } : f
          )
        );
      }
    }
    
    setIsValidating(false);
  };

  // Contadores
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const validCount = files.filter((f) => f.status === "valid").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => ["error", "invalid"].includes(f.status)).length;
  const duplicateCount = files.filter((f) => f.status === "duplicate").length;
  const totalProcessed = successCount + errorCount + duplicateCount;
  const progressPercent = files.length > 0 ? Math.round((totalProcessed / files.length) * 100) : 0;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Importar XML de NFe"
          subtitle="Arraste arquivos XML ou clique para selecionar"
          icon={<FileUp className="w-6 h-6" />}
          backHref="/invoices"
          module="invoices"
          actions={
            files.length > 0 ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setFiles([])}
                  variant="ghost"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Limpar
                </Button>
                {pendingCount > 0 && (
                  <Button
                    onClick={validateFiles}
                    variant="outline"
                    isLoading={isValidating}
                    leftIcon={<Search className="w-4 h-4" />}
                  >
                    Validar ({pendingCount})
                  </Button>
                )}
                <Button
                  onClick={importAll}
                  disabled={validCount === 0 && pendingCount === 0}
                  isLoading={isImporting}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Importar ({validCount > 0 ? validCount : pendingCount})
                </Button>
              </div>
            ) : undefined
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging
                ? "border-green-500 bg-green-50"
                : "border-theme hover:border-theme"
            }`}
          >
            <input
              type="file"
              multiple
              accept=".xml"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <FileText className="w-16 h-16 mx-auto text-theme-muted mb-4" />
              <p className="text-lg font-medium text-theme-secondary mb-1">
                Arraste arquivos XML aqui
              </p>
              <p className="text-theme-muted mb-4">ou clique para selecionar</p>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-theme-tertiary text-theme-secondary rounded-lg hover:bg-theme-tertiary transition-colors">
                <Upload className="w-4 h-4" />
                Selecionar Arquivos
              </span>
            </label>
          </div>

          {/* Progress Bar */}
          {isImporting && files.length > 0 && (
            <div className="mt-6 bg-theme-card rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-theme">Importando...</span>
                <span className="text-sm text-theme-muted">{progressPercent}%</span>
              </div>
              <div className="w-full bg-theme-tertiary rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-theme-muted mt-2">
                {totalProcessed} de {files.length} arquivos processados
              </p>
            </div>
          )}

          {/* Stats */}
          {files.length > 0 && (
            <div className="grid grid-cols-5 gap-4 mt-6">
              <div className="bg-theme-card rounded-lg p-4 border">
                <p className="text-sm text-theme-muted">Total</p>
                <p className="text-2xl font-bold text-theme">{files.length}</p>
              </div>
              <div className="bg-theme-card rounded-lg p-4 border">
                <p className="text-sm text-theme-muted">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="bg-theme-card rounded-lg p-4 border">
                <p className="text-sm text-theme-muted">Válidos</p>
                <p className="text-2xl font-bold text-blue-600">{validCount}</p>
              </div>
              <div className="bg-theme-card rounded-lg p-4 border">
                <p className="text-sm text-theme-muted">Importados</p>
                <p className="text-2xl font-bold text-green-600">{successCount}</p>
              </div>
              <div className="bg-theme-card rounded-lg p-4 border">
                <p className="text-sm text-theme-muted">Erros</p>
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 bg-theme-card rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-theme-tertiary">
                <h2 className="font-semibold text-theme">
                  Arquivos Selecionados
                </h2>
              </div>
              <div className="divide-y">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          fileItem.status === "success"
                            ? "bg-green-100"
                            : fileItem.status === "valid"
                              ? "bg-blue-100"
                              : fileItem.status === "error" || fileItem.status === "invalid"
                                ? "bg-red-100"
                                : fileItem.status === "duplicate"
                                  ? "bg-yellow-100"
                                  : fileItem.status === "validating" || fileItem.status === "importing"
                                    ? "bg-blue-50"
                                    : "bg-theme-tertiary"
                        }`}
                      >
                        {fileItem.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : fileItem.status === "valid" ? (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        ) : fileItem.status === "error" || fileItem.status === "invalid" ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : fileItem.status === "duplicate" ? (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        ) : fileItem.status === "validating" || fileItem.status === "importing" ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : (
                          <FileText className="w-5 h-5 text-theme-secondary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-theme">
                          {fileItem.file.name}
                        </p>
                        <p className="text-sm text-theme-muted">
                          {fileItem.status === "success" && fileItem.invoiceNumber
                            ? `Nota ${fileItem.invoiceNumber} importada`
                            : fileItem.status === "valid"
                              ? `Válido${fileItem.chaveAcesso ? ` • Chave: ...${fileItem.chaveAcesso.slice(-8)}` : ""}`
                              : fileItem.status === "error" || fileItem.status === "invalid"
                                ? fileItem.error
                                : fileItem.status === "duplicate"
                                  ? "Nota já importada"
                                  : fileItem.status === "validating"
                                    ? "Validando..."
                                    : fileItem.status === "importing"
                                      ? "Importando..."
                                      : `${(fileItem.file.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(fileItem.status === "pending" || fileItem.status === "valid") && (
                        <Button
                          size="sm"
                          onClick={() => importSingle(index)}
                          disabled={importMutation.isPending}
                          leftIcon={<Upload className="w-4 h-4" />}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Importar
                        </Button>
                      )}
                      {fileItem.status === "success" && fileItem.invoiceNumber && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/invoices/${fileItem.invoiceNumber}`)}
                          leftIcon={<Eye className="w-4 h-4" />}
                          className="text-green-600"
                        >
                          Ver
                        </Button>
                      )}
                      {(fileItem.status === "error" || fileItem.status === "invalid") && (
                        <span className="flex items-center gap-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          Erro
                        </span>
                      )}
                      {fileItem.status === "duplicate" && (
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <AlertCircle className="w-4 h-4" />
                          Duplicado
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="p-1.5 text-theme-muted hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-theme-muted">
                Nenhum arquivo selecionado. Arraste arquivos XML ou clique na área acima.
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
