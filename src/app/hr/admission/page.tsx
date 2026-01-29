"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

import {
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme", icon: <FileText className="w-4 h-4" /> },
  DOCUMENTS: { label: "Documentos", color: "bg-blue-100 text-blue-800", icon: <FileText className="w-4 h-4" /> },
  EXAM: { label: "Exame", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  APPROVAL: { label: "Aprovação", color: "bg-purple-100 text-purple-800", icon: <AlertCircle className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  COMPLETED: { label: "Concluído", color: "bg-emerald-100 text-emerald-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-theme-tertiary text-theme-secondary", icon: <XCircle className="w-4 h-4" /> },
};

export default function AdmissionPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data: dashboard, isLoading: loadingDashboard } = trpc.admission.dashboard.useQuery();

  const { data: admissions, isLoading: loadingAdmissions } = trpc.admission.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter as "DRAFT" | "DOCUMENTS" | "EXAM" | "APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED" : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissão Digital"
        icon={<UserPlus className="w-6 h-6" />}
        backHref="/hr"
        module="hr"
      />

      <main className="max-w-7xl mx-auto">
        {/* Dashboard Cards */}
        {loadingDashboard ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Total</span>
              </div>
              <p className="text-2xl font-bold text-theme">{dashboard?.total || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Rascunho</span>
              </div>
              <p className="text-2xl font-bold text-theme-secondary">{dashboard?.draft || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Em Andamento</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{dashboard?.inProgress || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Aprovados</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{dashboard?.approved || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Concluídos</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{dashboard?.completed || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">Rejeitados</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{dashboard?.rejected || 0}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-theme-card rounded-lg border border-theme mb-6">
          <div className="p-4 border-b border-theme">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou CPF..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-theme-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="border border-theme-input rounded-lg px-3 py-2"
                >
                  <option value="ALL">Todos os Status</option>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista */}
          <div className="p-4">
            {loadingAdmissions ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : !admissions?.admissions.length ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-theme-muted mb-4" />
                <p className="text-theme-muted">Nenhum processo de admissão encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-theme-table">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Candidato</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Cargo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Salário</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Etapa</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Criado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {admissions.admissions.map((admission) => {
                        const statusCfg = statusConfig[admission.status] || statusConfig.DRAFT;
                        return (
                          <tr key={admission.id} className="hover:bg-theme-hover">
                            <td className="px-4 py-3 font-mono text-sm">
                              #{admission.code}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-theme">{admission.candidateName}</p>
                                {admission.candidateEmail && (
                                  <p className="text-xs text-theme-muted">{admission.candidateEmail}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm">{admission.position?.name || "-"}</p>
                                <p className="text-xs text-theme-muted">{admission.department?.name || ""}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {admission.proposedSalary ? formatCurrency(admission.proposedSalary) : "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-medium">{admission.currentStep}</span>
                                <span className="text-xs text-theme-muted">/ {admission.totalSteps}</span>
                              </div>
                              <div className="w-full bg-theme-tertiary rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${(admission.currentStep / admission.totalSteps) * 100}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                                {statusCfg.icon}
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-theme-muted">
                              {formatDate(admission.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {admissions.pages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-theme">
                    <div className="text-sm text-theme-muted">
                      Página {page} de {admissions.pages} ({admissions.total} registros)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === admissions.pages}
                        className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
