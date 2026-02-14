"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Clock, Loader2 } from "lucide-react";

const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

const typeLabels: Record<string, string> = {
  FIXED: "Fixo",
  ROTATING: "Rotativo",
  FLEXIBLE: "Flexível",
  SHIFT: "Turno",
};

export default function ScheduleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: schedule, isLoading } = trpc.timeclock.getSchedule.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-theme-muted" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="p-8 text-center">
        <p className="text-theme-muted">Escala não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Clock className="w-6 h-6 text-blue-500" />}
        title={schedule.name}
        subtitle={`${typeLabels[schedule.type] || schedule.type} — ${schedule.weeklyHours}h semanais`}
        backHref="/hr/timeclock/schedules"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Informações</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-theme-muted">Código</span>
              <p className="font-medium text-theme mt-1">{schedule.code || "—"}</p>
            </div>
            <div>
              <span className="text-theme-muted">Tipo</span>
              <p className="font-medium text-theme mt-1">{typeLabels[schedule.type] || schedule.type}</p>
            </div>
            <div>
              <span className="text-theme-muted">Carga Horária Semanal</span>
              <p className="font-medium text-theme mt-1">{String(schedule.weeklyHours)}h</p>
            </div>
            <div>
              <span className="text-theme-muted">Carga Horária Diária</span>
              <p className="font-medium text-theme mt-1">{String(schedule.dailyHours)}h</p>
            </div>
            <div>
              <span className="text-theme-muted">Tolerância</span>
              <p className="font-medium text-theme mt-1">{schedule.toleranceMinutes} min</p>
            </div>
            {schedule.description && (
              <div>
                <span className="text-theme-muted">Descrição</span>
                <p className="font-medium text-theme mt-1">{schedule.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Turnos</h2>
          {schedule.shifts && schedule.shifts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="text-left py-2 px-3 text-theme-muted font-medium">Dia</th>
                    <th className="text-left py-2 px-3 text-theme-muted font-medium">Entrada</th>
                    <th className="text-left py-2 px-3 text-theme-muted font-medium">Saída</th>
                    <th className="text-left py-2 px-3 text-theme-muted font-medium">Intervalo</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.shifts.map((shift: { id: string; dayOfWeek: number; startTime: string; endTime: string; breakStart?: string | null; breakEnd?: string | null }) => (
                    <tr key={shift.id} className="border-b border-theme/50">
                      <td className="py-2 px-3 font-medium text-theme">{dayLabels[shift.dayOfWeek] || `Dia ${shift.dayOfWeek}`}</td>
                      <td className="py-2 px-3 text-theme">{shift.startTime}</td>
                      <td className="py-2 px-3 text-theme">{shift.endTime}</td>
                      <td className="py-2 px-3 text-theme">
                        {shift.breakStart && shift.breakEnd ? `${shift.breakStart} - ${shift.breakEnd}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-theme-muted">Nenhum turno configurado.</p>
          )}
        </div>
      </div>

      {schedule.employees && schedule.employees.length > 0 && (
        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Funcionários ({schedule.employees.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(schedule.employees as unknown as { id: string; name: string; registration?: string | null }[]).map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg bg-theme-secondary">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                  {emp.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-theme">{emp.name}</p>
                  {emp.registration && <p className="text-xs text-theme-muted">{emp.registration}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
