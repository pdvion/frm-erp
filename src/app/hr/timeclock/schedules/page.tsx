"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
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

// Dados mockados para escalas de trabalho
const mockSchedules = [
  {
    id: "1",
    name: "Comercial Padrão",
    code: "COM-01",
    type: "FIXED",
    employees: 45,
    workDays: ["SEG", "TER", "QUA", "QUI", "SEX"],
    shifts: [
      { start: "08:00", end: "12:00", type: "work" },
      { start: "12:00", end: "13:00", type: "break" },
      { start: "13:00", end: "17:00", type: "work" },
    ],
    weeklyHours: 40,
    isActive: true,
  },
  {
    id: "2",
    name: "Turno Manhã",
    code: "TUR-M",
    type: "SHIFT",
    employees: 12,
    workDays: ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"],
    shifts: [
      { start: "06:00", end: "10:00", type: "work" },
      { start: "10:00", end: "10:15", type: "break" },
      { start: "10:15", end: "14:00", type: "work" },
    ],
    weeklyHours: 44,
    isActive: true,
  },
  {
    id: "3",
    name: "Turno Tarde",
    code: "TUR-T",
    type: "SHIFT",
    employees: 10,
    workDays: ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"],
    shifts: [
      { start: "14:00", end: "18:00", type: "work" },
      { start: "18:00", end: "18:15", type: "break" },
      { start: "18:15", end: "22:00", type: "work" },
    ],
    weeklyHours: 44,
    isActive: true,
  },
  {
    id: "4",
    name: "Turno Noite",
    code: "TUR-N",
    type: "SHIFT",
    employees: 8,
    workDays: ["SEG", "TER", "QUA", "QUI", "SEX"],
    shifts: [
      { start: "22:00", end: "02:00", type: "work" },
      { start: "02:00", end: "02:30", type: "break" },
      { start: "02:30", end: "06:00", type: "work" },
    ],
    weeklyHours: 40,
    isActive: true,
  },
  {
    id: "5",
    name: "12x36",
    code: "ESC-12x36",
    type: "ROTATING",
    employees: 6,
    workDays: ["Escala rotativa"],
    shifts: [
      { start: "07:00", end: "13:00", type: "work" },
      { start: "13:00", end: "14:00", type: "break" },
      { start: "14:00", end: "19:00", type: "work" },
    ],
    weeklyHours: 36,
    isActive: true,
  },
];

const weekDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

const scheduleTypeLabels: Record<string, { label: string; color: string }> = {
  FIXED: { label: "Fixo", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  SHIFT: { label: "Turno", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  ROTATING: { label: "Rotativo", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

export default function TimeclockSchedulesPage() {
  const [schedules] = useState(mockSchedules);
  const [filter, setFilter] = useState<string>("ALL");

  const filteredSchedules = filter === "ALL" 
    ? schedules 
    : schedules.filter((s) => s.type === filter);

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
                <button className="p-2 text-theme-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dias da Semana */}
            <div className="mb-4">
              <div className="text-xs text-theme-muted mb-2">Dias de Trabalho</div>
              <div className="flex gap-1">
                {schedule.type === "ROTATING" ? (
                  <span className="text-sm text-theme">{schedule.workDays[0]}</span>
                ) : (
                  weekDays.map((day) => (
                    <span
                      key={day}
                      className={`w-8 h-8 flex items-center justify-center text-xs rounded-full ${
                        schedule.workDays.includes(day)
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                          : "bg-theme-secondary text-theme-muted"
                      }`}
                    >
                      {day.charAt(0)}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Horários */}
            <div className="mb-4">
              <div className="text-xs text-theme-muted mb-2">Horários</div>
              <div className="flex flex-wrap gap-2">
                {schedule.shifts.map((shift, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                      shift.type === "work"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    }`}
                  >
                    {getShiftIcon(shift.start)}
                    <span>{shift.start} - {shift.end}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-theme">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-theme-muted">
                  <Users className="w-4 h-4" />
                  <span>{schedule.employees} funcionários</span>
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
