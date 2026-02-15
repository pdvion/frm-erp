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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [search, setSearch] = useState("");

  const { data: payrolls, isLoading } = trpc.hr.listPayrolls.useQuery({
    month: selectedMonth,
  });

  const getStatusConfig = (status: string): { label: string; variant: BadgeVariant; icon: typeof FileText } => {
    switch (status) {
      case "DRAFT":
        return { label: "Rascunho", variant: "default", icon: FileText };
      case "CALCULATED":
        return { label: "Calculada", variant: "info", icon: Clock };
      case "APPROVED":
        return { label: "Aprovada", variant: "success", icon: CheckCircle };
      case "PAID":
        return { label: "Paga", variant: "emerald", icon: DollarSign };
      default:
        return { label: status, variant: "default", icon: FileText };
    }
  };

  // Calcular totais com useMemo para evitar recálculo a cada render
  const totals = useMemo(
    () =>
      payrolls?.reduce(
        (acc, p) => ({
          grossSalary: Number(acc.grossSalary) + (Number(p.grossSalary) || 0),
          netSalary: Number(acc.netSalary) + (Number(p.netSalary) || 0),
          inss: acc.inss + (Number(p.inssValue) || 0),
          irrf: acc.irrf + (Number(p.irrfValue) || 0),
        }),
        { grossSalary: 0, netSalary: 0, inss: 0, irrf: 0 }
      ) ?? { grossSalary: 0, netSalary: 0, inss: 0, irrf: 0 },
    [payrolls]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Folha de Pagamento"
        icon={<DollarSign className="w-6 h-6 text-green-600" />}
        backHref="/hr"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Download className="w-5 h-5" />}
            >
              Exportar
            </Button>
            <Link href="/hr/payroll/calculate">
              <Button leftIcon={<Plus className="w-5 h-5" />}>
                Calcular Folha
              </Button>
            </Link>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              label="Competência"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-48"
            />
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-theme-secondary mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-5 h-5 z-10" />
                <Input
                  placeholder="Buscar por funcionário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Funcionários</span>
            </div>
            <p className="text-2xl font-bold text-theme">{payrolls?.length || 0}</p>
          </div>
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Salário Bruto</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.grossSalary)}</p>
          </div>
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Descontos</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.inss + totals.irrf)}
            </p>
          </div>
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
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
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-12 text-center">
            <DollarSign className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme mb-2">Nenhuma folha encontrada</h3>
            <p className="text-theme-muted mb-4">Calcule a folha de pagamento para este mês</p>
            <Link href="/hr/payroll/calculate">
              <Button leftIcon={<Plus className="w-5 h-5" />}>
                Calcular Folha
              </Button>
            </Link>
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
                    Salário Bruto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    INSS
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    IRRF
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Salário Líquido
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
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
                      <tr key={payroll.id} className="hover:bg-theme-hover">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-theme">{payroll.employee.name}</p>
                            <p className="text-sm text-theme-muted">
                              {payroll.employee.position?.name || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-theme">
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
                          <Badge variant={statusConfig.variant}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
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
