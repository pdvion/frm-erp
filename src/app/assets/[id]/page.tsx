"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import {
  Building,
  Loader2,
  TrendingDown,
  ArrowRightLeft,
  Trash2,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";

const categoryLabels: Record<string, string> = {
  MACHINERY: "Máquinas",
  VEHICLES: "Veículos",
  FURNITURE: "Móveis",
  IT_EQUIPMENT: "Equipamentos TI",
  BUILDINGS: "Imóveis",
  LAND: "Terrenos",
  OTHER: "Outros",
};

const statusConfig: Record<string, { label: string; variant: "success" | "error" | "warning" | "default" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  DISPOSED: { label: "Baixado", variant: "error" },
  TRANSFERRED: { label: "Transferido", variant: "warning" },
  FULLY_DEPRECIATED: { label: "Depreciado", variant: "default" },
};

const movementTypeLabels: Record<string, string> = {
  ACQUISITION: "Aquisição",
  DEPRECIATION: "Depreciação",
  DISPOSAL: "Baixa",
  TRANSFER: "Transferência",
  REVALUATION: "Reavaliação",
  IMPAIRMENT: "Impairment",
};

export default function AssetDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showDispose, setShowDispose] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [disposalValue, setDisposalValue] = useState("");
  const [disposalReason, setDisposalReason] = useState("");
  const [transferLocation, setTransferLocation] = useState("");
  const [transferDescription, setTransferDescription] = useState("");

  const utils = trpc.useUtils();

  const { data: asset, isLoading, isError, error } = trpc.assets.getAsset.useQuery({ id });

  const disposeMutation = trpc.assets.disposeAsset.useMutation({
    onSuccess: () => {
      utils.assets.getAsset.invalidate({ id });
      setShowDispose(false);
    },
    onError: (err) => {
      alert(`Erro ao baixar ativo: ${err.message}`);
    },
  });

  const transferMutation = trpc.assets.transferAsset.useMutation({
    onSuccess: () => {
      utils.assets.getAsset.invalidate({ id });
      setShowTransfer(false);
    },
    onError: (err) => {
      alert(`Erro ao transferir ativo: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ativo" icon={<Building className="w-6 h-6" />} backHref="/assets" module="financeiro" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ativo" icon={<Building className="w-6 h-6" />} backHref="/assets" module="financeiro" />
        <Alert variant="error" title="Erro ao carregar ativo">{error?.message ?? "Não encontrado"}</Alert>
      </div>
    );
  }

  const st = statusConfig[asset.status] ?? statusConfig.ACTIVE;
  const depreciationPercent = Number(asset.acquisitionValue) > 0
    ? ((Number(asset.acquisitionValue) - Number(asset.netBookValue)) / Number(asset.acquisitionValue) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <PageHeader
        title={asset.name}
        icon={<Building className="w-6 h-6" />}
        backHref="/assets"
        module="financeiro"
        badge={{ label: st.label, variant: st.variant }}
        actions={
          asset.status === "ACTIVE" ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowTransfer(true)}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transferir
              </Button>
              <Button variant="danger" onClick={() => setShowDispose(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Baixar
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <p className="text-xs text-theme-muted mb-1">Valor de Aquisição</p>
          <p className="text-lg font-semibold text-theme">{formatCurrency(Number(asset.acquisitionValue))}</p>
        </div>
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <p className="text-xs text-theme-muted mb-1">Valor Atual</p>
          <p className="text-lg font-semibold text-theme">{formatCurrency(Number(asset.netBookValue))}</p>
        </div>
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <p className="text-xs text-theme-muted mb-1">Depreciação Acumulada</p>
          <p className="text-lg font-semibold text-theme">{formatCurrency(Number(asset.accumulatedDepr))}</p>
          <p className="text-xs text-theme-muted">{depreciationPercent}% depreciado</p>
        </div>
        <div className="bg-theme-card rounded-lg border border-theme p-4">
          <p className="text-xs text-theme-muted mb-1">Vida Útil</p>
          <p className="text-lg font-semibold text-theme">{asset.usefulLifeMonths} meses</p>
          <p className="text-xs text-theme-muted">Método: {asset.depreciationMethod === "STRAIGHT_LINE" ? "Linear" : asset.depreciationMethod === "DECLINING_BALANCE" ? "Saldo Decrescente" : "Soma dos Dígitos"}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
          <h3 className="text-sm font-semibold text-theme uppercase tracking-wider">Informações</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Código</p>
                <p className="text-sm font-mono text-theme">{asset.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Categoria</p>
                <p className="text-sm text-theme">{categoryLabels[asset.category] ?? asset.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Data de Aquisição</p>
                <p className="text-sm text-theme">{formatDate(asset.acquisitionDate)}</p>
              </div>
            </div>
            {asset.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-theme-muted" />
                <div>
                  <p className="text-xs text-theme-muted">Localização</p>
                  <p className="text-sm text-theme">{asset.location}</p>
                </div>
              </div>
            )}
            {asset.responsible && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-theme-muted" />
                <div>
                  <p className="text-xs text-theme-muted">Responsável</p>
                  <p className="text-sm text-theme">{asset.responsible.name}</p>
                </div>
              </div>
            )}
            {asset.serialNumber && (
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-theme-muted" />
                <div>
                  <p className="text-xs text-theme-muted">Número de Série</p>
                  <p className="text-sm font-mono text-theme">{asset.serialNumber}</p>
                </div>
              </div>
            )}
          </div>
          {asset.notes && (
            <div className="pt-3 border-t border-theme">
              <p className="text-xs text-theme-muted mb-1">Observações</p>
              <p className="text-sm text-theme-secondary">{asset.notes}</p>
            </div>
          )}
        </div>

        {/* Movements */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-sm font-semibold text-theme uppercase tracking-wider mb-4">Últimas Movimentações</h3>
          {!asset.movements?.length ? (
            <div className="text-center py-8">
              <ArrowRightLeft className="w-8 h-8 mx-auto text-theme-muted mb-2" />
              <p className="text-sm text-theme-muted">Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {asset.movements.map((mov) => (
                <div key={mov.id} className="flex items-start gap-3 p-3 rounded-lg bg-theme-secondary">
                  <TrendingDown className="w-4 h-4 text-theme-muted mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{movementTypeLabels[mov.type] ?? mov.type}</Badge>
                      <span className="text-sm font-medium text-theme">
                        {formatCurrency(Number(mov.value))}
                      </span>
                    </div>
                    {mov.description && (
                      <p className="text-xs text-theme-muted mt-1">{mov.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-theme-muted mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(mov.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Depreciation History */}
      {asset.depreciations && asset.depreciations.length > 0 && (
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-sm font-semibold text-theme uppercase tracking-wider mb-4">Histórico de Depreciação</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-table-header border-b border-theme">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-theme-muted uppercase">Período</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">Valor Depreciado</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">Acumulado</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">Valor Residual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {asset.depreciations.map((dep) => (
                  <tr key={dep.id} className="hover:bg-theme-table-hover transition-colors">
                    <td className="px-4 py-2 text-sm text-theme">{formatDate(dep.period)}</td>
                    <td className="px-4 py-2 text-sm text-right text-theme">{formatCurrency(Number(dep.depreciationValue))}</td>
                    <td className="px-4 py-2 text-sm text-right text-theme">{formatCurrency(Number(dep.accumulatedValue))}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-theme">{formatCurrency(Number(dep.netBookValue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispose Modal */}
      <Modal isOpen={showDispose} onClose={() => setShowDispose(false)} title="Baixar Ativo">
        <div className="space-y-4">
          <p className="text-sm text-theme-muted">Registrar a baixa do ativo <strong>{asset.name}</strong>.</p>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Valor de Venda/Baixa *</label>
            <Input
              type="number"
              value={disposalValue}
              onChange={(e) => setDisposalValue(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Motivo *</label>
            <Input
              value={disposalReason}
              onChange={(e) => setDisposalReason(e.target.value)}
              placeholder="Ex: Venda, obsolescência, sinistro..."
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDispose(false)}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={() => disposeMutation.mutate({
              assetId: id,
              disposalDate: new Date(),
              disposalValue: Number(disposalValue),
              disposalReason,
            })}
            isLoading={disposeMutation.isPending}
            disabled={!disposalValue || !disposalReason.trim()}
          >
            Confirmar Baixa
          </Button>
        </ModalFooter>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Transferir Ativo">
        <div className="space-y-4">
          <p className="text-sm text-theme-muted">Transferir o ativo <strong>{asset.name}</strong> para nova localização.</p>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Nova Localização</label>
            <Input
              value={transferLocation}
              onChange={(e) => setTransferLocation(e.target.value)}
              placeholder="Ex: Filial SP, Galpão B"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Descrição *</label>
            <Input
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
              placeholder="Motivo da transferência"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => transferMutation.mutate({
              assetId: id,
              date: new Date(),
              toLocation: transferLocation.trim() || undefined,
              description: transferDescription,
            })}
            isLoading={transferMutation.isPending}
            disabled={!transferDescription.trim()}
          >
            Confirmar Transferência
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
