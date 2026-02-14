"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Clock, 
  Plus, 
  User,
  CheckCircle,
  AlertTriangle,
  Filter
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";

export default function TimesheetPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const { data: employees } = trpc.hr.listEmployees.useQuery({
    status: "ACTIVE",
    limit: 100,
  });

  const { data: timeEntries, isLoading } = trpc.hr.listTimeEntries.useQuery({
    date: selectedDate,
    employeeId: selectedEmployee || undefined,
  });

  const formatHours = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Folha de Ponto"
        icon={<Clock className="w-6 h-6 text-blue-600" />}
        backHref="/hr"
        actions={
          <Link href="/hr/timesheet/register">
            <Button leftIcon={<Plus className="w-5 h-5" />}>
              Registrar Ponto
            </Button>
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                label="Data"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-theme mb-1">Funcionário</label>
              <Select
                value={selectedEmployee}
                onChange={(value) => setSelectedEmployee(value)}
                placeholder="Todos os funcionários"
                options={[
                  { value: "", label: "Todos os funcionários" },
                  ...(employees?.employees.map((emp) => ({
                    value: emp.id,
                    label: emp.name,
                  })) || []),
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" leftIcon={<Filter className="w-5 h-5" />}>
                Mais Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Total Funcionários</span>
            </div>
            <p className="text-2xl font-bold text-theme">{employees?.employees?.length || 0}</p>
          </div>
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Presentes</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {timeEntries?.filter((e) => Number(e.workedHours) > 0).length || 0}
            </p>
          </div>
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-yellow-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {timeEntries?.filter((e) => e.status === "PENDING").length || 0}
            </p>
          </div>
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Horas Totais</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">--:--</p>
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !timeEntries || timeEntries.length === 0 ? (
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-12 text-center">
            <Clock className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme mb-2">Nenhum registro encontrado</h3>
            <p className="text-theme-muted">Não há registros de ponto para esta data</p>
          </div>
        ) : (
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme overflow-hidden">
            <table className="w-full">
              <thead className="bg-theme-tertiary border-b border-theme">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Previsto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Trabalhado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Hora Extra
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Falta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-theme-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-theme">{entry.employee.name}</p>
                          <p className="text-sm text-theme-muted">{entry.employee.department?.name || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-theme text-right">{formatHours(Number(entry.scheduledHours))}</td>
                    <td className="px-6 py-4 text-sm text-theme text-right">{formatHours(Number(entry.workedHours))}</td>
                    <td className="px-6 py-4 text-sm text-green-600 text-right">
                      {Number(entry.overtimeHours) > 0 ? `+${formatHours(Number(entry.overtimeHours))}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 text-right">
                      {Number(entry.absenceHours) > 0 ? `-${formatHours(Number(entry.absenceHours))}` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {entry.status === "APPROVED" ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3" />
                          Aprovado
                        </Badge>
                      ) : entry.status === "PENDING" ? (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          {entry.status}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
