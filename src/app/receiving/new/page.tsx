"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeft,
  Upload,
  FileText,
  Package,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

interface ParsedNFe {
  chaveAcesso: string;
  numero: number;
  serie: number;
  dataEmissao: string;
  emitente: {
    cnpj: string;
    razaoSocial: string;
  };
  itens: Array<{
    numero: number;
    codigo: string;
    descricao: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
  totais: {
    valorProdutos: number;
    valorNota: number;
    valorFrete: number;
  };
}

export default function NewReceivingPage() {
  const router = useRouter();
  const [xmlContent, setXmlContent] = useState("");
  const [parsedNfe, setParsedNfe] = useState<ParsedNFe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);

  const importNfeMutation = trpc.nfe.import.useMutation({
    onSuccess: (data) => {
      setParsedNfe({
        chaveAcesso: data.parsed.chaveAcesso,
        numero: data.parsed.numero,
        serie: data.parsed.serie,
        dataEmissao: new Date(data.parsed.dataEmissao).toISOString(),
        emitente: data.parsed.emitente,
        itens: data.parsed.itens.map((item) => ({
          numero: item.numero,
          codigo: item.codigo,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
        })),
        totais: data.parsed.totais,
      });
      if (data.invoice.supplierId) {
        setSelectedSupplier(data.invoice.supplierId);
      }
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      setParsedNfe(null);
    },
  });

  const { data: suppliers } = trpc.suppliers.list.useQuery({
    search: supplierSearch,
    limit: 10,
  });

  const createReceivingMutation = trpc.receiving.createFromNfe.useMutation({
    onSuccess: (data) => {
      router.push(`/receiving/${data.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
      importNfeMutation.mutate({ xmlContent: content });
    };
    reader.readAsText(file);
  }, [importNfeMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".xml")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
      importNfeMutation.mutate({ xmlContent: content });
    };
    reader.readAsText(file);
  }, [importNfeMutation]);

  const handleCreateReceiving = () => {
    if (!parsedNfe || !selectedSupplier) return;

    createReceivingMutation.mutate({
      supplierId: selectedSupplier,
      nfeNumber: String(parsedNfe.numero),
      nfeSeries: String(parsedNfe.serie),
      nfeKey: parsedNfe.chaveAcesso,
      nfeXml: xmlContent,
      nfeIssueDate: new Date(parsedNfe.dataEmissao),
      totalValue: parsedNfe.totais.valorNota,
      freightValue: parsedNfe.totais.valorFrete,
      items: parsedNfe.itens.map((item) => ({
        materialId: "", // Será vinculado depois
        nfeItemNumber: item.numero,
        description: item.descricao,
        unit: item.unidade,
        nfeQuantity: item.quantidade,
        unitPrice: item.valorUnitario,
        totalPrice: item.valorTotal,
        icmsValue: 0,
        ipiValue: 0,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/receiving" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-theme">Nova Entrada de Material</h1>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload XML */}
        {!parsedNfe && (
          <div
            className="bg-theme-card rounded-lg border-2 border-dashed border-theme p-12 text-center hover:border-blue-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <h3 className="text-lg font-medium text-theme mb-2">Importar XML da NFe</h3>
            <p className="text-theme-muted mb-4">Arraste e solte o arquivo XML ou clique para selecionar</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              <FileText className="w-4 h-4" />
              Selecionar Arquivo
              <input
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {importNfeMutation.isPending && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando XML...
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Parsed NFe Data */}
        {parsedNfe && (
          <div className="space-y-6">
            {/* Header da NFe */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-theme flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  NFe {parsedNfe.numero} - Série {parsedNfe.serie}
                </h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  XML Válido
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-theme-muted uppercase">Chave de Acesso</label>
                  <p className="text-sm font-mono text-theme break-all">{parsedNfe.chaveAcesso}</p>
                </div>
                <div>
                  <label className="text-xs text-theme-muted uppercase">Data Emissão</label>
                  <p className="text-sm text-theme flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-theme-muted" />
                    {formatDate(parsedNfe.dataEmissao)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-theme-muted uppercase">Valor Total</label>
                  <p className="text-sm font-semibold text-theme flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-theme-muted" />
                    {formatCurrency(parsedNfe.totais.valorNota)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-theme-muted uppercase">Itens</label>
                  <p className="text-sm text-theme flex items-center gap-1">
                    <Package className="w-4 h-4 text-theme-muted" />
                    {parsedNfe.itens.length} itens
                  </p>
                </div>
              </div>
            </div>

            {/* Fornecedor */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Fornecedor
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-theme-muted uppercase">CNPJ (NFe)</label>
                  <p className="text-sm text-theme">{parsedNfe.emitente.cnpj}</p>
                </div>
                <div>
                  <label className="text-xs text-theme-muted uppercase">Razão Social (NFe)</label>
                  <p className="text-sm text-theme">{parsedNfe.emitente.razaoSocial}</p>
                </div>
              </div>

              {!selectedSupplier && (
                <div className="relative">
                  <div className="flex items-center gap-2 border border-theme-input rounded-lg px-3 py-2">
                    <Search className="w-4 h-4 text-theme-muted" />
                    <input
                      type="text"
                      placeholder="Buscar fornecedor cadastrado..."
                      value={supplierSearch}
                      onChange={(e) => {
                        setSupplierSearch(e.target.value);
                        setShowSupplierSearch(true);
                      }}
                      onFocus={() => setShowSupplierSearch(true)}
                      className="flex-1 outline-none"
                    />
                  </div>
                  {showSupplierSearch && suppliers?.suppliers && suppliers.suppliers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card border border-theme rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
                      {suppliers.suppliers.map((supplier) => (
                        <button
                          key={supplier.id}
                          onClick={() => {
                            setSelectedSupplier(supplier.id);
                            setShowSupplierSearch(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-theme-hover flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-theme">{supplier.companyName}</p>
                            <p className="text-sm text-theme-muted">{supplier.cnpj}</p>
                          </div>
                          <span className="text-xs text-theme-muted">#{supplier.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedSupplier && suppliers?.suppliers && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-theme">
                        {suppliers.suppliers.find((s) => s.id === selectedSupplier)?.companyName}
                      </p>
                      <p className="text-sm text-theme-muted">
                        {suppliers.suppliers.find((s) => s.id === selectedSupplier)?.cnpj}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSupplier(null)}
                    className="text-theme-muted hover:text-theme-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
              <div className="px-6 py-4 border-b border-theme">
                <h3 className="text-lg font-semibold text-theme flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Itens da NFe ({parsedNfe.itens.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">UN</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Vlr Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {parsedNfe.itens.map((item) => (
                      <tr key={item.numero} className="hover:bg-theme-hover">
                        <td className="px-4 py-3 text-sm text-theme-muted">{item.numero}</td>
                        <td className="px-4 py-3 text-sm font-mono text-theme">{item.codigo}</td>
                        <td className="px-4 py-3 text-sm text-theme">{item.descricao}</td>
                        <td className="px-4 py-3 text-sm text-center text-theme-muted">{item.unidade}</td>
                        <td className="px-4 py-3 text-sm text-right text-theme">{item.quantidade.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-sm text-right text-theme-muted">{formatCurrency(item.valorUnitario)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-theme">{formatCurrency(item.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-theme-tertiary">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right text-sm font-medium text-theme-secondary">Total Produtos:</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-theme">{formatCurrency(parsedNfe.totais.valorProdutos)}</td>
                    </tr>
                    {parsedNfe.totais.valorFrete > 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-right text-sm font-medium text-theme-secondary">Frete:</td>
                        <td className="px-4 py-3 text-right text-sm text-theme">{formatCurrency(parsedNfe.totais.valorFrete)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right text-sm font-bold text-theme">Total NFe:</td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-blue-600">{formatCurrency(parsedNfe.totais.valorNota)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between bg-theme-card rounded-lg border border-theme p-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setParsedNfe(null);
                  setXmlContent("");
                  setSelectedSupplier(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateReceiving}
                disabled={!selectedSupplier}
                isLoading={createReceivingMutation.isPending}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Criar Entrada
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
