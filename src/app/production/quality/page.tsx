"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate, formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

import {
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Package,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

const inspectionStatusConfig: Record<string, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", variant: "warning", icon: <Clock className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Em Andamento", variant: "info", icon: <AlertCircle className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", variant: "success", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", variant: "error", icon: <XCircle className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", variant: "orange", icon: <AlertTriangle className="w-4 h-4" /> },
};

const inspectionTypeConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  RECEIVING: { label: "Recebimento", variant: "info" },
  IN_PROCESS: { label: "Em Processo", variant: "purple" },
  FINAL: { label: "Final", variant: "success" },
  AUDIT: { label: "Auditoria", variant: "default" },
};

const ncSeverityConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  MINOR: { label: "Menor", variant: "warning" },
  MAJOR: { label: "Maior", variant: "orange" },
  CRITICAL: { label: "Crítica", variant: "error" },
};

const ncStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: "Aberta", variant: "error" },
  ANALYZING: { label: "Em Análise", variant: "warning" },
  ACTION: { label: "Ação em Andamento", variant: "info" },
  VERIFICATION: { label: "Verificação", variant: "purple" },
  CLOSED: { label: "Fechada", variant: "success" },
};

export default function QualityPage() {
  const [activeTab, setActiveTab] = useState<"inspections" | "nonconformities">("inspections");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data: dashboard, isLoading: loadingDashboard } = trpc.quality.dashboard.useQuery();

  const { data: inspectionsData, isLoading: loadingInspections } = trpc.quality.listInspections.useQuery(
    {
      search: search || undefined,
      status: statusFilter !== "ALL" ? statusFilter as "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "PARTIAL" : undefined,
      type: typeFilter !== "ALL" ? typeFilter as "RECEIVING" | "IN_PROCESS" | "FINAL" | "AUDIT" : undefined,
      page,
      limit: 20,
    },
    { enabled: activeTab === "inspections" }
  );

  const { data: ncData, isLoading: loadingNCs } = trpc.quality.listNonConformities.useQuery(
    {
      search: search || undefined,
      status: statusFilter !== "ALL" ? statusFilter as "OPEN" | "ANALYZING" | "ACTION" | "VERIFICATION" | "CLOSED" : undefined,
      page,
      limit: 20,
    },
    { enabled: activeTab === "nonconformities" }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Qualidade"
        icon={<ClipboardCheck className="w-6 h-6" />}
        backHref="/production"
        module="production"
        actions={
          <Button
            onClick={() => window.location.href = "/production/quality/new"}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Inspeção
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto">
        {/* Dashboard Cards */}
        {loadingDashboard ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <ClipboardCheck className="w-4 h-4" />
                <span className="text-sm">Inspeções Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{dashboard?.pendingInspections || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Taxa de Aprovação</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatNumber(dashboard?.approvalRate || 100)}%</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">NCs Abertas</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{dashboard?.openNCs || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">NCs Críticas</span>
              </div>
              <p className="text-2xl font-bold text-red-800">{dashboard?.criticalNCs || 0}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-theme mb-6">
          <Button
            variant="ghost"
            onClick={() => { setActiveTab("inspections"); setPage(1); setStatusFilter("ALL"); }}
            className={`px-4 py-2 font-medium border-b-2 -mb-px rounded-none ${
              activeTab === "inspections"
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-theme-muted hover:text-theme"
            }`}
          >
            Inspeções
          </Button>
          <Button
            variant="ghost"
            onClick={() => { setActiveTab("nonconformities"); setPage(1); setStatusFilter("ALL"); }}
            className={`px-4 py-2 font-medium border-b-2 -mb-px rounded-none ${
              activeTab === "nonconformities"
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-theme-muted hover:text-theme"
            }`}
          >
            Não-Conformidades
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
              <Input
                placeholder={activeTab === "inspections" ? "Buscar por lote, material..." : "Buscar por descrição..."}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <Select
                value={statusFilter}
                onChange={(value) => { setStatusFilter(value); setPage(1); }}
                options={
                  activeTab === "inspections"
                    ? [
                      { value: "ALL", label: "Todos Status" },
                      { value: "PENDING", label: "Pendente" },
                      { value: "IN_PROGRESS", label: "Em Andamento" },
                      { value: "APPROVED", label: "Aprovado" },
                      { value: "REJECTED", label: "Rejeitado" },
                      { value: "PARTIAL", label: "Parcial" },
                    ]
                    : [
                      { value: "ALL", label: "Todos Status" },
                      { value: "OPEN", label: "Aberta" },
                      { value: "ANALYZING", label: "Em Análise" },
                      { value: "ACTION", label: "Ação em Andamento" },
                      { value: "VERIFICATION", label: "Verificação" },
                      { value: "CLOSED", label: "Fechada" },
                    ]
                }
              />
              {activeTab === "inspections" && (
                <Select
                  value={typeFilter}
                  onChange={(value) => { setTypeFilter(value); setPage(1); }}
                  options={[
                    { value: "ALL", label: "Todos Tipos" },
                    { value: "RECEIVING", label: "Recebimento" },
                    { value: "IN_PROCESS", label: "Em Processo" },
                    { value: "FINAL", label: "Final" },
                    { value: "AUDIT", label: "Auditoria" },
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        {/* Lista de Inspeções */}
        {activeTab === "inspections" && (
          <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
            {loadingInspections ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : !inspectionsData?.inspections.length ? (
              <div className="text-center py-12">
                <ClipboardCheck className="w-12 h-12 mx-auto text-theme-muted mb-4" />
                <p className="text-theme-muted">Nenhuma inspeção encontrada</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-theme-table">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Material</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Lote</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Data</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {inspectionsData.inspections.map((inspection) => {
                        const statusCfg = inspectionStatusConfig[inspection.status] || inspectionStatusConfig.PENDING;
                        const typeCfg = inspectionTypeConfig[inspection.type] || inspectionTypeConfig.RECEIVING;
                        return (
                          <tr key={inspection.id} className="hover:bg-theme-hover">
                            <td className="px-4 py-3 font-medium text-theme">#{inspection.code}</td>
                            <td className="px-4 py-3">
                              <Badge variant={typeCfg.variant}>
                                {typeCfg.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {inspection.material ? (
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-theme-muted" />
                                  <span className="text-sm">{inspection.material.description}</span>
                                </div>
                              ) : (
                                <span className="text-theme-muted">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                              {inspection.lotNumber || "-"}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-theme">
                              {formatNumber(inspection.quantity)}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                              {formatDate(inspection.inspectionDate)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={statusCfg.variant}>
                                {statusCfg.icon}
                                {statusCfg.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link
                                href={`/production/quality/inspections/${inspection.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {inspectionsData.pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                    <div className="text-sm text-theme-muted">Página {page} de {inspectionsData.pages}</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === inspectionsData.pages}>
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Lista de Não-Conformidades */}
        {activeTab === "nonconformities" && (
          <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
            {loadingNCs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : !ncData?.nonConformities.length ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 mx-auto text-theme-muted mb-4" />
                <p className="text-theme-muted">Nenhuma não-conformidade encontrada</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-theme-table">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Severidade</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Material</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Data</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {ncData.nonConformities.map((nc) => {
                        const severityCfg = ncSeverityConfig[nc.severity] || ncSeverityConfig.MINOR;
                        const statusCfg = ncStatusConfig[nc.status] || ncStatusConfig.OPEN;
                        return (
                          <tr key={nc.id} className="hover:bg-theme-hover">
                            <td className="px-4 py-3 font-medium text-theme">NC-{nc.code}</td>
                            <td className="px-4 py-3 text-sm text-theme max-w-xs truncate">
                              {nc.description}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={severityCfg.variant}>
                                {severityCfg.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                              {nc.material?.description || "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                              {formatDate(nc.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={statusCfg.variant}>
                                {statusCfg.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link
                                href={`/production/quality/nc/${nc.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {ncData.pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                    <div className="text-sm text-theme-muted">Página {page} de {ncData.pages}</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === ncData.pages}>
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
