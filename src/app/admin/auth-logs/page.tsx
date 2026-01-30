"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import {
  Shield,
  ArrowLeft,
  RefreshCw,
  Loader2,
  LogIn,
  LogOut,
  UserPlus,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const eventTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  login: { label: "Login", icon: LogIn, color: "text-green-600 bg-green-50" },
  logout: { label: "Logout", icon: LogOut, color: "text-theme-secondary bg-theme-tertiary" },
  user_signedup: { label: "Cadastro", icon: UserPlus, color: "text-blue-600 bg-blue-50" },
  user_updated: { label: "Atualização", icon: Key, color: "text-yellow-600 bg-yellow-50" },
  token_refreshed: { label: "Token Refresh", icon: RefreshCw, color: "text-purple-600 bg-purple-50" },
  user_recovery_requested: { label: "Recuperação", icon: Key, color: "text-orange-600 bg-orange-50" },
  user_invited: { label: "Convite", icon: UserPlus, color: "text-blue-600 bg-indigo-50" },
  mfa_challenge_verified: { label: "MFA Verificado", icon: Shield, color: "text-green-600 bg-green-50" },
  unknown: { label: "Outro", icon: AlertTriangle, color: "text-theme-muted bg-theme-tertiary" },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuthLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = trpc.authLogs.list.useQuery(
    { page, limit: 20 },
    { refetchOnWindowFocus: false }
  );

  const { data: stats } = trpc.authLogs.stats.useQuery();

  const getEventConfig = (eventType: string) => {
    return eventTypeConfig[eventType] || eventTypeConfig.unknown;
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Logs de Autenticação"
          icon={<Shield className="w-6 h-6" />}
          backHref="/"
          module="admin"
          actions={
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme-input rounded-lg hover:bg-theme-hover disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          }
        />

        <main className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-theme-card rounded-xl border border-theme p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-theme-muted">Últimas 24h</p>
                    <p className="text-2xl font-bold text-theme">{stats.last24h}</p>
                  </div>
                </div>
              </div>

              <div className="bg-theme-card rounded-xl border border-theme p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-theme-muted">Últimos 7 dias</p>
                    <p className="text-2xl font-bold text-theme">{stats.last7d}</p>
                  </div>
                </div>
              </div>

              <div className="bg-theme-card rounded-xl border border-theme p-6">
                <div>
                  <p className="text-sm text-theme-muted mb-2">Eventos por tipo (7d)</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.byType.slice(0, 4).map((item) => {
                      const config = getEventConfig(item.type);
                      return (
                        <span
                          key={item.type}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                        >
                          {config.label}: {item.count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs Table */}
          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="px-6 py-4 border-b border-theme">
              <h2 className="text-lg font-semibold text-theme">
                Histórico de Eventos
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
              </div>
            ) : data?.logs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-theme-muted mx-auto mb-4" />
                <p className="text-theme-muted">Nenhum log de autenticação encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                          Evento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                          IP
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                          Data/Hora
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {data?.logs.map((log) => {
                        const config = getEventConfig(log.eventType);
                        const Icon = config.icon;
                        return (
                          <tr key={log.id} className="hover:bg-theme-hover">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${config.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-theme">
                                  {config.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-theme-secondary">
                                {log.email || log.userId || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-theme-muted font-mono">
                                {log.ipAddress || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-theme-muted">
                                {formatDate(log.createdAt)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {data?.pagination && data.pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-theme flex items-center justify-between">
                    <p className="text-sm text-theme-muted">
                      Página {data.pagination.page} de {data.pagination.totalPages} ({data.pagination.total} registros)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                        disabled={page === data.pagination.totalPages}
                        className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
