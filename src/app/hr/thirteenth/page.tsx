"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Calculator,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  CheckCircle,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  FIRST_INSTALLMENT: "1ª Parcela",
  SECOND_INSTALLMENT: "2ª Parcela",
  FULL: "Integral",
  PROPORTIONAL: "Proporcional",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-theme-tertiary text-theme" },
  CALCULATED: { label: "Calculado", color: "bg-blue-100 text-blue-800" },
  PAID: { label: "Pago", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default function ThirteenthPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.thirteenth.list.useQuery({
    type: typeFilter as "FIRST_INSTALLMENT" | "SECOND_INSTALLMENT" | "FULL" | "PROPORTIONAL" | "ALL",
    status: statusFilter as "PENDING" | "CALCULATED" | "PAID" | "CANCELLED" | "ALL",
    year,
    page,
    limit: 20,
  });

  const { data: summary } = trpc.thirteenth.summary.useQuery({ year });

  const calculateFirstMutation = trpc.thirteenth.calculateFirstInstallment.useMutation({
    onSuccess: () => utils.thirteenth.list.invalidate(),
  });

  const calculateSecondMutation = trpc.thirteenth.calculateSecondInstallment.useMutation({
    onSuccess: () => utils.thirteenth.list.invalidate(),
  });

  const filteredItems = data?.items.filter((item) =>
    item.employee.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="13º Salário"
        subtitle="Cálculo e pagamento do décimo terceiro"
        icon={<Calculator className="w-6 h-6" />}
        module="hr"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => calculateFirstMutation.mutate({ year })}
              disabled={calculateFirstMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-theme-input rounded-lg hover:bg-theme-hover transition-colors disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              Calcular 1ª Parcela
            </button>
            <button
              onClick={() => calculateSecondMutation.mutate({ year })}
              disabled={calculateSecondMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              Calcular 2ª Parcela
            </button>
          </div>
        }
      />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
              <Users className="w-4 h-4" />
              1ª Parcela
            </div>
            <div className="text-2xl font-bold">{summary.firstInstallment.count}</div>
          </div>
          <div className="bg-theme-card p-4 rounded-lg shadow">
            <div className="text-theme-muted text-sm mb-1">Total 1ª Parcela</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.firstInstallment.totalNet)}</div>
          </div>
          <div className="bg-theme-card p-4 rounded-lg shadow">
            <div className="text-theme-muted text-sm mb-1">Total 2ª Parcela</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.secondInstallment.totalNet)}</div>
          </div>
          <div className="bg-theme-card p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Pagos
            </div>
            <div className="text-2xl font-bold">{summary.firstInstallment.paid + summary.secondInstallment.paid}</div>
          </div>
        </div>
      )}

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
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-theme-input rounded-lg"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="FIRST_INSTALLMENT">1ª Parcela</option>
              <option value="SECOND_INSTALLMENT">2ª Parcela</option>
              <option value="FULL">Integral</option>
              <option value="PROPORTIONAL">Proporcional</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-theme-input rounded-lg"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PENDING">Pendente</option>
              <option value="CALCULATED">Calculado</option>
              <option value="PAID">Pago</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <select
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
              className="px-4 py-2 border border-theme-input rounded-lg"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Funcionário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Meses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Valor Bruto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">INSS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">IRRF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Valor Líquido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {filteredItems?.map((item) => (
                  <tr key={item.id} className="hover:bg-theme-hover">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-theme">
                      {item.employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-theme-tertiary text-theme">
                        {typeLabels[item.type] || item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                      {item.monthsWorked}/12
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme">
                      {formatCurrency(item.grossValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {item.inssDeduction > 0 ? `-${formatCurrency(item.inssDeduction)}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {item.irrfDeduction > 0 ? `-${formatCurrency(item.irrfDeduction)}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-theme">
                      {formatCurrency(item.netValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[item.status]?.color}`}>
                        {statusConfig[item.status]?.label || item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!filteredItems || filteredItems.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-theme-muted">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-theme">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded hover:bg-theme-hover disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-theme-secondary">Página {page} de {data.pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="p-2 rounded hover:bg-theme-hover disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
