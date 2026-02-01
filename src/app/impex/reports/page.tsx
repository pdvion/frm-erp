"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import {
  FileText,
  Loader2,
  Download,
  Filter,
  Package,
  DollarSign,
  Banknote,
} from "lucide-react";

type ReportType = "processes" | "costs" | "exchange";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_SHIPMENT: "Aguardando Embarque",
  IN_TRANSIT: "Em Trânsito",
  ARRIVED: "Chegou",
  IN_CLEARANCE: "Em Desembaraço",
  CLEARED: "Desembaraçado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  OPEN: "Aberto",
  PARTIALLY_LIQUIDATED: "Parcialmente Liquidado",
  LIQUIDATED: "Liquidado",
};

export default function ImpExReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("processes");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");

  const processReport = trpc.impex.getProcessReport.useQuery(
    { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, status: status || undefined },
    { enabled: reportType === "processes" }
  );

  const costReport = trpc.impex.getCostReport.useQuery(
    { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
    { enabled: reportType === "costs" }
  );

  const exchangeReport = trpc.impex.getExchangeReport.useQuery(
    {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: (status || undefined) as "OPEN" | "PARTIALLY_LIQUIDATED" | "LIQUIDATED" | "CANCELLED" | undefined,
    },
    { enabled: reportType === "exchange" }
  );

  const formatCurrency = (value: number, currency = "USD") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const exportToCSV = () => {
    let csvContent = "";
    let filename = "";

    if (reportType === "processes" && processReport.data) {
      filename = `processos_importacao_${new Date().toISOString().split("T")[0]}.csv`;
      csvContent = "Processo,Fornecedor,Despachante,Incoterm,Rota,Valor,Moeda,Status,ETA,Itens,Custos,Criado Em\n";
      processReport.data.processes.forEach((p) => {
        csvContent += `${p.processNumber},${p.supplier || ""},${p.broker || ""},${p.incoterm || ""},${p.route},${p.invoiceValue},${p.currency},${STATUS_LABELS[p.status] || p.status},${formatDate(p.eta)},${p.itemsCount},${p.costsCount},${formatDate(p.createdAt)}\n`;
      });
    } else if (reportType === "costs" && costReport.data) {
      filename = `custos_importacao_${new Date().toISOString().split("T")[0]}.csv`;
      csvContent = "Processo,Tipo,Descrição,Valor,Moeda,Estimado,Data\n";
      costReport.data.costs.forEach((c) => {
        csvContent += `${c.processNumber},${c.costType},${c.description},${c.value},${c.currency},${c.isEstimated ? "Sim" : "Não"},${formatDate(c.createdAt)}\n`;
      });
    } else if (reportType === "exchange" && exchangeReport.data) {
      filename = `contratos_cambio_${new Date().toISOString().split("T")[0]}.csv`;
      csvContent = "Contrato,Banco,Processo,Valor ME,Moeda,Taxa,Valor BRL,Status,Variação,Liquidações,Data Contrato,Vencimento\n";
      exchangeReport.data.contracts.forEach((c) => {
        csvContent += `${c.contractNumber},${c.bank || ""},${c.processNumber || ""},${c.foreignValue},${c.foreignCurrency},${c.contractRate},${c.brlValue},${STATUS_LABELS[c.status] || c.status},${c.variation},${c.liquidationsCount},${formatDate(c.contractDate)},${formatDate(c.maturityDate)}\n`;
      });
    }

    if (csvContent) {
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const isLoading =
    (reportType === "processes" && processReport.isLoading) ||
    (reportType === "costs" && costReport.isLoading) ||
    (reportType === "exchange" && exchangeReport.isLoading);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios de Importação"
        icon={<FileText className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Relatórios" },
        ]}
        actions={
          <button
            onClick={exportToCSV}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        }
      />

      {/* Tipo de Relatório */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setReportType("processes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              reportType === "processes"
                ? "bg-blue-600 text-white border-blue-600"
                : "border-theme hover:bg-theme-secondary"
            }`}
          >
            <Package className="w-4 h-4" />
            Processos
          </button>
          <button
            onClick={() => setReportType("costs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              reportType === "costs"
                ? "bg-blue-600 text-white border-blue-600"
                : "border-theme hover:bg-theme-secondary"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Custos
          </button>
          <button
            onClick={() => setReportType("exchange")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              reportType === "exchange"
                ? "bg-blue-600 text-white border-blue-600"
                : "border-theme hover:bg-theme-secondary"
            }`}
          >
            <Banknote className="w-4 h-4" />
            Câmbio
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-theme-muted" />
          <span className="font-medium text-theme">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Data Inicial"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Data Final"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          {reportType !== "costs" && (
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Todos</option>
                {reportType === "processes" ? (
                  <>
                    <option value="DRAFT">Rascunho</option>
                    <option value="PENDING_SHIPMENT">Aguardando Embarque</option>
                    <option value="IN_TRANSIT">Em Trânsito</option>
                    <option value="ARRIVED">Chegou</option>
                    <option value="IN_CLEARANCE">Em Desembaraço</option>
                    <option value="CLEARED">Desembaraçado</option>
                    <option value="DELIVERED">Entregue</option>
                    <option value="CANCELLED">Cancelado</option>
                  </>
                ) : (
                  <>
                    <option value="OPEN">Aberto</option>
                    <option value="PARTIALLY_LIQUIDATED">Parcialmente Liquidado</option>
                    <option value="LIQUIDATED">Liquidado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </>
                )}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setStatus("");
              }}
              className="px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Resumo */}
          {reportType === "processes" && processReport.data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-theme-card border border-theme rounded-lg p-4">
                <p className="text-sm text-theme-muted">Total de Processos</p>
                <p className="text-2xl font-bold text-theme">
                  {processReport.data.summary.totalProcesses}
                </p>
              </div>
              <div className="bg-theme-card border border-theme rounded-lg p-4">
                <p className="text-sm text-theme-muted">Valor Total</p>
                <p className="text-2xl font-bold text-theme">
                  {formatCurrency(processReport.data.summary.totalValue)}
                </p>
              </div>
            </div>
          )}

          {reportType === "costs" && costReport.data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-theme-card border border-theme rounded-lg p-4">
                <p className="text-sm text-theme-muted">Total de Custos</p>
                <p className="text-2xl font-bold text-theme">
                  {costReport.data.summary.totalCosts}
                </p>
              </div>
              <div className="bg-theme-card border border-theme rounded-lg p-4">
                <p className="text-sm text-theme-muted">Valor Total</p>
                <p className="text-2xl font-bold text-theme">
                  {formatCurrency(costReport.data.summary.totalValue, "BRL")}
                </p>
              </div>
            </div>
          )}

          {reportType === "exchange" && exchangeReport.data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-theme-card border border-theme rounded-lg p-4">
                <p className="text-sm text-theme-muted">Total de Contratos</p>
                <p className="text-2xl font-bold text-theme">
                  {exchangeReport.data.summary.totalContracts}
                </p>
              </div>
              <div className="bg-theme-card border border-theme rounded-lg p-4">
                <p className="text-sm text-theme-muted">Valor ME Total</p>
                <p className="text-2xl font-bold text-theme">
                  {formatCurrency(exchangeReport.data.summary.totalForeignValue)}
                </p>
              </div>
              <div className="bg-theme-card border border-theme rounded-lg p-4">
                <p className="text-sm text-theme-muted">Valor BRL Total</p>
                <p className="text-2xl font-bold text-theme">
                  {formatCurrency(exchangeReport.data.summary.totalBrlValue, "BRL")}
                </p>
              </div>
              <div className="bg-theme-card border border-theme rounded-lg p-4">
                <p className="text-sm text-theme-muted">Variação Total</p>
                <p
                  className={`text-2xl font-bold ${
                    exchangeReport.data.summary.totalVariation > 0
                      ? "text-red-600"
                      : exchangeReport.data.summary.totalVariation < 0
                        ? "text-green-600"
                        : "text-theme"
                  }`}
                >
                  {formatCurrency(Math.abs(exchangeReport.data.summary.totalVariation), "BRL")}
                </p>
                <p className="text-xs text-theme-muted">
                  {exchangeReport.data.summary.totalVariation > 0 ? "Perda" : exchangeReport.data.summary.totalVariation < 0 ? "Ganho" : "Neutro"}
                </p>
              </div>
            </div>
          )}

          {/* Tabela de Dados */}
          <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {reportType === "processes" && processReport.data && (
                <table className="w-full text-sm">
                  <thead className="bg-theme-secondary">
                    <tr>
                      <th className="text-left py-3 px-4 text-theme-muted font-medium">Processo</th>
                      <th className="text-left py-3 px-4 text-theme-muted font-medium">Fornecedor</th>
                      <th className="text-left py-3 px-4 text-theme-muted font-medium">Rota</th>
                      <th className="text-right py-3 px-4 text-theme-muted font-medium">Valor</th>
                      <th className="text-center py-3 px-4 text-theme-muted font-medium">Status</th>
                      <th className="text-center py-3 px-4 text-theme-muted font-medium">ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processReport.data.processes.map((p) => (
                      <tr key={p.id} className="border-t border-theme">
                        <td className="py-3 px-4 text-theme font-medium">{p.processNumber}</td>
                        <td className="py-3 px-4 text-theme">{p.supplier || "-"}</td>
                        <td className="py-3 px-4 text-theme">{p.route}</td>
                        <td className="py-3 px-4 text-right text-theme">
                          {formatCurrency(p.invoiceValue, p.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs">{STATUS_LABELS[p.status] || p.status}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-theme">{formatDate(p.eta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === "costs" && costReport.data && (
                <table className="w-full text-sm">
                  <thead className="bg-theme-secondary">
                    <tr>
                      <th className="text-left py-3 px-4 text-theme-muted font-medium">Processo</th>
                      <th className="text-left py-3 px-4 text-theme-muted font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 text-theme-muted font-medium">Descrição</th>
                      <th className="text-right py-3 px-4 text-theme-muted font-medium">Valor</th>
                      <th className="text-center py-3 px-4 text-theme-muted font-medium">Estimado</th>
                      <th className="text-center py-3 px-4 text-theme-muted font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costReport.data.costs.map((c) => (
                      <tr key={c.id} className="border-t border-theme">
                        <td className="py-3 px-4 text-theme font-medium">{c.processNumber}</td>
                        <td className="py-3 px-4 text-theme">{c.costType}</td>
                        <td className="py-3 px-4 text-theme">{c.description}</td>
                        <td className="py-3 px-4 text-right text-theme">
                          {formatCurrency(c.value, c.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.isEstimated ? (
                            <span className="text-yellow-600">Sim</span>
                          ) : (
                            <span className="text-green-600">Não</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-theme">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === "exchange" && exchangeReport.data && (
                <table className="w-full text-sm">
                  <thead className="bg-theme-secondary">
                    <tr>
                      <th className="text-left py-3 px-4 text-theme-muted font-medium">Contrato</th>
                      <th className="text-left py-3 px-4 text-theme-muted font-medium">Banco</th>
                      <th className="text-right py-3 px-4 text-theme-muted font-medium">Valor ME</th>
                      <th className="text-right py-3 px-4 text-theme-muted font-medium">Taxa</th>
                      <th className="text-right py-3 px-4 text-theme-muted font-medium">Valor BRL</th>
                      <th className="text-center py-3 px-4 text-theme-muted font-medium">Status</th>
                      <th className="text-right py-3 px-4 text-theme-muted font-medium">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangeReport.data.contracts.map((c) => (
                      <tr key={c.id} className="border-t border-theme">
                        <td className="py-3 px-4 text-theme font-medium">{c.contractNumber}</td>
                        <td className="py-3 px-4 text-theme">{c.bank || "-"}</td>
                        <td className="py-3 px-4 text-right text-theme">
                          {formatCurrency(c.foreignValue, c.foreignCurrency)}
                        </td>
                        <td className="py-3 px-4 text-right text-theme">{c.contractRate.toFixed(4)}</td>
                        <td className="py-3 px-4 text-right text-theme">
                          {formatCurrency(c.brlValue, "BRL")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs">{STATUS_LABELS[c.status] || c.status}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={c.variation > 0 ? "text-red-600" : c.variation < 0 ? "text-green-600" : "text-theme"}
                          >
                            {formatCurrency(Math.abs(c.variation), "BRL")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
