"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Award,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function QuoteComparePage() {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  const { data: materialsWithQuotes, isLoading: loadingMaterials } = 
    trpc.quotes.materialsWithQuotes.useQuery();

  const { data: comparison, isLoading: loadingComparison } = 
    trpc.quotes.compare.useQuery(
      { materialId: selectedMaterialId ?? undefined },
      { enabled: !!selectedMaterialId }
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comparativo de Cotações"
        subtitle="Compare preços entre fornecedores"
        icon={<BarChart3 className="w-6 h-6" />}
        backHref="/quotes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Material Selection */}
        <div className="lg:col-span-1">
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <h2 className="font-medium text-theme mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-theme-muted" />
              Materiais com Cotações
            </h2>

            {loadingMaterials ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : materialsWithQuotes?.length === 0 ? (
              <div className="text-center py-8 text-theme-muted text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 text-theme-muted" />
                <p>Nenhum material com múltiplas cotações</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {materialsWithQuotes?.map((material) => (
                  <Button
                    key={material.id}
                    onClick={() => setSelectedMaterialId(material.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMaterialId === material.id
                        ? "border-purple-500 bg-purple-900/20"
                        : "border-theme hover:border-theme-input hover:bg-theme-hover"
                    }`}
                  >
                    <div className="font-medium text-theme text-sm">
                      {material.code} - {material.description}
                    </div>
                    <div className="text-xs text-theme-muted mt-1">
                      {material._count.quoteItems} cotações
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Comparison */}
        <div className="lg:col-span-3">
          {!selectedMaterialId ? (
            <div className="bg-theme-card rounded-lg border border-theme p-12 text-center">
              <BarChart3 className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">
                Selecione um Material
              </h3>
              <p className="text-theme-secondary">
                Escolha um material na lista ao lado para comparar as cotações
              </p>
            </div>
          ) : loadingComparison ? (
            <div className="bg-theme-card rounded-lg border border-theme p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : comparison?.length === 0 ? (
            <div className="bg-theme-card rounded-lg border border-theme p-12 text-center">
              <AlertCircle className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">
                Sem Cotações para Comparar
              </h3>
              <p className="text-theme-secondary">
                Este material não possui cotações ativas para comparação
              </p>
            </div>
          ) : (
            comparison?.map((item) => (
              <div key={item.material.id} className="space-y-6">
                {/* Material Header */}
                <div className="bg-theme-card rounded-lg border border-theme p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-theme">
                        {item.material.code} - {item.material.description}
                      </h2>
                      <p className="text-theme-secondary mt-1">
                        Unidade: {item.material.unit} • {item.quotesCount} cotações
                      </p>
                    </div>
                    {item.bestQuote && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 text-green-400 rounded-full text-sm font-medium">
                        <Award className="w-4 h-4" />
                        Melhor: {formatCurrency(item.minPrice)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-theme-card rounded-lg border border-theme p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-1">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm font-medium">Menor Preço</span>
                    </div>
                    <div className="text-2xl font-bold text-theme">
                      {formatCurrency(item.minPrice)}
                    </div>
                  </div>

                  <div className="bg-theme-card rounded-lg border border-theme p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Maior Preço</span>
                    </div>
                    <div className="text-2xl font-bold text-theme">
                      {formatCurrency(item.maxPrice)}
                    </div>
                  </div>

                  <div className="bg-theme-card rounded-lg border border-theme p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Preço Médio</span>
                    </div>
                    <div className="text-2xl font-bold text-theme">
                      {formatCurrency(item.avgPrice)}
                    </div>
                  </div>

                  <div className="bg-theme-card rounded-lg border border-theme p-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Variação</span>
                    </div>
                    <div className="text-2xl font-bold text-theme">
                      {item.priceVariation.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Quotes Table */}
                <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
                  <div className="px-6 py-4 border-b border-theme">
                    <h3 className="font-medium text-theme">
                      Cotações Ordenadas por Preço
                    </h3>
                  </div>
                  <table className="min-w-full divide-y divide-theme-table">
                    <thead className="bg-theme-table-header">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Posição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Fornecedor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Cotação
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                          Preço Unit.
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                          Prazo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Validade
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {item.quotes.map((quote, index) => (
                        <tr
                          key={quote.quoteId}
                          className={`${
                            index === 0 ? "bg-green-900/20" : "hover:bg-theme-table-hover"
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {index === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-medium">
                                <Award className="w-3 h-3" />
                                1º
                              </span>
                            ) : (
                              <span className="text-theme-muted">{index + 1}º</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-theme">
                              {quote.supplier.tradeName || quote.supplier.companyName}
                            </div>
                            <div className="text-sm text-theme-muted">
                              Cód: {quote.supplier.code}
                              {quote.supplier.qualityIndex && (
                                <span className="ml-2">
                                  IQF: {quote.supplier.qualityIndex.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/quotes/${quote.quoteId}`}
                              className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                            >
                              #{quote.quoteCode.toString().padStart(6, "0")}
                            </Link>
                            <div className="text-xs text-theme-muted">
                              {formatDate(quote.requestDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`font-medium ${
                              index === 0 ? "text-green-600 dark:text-green-400" : "text-theme"
                            }`}>
                              {formatCurrency(quote.unitPrice)}
                            </span>
                            {index > 0 && (
                              <div className="text-xs text-red-600 dark:text-red-400">
                                +{((quote.unitPrice - item.minPrice) / item.minPrice * 100).toFixed(1)}%
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-theme">
                            {quote.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-theme-secondary">
                            {quote.deliveryDays ? `${quote.deliveryDays} dias` : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-theme-secondary">
                            {formatDate(quote.validUntil)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {quote.quoteStatus === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                                <CheckCircle className="w-3 h-3" />
                                Aprovada
                              </span>
                            ) : (
                              <Link
                                href={`/quotes/${quote.quoteId}`}
                                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                              >
                                Ver
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
