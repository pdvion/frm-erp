"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Mail,
  FileUp
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";

interface ImportResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: number;
  supplierName?: string;
  totalValue?: number;
  itemsCount?: number;
  linkedItemsCount?: number;
  error?: string;
}

export default function NFeImportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upload" | "email">("upload");
  const [xmlContent, setXmlContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const importMutation = trpc.nfe.import.useMutation({
    onSuccess: (data) => {
      setResults((prev) => [
        ...prev,
        {
          success: true,
          invoiceId: data.invoice.id,
          invoiceNumber: data.invoice.invoiceNumber,
          supplierName: data.invoice.supplierName,
          totalValue: data.invoice.totalInvoice,
          itemsCount: data.itemsCount,
          linkedItemsCount: data.linkedItemsCount,
        },
      ]);
    },
    onError: (error) => {
      setResults((prev) => [
        ...prev,
        {
          success: false,
          error: error.message,
        },
      ]);
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.toLowerCase().endsWith(".xml")) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
    };
    reader.readAsText(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleImport = async () => {
    if (!xmlContent) return;

    setIsProcessing(true);
    try {
      await importMutation.mutateAsync({ xmlContent });
    } finally {
      setIsProcessing(false);
      setXmlContent("");
      setFileName("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar NFe"
        icon={<Upload className="w-6 h-6 text-blue-600" />}
        backHref="/fiscal/nfe"
        actions={
          <Link
            href="/fiscal/nfe"
            className="flex items-center gap-2 px-4 py-2 text-theme-secondary hover:text-theme"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-theme-card rounded-xl border border-theme mb-6">
          <div className="border-b border-theme">
            <nav className="flex -mb-px">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("upload")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 rounded-none h-auto ${
                  activeTab === "upload"
                    ? "border-[var(--frm-primary)] text-[var(--frm-primary)]"
                    : "border-transparent text-theme-muted hover:text-theme-secondary hover:border-theme"
                }`}
                leftIcon={<FileUp className="w-5 h-5" />}
              >
                Upload de Arquivo
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("email")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 rounded-none h-auto ${
                  activeTab === "email"
                    ? "border-[var(--frm-primary)] text-[var(--frm-primary)]"
                    : "border-transparent text-theme-muted hover:text-theme-secondary hover:border-theme"
                }`}
                leftIcon={<Mail className="w-5 h-5" />}
              >
                Importar do Email
              </Button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "upload" && (
              <div className="space-y-6">
                {/* Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    xmlContent
                      ? "border-green-300 bg-green-50"
                      : "border-theme hover:border-[var(--frm-primary)] hover:bg-[var(--frm-50)]"
                  }`}
                >
                  {xmlContent ? (
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                      <div>
                        <p className="text-lg font-medium text-theme">{fileName}</p>
                        <p className="text-sm text-theme-muted">Arquivo carregado com sucesso</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setXmlContent("");
                          setFileName("");
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remover arquivo
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-theme-muted" />
                      <div>
                        <p className="text-lg font-medium text-theme">
                          Arraste o arquivo XML aqui
                        </p>
                        <p className="text-sm text-theme-muted">ou clique para selecionar</p>
                      </div>
                      <Input
                        type="file"
                        accept=".xml"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ position: "relative" }}
                      />
                      <label className="px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] cursor-pointer transition-colors">
                        Selecionar Arquivo
                        <Input
                          type="file"
                          accept=".xml"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Import Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={!xmlContent || isProcessing}
                    isLoading={isProcessing}
                    leftIcon={!isProcessing ? <Upload className="w-5 h-5" /> : undefined}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Importar NFe
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="text-center py-8">
                <Mail className="w-16 h-16 text-theme-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-theme mb-2">
                  Importação por Email
                </h3>
                <p className="text-theme-muted mb-4">
                  Configure uma conta de email para receber XMLs automaticamente.
                </p>
                <Link
                  href="/settings/email-integration"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors"
                >
                  Configurar Integração
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-lg font-medium text-theme mb-4">
              Resultados da Importação
            </h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    result.success ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  {result.success ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800">
                          NFe {result.invoiceNumber} importada com sucesso
                        </p>
                        <p className="text-sm text-green-600">
                          {result.supplierName} • {formatCurrency(result.totalValue || 0)}
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                          {result.itemsCount} itens • {result.linkedItemsCount} vinculados automaticamente
                        </p>
                        <Link
                          href={`/fiscal/nfe/${result.invoiceId}`}
                          className="text-sm text-[var(--frm-primary)] hover:underline mt-2 inline-block"
                        >
                          Ver detalhes →
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-800">Erro na importação</p>
                        <p className="text-sm text-red-600">{result.error}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {results.some((r) => r.success) && (
              <div className="mt-4 pt-4 border-t border-theme flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setResults([])}
                >
                  Limpar resultados
                </Button>
                <Button
                  onClick={() => router.push("/fiscal/nfe")}
                >
                  Ver todas as NFes
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Help */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Dicas para importação</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Aceite apenas arquivos XML de NFe válidos</li>
                <li>• O sistema detecta automaticamente o fornecedor pelo CNPJ</li>
                <li>• Itens são vinculados automaticamente por código do produto</li>
                <li>• NFes duplicadas (mesma chave de acesso) são rejeitadas</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
