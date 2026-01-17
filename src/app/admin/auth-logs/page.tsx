"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

// Importar ProtectedRoute dinamicamente para evitar SSR
const ProtectedRoute = dynamic(
  () => import("@/components/ProtectedRoute").then((mod) => mod.ProtectedRoute),
  { ssr: false }
);
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
  logout: { label: "Logout", icon: LogOut, color: "text-gray-600 bg-gray-50" },
  user_signedup: { label: "Cadastro", icon: UserPlus, color: "text-blue-600 bg-blue-50" },
  user_updated: { label: "Atualização", icon: Key, color: "text-yellow-600 bg-yellow-50" },
  token_refreshed: { label: "Token Refresh", icon: RefreshCw, color: "text-purple-600 bg-purple-50" },
  user_recovery_requested: { label: "Recuperação", icon: Key, color: "text-orange-600 bg-orange-50" },
  user_invited: { label: "Convite", icon: UserPlus, color: "text-indigo-600 bg-indigo-50" },
  mfa_challenge_verified: { label: "MFA Verificado", icon: Shield, color: "text-green-600 bg-green-50" },
  unknown: { label: "Outro", icon: AlertTriangle, color: "text-gray-500 bg-gray-50" },
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-600 hover:text-[var(--frm-primary)]"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[var(--frm-primary)]" />
                  <h1 className="text-xl font-semibold text-gray-900">
                    Logs de Autenticação
                  </h1>
                </div>
              </div>

              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Últimas 24h</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.last24h}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Últimos 7 dias</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.last7d}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Eventos por tipo (7d)</p>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Histórico de Eventos
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
              </div>
            ) : data?.logs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum log de autenticação encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Evento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data?.logs.map((log) => {
                        const config = getEventConfig(log.eventType);
                        const Icon = config.icon;
                        return (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${config.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {config.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {log.email || log.userId || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 font-mono">
                                {log.ipAddress || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500">
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
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Página {data.pagination.page} de {data.pagination.totalPages} ({data.pagination.total} registros)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                        disabled={page === data.pagination.totalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
