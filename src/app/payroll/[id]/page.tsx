"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Users,
  ChevronLeft,
  Clock,
  CheckCircle,
  Calculator,
  Loader2,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Building2,
  FileText,
  TrendingUp,
  TrendingDown,
  PieChart,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <Clock className="w-4 h-4" /> },
  PROCESSED: { label: "Processada", color: "bg-blue-100 text-blue-800", icon: <Calculator className="w-4 h-4" /> },
  APPROVED: { label: "Aprovada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  PAID: { label: "Paga", color: "bg-purple-100 text-purple-800", icon: <DollarSign className="w-4 h-4" /> },
};

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function PayrollDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  const { data: payroll, isLoading, refetch } = trpc.hr.getPayroll.useQuery({ id });
  const { data: summary } = trpc.hr.payrollSummary.useQuery({ payrollId: id });

  const calculateMutation = trpc.hr.calculatePayroll.useMutation({
    onSuccess: () => refetch(),
  });

  const approveMutation = trpc.hr.approvePayroll.useMutation({
    onSuccess: () => refetch(),
  });

  const removeEventMutation = trpc.hr.removePayrollEvent.useMutation({
    onSuccess: () => refetch(),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Folha não encontrada</h3>
          <Link href="/payroll" className="text-indigo-600 hover:text-indigo-800">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[payroll.status] || statusConfig.DRAFT;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/payroll" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Folha {months[payroll.referenceMonth - 1]} / {payroll.referenceYear}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon}
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              {payroll.status === "DRAFT" && (
                <button
                  onClick={() => calculateMutation.mutate({ payrollId: id })}
                  disabled={calculateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Calculator className="w-4 h-4" />
                  {calculateMutation.isPending ? "Calculando..." : "Calcular Folha"}
                </button>
              )}
              {payroll.status === "PROCESSED" && (
                <button
                  onClick={() => approveMutation.mutate({ payrollId: id })}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {approveMutation.isPending ? "Aprovando..." : "Aprovar Folha"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm text-gray-600">Funcionários</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{payroll.employeeCount}</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Total Bruto</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(payroll.totalGross)}</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-gray-600">Descontos</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(payroll.totalDeductions)}</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Total Líquido</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(payroll.totalNet)}</div>
              </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Funcionários</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Funcionário
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Salário Base
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Bruto
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        INSS
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        IRRF
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Líquido
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payroll.items?.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 ${selectedItem === item.id ? "bg-indigo-50" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.employee?.name}</div>
                          <div className="text-sm text-gray-500">Cód: {item.employee?.code}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          {formatCurrency(item.baseSalary)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(item.grossSalary)}
                        </td>
                        <td className="px-6 py-4 text-right text-red-600">
                          {formatCurrency(item.inss)}
                        </td>
                        <td className="px-6 py-4 text-right text-red-600">
                          {formatCurrency(item.irrf)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">
                          {formatCurrency(item.netSalary)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedItem(selectedItem === item.id ? null : item.id);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            {selectedItem === item.id ? "Fechar" : "Detalhes"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Employee Events */}
            {selectedItem && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Eventos - {payroll.items?.find((i) => i.id === selectedItem)?.employee?.name}
                  </h2>
                  {payroll.status === "DRAFT" && (
                    <button
                      onClick={() => setShowAddEventModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Evento
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {(() => {
                    const item = payroll.items?.find((i) => i.id === selectedItem);
                    if (!item?.events || item.events.length === 0) {
                      return (
                        <p className="text-gray-500 text-center py-4">
                          Nenhum evento adicional
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {item.events.map((event) => (
                          <div
                            key={event.id}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              event.isDeduction ? "bg-red-50" : "bg-green-50"
                            }`}
                          >
                            <div>
                              <div className="font-medium text-gray-900">{event.description}</div>
                              <div className="text-sm text-gray-500">Código: {event.code}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`font-medium ${event.isDeduction ? "text-red-600" : "text-green-600"}`}>
                                {event.isDeduction ? "-" : "+"}{formatCurrency(event.value)}
                              </span>
                              {payroll.status === "DRAFT" && (
                                <button
                                  onClick={() => removeEventMutation.mutate({ eventId: event.id })}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Taxes Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Encargos
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">INSS Funcionários</span>
                  <span className="font-medium text-gray-900">{formatCurrency(summary?.totals?.inss || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IRRF</span>
                  <span className="font-medium text-gray-900">{formatCurrency(summary?.totals?.irrf || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">FGTS (8%)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(summary?.totals?.fgts || 0)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">INSS Patronal (20%)</span>
                    <span className="font-medium text-gray-900">{formatCurrency(payroll.totalGross * 0.2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* By Department */}
            {summary?.byDepartment && summary.byDepartment.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  Por Departamento
                </h2>
                <div className="space-y-3">
                  {summary.byDepartment.map((dept) => (
                    <div key={dept.name} className="flex justify-between">
                      <div>
                        <span className="text-gray-900">{dept.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({dept.count})</span>
                      </div>
                      <span className="font-medium text-gray-900">{formatCurrency(dept.net)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Summary */}
            {summary?.eventSummary && summary.eventSummary.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-gray-400" />
                  Resumo de Eventos
                </h2>
                <div className="space-y-2">
                  {summary.eventSummary.map((event) => (
                    <div
                      key={event.code}
                      className={`flex justify-between p-2 rounded ${
                        event.isDeduction ? "bg-red-50" : "bg-green-50"
                      }`}
                    >
                      <div>
                        <span className="text-gray-900">{event.description}</span>
                        <span className="text-sm text-gray-500 ml-2">({event.count}x)</span>
                      </div>
                      <span className={`font-medium ${event.isDeduction ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(event.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Informações
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Código</span>
                  <span className="text-gray-900">{payroll.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Referência</span>
                  <span className="text-gray-900">{months[payroll.referenceMonth - 1]} / {payroll.referenceYear}</span>
                </div>
                {payroll.processedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Processada em</span>
                    <span className="text-gray-900">{new Date(payroll.processedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                )}
                {payroll.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Aprovada em</span>
                    <span className="text-gray-900">{new Date(payroll.approvedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Event Modal */}
      {showAddEventModal && selectedItem && (
        <AddEventModal
          payrollItemId={selectedItem}
          onClose={() => setShowAddEventModal(false)}
          onSuccess={() => {
            setShowAddEventModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function AddEventModal({
  payrollItemId,
  onClose,
  onSuccess,
}: {
  payrollItemId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [isDeduction, setIsDeduction] = useState(false);

  const addEventMutation = trpc.hr.addPayrollEvent.useMutation({
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Adicionar Evento
        </h3>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: HE50, BONUS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Hora Extra 50%"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDeduction"
              checked={isDeduction}
              onChange={(e) => setIsDeduction(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isDeduction" className="text-sm text-gray-700">
              É um desconto
            </label>
          </div>
        </div>

        {addEventMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {addEventMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              addEventMutation.mutate({
                payrollItemId,
                code,
                description,
                value: parseFloat(value) || 0,
                isDeduction,
              })
            }
            disabled={!code || !description || !value || addEventMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {addEventMutation.isPending ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
