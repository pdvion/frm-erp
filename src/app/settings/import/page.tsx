"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Users, FileCheck, AlertTriangle, CheckCircle, Loader2, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/Input";

type ImportType = "customers" | "invoices";

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>("customers");
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [updateIfExists, setUpdateIfExists] = useState(false);

  const { data: stats, isLoading: statsLoading } = trpc.delphiImport.getImportStats.useQuery();

  const validateMutation = trpc.delphiImport.validateCSV.useQuery(
    { csvContent, type: importType },
    { enabled: csvContent.length > 0 }
  );

  const importCustomersMutation = trpc.delphiImport.importCustomers.useMutation();
  const importInvoicesMutation = trpc.delphiImport.importInvoices.useMutation();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleImport = async () => {
    if (!csvContent) return;

    const options = { dryRun, updateIfExists };

    if (importType === "customers") {
      await importCustomersMutation.mutateAsync({ csvContent, options });
    } else {
      await importInvoicesMutation.mutateAsync({ csvContent, options });
    }
  };

  const importResult = importType === "customers" 
    ? importCustomersMutation.data 
    : importInvoicesMutation.data;

  const isImporting = importCustomersMutation.isPending || importInvoicesMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importação de Dados"
        subtitle="Importar dados do sistema Delphi (FRM)"
        icon={<Upload className="w-6 h-6" />}
        module="settings"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Clientes Cadastrados</p>
              <p className="text-2xl font-bold text-theme">
                {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.customers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-theme-muted">NFe Emitidas</p>
              <p className="text-2xl font-bold text-theme">
                {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.invoices || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Type Selection */}
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <h2 className="text-lg font-semibold text-theme mb-4">Tipo de Importação</h2>
        <div className="flex gap-4">
          <Button
            onClick={() => setImportType("customers")}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              importType === "customers"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-theme hover:border-blue-300"
            }`}
          >
            <Users className={`w-8 h-8 mx-auto mb-2 ${importType === "customers" ? "text-blue-600" : "text-theme-muted"}`} />
            <p className={`font-medium ${importType === "customers" ? "text-blue-600" : "text-theme"}`}>Clientes</p>
            <p className="text-sm text-theme-muted">cliente_v1.csv</p>
          </Button>

          <Button
            onClick={() => setImportType("invoices")}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              importType === "invoices"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-theme hover:border-green-300"
            }`}
          >
            <FileText className={`w-8 h-8 mx-auto mb-2 ${importType === "invoices" ? "text-green-600" : "text-theme-muted"}`} />
            <p className={`font-medium ${importType === "invoices" ? "text-green-600" : "text-theme"}`}>NFe Emitidas</p>
            <p className="text-sm text-theme-muted">pv15_nf_emitidas_v1.csv</p>
          </Button>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <h2 className="text-lg font-semibold text-theme mb-4">Upload do Arquivo CSV</h2>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-theme rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        >
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Download className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme font-medium">
              {fileName || "Arraste o arquivo CSV ou clique para selecionar"}
            </p>
            <p className="text-sm text-theme-muted mt-2">
              Formato: CSV com separador ; (ponto e vírgula)
            </p>
          </label>
        </div>

        {/* Validation Result */}
        {validateMutation.data && csvContent && (
          <div className={`mt-4 p-4 rounded-lg ${
            validateMutation.data.valid 
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}>
            <div className="flex items-center gap-2">
              {validateMutation.data.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={validateMutation.data.valid ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                {validateMutation.data.message}
              </span>
            </div>
            {validateMutation.data.headers.length > 0 && (
              <div className="mt-2 text-sm text-theme-muted">
                <strong>Colunas encontradas:</strong> {validateMutation.data.headers.slice(0, 10).join(", ")}
                {validateMutation.data.headers.length > 10 && ` (+${validateMutation.data.headers.length - 10} mais)`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Options */}
      {csvContent && validateMutation.data?.valid && (
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4">Opções de Importação</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <Input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4 rounded border-theme"
              />
              <div>
                <span className="font-medium text-theme">Modo Simulação</span>
                <p className="text-sm text-theme-muted">Apenas simula a importação sem gravar dados</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <Input
                type="checkbox"
                checked={updateIfExists}
                onChange={(e) => setUpdateIfExists(e.target.checked)}
                className="w-4 h-4 rounded border-theme"
              />
              <div>
                <span className="font-medium text-theme">Atualizar Existentes</span>
                <p className="text-sm text-theme-muted">Atualiza registros que já existem no sistema</p>
              </div>
            </label>
          </div>

          <Button
            onClick={handleImport}
            isLoading={isImporting}
            leftIcon={<FileCheck className="w-5 h-5" />}
            className="mt-6 w-full py-3"
          >
            {dryRun ? "Simular Importação" : "Executar Importação"}
          </Button>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`bg-theme-card rounded-lg border p-6 ${
          importResult.success ? "border-green-500" : "border-red-500"
        }`}>
          <h2 className="text-lg font-semibold text-theme mb-4">
            {importResult.success ? "✅ Resultado da Importação" : "❌ Erro na Importação"}
          </h2>
          
          <p className="text-theme mb-4">{importResult.message}</p>

          {importResult.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{importResult.summary.created}</p>
                <p className="text-sm text-green-700 dark:text-green-400">Criados</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{importResult.summary.updated}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">Atualizados</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{importResult.summary.skipped}</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">Ignorados</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{importResult.summary.errors}</p>
                <p className="text-sm text-red-700 dark:text-red-400">Erros</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
