"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";

import {
  ChevronLeft,
  Loader2,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Building2,
  Calendar,
  ArrowRight,
} from "lucide-react";

export default function ImportOFXPage() {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  const { data: accounts, isLoading: loadingAccounts } = trpc.bankAccounts.list.useQuery();

  const importMutation = trpc.bankAccounts.importOFX.useMutation({
    onSuccess: () => {
      // Redirecionar para conciliação após sucesso
      setTimeout(() => {
        router.push("/treasury/reconciliation");
      }, 3000);
    },
  });

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".ofx")) {
      alert("Por favor, selecione um arquivo OFX válido");
      return;
    }

    setFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file, "ISO-8859-1");
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedAccountId || !fileContent) return;

    await importMutation.mutateAsync({
      bankAccountId: selectedAccountId,
      ofxContent: fileContent,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/treasury/reconciliation" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-theme flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Importar Extrato OFX
              </h1>
            </div>
            
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resultado da Importação */}
        {importMutation.isSuccess && importMutation.data && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  Importação Concluída!
                </h3>
                <div className="space-y-1 text-green-700">
                  <p><strong>{importMutation.data.imported}</strong> transação(ões) importada(s)</p>
                  {importMutation.data.skipped > 0 && (
                    <p><strong>{importMutation.data.skipped}</strong> transação(ões) já existente(s)</p>
                  )}
                  {importMutation.data.newBalance !== undefined && (
                    <p>Novo saldo: <strong>{formatCurrency(importMutation.data.newBalance)}</strong></p>
                  )}
                  {importMutation.data.period && (
                    <p>
                      Período: {formatDate(importMutation.data.period.start)} a {formatDate(importMutation.data.period.end)}
                    </p>
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    href="/treasury/reconciliation"
                    className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium"
                  >
                    Ir para Conciliação <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {importMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-1">
                  Erro na Importação
                </h3>
                <p className="text-red-700">
                  {importMutation.error?.message || "Erro desconhecido ao importar arquivo"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulário */}
        {!importMutation.isSuccess && (
          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-6">
            {/* Seleção de Conta */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Conta Bancária
              </label>
              {loadingAccounts ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma conta...</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name} ({formatCurrency(Number(account.currentBalance))})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Upload de Arquivo */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Arquivo OFX
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : file
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                    <p className="text-green-700 font-medium">{file.name}</p>
                    <p className="text-green-600 text-sm">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={() => {
                        setFile(null);
                        setFileContent("");
                      }}
                      className="text-sm text-theme-muted hover:text-theme-secondary underline"
                    >
                      Remover arquivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-theme-muted mx-auto" />
                    <p className="text-theme-secondary">
                      Arraste um arquivo OFX aqui ou{" "}
                      <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                        clique para selecionar
                        <input
                          type="file"
                          accept=".ofx"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-theme-muted text-sm">
                      Formato aceito: .ofx (Open Financial Exchange)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Informações */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Como obter o arquivo OFX
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Acesse o Internet Banking do seu banco</li>
                <li>Vá em Extrato ou Movimentação</li>
                <li>Selecione o período desejado</li>
                <li>Exporte no formato OFX (Money ou Quicken)</li>
              </ul>
            </div>

            {/* Botão de Importar */}
            <div className="flex justify-end gap-3">
              <Link
                href="/treasury/reconciliation"
                className="px-4 py-2 border border-theme-input rounded-lg text-theme-secondary hover:bg-theme-hover"
              >
                Cancelar
              </Link>
              <button
                onClick={handleImport}
                disabled={!selectedAccountId || !fileContent || importMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar Extrato
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
