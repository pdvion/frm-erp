"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Factory,
  ChevronLeft,
  Loader2,
  Play,
  Pause,
  StopCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Wrench,
  Settings,
  BarChart3,
  Plus,
  XCircle,
  RefreshCw,
} from "lucide-react";

const stopTypeConfig: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Planejada", color: "bg-blue-100 text-blue-800" },
  UNPLANNED: { label: "Não Planejada", color: "bg-red-100 text-red-800" },
  SETUP: { label: "Setup", color: "bg-yellow-100 text-yellow-800" },
  MAINTENANCE: { label: "Manutenção", color: "bg-orange-100 text-orange-800" },
  QUALITY: { label: "Qualidade", color: "bg-purple-100 text-purple-800" },
  MATERIAL: { label: "Material", color: "bg-gray-100 text-gray-800" },
  OTHER: { label: "Outro", color: "bg-gray-100 text-gray-800" },
};

export default function MesPage() {
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<string | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopType, setStopType] = useState<string>("UNPLANNED");
  const [stopReason, setStopReason] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportQty, setReportQty] = useState(0);
  const [scrapQty, setScrapQty] = useState(0);
  const [scrapReason, setScrapReason] = useState("");

  const { data: dashboard, isLoading: loadingDashboard, refetch: refetchDashboard } = trpc.mes.dashboard.useQuery();
  const { data: openStops, refetch: refetchStops } = trpc.mes.getOpenStops.useQuery();
  
  const { data: workCenterStatus, isLoading: loadingStatus, refetch: refetchStatus } = trpc.mes.getWorkCenterStatus.useQuery(
    { workCenterId: selectedWorkCenter || "" },
    { enabled: !!selectedWorkCenter }
  );

  const startStopMutation = trpc.mes.startMachineStop.useMutation({
    onSuccess: () => {
      setShowStopModal(false);
      setStopReason("");
      refetchStops();
      refetchStatus();
      refetchDashboard();
    },
  });

  const endStopMutation = trpc.mes.endMachineStop.useMutation({
    onSuccess: () => {
      refetchStops();
      refetchStatus();
      refetchDashboard();
    },
  });

  const quickReportMutation = trpc.mes.quickReport.useMutation({
    onSuccess: (data) => {
      setShowReportModal(false);
      setReportQty(0);
      setScrapQty(0);
      setScrapReason("");
      refetchStatus();
      refetchDashboard();
      if (data.isComplete) {
        alert("Ordem de produção concluída!");
      }
    },
  });

  const handleStartStop = () => {
    if (!selectedWorkCenter || !stopReason) return;
    startStopMutation.mutate({
      workCenterId: selectedWorkCenter,
      stopType: stopType as "PLANNED" | "UNPLANNED" | "SETUP" | "MAINTENANCE" | "QUALITY" | "MATERIAL" | "OTHER",
      reason: stopReason,
      productionLogId: workCenterStatus?.todayLog?.id,
    });
  };

  const handleEndStop = (stopId: string) => {
    const solution = prompt("Solução aplicada (opcional):");
    endStopMutation.mutate({ id: stopId, solution: solution || undefined });
  };

  const handleQuickReport = () => {
    if (!selectedWorkCenter || !workCenterStatus?.activeOrder || reportQty <= 0) return;
    quickReportMutation.mutate({
      workCenterId: selectedWorkCenter,
      productionOrderId: workCenterStatus.activeOrder.id,
      quantity: reportQty,
      scrapQty,
      scrapReason: scrapReason || undefined,
    });
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(startTime).getTime()) / 60000);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  };

  if (loadingDashboard) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/production" className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Factory className="w-5 h-5 text-green-500" />
                Terminal MES - Chão de Fábrica
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { refetchDashboard(); refetchStops(); refetchStatus(); }}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Factory className="w-4 h-4" />
              <span className="text-sm">Centros de Trabalho</span>
            </div>
            <p className="text-2xl font-bold text-white">{dashboard?.workCentersCount || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <StopCircle className="w-4 h-4" />
              <span className="text-sm">Paradas Ativas</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{dashboard?.openStopsCount || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Play className="w-4 h-4" />
              <span className="text-sm">OPs em Andamento</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{dashboard?.activeOrdersCount || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Qualidade Hoje</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {formatNumber(dashboard?.todayProduction?.qualityRate || 100)}%
            </p>
            <p className="text-xs text-gray-500">
              {formatNumber(dashboard?.todayProduction?.good || 0)} boas / {formatNumber(dashboard?.todayProduction?.produced || 0)} total
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Paradas em Aberto */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Paradas em Aberto
            </h2>
            
            {openStops?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma parada ativa</p>
            ) : (
              <div className="space-y-3">
                {openStops?.map((stop) => (
                  <div key={stop.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{stop.workCenter.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${stopTypeConfig[stop.stopType]?.color || "bg-gray-600"}`}>
                        {stopTypeConfig[stop.stopType]?.label || stop.stopType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{stop.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(stop.startTime)}
                      </span>
                      <button
                        onClick={() => handleEndStop(stop.id)}
                        disabled={endStopMutation.isPending}
                        className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 rounded"
                      >
                        Encerrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seleção de Centro de Trabalho */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Terminal de Apontamento
            </h2>

            {!selectedWorkCenter ? (
              <div className="text-center py-8">
                <Factory className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Selecione um centro de trabalho para iniciar</p>
                <Link
                  href="/production/work-centers"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar Centros de Trabalho
                </Link>
              </div>
            ) : loadingStatus ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div>
                {/* Status do Centro de Trabalho */}
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">{workCenterStatus?.workCenter?.name}</h3>
                      <p className="text-sm text-gray-400">{workCenterStatus?.workCenter?.code}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      workCenterStatus?.status === "RUNNING" ? "bg-green-600" :
                      workCenterStatus?.status === "STOPPED" ? "bg-red-600" :
                      "bg-gray-600"
                    }`}>
                      {workCenterStatus?.status === "RUNNING" ? "Produzindo" :
                       workCenterStatus?.status === "STOPPED" ? "Parado" : "Ocioso"}
                    </div>
                  </div>

                  {/* OP Ativa */}
                  {workCenterStatus?.activeOrder && (
                    <div className="bg-gray-600 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">OP #{workCenterStatus.activeOrder.code}</span>
                      </div>
                      <p className="text-sm text-gray-300">{workCenterStatus.activeOrder.product?.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span>Qtd: {formatNumber(workCenterStatus.activeOrder.quantity)}</span>
                        <span className="text-green-400">
                          Produzido: {formatNumber(workCenterStatus.activeOrder.producedQty)}
                        </span>
                        <span className="text-yellow-400">
                          Falta: {formatNumber(workCenterStatus.activeOrder.quantity - workCenterStatus.activeOrder.producedQty)}
                        </span>
                      </div>
                      {/* Barra de progresso */}
                      <div className="mt-2 h-2 bg-gray-500 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${Math.min(100, (workCenterStatus.activeOrder.producedQty / workCenterStatus.activeOrder.quantity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* OEE do Dia */}
                  {workCenterStatus?.oee !== null && workCenterStatus?.oee !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span>OEE Hoje: </span>
                      <span className={`font-medium ${
                        workCenterStatus.oee >= 85 ? "text-green-400" :
                        workCenterStatus.oee >= 60 ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {formatNumber(workCenterStatus.oee)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Registrar Parada */}
                  {workCenterStatus?.status !== "STOPPED" ? (
                    <button
                      onClick={() => setShowStopModal(true)}
                      className="flex items-center justify-center gap-2 p-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium"
                    >
                      <StopCircle className="w-6 h-6" />
                      Registrar Parada
                    </button>
                  ) : (
                    <button
                      onClick={() => workCenterStatus?.openStop && handleEndStop(workCenterStatus.openStop.id)}
                      disabled={endStopMutation.isPending}
                      className="flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium"
                    >
                      <Play className="w-6 h-6" />
                      Encerrar Parada
                    </button>
                  )}

                  {/* Apontar Produção */}
                  <button
                    onClick={() => setShowReportModal(true)}
                    disabled={!workCenterStatus?.activeOrder || workCenterStatus?.status === "STOPPED"}
                    className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-lg font-medium"
                  >
                    <Plus className="w-6 h-6" />
                    Apontar Produção
                  </button>
                </div>

                <button
                  onClick={() => setSelectedWorkCenter(null)}
                  className="mt-4 w-full text-center text-gray-400 hover:text-white py-2"
                >
                  Trocar Centro de Trabalho
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Registrar Parada */}
      {showStopModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-red-500" />
              Registrar Parada
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de Parada</label>
                <select
                  value={stopType}
                  onChange={(e) => setStopType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="UNPLANNED">Não Planejada</option>
                  <option value="PLANNED">Planejada</option>
                  <option value="SETUP">Setup</option>
                  <option value="MAINTENANCE">Manutenção</option>
                  <option value="QUALITY">Qualidade</option>
                  <option value="MATERIAL">Falta de Material</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Motivo *</label>
                <textarea
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Descreva o motivo da parada..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStopModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleStartStop}
                disabled={!stopReason || startStopMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg"
              >
                {startStopMutation.isPending ? "Registrando..." : "Registrar Parada"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apontar Produção */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Apontar Produção
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantidade Produzida *</label>
                <input
                  type="number"
                  value={reportQty}
                  onChange={(e) => setReportQty(parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-2xl text-center"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantidade Refugo</label>
                <input
                  type="number"
                  value={scrapQty}
                  onChange={(e) => setScrapQty(parseInt(e.target.value) || 0)}
                  min={0}
                  max={reportQty}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {scrapQty > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Motivo do Refugo</label>
                  <input
                    type="text"
                    value={scrapReason}
                    onChange={(e) => setScrapReason(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Ex: Dimensional fora, Trinca, etc."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleQuickReport}
                disabled={reportQty <= 0 || quickReportMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
              >
                {quickReportMutation.isPending ? "Apontando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
