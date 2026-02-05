"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import {
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Square,
  Coffee,
  Settings,
  Calendar,
  Users,
  AlertCircle,
} from "lucide-react";

const clockTypeConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  CLOCK_IN: { label: "Entrada", color: "bg-green-100 text-green-800", icon: Play },
  CLOCK_OUT: { label: "Saída", color: "bg-red-100 text-red-800", icon: Square },
  BREAK_START: { label: "Início Intervalo", color: "bg-yellow-100 text-yellow-800", icon: Coffee },
  BREAK_END: { label: "Fim Intervalo", color: "bg-blue-100 text-blue-800", icon: Coffee },
};

export default function TimeclockPage() {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [page, setPage] = useState(1);

  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(selectedDate);
  endDate.setHours(23, 59, 59, 999);

  const { data, isLoading } = trpc.timeclock.listEntries.useQuery({
    startDate,
    endDate,
    page,
    limit: 50,
  });

  const { data: schedules } = trpc.timeclock.listSchedules.useQuery({ isActive: true });
  const { data: pendingAdjustments } = trpc.timeclock.listAdjustments.useQuery({ status: "PENDING" });

  const filteredEntries = data?.entries.filter((e) =>
    e.employee.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ponto Eletrônico"
        subtitle="Controle de marcações e escalas"
        icon={<Clock className="w-6 h-6" />}
        module="hr"
        actions={
          <div className="flex gap-2">
            <Link
              href="/hr/timeclock/schedules"
              className="flex items-center gap-2 px-4 py-2 border border-theme-input rounded-lg hover:bg-theme-hover"
            >
              <Settings className="w-4 h-4" />
              Escalas
            </Link>
            <Link
              href="/hr/timeclock/holidays"
              className="flex items-center gap-2 px-4 py-2 border border-theme-input rounded-lg hover:bg-theme-hover"
            >
              <Calendar className="w-4 h-4" />
              Feriados
            </Link>
            <Link
              href="/hr/timeclock/hours-bank"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Clock className="w-4 h-4" />
              Banco de Horas
            </Link>
          </div>
        }
      />

      <div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
              <Users className="w-4 h-4" />
            Escalas Ativas
            </div>
            <div className="text-2xl font-bold">{schedules?.length || 0}</div>
          </div>
          <div className="bg-theme-card p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
              <Clock className="w-4 h-4" />
            Marcações Hoje
            </div>
            <div className="text-2xl font-bold text-blue-600">{data?.total || 0}</div>
          </div>
          <div className="bg-theme-card p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
            Ajustes Pendentes
            </div>
            <div className="text-2xl font-bold text-yellow-600">{pendingAdjustments?.total || 0}</div>
            {(pendingAdjustments?.total || 0) > 0 && (
              <Link href="/hr/timeclock/adjustments" className="text-xs text-blue-600 hover:underline">
              Ver pendentes →
              </Link>
            )}
          </div>
          <div className="bg-theme-card p-4 rounded-lg shadow">
            <Input
              label="Data Selecionada"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de marcações */}
        <div className="bg-theme-card rounded-lg shadow">
          <div className="p-4 border-b border-theme">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por funcionário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Funcionário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Horário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Local</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Dispositivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredEntries?.map((entry) => {
                    const config = clockTypeConfig[entry.type];
                    const IconComponent = config?.icon || Clock;
                    return (
                      <tr key={entry.id} className="hover:bg-theme-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-theme">{entry.employee.name}</div>
                          <div className="text-sm text-theme-muted">#{entry.employee.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config?.color}`}>
                            <IconComponent className="w-3 h-3" />
                            {config?.label || entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                          {entry.location || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                          {entry.deviceId || entry.ipAddress || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.isManual ? (
                            <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Manual</span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded bg-theme-tertiary text-theme-secondary">Automático</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!filteredEntries || filteredEntries.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-theme-muted">
                      Nenhuma marcação encontrada para esta data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-theme">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-sm text-theme-secondary">Página {page} de {data.pages}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
