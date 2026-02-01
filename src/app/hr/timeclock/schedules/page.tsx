"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  CalendarDays,
  Plus,
  Clock,
  Users,
  Edit2,
  Trash2,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";

// Tipos para escalas de trabalho
interface ScheduleShift {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

interface Schedule {
  id: string;
  name: string;
  code: string | null;
  type: string;
  weeklyHours: number;
  isActive: boolean;
  shifts: ScheduleShift[];
  _count: { employees: number };
}


const weekDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

const scheduleTypeLabels: Record<string, { label: string; color: string }> = {
  FIXED: { label: "Fixo", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  SHIFT: { label: "Turno", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  ROTATING: { label: "Rotativo", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

export default function TimeclockSchedulesPage() {
  const [filter, setFilter] = useState<string>("ALL");
  
  const { data: schedulesData, isLoading } = trpc.timeclock.listSchedules.useQuery({});
  
  // Usar dados do backend
  const schedules: Schedule[] = schedulesData?.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    type: s.type,
    weeklyHours: s.weeklyHours,
    isActive: s.isActive,
    shifts: s.shifts,
    _count: s._count,
  })) || [];

  const filteredSchedules = filter === "ALL" 
    ? schedules 
    : schedules.filter((s) => s.type === filter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Escalas de Trabalho"
          subtitle="Gerenciar escalas e horários de trabalho"
          icon={<CalendarDays className="w-6 h-6" />}
          module="HR"
          backHref="/hr/timeclock"
          backLabel="Voltar"
        />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  const getShiftIcon = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 6 && hour < 12) return <Sun className="w-4 h-4 text-yellow-500" />;
    if (hour >= 12 && hour < 18) return <Coffee className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escalas de Trabalho"
        subtitle="Gerenciar escalas e horários de trabalho"
        icon={<CalendarDays className="w-6 h-6" />}
        module="HR"
        backHref="/hr/timeclock"
        backLabel="Voltar"
      />

      {/* Ações e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-theme-secondary text-theme hover:bg-theme-tertiary"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter("FIXED")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "FIXED"
                ? "bg-blue-600 text-white"
                : "bg-theme-secondary text-theme hover:bg-theme-tertiary"
            }`}
          >
            Fixas
          </button>
          <button
            onClick={() => setFilter("SHIFT")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "SHIFT"
                ? "bg-blue-600 text-white"
                : "bg-theme-secondary text-theme hover:bg-theme-tertiary"
            }`}
          >
            Turnos
          </button>
          <button
            onClick={() => setFilter("ROTATING")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "ROTATING"
                ? "bg-blue-600 text-white"
                : "bg-theme-secondary text-theme hover:bg-theme-tertiary"
            }`}
          >
            Rotativas
          </button>
        </div>

        <Button leftIcon={<Plus className="w-4 h-4" />}>
          Nova Escala
        </Button>
      </div>

      {/* Cards de Escalas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-theme-card border border-theme rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-theme">{schedule.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${scheduleTypeLabels[schedule.type].color}`}>
                    {scheduleTypeLabels[schedule.type].label}
                  </span>
                </div>
                <p className="text-sm text-theme-muted">{schedule.code}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="p-2 text-theme-muted hover:text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 text-theme-muted hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Dias da Semana */}
            <div className="mb-4">
              <div className="text-xs text-theme-muted mb-2">Dias de Trabalho</div>
              <div className="flex gap-1">
                {schedule.type === "ROTATING" ? (
                  <span className="text-sm text-theme">Escala rotativa</span>
                ) : (
                  weekDays.map((day, idx) => {
                    const hasShiftOnDay = schedule.shifts.some((s) => s.dayOfWeek === idx);
                    return (
                      <span
                        key={day}
                        className={`w-8 h-8 flex items-center justify-center text-xs rounded-full ${
                          hasShiftOnDay
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                            : "bg-theme-secondary text-theme-muted"
                        }`}
                      >
                        {day.charAt(0)}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Horários */}
            <div className="mb-4">
              <div className="text-xs text-theme-muted mb-2">Horários</div>
              <div className="flex flex-wrap gap-2">
                {schedule.shifts.slice(0, 3).map((shift, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    {getShiftIcon(shift.startTime)}
                    <span>{shift.startTime} - {shift.endTime}</span>
                  </div>
                ))}
                {schedule.shifts.length > 3 && (
                  <span className="text-xs text-theme-muted">+{schedule.shifts.length - 3} mais</span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-theme">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-theme-muted">
                  <Users className="w-4 h-4" />
                  <span>{schedule._count.employees} funcionários</span>
                </div>
                <div className="flex items-center gap-1 text-theme-muted">
                  <Clock className="w-4 h-4" />
                  <span>{schedule.weeklyHours}h/semana</span>
                </div>
              </div>
              <Link
                href={`/hr/timeclock/schedules/${schedule.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Ver detalhes
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredSchedules.length === 0 && (
        <div className="text-center py-12 text-theme-muted">
          Nenhuma escala encontrada com o filtro selecionado.
        </div>
      )}
    </div>
  );
}
