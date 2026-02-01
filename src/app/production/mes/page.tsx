"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Factory,
  Loader2,
  Play,
  StopCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Settings,
  BarChart3,
  Plus,
  RefreshCw,
} from "lucide-react";

const stopTypeConfig: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Planejada", color: "bg-blue-100 text-blue-800" },
  UNPLANNED: { label: "Não Planejada", color: "bg-red-100 text-red-800" },
  SETUP: { label: "Setup", color: "bg-yellow-100 text-yellow-800" },
  MAINTENANCE: { label: "Manutenção", color: "bg-orange-100 text-orange-800" },
  QUALITY: { label: "Qualidade", color: "bg-purple-100 text-purple-800" },
  MATERIAL: { label: "Material", color: "bg-theme-tertiary text-theme" },
  OTHER: { label: "Outro", color: "bg-theme-tertiary text-theme" },
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

  if (loadingDashboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Terminal MES - Chão de Fábrica"
        icon={<Factory className="w-6 h-6 text-green-500" />}
        backHref="/production"
        module="PRODUCTION"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { refetchDashboard(); refetchStops(); refetchStatus(); }}
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        }
      />

      <div>
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <Factory className="w-4 h-4" />
              <span className="text-sm">Centros de Trabalho</span>
            </div>
            <p className="text-2xl font-bold text-theme">{dashboard?.workCentersCount || 0}</p>
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <StopCircle className="w-4 h-4" />
              <span className="text-sm">Paradas Ativas</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{dashboard?.openStopsCount || 0}</p>
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Play className="w-4 h-4" />
              <span className="text-sm">OPs em Andamento</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{dashboard?.activeOrdersCount || 0}</p>
          </div>

          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Qualidade Hoje</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {formatNumber(dashboard?.todayProduction?.qualityRate || 100)}%
            </p>
            <p className="text-xs text-theme-muted">
              {formatNumber(dashboard?.todayProduction?.good || 0)} boas / {formatNumber(dashboard?.todayProduction?.produced || 0)} total
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Paradas em Aberto */}
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Paradas em Aberto
            </h2>
            
            {openStops?.length === 0 ? (
              <p className="text-theme-muted text-center py-4">Nenhuma parada ativa</p>
            ) : (
              <div className="space-y-3">
                {openStops?.map((stop) => (
                  <div key={stop.id} className="bg-theme-secondary rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{stop.workCenter.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${stopTypeConfig[stop.stopType]?.color || "bg-theme-secondary"}`}>
                        {stopTypeConfig[stop.stopType]?.label || stop.stopType}
                      </span>
                    </div>
                    <p className="text-sm text-theme-muted mb-2">{stop.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(stop.startTime)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleEndStop(stop.id)}
                        disabled={endStopMutation.isPending}
                        className="text-xs bg-green-600 hover:bg-green-700"
                      >
                        Encerrar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seleção de Centro de Trabalho */}
          <div className="lg:col-span-2 bg-theme-card rounded-lg border border-theme p-4">
            <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Terminal de Apontamento
            </h2>

            {!selectedWorkCenter ? (
              <div className="text-center py-8">
                <Factory className="w-12 h-12 text-theme-secondary mx-auto mb-4" />
                <p className="text-theme-muted mb-4">Selecione um centro de trabalho para iniciar</p>
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
                <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
              </div>
            ) : (
              <div>
                {/* Status do Centro de Trabalho */}
                <div className="bg-theme-secondary rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-theme">{workCenterStatus?.workCenter?.name}</h3>
                      <p className="text-sm text-theme-muted">{workCenterStatus?.workCenter?.code}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                      workCenterStatus?.status === "RUNNING" ? "bg-green-600" :
                        workCenterStatus?.status === "STOPPED" ? "bg-red-600" :
                          "bg-theme-tertiary"
                    }`}>
                      {workCenterStatus?.status === "RUNNING" ? "Produzindo" :
                        workCenterStatus?.status === "STOPPED" ? "Parado" : "Ocioso"}
                    </div>
                  </div>

                  {/* OP Ativa */}
                  {workCenterStatus?.activeOrder && (
                    <div className="bg-theme-tertiary rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-theme">OP #{workCenterStatus.activeOrder.code}</span>
                      </div>
                      <p className="text-sm text-theme-secondary">{workCenterStatus.activeOrder.product?.description}</p>
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
                      <div className="mt-2 h-2 bg-theme-tertiary rounded-full overflow-hidden">
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
                    <Button
                      onClick={() => setShowStopModal(true)}
                      className="flex items-center justify-center gap-2 p-4 bg-red-600 hover:bg-red-700 text-lg font-medium h-auto"
                      leftIcon={<StopCircle className="w-6 h-6" />}
                    >
                      Registrar Parada
                    </Button>
                  ) : (
                    <Button
                      onClick={() => workCenterStatus?.openStop && handleEndStop(workCenterStatus.openStop.id)}
                      disabled={endStopMutation.isPending}
                      className="flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-lg font-medium h-auto"
                      leftIcon={<Play className="w-6 h-6" />}
                    >
                      Encerrar Parada
                    </Button>
                  )}

                  {/* Apontar Produção */}
                  <Button
                    onClick={() => setShowReportModal(true)}
                    disabled={!workCenterStatus?.activeOrder || workCenterStatus?.status === "STOPPED"}
                    className="flex items-center justify-center gap-2 p-4 text-lg font-medium h-auto"
                    leftIcon={<Plus className="w-6 h-6" />}
                  >
                    Apontar Produção
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setSelectedWorkCenter(null)}
                  className="mt-4 w-full"
                >
                  Trocar Centro de Trabalho
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Registrar Parada */}
      {showStopModal && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stop-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowStopModal(false)}
        >
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md border border-theme">
            <h3 id="stop-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-red-500" />
              Registrar Parada
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-theme-muted mb-1">Tipo de Parada</label>
                <select
                  value={stopType}
                  onChange={(e) => setStopType(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
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
                <label className="block text-sm text-theme-muted mb-1">Motivo *</label>
                <textarea
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted"
                  placeholder="Descreva o motivo da parada..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowStopModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleStartStop}
                disabled={!stopReason || startStopMutation.isPending}
                isLoading={startStopMutation.isPending}
                className="flex-1"
              >
                Registrar Parada
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apontar Produção */}
      {showReportModal && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowReportModal(false)}
        >
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md border border-theme">
            <h3 id="report-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Apontar Produção
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-theme-muted mb-1">Quantidade Produzida *</label>
                <input
                  type="number"
                  value={reportQty}
                  onChange={(e) => setReportQty(parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme text-2xl text-center"
                />
              </div>

              <div>
                <label className="block text-sm text-theme-muted mb-1">Quantidade Refugo</label>
                <input
                  type="number"
                  value={scrapQty}
                  onChange={(e) => setScrapQty(parseInt(e.target.value) || 0)}
                  min={0}
                  max={reportQty}
                  className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                />
              </div>

              {scrapQty > 0 && (
                <div>
                  <label className="block text-sm text-theme-muted mb-1">Motivo do Refugo</label>
                  <input
                    type="text"
                    value={scrapReason}
                    onChange={(e) => setScrapReason(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted"
                    placeholder="Ex: Dimensional fora, Trinca, etc."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowReportModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleQuickReport}
                disabled={reportQty <= 0 || quickReportMutation.isPending}
                isLoading={quickReportMutation.isPending}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
