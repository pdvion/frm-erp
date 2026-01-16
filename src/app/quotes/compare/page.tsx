"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
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

export default function QuoteComparePage() {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  const { data: materialsWithQuotes, isLoading: loadingMaterials } = 
    trpc.quotes.materialsWithQuotes.useQuery();

  const { data: comparison, isLoading: loadingComparison } = 
    trpc.quotes.compare.useQuery(
      { materialId: selectedMaterialId ?? undefined },
      { enabled: !!selectedMaterialId }
    );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/quotes" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Comparativo de Cotações
                </h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Material Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                Materiais com Cotações
              </h2>

              {loadingMaterials ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : materialsWithQuotes?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum material com múltiplas cotações</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {materialsWithQuotes?.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => setSelectedMaterialId(material.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedMaterialId === material.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        {material.code} - {material.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {material._count.quoteItems} cotações
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Comparison */}
          <div className="lg:col-span-3">
            {!selectedMaterialId ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um Material
                </h3>
                <p className="text-gray-500">
                  Escolha um material na lista ao lado para comparar as cotações
                </p>
              </div>
            ) : loadingComparison ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : comparison?.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sem Cotações para Comparar
                </h3>
                <p className="text-gray-500">
                  Este material não possui cotações ativas para comparação
                </p>
              </div>
            ) : (
              comparison?.map((item) => (
                <div key={item.material.id} className="space-y-6">
                  {/* Material Header */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {item.material.code} - {item.material.description}
                        </h2>
                        <p className="text-gray-500 mt-1">
                          Unidade: {item.material.unit} • {item.quotesCount} cotações
                        </p>
                      </div>
                      {item.bestQuote && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          <Award className="w-4 h-4" />
                          Melhor: {formatCurrency(item.minPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-sm font-medium">Menor Preço</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(item.minPrice)}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-red-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Maior Preço</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(item.maxPrice)}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-sm font-medium">Preço Médio</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(item.avgPrice)}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Variação</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {item.priceVariation.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Quotes Table */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">
                        Cotações Ordenadas por Preço
                      </h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Posição
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Fornecedor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cotação
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Preço Unit.
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Prazo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Validade
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {item.quotes.map((quote, index) => (
                          <tr
                            key={quote.quoteId}
                            className={`${
                              index === 0 ? "bg-green-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              {index === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  <Award className="w-3 h-3" />
                                  1º
                                </span>
                              ) : (
                                <span className="text-gray-500">{index + 1}º</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {quote.supplier.tradeName || quote.supplier.companyName}
                              </div>
                              <div className="text-sm text-gray-500">
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
                                className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                              >
                                #{quote.quoteCode.toString().padStart(6, "0")}
                              </Link>
                              <div className="text-xs text-gray-500">
                                {formatDate(quote.requestDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className={`font-medium ${
                                index === 0 ? "text-green-700" : "text-gray-900"
                              }`}>
                                {formatCurrency(quote.unitPrice)}
                              </span>
                              {index > 0 && (
                                <div className="text-xs text-red-500">
                                  +{((quote.unitPrice - item.minPrice) / item.minPrice * 100).toFixed(1)}%
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                              {quote.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                              {quote.deliveryDays ? `${quote.deliveryDays} dias` : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {formatDate(quote.validUntil)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {quote.quoteStatus === "APPROVED" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  Aprovada
                                </span>
                              ) : (
                                <Link
                                  href={`/quotes/${quote.quoteId}`}
                                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
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
      </main>
    </div>
  );
}
