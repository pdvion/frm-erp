"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Clock, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { generatePdfFromHtml } from "@/lib/pdf-generator";

export default function TimesheetPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: timeRecords, isLoading } =
    trpc.employeePortal.getMyTimeRecords.useQuery({
      month: selectedMonth,
      year: selectedYear,
    });

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getMonthName = () => {
    return new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      }
    );
  };

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  };

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const hasRecords = timeRecords?.records && timeRecords.records.length > 0;

  const handleExportPdf = () => {
    if (!timeRecords?.records || timeRecords.records.length === 0) return;

    const rows = timeRecords.records
      .map((record) => `
        <tr>
          <td>${new Date(record.date).toLocaleDateString("pt-BR")}</td>
          <td>${getDayOfWeek(record.date)}</td>
          <td style="text-align: center">${record.entryTime || "-"}</td>
          <td style="text-align: center">${record.lunchOutTime || "-"}</td>
          <td style="text-align: center">${record.lunchInTime || "-"}</td>
          <td style="text-align: center">${record.exitTime || "-"}</td>
          <td style="text-align: center">${record.workedHours ? `${record.workedHours}h ${record.workedMinutes || 0}m` : "-"}</td>
          <td style="text-align: center">${record.overtimeHours ? `${record.overtimeHours}h ${record.overtimeMinutes || 0}m` : "-"}</td>
        </tr>
      `)
      .join("");

    const content = `
      <div class="header">
        <h1>ESPELHO DE PONTO</h1>
        <p>${getMonthName()}</p>
      </div>
      <table style="margin-bottom: 20px">
        <tr>
          <td><strong>Dias Trabalhados:</strong> ${timeRecords.summary?.workDays || 0}</td>
          <td><strong>Horas Trabalhadas:</strong> ${timeRecords.summary?.totalWorkedHours || 0}h ${timeRecords.summary?.totalWorkedMinutes || 0}m</td>
          <td><strong>Horas Extras:</strong> ${timeRecords.summary?.totalOvertimeHours || 0}h ${timeRecords.summary?.totalOvertimeMinutes || 0}m</td>
          <td><strong>Faltas:</strong> ${timeRecords.summary?.absences || 0}</td>
        </tr>
      </table>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Dia</th>
            <th style="text-align: center">Entrada</th>
            <th style="text-align: center">Saída Almoço</th>
            <th style="text-align: center">Retorno</th>
            <th style="text-align: center">Saída</th>
            <th style="text-align: center">Total</th>
            <th style="text-align: center">Extra</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    generatePdfFromHtml(content, {
      title: `Espelho de Ponto - ${getMonthName()}`,
      filename: `espelho-ponto-${selectedYear}-${selectedMonth}.pdf`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Espelho de Ponto"
        icon={<Clock className="w-6 h-6" />}
        backHref="/portal"
        backLabel="Voltar ao Portal"
        actions={
          <Button
            variant="secondary"
            onClick={handleExportPdf}
            disabled={!hasRecords || isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        }
      />

      {/* Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {getMonthName()}
          </h2>
          <Button variant="secondary" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      {timeRecords?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dias Trabalhados
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {timeRecords.summary.workDays}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Horas Trabalhadas
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {timeRecords.summary.totalWorkedHours}h{" "}
              {timeRecords.summary.totalWorkedMinutes}m
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Horas Extras
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {timeRecords.summary.totalOvertimeHours}h{" "}
              {timeRecords.summary.totalOvertimeMinutes}m
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Atrasos</p>
            <p className="text-2xl font-bold text-yellow-600">
              {timeRecords.summary.lateArrivals}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Faltas</p>
            <p className="text-2xl font-bold text-red-600">
              {timeRecords.summary.absences}
            </p>
          </div>
        </div>
      )}

      {/* Time Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Dia
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Entrada
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Saída Almoço
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Retorno
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Saída
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Extra
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="animate-pulse">Carregando...</div>
                  </td>
                </tr>
              ) : timeRecords?.records && timeRecords.records.length > 0 ? (
                timeRecords.records.map((record: { id: string; date: string; entryTime?: string | null; lunchOutTime?: string | null; lunchInTime?: string | null; exitTime?: string | null; workedHours?: number | null; workedMinutes?: number | null; overtimeHours?: number | null; overtimeMinutes?: number | null }) => (
                  <tr
                    key={record.id}
                    className={`${
                      isWeekend(record.date)
                        ? "bg-gray-50 dark:bg-gray-700/50"
                        : ""
                    } hover:bg-gray-50 dark:hover:bg-gray-700/30`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {new Date(record.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {getDayOfWeek(record.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                      {record.entryTime || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                      {record.lunchOutTime || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                      {record.lunchInTime || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                      {record.exitTime || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-900 dark:text-white">
                      {record.workedHours
                        ? `${record.workedHours}h ${record.workedMinutes || 0}m`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-blue-600">
                      {record.overtimeHours
                        ? `${record.overtimeHours}h ${record.overtimeMinutes || 0}m`
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nenhum registro encontrado para este mês
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
