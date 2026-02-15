"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { PageCard } from "@/components/ui/PageCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  FileText,
  Check,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  Search,
  Filter,
  Loader2,
  Eye,
  Link as LinkIcon,
  Plus,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

type BoletoStatus = "PENDENTE" | "APROVADO" | "REJEITADO" | "PAGO" | "VENCIDO" | "CANCELADO";

const statusConfig: Record<BoletoStatus, { label: string; variant: BadgeVariant; icon: React.ElementType }> = {
  PENDENTE: { label: "Pendente", variant: "warning", icon: Clock },
  APROVADO: { label: "Aprovado", variant: "info", icon: Check },
  REJEITADO: { label: "Rejeitado", variant: "error", icon: X },
  PAGO: { label: "Pago", variant: "success", icon: DollarSign },
  VENCIDO: { label: "Vencido", variant: "orange", icon: AlertTriangle },
  CANCELADO: { label: "Cancelado", variant: "default", icon: X },
};

export default function DdaPage() {
  const [statusFilter, setStatusFilter] = useState<BoletoStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBoleto, setSelectedBoleto] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const utils = trpc.useUtils();

  const { data: dashboard, isLoading: loadingDashboard } = trpc.dda.dashboard.useQuery();

  const { data, isLoading } = trpc.dda.list.useQuery({
    status: statusFilter || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const aprovarMutation = trpc.dda.aprovar.useMutation({
    onSuccess: () => {
      utils.dda.list.invalidate();
      utils.dda.dashboard.invalidate();
    },
  });

  const rejeitarMutation = trpc.dda.rejeitar.useMutation({
    onSuccess: () => {
      utils.dda.list.invalidate();
      utils.dda.dashboard.invalidate();
      setShowRejectModal(false);
      setMotivoRejeicao("");
      setSelectedBoleto(null);
    },
  });

  const marcarPagoMutation = trpc.dda.marcarPago.useMutation({
    onSuccess: () => {
      utils.dda.list.invalidate();
      utils.dda.dashboard.invalidate();
    },
  });

  const criarContaPagarMutation = trpc.dda.criarContaPagar.useMutation({
    onSuccess: () => {
      utils.dda.list.invalidate();
    },
  });

  const handleAprovar = (id: string) => {
    aprovarMutation.mutate({ id });
  };

  const handleRejeitar = () => {
    if (!selectedBoleto || !motivoRejeicao) return;
    rejeitarMutation.mutate({ id: selectedBoleto, motivo: motivoRejeicao });
  };

  const handleMarcarPago = (id: string) => {
    marcarPagoMutation.mutate({ id });
  };

  const handleCriarContaPagar = (id: string) => {
    criarContaPagarMutation.mutate({ id });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="DDA - Débito Direto Autorizado"
        subtitle="Gerenciamento de boletos recebidos via DDA"
        icon={<FileText className="h-6 w-6" />}
        backHref="/treasury"
        actions={
          <Button
            onClick={() => {
              // TODO: Implementar sincronização real com API bancária (VIO-597)
              toast.info("Sincronização com bancos será implementada após cadastro das credenciais bancárias.");
            }}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Sincronizar
          </Button>
        }
      />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PageCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme dark:text-theme-muted">
                {loadingDashboard ? "-" : dashboard?.totalPendentes || 0}
              </p>
              <p className="text-sm text-theme-muted">Pendentes</p>
            </div>
          </div>
        </PageCard>

        <PageCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme dark:text-theme-muted">
                {loadingDashboard ? "-" : dashboard?.vencendoHoje || 0}
              </p>
              <p className="text-sm text-theme-muted">Vencendo Hoje</p>
            </div>
          </div>
        </PageCard>

        <PageCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme dark:text-theme-muted">
                {loadingDashboard ? "-" : dashboard?.vencendoSemana || 0}
              </p>
              <p className="text-sm text-theme-muted">Próx. 7 dias</p>
            </div>
          </div>
        </PageCard>

        <PageCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme dark:text-theme-muted">
                {loadingDashboard ? "-" : formatCurrency(dashboard?.valorPendente || 0)}
              </p>
              <p className="text-sm text-theme-muted">Valor Pendente</p>
            </div>
          </div>
        </PageCard>
      </div>

      {/* Filtros */}
      <PageCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted z-10" />
              <Input
                placeholder="Buscar por cedente, nosso número ou código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-theme-muted" />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as BoletoStatus | "")}
              placeholder="Todos os status"
              options={[
                { value: "", label: "Todos os status" },
                { value: "PENDENTE", label: "Pendentes" },
                { value: "APROVADO", label: "Aprovados" },
                { value: "PAGO", label: "Pagos" },
                { value: "VENCIDO", label: "Vencidos" },
                { value: "REJEITADO", label: "Rejeitados" },
              ]}
            />
          </div>
        </div>
      </PageCard>

      {/* Lista de Boletos */}
      <PageCard title="Boletos">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-theme-muted" />
          </div>
        ) : data?.boletos && data.boletos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-theme">
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Cedente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Vencimento</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-theme-muted">Valor</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Vinculado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-theme-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.boletos.map((boleto) => {
                  const status = statusConfig[boleto.status as BoletoStatus];
                  const StatusIcon = status.icon;
                  const isVencido = new Date(boleto.dataVencimento) < new Date() && boleto.status === "PENDENTE";

                  return (
                    <tr
                      key={boleto.id}
                      className={`border-b border-theme dark:border-theme hover:bg-theme-secondary dark:hover:bg-theme-card/50 ${
                        isVencido ? "bg-red-50 dark:bg-red-900/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-theme dark:text-theme-muted">
                            {boleto.cedenteNome || "Cedente não informado"}
                          </p>
                          <p className="text-sm text-theme-muted">
                            {boleto.cedenteCnpj || boleto.nossoNumero || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={isVencido ? "text-red-600 font-medium" : "text-theme dark:text-theme-muted"}>
                          {formatDate(boleto.dataVencimento)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-theme dark:text-theme-muted">
                          {formatCurrency(Number(boleto.valorFinal))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={status.variant}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {boleto.accountsPayable ? (
                          <span className="text-green-600 dark:text-green-400 text-sm">
                            <LinkIcon className="h-4 w-4 inline" /> #{boleto.accountsPayable.code}
                          </span>
                        ) : boleto.supplier ? (
                          <span className="text-blue-600 dark:text-blue-400 text-sm">
                            <Building2 className="h-4 w-4 inline" /> {boleto.supplier.tradeName || boleto.supplier.companyName}
                          </span>
                        ) : (
                          <span className="text-theme-muted text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {boleto.status === "PENDENTE" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAprovar(boleto.id)}
                                disabled={aprovarMutation.isPending}
                                title="Aprovar"
                                className="text-green-600 hover:bg-green-100"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBoleto(boleto.id);
                                  setShowRejectModal(true);
                                }}
                                title="Rejeitar"
                                className="text-red-600 hover:bg-red-100"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {boleto.status === "APROVADO" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarcarPago(boleto.id)}
                              disabled={marcarPagoMutation.isPending}
                              title="Marcar como Pago"
                              className="text-green-600 hover:bg-green-100"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          {!boleto.accountsPayableId && boleto.status !== "REJEITADO" && boleto.status !== "CANCELADO" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCriarContaPagar(boleto.id)}
                              disabled={criarContaPagarMutation.isPending}
                              title="Criar Conta a Pagar"
                              className="text-blue-600 hover:bg-blue-100"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar modal de detalhes do boleto
                              setSelectedBoleto(boleto.id);
                            }}
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-theme-muted mx-auto mb-4" />
            <p className="text-theme-muted">Nenhum boleto encontrado</p>
          </div>
        )}

        {/* Paginação */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-theme">
            <p className="text-sm text-theme-muted">
              Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.pagination.total)} de {data.pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= data.pagination.totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </PageCard>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-theme dark:text-theme-muted mb-4">
              Rejeitar Boleto
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Motivo da Rejeição
              </label>
              <Textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                rows={3}
                placeholder="Informe o motivo da rejeição..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setMotivoRejeicao("");
                  setSelectedBoleto(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleRejeitar}
                disabled={!motivoRejeicao || rejeitarMutation.isPending}
                isLoading={rejeitarMutation.isPending}
              >
                Rejeitar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
