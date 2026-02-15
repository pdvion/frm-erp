"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import {
  TrendingUp,
  Loader2,
  Trophy,
  XCircle,
  ArrowRight,
  Building2,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  Clock,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "info" | "success" | "error" }> = {
  OPEN: { label: "Aberta", variant: "info" },
  WON: { label: "Ganha", variant: "success" },
  LOST: { label: "Perdida", variant: "error" },
};

interface PipelineStage {
  order: number;
  name: string;
  probability: number;
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const id = params.id as string;

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState("");
  const [lostReason, setLostReason] = useState("");

  const utils = trpc.useUtils();

  const { data: opp, isLoading, isError, error } = trpc.crm.getOpportunity.useQuery({ id });

  const moveMutation = trpc.crm.moveOpportunity.useMutation({
    onSuccess: () => {
      utils.crm.getOpportunity.invalidate({ id });
      setShowMoveModal(false);
      setSelectedStage("");
    },
    onError: (err) => {
      alert(`Erro ao mover: ${err.message}`);
    },
  });

  const winMutation = trpc.crm.winOpportunity.useMutation({
    onSuccess: () => {
      utils.crm.getOpportunity.invalidate({ id });
    },
    onError: (err) => {
      alert(`Erro ao marcar como ganha: ${err.message}`);
    },
  });

  const loseMutation = trpc.crm.loseOpportunity.useMutation({
    onSuccess: () => {
      utils.crm.getOpportunity.invalidate({ id });
      setShowLoseModal(false);
      setLostReason("");
    },
    onError: (err) => {
      alert(`Erro ao marcar como perdida: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Oportunidade" icon={<TrendingUp className="w-6 h-6" />} backHref="/sales/crm/opportunities" module="sales" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (isError || !opp) {
    return (
      <div className="space-y-6">
        <PageHeader title="Oportunidade" icon={<TrendingUp className="w-6 h-6" />} backHref="/sales/crm/opportunities" module="sales" />
        <Alert variant="error" title="Erro ao carregar oportunidade">{error?.message ?? "Não encontrada"}</Alert>
      </div>
    );
  }

  const config = statusConfig[opp.status] ?? statusConfig.OPEN;
  const stages = (opp.pipeline?.stages as unknown as PipelineStage[]) || [];
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const currentStageIndex = sortedStages.findIndex((s) => s.name === opp.stage);

  return (
    <div className="space-y-6">
      <PageHeader
        title={opp.title}
        icon={<TrendingUp className="w-6 h-6" />}
        backHref="/sales/crm/opportunities"
        module="sales"
        badge={{ label: config.label, variant: config.variant }}
        actions={
          opp.status === "OPEN" ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowMoveModal(true)}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Mover Estágio
              </Button>
              <Button variant="primary" onClick={() => winMutation.mutate({ opportunityId: id })} isLoading={winMutation.isPending}>
                <Trophy className="w-4 h-4 mr-2" />
                Ganhar
              </Button>
              <Button variant="danger" onClick={() => setShowLoseModal(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Perder
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Pipeline Progress */}
      {sortedStages.length > 0 && (
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-sm font-medium text-theme-muted mb-4">Progresso no Pipeline: {opp.pipeline?.name}</h3>
          <div className="flex items-center gap-1">
            {sortedStages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stage.name} className="flex-1">
                  <div
                    className={`h-2 rounded-full ${
                      isCompleted
                        ? "bg-green-500"
                        : isCurrent
                          ? "bg-blue-500"
                          : "bg-theme-tertiary"
                    }`}
                  />
                  <p className={`text-xs mt-1 text-center ${isCurrent ? "font-semibold text-theme" : "text-theme-muted"}`}>
                    {stage.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
          <h3 className="text-sm font-semibold text-theme uppercase tracking-wider">Detalhes</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Valor</p>
                <p className="text-sm font-medium text-theme">{formatCurrency(Number(opp.value))}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Probabilidade</p>
                <p className="text-sm font-medium text-theme">{opp.probability}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Previsão de Fechamento</p>
                <p className="text-sm font-medium text-theme">
                  {opp.expectedCloseDate ? formatDate(opp.expectedCloseDate) : "Não definida"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Cliente</p>
                <p className="text-sm font-medium text-theme">{opp.customer?.companyName ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Responsável</p>
                <p className="text-sm font-medium text-theme">{opp.assignedUser?.name ?? "Não atribuído"}</p>
              </div>
            </div>
          </div>
          {opp.notes && (
            <div className="pt-3 border-t border-theme">
              <p className="text-xs text-theme-muted mb-1">Observações</p>
              <p className="text-sm text-theme-secondary">{opp.notes}</p>
            </div>
          )}
        </div>

        {/* Communication Logs */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-sm font-semibold text-theme uppercase tracking-wider mb-4">Últimas Comunicações</h3>
          {!opp.communicationLogs?.length ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 mx-auto text-theme-muted mb-2" />
              <p className="text-sm text-theme-muted">Nenhuma comunicação registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {opp.communicationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-theme-secondary">
                  <MessageSquare className="w-4 h-4 text-theme-muted mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.channel}</Badge>
                      <Badge variant={log.direction === "INBOUND" ? "info" : "success"}>
                        {log.direction === "INBOUND" ? "Entrada" : "Saída"}
                      </Badge>
                    </div>
                    {log.subject && <p className="text-sm font-medium text-theme mt-1">{log.subject}</p>}
                    {log.content && <p className="text-xs text-theme-muted mt-1 line-clamp-2">{log.content}</p>}
                    <div className="flex items-center gap-1 text-xs text-theme-muted mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.occurredAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Move Stage Modal */}
      <Modal isOpen={showMoveModal} onClose={() => setShowMoveModal(false)} title="Mover Estágio">
        <div className="space-y-3">
          <p className="text-sm text-theme-muted">Estágio atual: <strong>{opp.stage}</strong></p>
          <div className="space-y-2">
            {sortedStages
              .filter((s) => s.name !== opp.stage)
              .map((stage) => (
                <Button
                  key={stage.name}
                  variant="ghost"
                  onClick={() => setSelectedStage(stage.name)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors h-auto ${
                    selectedStage === stage.name
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-theme hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-theme">{stage.name}</span>
                    <span className="text-xs text-theme-muted">{stage.probability}%</span>
                  </div>
                </Button>
              ))}
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowMoveModal(false)}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => moveMutation.mutate({ opportunityId: id, newStage: selectedStage })}
            isLoading={moveMutation.isPending}
            disabled={!selectedStage}
          >
            Mover para {selectedStage || "..."}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Lose Modal */}
      <Modal isOpen={showLoseModal} onClose={() => setShowLoseModal(false)} title="Marcar como Perdida">
        <div className="space-y-4">
          <p className="text-sm text-theme-muted">Informe o motivo da perda desta oportunidade.</p>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Motivo *</label>
            <Input
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Ex: Preço, concorrente, prazo..."
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowLoseModal(false)}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={() => loseMutation.mutate({ opportunityId: id, lostReason })}
            isLoading={loseMutation.isPending}
            disabled={!lostReason.trim()}
          >
            Confirmar Perda
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
