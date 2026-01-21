"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ponto Eletrônico</h1>
            <p className="text-sm text-gray-500">Controle de marcações e escalas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/hr/timeclock/schedules"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" />
            Escalas
          </Link>
          <Link
            href="/hr/timeclock/holidays"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Calendar className="w-4 h-4" />
            Feriados
          </Link>
          <Link
            href="/hr/timeclock/hours-bank"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Clock className="w-4 h-4" />
            Banco de Horas
          </Link>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4" />
            Escalas Ativas
          </div>
          <div className="text-2xl font-bold">{schedules?.length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="w-4 h-4" />
            Marcações Hoje
          </div>
          <div className="text-2xl font-bold text-indigo-600">{data?.total || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <AlertCircle className="w-4 h-4" />
            Ajustes Pendentes
          </div>
          <div className="text-2xl font-bold text-yellow-600">{pendingAdjustments?.total || 0}</div>
          {(pendingAdjustments?.total || 0) > 0 && (
            <Link href="/hr/timeclock/adjustments" className="text-xs text-indigo-600 hover:underline">
              Ver pendentes →
            </Link>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-1">Data Selecionada</div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-lg font-bold border-none p-0 focus:ring-0"
          />
        </div>
      </div>

      {/* Tabela de marcações */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por funcionário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispositivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries?.map((entry) => {
                  const config = clockTypeConfig[entry.type];
                  const IconComponent = config?.icon || Clock;
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{entry.employee.name}</div>
                        <div className="text-sm text-gray-500">#{entry.employee.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config?.color}`}>
                          <IconComponent className="w-3 h-3" />
                          {config?.label || entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.location || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.deviceId || entry.ipAddress || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.isManual ? (
                          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Manual</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">Automático</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!filteredEntries || filteredEntries.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Nenhuma marcação encontrada para esta data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">Página {page} de {data.pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
