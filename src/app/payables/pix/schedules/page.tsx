"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  ArrowLeft,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "FAILED";

const statusConfig: Record<ScheduleStatus, { label: string; color: string; icon: typeof Clock }> = {
  SCHEDULED: { label: "Agendado", color: "bg-blue-100 text-blue-800", icon: Clock },
  COMPLETED: { label: "Executado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", color: "bg-theme-tertiary text-theme", icon: XCircle },
  FAILED: { label: "Falhou", color: "bg-red-100 text-red-800", icon: AlertTriangle },
};

export default function PixSchedulesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "">("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading } = trpc.payables.listPixTransactions.useQuery({
    status: "SCHEDULED",
    page: 1,
    limit: 50,
  });

  const cancelMutation = trpc.payables.cancelPixSchedule.useMutation({
    onSuccess: () => {
      // Refetch data
    },
  });

  const schedules = data?.transactions || [];

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch = 
      schedule.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      schedule.pixKey.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || schedule.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCancel = async (id: string) => {
    if (confirm("Deseja cancelar este agendamento?")) {
      await cancelMutation.mutateAsync({ id });
    }
    setOpenMenu(null);
  };

  // Calcular estatísticas
  const stats = {
    total: schedules.length,
    scheduled: schedules.filter(s => s.status === "SCHEDULED").length,
    totalValue: schedules
      .filter(s => s.status === "SCHEDULED")
      .reduce((sum, s) => sum + s.value, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agendamentos PIX"
        icon={<Calendar className="w-6 h-6 text-purple-600" />}
        backHref="/payables/pix"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/payables/pix"
              className="flex items-center gap-2 px-4 py-2 text-theme-secondary hover:text-theme"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <Link
              href="/payables/pix/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Agendamento</span>
            </Link>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-theme-card rounded-xl border border-theme p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Total Agendamentos</p>
                <p className="text-xl font-bold text-theme">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-theme-card rounded-xl border border-theme p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Pendentes</p>
                <p className="text-xl font-bold text-theme">{stats.scheduled}</p>
              </div>
            </div>
          </div>
          <div className="bg-theme-card rounded-xl border border-theme p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Valor Total Agendado</p>
                <p className="text-xl font-bold text-theme">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-theme-card rounded-xl border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por destinatário ou chave PIX..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ScheduleStatus | "")}
              className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="SCHEDULED">Agendado</option>
              <option value="COMPLETED">Executado</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="FAILED">Falhou</option>
            </select>
          </div>
        </div>

        {/* Schedules List */}
        <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-theme-muted">Carregando agendamentos...</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <p className="text-theme-muted">Nenhum agendamento encontrado</p>
              <Link
                href="/payables/pix/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Criar Agendamento
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Destinatário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Chave PIX
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Data Agendada
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredSchedules.map((schedule) => {
                    const status = statusConfig[schedule.status as ScheduleStatus] || statusConfig.SCHEDULED;
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={schedule.id} className="hover:bg-theme-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-theme">{schedule.recipientName}</p>
                            {schedule.description && (
                              <p className="text-sm text-theme-muted">{schedule.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-mono text-theme">{schedule.pixKey}</p>
                            <p className="text-xs text-theme-muted">{schedule.pixKeyType}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-theme">
                            {schedule.scheduledAt ? formatDate(schedule.scheduledAt) : "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <p className="font-medium text-theme">{formatCurrency(schedule.value)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === schedule.id ? null : schedule.id)}
                              className="p-2 hover:bg-theme-hover rounded-lg"
                            >
                              <MoreVertical className="w-5 h-5 text-theme-muted" />
                            </button>
                            {openMenu === schedule.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-theme-card rounded-lg shadow-lg border border-theme z-10">
                                <button
                                  onClick={() => {
                                    // View details
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-theme-secondary hover:bg-theme-hover"
                                >
                                  <Eye className="w-4 h-4" />
                                  Ver Detalhes
                                </button>
                                {schedule.status === "SCHEDULED" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        // Edit schedule
                                        setOpenMenu(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-theme-secondary hover:bg-theme-hover"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleCancel(schedule.id)}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Cancelar
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Sobre Agendamentos PIX</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Agendamentos são processados automaticamente na data programada</li>
                <li>• Você pode cancelar um agendamento até 1 hora antes da execução</li>
                <li>• Agendamentos falhos podem ser reagendados manualmente</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
