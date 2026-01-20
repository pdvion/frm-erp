"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Plus, 
  Search,
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [search, setSearch] = useState("");

  const { data: payrolls, isLoading } = trpc.hr.listPayrolls.useQuery({
    month: selectedMonth,
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "DRAFT":
        return { label: "Rascunho", color: "bg-gray-100 text-gray-700", icon: FileText };
      case "CALCULATED":
        return { label: "Calculada", color: "bg-blue-100 text-blue-700", icon: Clock };
      case "APPROVED":
        return { label: "Aprovada", color: "bg-green-100 text-green-700", icon: CheckCircle };
      case "PAID":
        return { label: "Paga", color: "bg-emerald-100 text-emerald-700", icon: DollarSign };
      default:
        return { label: status, color: "bg-gray-100 text-gray-700", icon: FileText };
    }
  };

  // Calcular totais com useMemo para evitar recálculo a cada render
  const totals = useMemo(
    () =>
      payrolls?.reduce(
        (acc, p) => ({
          grossSalary: acc.grossSalary + (p.grossSalary || 0),
          netSalary: acc.netSalary + (p.netSalary || 0),
          inss: acc.inss + (p.inssValue || 0),
          irrf: acc.irrf + (p.irrfValue || 0),
        }),
        { grossSalary: 0, netSalary: 0, inss: 0, irrf: 0 }
      ) ?? { grossSalary: 0, netSalary: 0, inss: 0, irrf: 0 },
    [payrolls]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Folha de Pagamento"
        icon={<DollarSign className="w-6 h-6 text-green-600" />}
        backHref="/hr"
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <Download className="w-5 h-5" />
              <span>Exportar</span>
            </button>
            <Link
              href="/hr/payroll/calculate"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Calcular Folha</span>
            </Link>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Competência</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por funcionário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Funcionários</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{payrolls?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Salário Bruto</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.grossSalary)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Descontos</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.inss + totals.irrf)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Salário Líquido</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.netSalary)}</p>
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !payrolls || payrolls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma folha encontrada</h3>
            <p className="text-gray-500 mb-4">Calcule a folha de pagamento para este mês</p>
            <Link
              href="/hr/payroll/calculate"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)]"
            >
              <Plus className="w-5 h-5" />
              Calcular Folha
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Salário Bruto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    INSS
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    IRRF
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Salário Líquido
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls
                  .filter(
                    (p) =>
                      !search ||
                      p.employee.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((payroll) => {
                    const statusConfig = getStatusConfig(payroll.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr key={payroll.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{payroll.employee.name}</p>
                            <p className="text-sm text-gray-500">
                              {payroll.employee.position?.name || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {formatCurrency(payroll.grossSalary || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-red-600">
                          -{formatCurrency(payroll.inssValue || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-red-600">
                          -{formatCurrency(payroll.irrfValue || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                          {formatCurrency(payroll.netSalary || 0)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/hr/payroll/${payroll.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
