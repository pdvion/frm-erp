"use client";

import { useState } from "react";
import {
  Activity,
  DollarSign,
  Zap,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { formatCostUSD } from "@/lib/ai/costs";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
}

const TASK_TYPE_LABELS: Record<string, string> = {
  MATERIAL_CLASSIFICATION: "Classificação de Materiais",
  CHART_GENERATION: "Geração de Gráficos",
  TEXT_GENERATION: "Geração de Texto",
  CODE_REVIEW: "Revisão de Código",
  TRANSLATION: "Tradução",
  SUMMARIZATION: "Sumarização",
};

export default function AiUsagePage() {
  const [days, setDays] = useState(30);
  const [filterProvider, setFilterProvider] = useState("");
  const [filterTaskType, setFilterTaskType] = useState("");
  const [page, setPage] = useState(1);

  const { data: summary, isLoading: loadingSummary } =
    trpc.aiUsage.getSummary.useQuery();

  const { data: dailyUsage } = trpc.aiUsage.getDailyUsage.useQuery({ days });

  const { data: providerBreakdown } = trpc.aiUsage.getBreakdown.useQuery({
    groupBy: "provider",
  });

  const { data: taskBreakdown } = trpc.aiUsage.getBreakdown.useQuery({
    groupBy: "taskType",
  });

  const { data: logsData, isLoading: loadingLogs } = trpc.aiUsage.list.useQuery({
    page,
    limit: 20,
    provider: filterProvider || undefined,
    taskType: filterTaskType || undefined,
  });

  const logs = logsData?.logs ?? [];
  const totalPages = logsData?.pagination?.totalPages ?? 1;

  const handleExportCSV = () => {
    if (!logs.length) return;

    const headers = [
      "Data",
      "Tarefa",
      "Provider",
      "Modelo",
      "Tokens",
      "Custo (USD)",
      "Latência (ms)",
      "Status",
    ];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString("pt-BR"),
      TASK_TYPE_LABELS[log.taskType] || log.taskType,
      log.provider,
      log.model,
      log.totalTokens,
      log.estimatedCost.toFixed(6),
      log.latencyMs,
      log.success ? "Sucesso" : "Erro",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-usage-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Uso de IA"
        subtitle="Métricas e custos de chamadas de IA"
        icon={<Activity size={24} />}
        actions={
          <Button
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download size={18} />}
          >
            Exportar CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      {loadingSummary ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Chamadas"
            value={formatNumber(summary?.totalCalls ?? 0)}
            change={summary?.callsChange}
            icon={Activity}
            color="bg-blue-600"
          />
          <StatCard
            title="Tokens Consumidos"
            value={formatNumber(summary?.totalTokens ?? 0)}
            change={summary?.tokensChange}
            icon={Zap}
            color="bg-purple-600"
          />
          <StatCard
            title="Custo Estimado"
            value={formatCostUSD(summary?.totalCost ?? 0)}
            change={summary?.costChange}
            icon={DollarSign}
            color="bg-green-600"
          />
          <StatCard
            title="Taxa de Sucesso"
            value={`${summary?.successRate ?? 0}%`}
            icon={CheckCircle}
            color="bg-emerald-600"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Uso por Dia</h3>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>
          <div className="h-48">
            {dailyUsage && dailyUsage.length > 0 ? (
              <div className="flex items-end gap-1 h-full">
                {dailyUsage.slice(-30).map((day, i) => {
                  const maxCalls = Math.max(...dailyUsage.map((d) => d.calls));
                  const height = maxCalls > 0 ? (day.calls / maxCalls) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{ height: `${height}%`, minHeight: day.calls > 0 ? "4px" : "0" }}
                      title={`${day.date}: ${day.calls} chamadas`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Sem dados no período
              </div>
            )}
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium mb-4">Uso por Provider</h3>
          <div className="space-y-3">
            {providerBreakdown && providerBreakdown.length > 0 ? (
              providerBreakdown.map((item) => {
                const total = providerBreakdown.reduce((sum, p) => sum + p.calls, 0);
                const percentage = total > 0 ? (item.calls / total) * 100 : 0;
                const colors: Record<string, string> = {
                  openai: "bg-green-500",
                  anthropic: "bg-orange-500",
                  google: "bg-blue-500",
                };
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize">{item.name}</span>
                      <span className="text-gray-500">
                        {item.calls} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[item.name] || "bg-gray-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-500">Sem dados</div>
            )}
          </div>
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium mb-4">Uso por Tipo de Tarefa</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {taskBreakdown && taskBreakdown.length > 0 ? (
            taskBreakdown.map((item) => (
              <div
                key={item.name}
                className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg"
              >
                <div className="text-lg font-bold">{item.calls}</div>
                <div className="text-sm text-gray-500">
                  {TASK_TYPE_LABELS[item.name] || item.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatCostUSD(item.cost)}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-4 text-gray-500">
              Sem dados
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Histórico de Chamadas</h3>
            <div className="flex items-center gap-2">
              <select
                value={filterProvider}
                onChange={(e) => {
                  setFilterProvider(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              >
                <option value="">Todos Providers</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </select>
              <select
                value={filterTaskType}
                onChange={(e) => {
                  setFilterTaskType(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              >
                <option value="">Todas Tarefas</option>
                {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loadingLogs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum registro encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tarefa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Modelo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tokens
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Custo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Latência
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {TASK_TYPE_LABELS[log.taskType] || log.taskType}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{log.provider}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">
                      {log.model}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(log.totalTokens)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCostUSD(log.estimatedCost)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {log.latencyMs}ms
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.success ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Erro
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
