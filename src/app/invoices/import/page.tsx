"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  FileText,
  Upload,
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileUp,
  Trash2,
  Eye,
} from "lucide-react";

interface FileWithContent {
  file: File;
  content: string;
  status: "pending" | "success" | "error";
  error?: string;
  invoiceNumber?: number;
}

export default function ImportNFePage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileWithContent[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // Contadores
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/invoices"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <FileUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Importar XML de NFe
                    </h1>
                    <p className="text-sm text-gray-500">
                      Arraste arquivos XML ou clique para selecionar
                    </p>
                  </div>
                </div>
              </div>
              {files.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFiles([])}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpar
                  </button>
                  <button
                    onClick={importAll}
                    disabled={isImporting || pendingCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Importar Todos ({pendingCount})
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
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
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-1">
                Arraste arquivos XML aqui
              </p>
              <p className="text-gray-500 mb-4">ou clique para selecionar</p>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Upload className="w-4 h-4" />
                Selecionar Arquivos
              </span>
            </label>
          </div>

          {/* Stats */}
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{files.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-sm text-gray-500">Importados</p>
                <p className="text-2xl font-bold text-green-600">{successCount}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-sm text-gray-500">Erros</p>
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">
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
                            : fileItem.status === "error"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {fileItem.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : fileItem.status === "error" ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {fileItem.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {fileItem.status === "success" && fileItem.invoiceNumber
                            ? `Nota ${fileItem.invoiceNumber} importada`
                            : fileItem.status === "error"
                            ? fileItem.error
                            : `${(fileItem.file.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {fileItem.status === "pending" && (
                        <button
                          onClick={() => importSingle(index)}
                          disabled={importMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" />
                          Importar
                        </button>
                      )}
                      {fileItem.status === "success" && fileItem.invoiceNumber && (
                        <button
                          onClick={() => router.push(`/invoices/${fileItem.invoiceNumber}`)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                      )}
                      {fileItem.status === "error" && (
                        <span className="flex items-center gap-1 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          Erro
                        </span>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500">
                Nenhum arquivo selecionado. Arraste arquivos XML ou clique na área acima.
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
