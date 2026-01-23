"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageCard } from "@/components/ui/PageCard";
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

type BoletoStatus = "PENDENTE" | "APROVADO" | "REJEITADO" | "PAGO" | "VENCIDO" | "CANCELADO";

const statusConfig: Record<BoletoStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  PENDENTE: { label: "Pendente", color: "text-yellow-800", bgColor: "bg-yellow-100", icon: Clock },
  APROVADO: { label: "Aprovado", color: "text-blue-800", bgColor: "bg-blue-100", icon: Check },
  REJEITADO: { label: "Rejeitado", color: "text-red-800", bgColor: "bg-red-100", icon: X },
  PAGO: { label: "Pago", color: "text-green-800", bgColor: "bg-green-100", icon: DollarSign },
  VENCIDO: { label: "Vencido", color: "text-orange-800", bgColor: "bg-orange-100", icon: AlertTriangle },
  CANCELADO: { label: "Cancelado", color: "text-gray-800", bgColor: "bg-gray-100", icon: X },
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
          <button
            onClick={() => {
              // TODO: Implementar sincronização real com API bancária (VIO-597)
              alert("Sincronização com bancos será implementada após cadastro das credenciais bancárias.");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Sincronizar
          </button>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loadingDashboard ? "-" : dashboard?.totalPendentes || 0}
              </p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
        </PageCard>

        <PageCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loadingDashboard ? "-" : dashboard?.vencendoHoje || 0}
              </p>
              <p className="text-sm text-gray-500">Vencendo Hoje</p>
            </div>
          </div>
        </PageCard>

        <PageCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loadingDashboard ? "-" : dashboard?.vencendoSemana || 0}
              </p>
              <p className="text-sm text-gray-500">Próx. 7 dias</p>
            </div>
          </div>
        </PageCard>

        <PageCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loadingDashboard ? "-" : formatCurrency(dashboard?.valorPendente || 0)}
              </p>
              <p className="text-sm text-gray-500">Valor Pendente</p>
            </div>
          </div>
        </PageCard>
      </div>

      {/* Filtros */}
      <PageCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cedente, nosso número ou código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BoletoStatus | "")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="APROVADO">Aprovados</option>
              <option value="PAGO">Pagos</option>
              <option value="VENCIDO">Vencidos</option>
              <option value="REJEITADO">Rejeitados</option>
            </select>
          </div>
        </div>
      </PageCard>

      {/* Lista de Boletos */}
      <PageCard title="Boletos">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : data?.boletos && data.boletos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cedente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vencimento</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Valor</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Vinculado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
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
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        isVencido ? "bg-red-50 dark:bg-red-900/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {boleto.cedenteNome || "Cedente não informado"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {boleto.cedenteCnpj || boleto.nossoNumero || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={isVencido ? "text-red-600 font-medium" : "text-gray-900 dark:text-gray-100"}>
                          {formatDate(boleto.dataVencimento)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(Number(boleto.valorFinal))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
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
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {boleto.status === "PENDENTE" && (
                            <>
                              <button
                                onClick={() => handleAprovar(boleto.id)}
                                disabled={aprovarMutation.isPending}
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Aprovar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBoleto(boleto.id);
                                  setShowRejectModal(true);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Rejeitar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {boleto.status === "APROVADO" && (
                            <button
                              onClick={() => handleMarcarPago(boleto.id)}
                              disabled={marcarPagoMutation.isPending}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Marcar como Pago"
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                          )}
                          {!boleto.accountsPayableId && boleto.status !== "REJEITADO" && boleto.status !== "CANCELADO" && (
                            <button
                              onClick={() => handleCriarContaPagar(boleto.id)}
                              disabled={criarContaPagarMutation.isPending}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Criar Conta a Pagar"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // TODO: Implementar modal de detalhes do boleto
                              setSelectedBoleto(boleto.id);
                            }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum boleto encontrado</p>
          </div>
        )}

        {/* Paginação */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.pagination.total)} de {data.pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= data.pagination.totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </PageCard>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Rejeitar Boleto
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo da Rejeição
              </label>
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                placeholder="Informe o motivo da rejeição..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setMotivoRejeicao("");
                  setSelectedBoleto(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejeitar}
                disabled={!motivoRejeicao || rejeitarMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {rejeitarMutation.isPending ? "Rejeitando..." : "Rejeitar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
