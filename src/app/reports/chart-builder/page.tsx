"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  SimpleLineChart,
  SimpleBarChart,
  SimplePieChart,
  SimpleAreaChart,
  DonutChart,
  ChartCard,
} from "@/components/charts";
import { Input } from "@/components/ui/Input";
import {
  BarChart3,
  Sparkles,
  Send,
  Loader2,
  Settings2,
  Save,
  Lightbulb,
} from "lucide-react";
import type { ChartConfig } from "@/lib/ai/chartGenerator";

type ChartType = "line" | "bar" | "pie" | "area" | "donut";

const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

export default function ChartBuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [config, setConfig] = useState<ChartConfig>({
    type: "bar",
    title: "Novo Gráfico",
    xAxis: "mes",
    yAxis: ["valor"],
    showGrid: true,
    showLegend: true,
  });
  const [explanation, setExplanation] = useState("");
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState("vendas");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const { data: suggestions } = trpc.chartBuilder.getSuggestions.useQuery();
  const { data: dataSources } = trpc.chartBuilder.getDataSources.useQuery();
  const { data: chartData, isLoading: isLoadingData } = trpc.chartBuilder.getChartData.useQuery({
    dataSource: selectedDataSource,
    xAxis: config.xAxis ?? "mes",
    yAxis: config.yAxis ?? ["valor"],
  });

  const generateMutation = trpc.chartBuilder.generateFromPrompt.useMutation({
    onSuccess: (data) => {
      setConfig(data.config);
      setExplanation(data.explanation);
      setSuggestedQueries(data.suggestedQueries ?? []);
    },
  });

  const saveMutation = trpc.chartBuilder.saveTemplate.useMutation({
    onSuccess: () => {
      setShowSaveModal(false);
      setTemplateName("");
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate({ prompt });
  };

  const handleSuggestionClick = (suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
    generateMutation.mutate({ prompt: suggestionPrompt });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveMutation.mutate({
      name: templateName,
      config,
      dataSource: selectedDataSource,
    });
  };

  const renderChart = () => {
    if (isLoadingData || !chartData) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      );
    }

    // Ensure data has 'name' property for chart components
    const formattedData = chartData.map((item) => ({
      ...item,
      name: String(item.name ?? ""),
    }));

    const dataKeys = (config.yAxis ?? ["valor"]).map((key, index) => ({
      key,
      color: config.colors?.[index] ?? CHART_COLORS[index % CHART_COLORS.length],
      name: key,
    }));

    switch (config.type) {
      case "line":
        return (
          <SimpleLineChart
            data={formattedData}
            dataKeys={dataKeys}
            height={350}
            showGrid={config.showGrid}
            showLegend={config.showLegend}
          />
        );
      case "bar":
        return (
          <SimpleBarChart
            data={formattedData}
            dataKeys={dataKeys}
            height={350}
            showGrid={config.showGrid}
            showLegend={config.showLegend}
          />
        );
      case "pie":
        return (
          <SimplePieChart
            data={formattedData}
            dataKey={config.yAxis?.[0] ?? "valor"}
            height={350}
            showLegend={config.showLegend}
          />
        );
      case "donut":
        return (
          <DonutChart
            data={formattedData}
            dataKey={config.yAxis?.[0] ?? "valor"}
            height={350}
            showLegend={config.showLegend}
          />
        );
      case "area":
        return (
          <SimpleAreaChart
            data={formattedData}
            dataKeys={dataKeys}
            height={350}
            showGrid={config.showGrid}
            showLegend={config.showLegend}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editor de Gráficos com IA"
        icon={<BarChart3 className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Relatórios", href: "/reports" },
          { label: "Editor de Gráficos" },
        ]}
        actions={
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Salvar Template
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Painel de Configuração */}
        <div className="col-span-4 space-y-4">
          {/* Input de Linguagem Natural */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="text-sm font-semibold text-theme mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Gerar com IA
            </h3>
            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Ex: Mostre vendas por mês"
                className="flex-1 text-sm"
              />
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !prompt.trim()}
                className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {explanation && (
              <p className="mt-2 text-xs text-theme-muted">{explanation}</p>
            )}
          </div>

          {/* Sugestões */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="text-sm font-semibold text-theme mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Sugestões
            </h3>
            <div className="space-y-2">
              {(suggestedQueries.length > 0 ? suggestedQueries : suggestions?.map((s) => s.prompt) ?? [])
                .slice(0, 4)
                .map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(query)}
                    className="w-full text-left text-sm p-2 rounded-lg hover:bg-theme-secondary text-theme-muted hover:text-theme transition-colors"
                  >
                    {query}
                  </button>
                ))}
            </div>
          </div>

          {/* Configuração Manual */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="text-sm font-semibold text-theme mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-500" />
              Configuração
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-theme-muted mb-1">
                  Tipo de Gráfico
                </label>
                <select
                  value={config.type}
                  onChange={(e) => setConfig({ ...config, type: e.target.value as ChartType })}
                  className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme"
                >
                  <option value="line">Linha</option>
                  <option value="bar">Barras</option>
                  <option value="area">Área</option>
                  <option value="pie">Pizza</option>
                  <option value="donut">Rosca</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-theme-muted mb-1">
                  Fonte de Dados
                </label>
                <select
                  value={selectedDataSource}
                  onChange={(e) => setSelectedDataSource(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme"
                >
                  {dataSources?.map((ds) => (
                    <option key={ds.name} value={ds.name}>
                      {ds.description}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Título"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="text-sm"
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-theme">
                  <input
                    type="checkbox"
                    checked={config.showGrid}
                    onChange={(e) => setConfig({ ...config, showGrid: e.target.checked })}
                    className="rounded"
                  />
                  Grade
                </label>
                <label className="flex items-center gap-2 text-sm text-theme">
                  <input
                    type="checkbox"
                    checked={config.showLegend}
                    onChange={(e) => setConfig({ ...config, showLegend: e.target.checked })}
                    className="rounded"
                  />
                  Legenda
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preview do Gráfico */}
        <div className="col-span-8">
          <ChartCard title={config.title} subtitle="Preview em tempo real">
            {renderChart()}
          </ChartCard>
        </div>
      </div>

      {/* Modal de Salvar Template */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-theme mb-4">Salvar Template</h3>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nome do template"
              className="text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm border border-theme rounded-lg hover:bg-theme-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saveMutation.isPending || !templateName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
