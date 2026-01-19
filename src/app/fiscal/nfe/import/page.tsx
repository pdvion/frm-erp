"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Mail,
  FileUp
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

interface ImportResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Importar NFe"
        icon={Upload}
        backUrl="/fiscal/nfe"
        actions={
          <Link
            href="/fiscal/nfe"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "upload"
                    ? "border-[var(--frm-primary)] text-[var(--frm-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileUp className="w-5 h-5" />
                Upload de Arquivo
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "email"
                    ? "border-[var(--frm-primary)] text-[var(--frm-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Mail className="w-5 h-5" />
                Importar do Email
              </button>
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
                      : "border-gray-300 hover:border-[var(--frm-primary)] hover:bg-[var(--frm-50)]"
                  }`}
                >
                  {xmlContent ? (
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">{fileName}</p>
                        <p className="text-sm text-gray-500">Arquivo carregado com sucesso</p>
                      </div>
                      <button
                        onClick={() => {
                          setXmlContent("");
                          setFileName("");
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remover arquivo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Arraste o arquivo XML aqui
                        </p>
                        <p className="text-sm text-gray-500">ou clique para selecionar</p>
                      </div>
                      <input
                        type="file"
                        accept=".xml"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ position: "relative" }}
                      />
                      <label className="px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] cursor-pointer transition-colors">
                        Selecionar Arquivo
                        <input
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
                  <button
                    onClick={handleImport}
                    disabled={!xmlContent || isProcessing}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  </button>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="text-center py-8">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Importação por Email
                </h3>
                <p className="text-gray-500 mb-4">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
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
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setResults([])}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Limpar resultados
                </button>
                <button
                  onClick={() => router.push("/fiscal/nfe")}
                  className="px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors"
                >
                  Ver todas as NFes
                </button>
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
