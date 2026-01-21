"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate, formatNumber } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Calculator,
  ChevronLeft,
  Loader2,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShoppingCart,
  Factory,
  Calendar,
  TrendingUp,
  FileText,
  RefreshCw,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  APPROVED: { label: "Aprovada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  CONVERTED: { label: "Convertida", color: "bg-blue-100 text-blue-800", icon: <FileText className="w-4 h-4" /> },
};

const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PRODUCTION: { label: "Produção", color: "bg-purple-100 text-purple-800", icon: <Factory className="w-4 h-4" /> },
  PURCHASE: { label: "Compra", color: "bg-blue-100 text-blue-800", icon: <ShoppingCart className="w-4 h-4" /> },
  RESCHEDULE: { label: "Reprogramar", color: "bg-orange-100 text-orange-800", icon: <Calendar className="w-4 h-4" /> },
  CANCEL: { label: "Cancelar", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function MrpPage() {
  const [horizonDays, setHorizonDays] = useState(30);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: dashboard, isLoading: loadingDashboard, refetch: refetchDashboard } = trpc.mrp.dashboard.useQuery();
  const { data: runsData, isLoading: loadingRuns, refetch: refetchRuns } = trpc.mrp.listRuns.useQuery({ page: 1, limit: 10 });
  
  const { data: suggestions, isLoading: loadingSuggestions } = trpc.mrp.getSuggestions.useQuery(
    { 
      runId: selectedRunId || "", 
      type: typeFilter === "ALL" ? undefined : typeFilter as "PRODUCTION" | "PURCHASE" | "RESCHEDULE" | "CANCEL",
      status: statusFilter === "ALL" ? undefined : statusFilter as "PENDING" | "APPROVED" | "REJECTED" | "CONVERTED",
    },
    { enabled: !!selectedRunId }
  );

  const runMrpMutation = trpc.mrp.run.useMutation({
    onSuccess: (data) => {
      alert(`MRP executado com sucesso!\n${data.totalSuggestions} sugestões geradas:\n- ${data.productionSuggestions} de produção\n- ${data.purchaseSuggestions} de compra`);
      refetchDashboard();
      refetchRuns();
      setSelectedRunId(data.runId);
    },
    onError: (error) => {
      alert(`Erro ao executar MRP: ${error.message}`);
    },
  });

  const approveMutation = trpc.mrp.approveSuggestion.useMutation({
    onSuccess: () => refetchDashboard(),
  });

  const rejectMutation = trpc.mrp.rejectSuggestion.useMutation({
    onSuccess: () => refetchDashboard(),
  });

  const handleRunMrp = () => {
    if (confirm(`Executar MRP com horizonte de ${horizonDays} dias?`)) {
      runMrpMutation.mutate({ horizonDays });
    }
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Motivo da rejeição:");
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  if (loadingDashboard) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/production" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-theme flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                MRP - Planejamento de Necessidades
              </h1>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Última Execução</span>
            </div>
            <p className="text-lg font-semibold">
              {dashboard?.lastRun ? formatDate(dashboard.lastRun.runDate) : "Nunca"}
            </p>
            {dashboard?.lastRun && (
              <p className="text-sm text-theme-muted">
                {dashboard.lastRun.totalSuggestions} sugestões
              </p>
            )}
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Factory className="w-4 h-4" />
              <span className="text-sm">Produção Pendente</span>
            </div>
            <p className="text-lg font-semibold">
              {dashboard?.pendingSuggestions?.find(s => s.type === "PRODUCTION")?._count || 0}
            </p>
            <p className="text-sm text-theme-muted">ordens sugeridas</p>
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">Compras Pendentes</span>
            </div>
            <p className="text-lg font-semibold">
              {dashboard?.pendingSuggestions?.find(s => s.type === "PURCHASE")?._count || 0}
            </p>
            <p className="text-sm text-theme-muted">ordens sugeridas</p>
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Alertas</span>
            </div>
            <p className="text-lg font-semibold">
              {(dashboard?.materialsWithoutBom || 0) + (dashboard?.materialsWithoutParams || 0)}
            </p>
            <p className="text-sm text-theme-muted">
              {dashboard?.materialsWithoutBom || 0} sem BOM, {dashboard?.materialsWithoutParams || 0} sem parâmetros
            </p>
          </div>
        </div>

        {/* Executar MRP */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" />
            Executar MRP
          </h2>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Horizonte de Planejamento (dias)
              </label>
              <input
                type="number"
                value={horizonDays}
                onChange={(e) => setHorizonDays(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                className="w-32 px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleRunMrp}
              disabled={runMrpMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {runMrpMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Executar MRP
            </button>
          </div>
        </div>

        {/* Histórico de Execuções */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-theme-muted" />
            Histórico de Execuções
          </h2>
          
          {loadingRuns ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
            </div>
          ) : runsData?.runs.length === 0 ? (
            <p className="text-theme-muted text-center py-8">Nenhuma execução encontrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Data</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Horizonte</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Status</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-theme-muted">Produção</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-theme-muted">Compras</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-theme-muted">Total</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-theme-muted">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {runsData?.runs.map((run) => (
                    <tr 
                      key={run.id} 
                      className={`border-b border-gray-100 hover:bg-theme-hover cursor-pointer ${selectedRunId === run.id ? 'bg-purple-50' : ''}`}
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      <td className="py-3 px-3 text-sm">{formatDate(run.runDate)}</td>
                      <td className="py-3 px-3 text-sm">{run.horizonDays} dias</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          run.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                          run.status === "RUNNING" ? "bg-blue-100 text-blue-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {run.status === "COMPLETED" ? <CheckCircle className="w-3 h-3" /> :
                           run.status === "RUNNING" ? <RefreshCw className="w-3 h-3 animate-spin" /> :
                           <XCircle className="w-3 h-3" />}
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-right">{run.productionSuggestions || 0}</td>
                      <td className="py-3 px-3 text-sm text-right">{run.purchaseSuggestions || 0}</td>
                      <td className="py-3 px-3 text-sm text-right font-medium">{run.totalSuggestions || 0}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedRunId(run.id); }}
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          Ver Sugestões
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sugestões da Execução Selecionada */}
        {selectedRunId && (
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-theme flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Sugestões do MRP
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-theme-input rounded-lg text-sm"
                >
                  <option value="ALL">Todos os tipos</option>
                  <option value="PRODUCTION">Produção</option>
                  <option value="PURCHASE">Compra</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-theme-input rounded-lg text-sm"
                >
                  <option value="ALL">Todos os status</option>
                  <option value="PENDING">Pendente</option>
                  <option value="APPROVED">Aprovada</option>
                  <option value="REJECTED">Rejeitada</option>
                  <option value="CONVERTED">Convertida</option>
                </select>
              </div>
            </div>

            {loadingSuggestions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
              </div>
            ) : suggestions?.length === 0 ? (
              <p className="text-theme-muted text-center py-8">Nenhuma sugestão encontrada</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-theme">
                      <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Tipo</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Material</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-theme-muted">Quantidade</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Data Sugerida</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Data Necessária</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Status</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Motivo</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-theme-muted">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions?.map((suggestion) => {
                      const typeInfo = typeConfig[suggestion.type] || typeConfig.PRODUCTION;
                      const statusInfo = statusConfig[suggestion.status] || statusConfig.PENDING;
                      
                      return (
                        <tr key={suggestion.id} className="border-b border-gray-100 hover:bg-theme-hover">
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${typeInfo.color}`}>
                              {typeInfo.icon}
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-sm font-medium">{suggestion.material?.code}</div>
                            <div className="text-xs text-theme-muted">{suggestion.material?.description}</div>
                          </td>
                          <td className="py-3 px-3 text-sm text-right">
                            {formatNumber(suggestion.quantity)} {suggestion.material?.unit}
                          </td>
                          <td className="py-3 px-3 text-sm">{formatDate(suggestion.suggestedDate)}</td>
                          <td className="py-3 px-3 text-sm">{formatDate(suggestion.requiredDate)}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-theme-muted max-w-xs truncate">
                            {suggestion.reason}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {suggestion.status === "PENDING" && (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleApprove(suggestion.id)}
                                  disabled={approveMutation.isPending}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Aprovar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(suggestion.id)}
                                  disabled={rejectMutation.isPending}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Rejeitar"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
