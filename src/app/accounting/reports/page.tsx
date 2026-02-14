"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  BarChart3,
  Loader2,
  FileText,
} from "lucide-react";

const reportOptions = [
  { value: "TRIAL_BALANCE", label: "Balancete de Verificação" },
  { value: "INCOME_STATEMENT", label: "DRE — Demonstração do Resultado" },
];

export default function AccountingReportsPage() {
  const [reportType, setReportType] = useState("TRIAL_BALANCE");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [showReport, setShowReport] = useState(false);

  const trialBalanceQuery = trpc.accounting.getTrialBalance.useQuery(
    { startDate: new Date(startDate), endDate: new Date(endDate) },
    { enabled: showReport && reportType === "TRIAL_BALANCE" },
  );

  const incomeStatementQuery = trpc.accounting.getIncomeStatement.useQuery(
    { startDate: new Date(startDate), endDate: new Date(endDate) },
    { enabled: showReport && reportType === "INCOME_STATEMENT" },
  );

  const isLoading = reportType === "TRIAL_BALANCE" ? trialBalanceQuery.isLoading : incomeStatementQuery.isLoading;
  const isError = reportType === "TRIAL_BALANCE" ? trialBalanceQuery.isError : incomeStatementQuery.isError;
  const error = reportType === "TRIAL_BALANCE" ? trialBalanceQuery.error : incomeStatementQuery.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios Contábeis"
        icon={<BarChart3 className="w-6 h-6" />}
        backHref="/accounting"
        module="financeiro"
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-theme mb-1">Relatório</label>
            <Select
              value={reportType}
              onChange={(v) => { setReportType(v); setShowReport(false); }}
              options={reportOptions}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Data Início</label>
            <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setShowReport(false); }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Data Fim</label>
            <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setShowReport(false); }} />
          </div>
          <Button variant="primary" onClick={() => setShowReport(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Gerar
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {showReport && (
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : isError ? (
            <div className="p-6">
              <Alert variant="error" title="Erro ao gerar relatório">{error?.message}</Alert>
            </div>
          ) : reportType === "TRIAL_BALANCE" && trialBalanceQuery.data ? (
            <TrialBalanceReport data={trialBalanceQuery.data} />
          ) : reportType === "INCOME_STATEMENT" && incomeStatementQuery.data ? (
            <IncomeStatementReport data={incomeStatementQuery.data} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function TrialBalanceReport({ data }: { data: {
  period: { startDate: Date; endDate: Date };
  rows: { accountCode: string; accountName: string; accountType: string; level: number; previousBalance: number; debit: number; credit: number; currentBalance: number }[];
  totals: { previousBalance: { debit: number; credit: number }; movements: { debit: number; credit: number }; currentBalance: { debit: number; credit: number } };
} }) {
  const typeLabels: Record<string, string> = {
    ASSET: "Ativo",
    LIABILITY: "Passivo",
    EQUITY: "PL",
    REVENUE: "Receita",
    EXPENSE: "Despesa",
  };

  return (
    <div>
      <div className="px-6 py-4 border-b border-theme">
        <h3 className="text-lg font-semibold text-theme">Balancete de Verificação</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-theme-table-header border-b border-theme">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Conta</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Tipo</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Saldo Anterior</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Débitos</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Créditos</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Saldo Atual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-table">
            {data.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-theme-table-hover transition-colors">
                <td className="px-4 py-2 text-sm font-mono text-theme">{row.accountCode}</td>
                <td className="px-4 py-2 text-sm font-medium text-theme">{row.accountName}</td>
                <td className="px-4 py-2 text-center">
                  <Badge variant="outline">{typeLabels[row.accountType] ?? row.accountType}</Badge>
                </td>
                <td className="px-4 py-2 text-sm text-right text-theme">{formatCurrency(row.previousBalance)}</td>
                <td className="px-4 py-2 text-sm text-right text-theme">{formatCurrency(row.debit)}</td>
                <td className="px-4 py-2 text-sm text-right text-theme">{formatCurrency(row.credit)}</td>
                <td className="px-4 py-2 text-sm text-right font-semibold text-theme">{formatCurrency(row.currentBalance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-theme-table-header border-t-2 border-theme">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-theme">TOTAIS</td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-theme">{formatCurrency(data.totals.previousBalance.debit - data.totals.previousBalance.credit)}</td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-theme">{formatCurrency(data.totals.movements.debit)}</td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-theme">{formatCurrency(data.totals.movements.credit)}</td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-theme">{formatCurrency(data.totals.currentBalance.debit - data.totals.currentBalance.credit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function IncomeStatementReport({ data }: { data: {
  period: { startDate: Date; endDate: Date };
  revenue: { accountCode: string; accountName: string; level: number; amount: number; isSubtotal: boolean }[];
  expenses: { accountCode: string; accountName: string; level: number; amount: number; isSubtotal: boolean }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
} }) {
  return (
    <div>
      <div className="px-6 py-4 border-b border-theme">
        <h3 className="text-lg font-semibold text-theme">Demonstração do Resultado do Exercício (DRE)</h3>
      </div>
      <div className="p-6 space-y-6">
        {/* Revenues */}
        <div>
          <h4 className="text-sm font-semibold text-theme uppercase tracking-wider mb-3">Receitas</h4>
          <div className="space-y-2">
            {data.revenue.map((r, idx) => (
              <div key={idx} className={`flex items-center justify-between py-1 ${r.isSubtotal ? "font-semibold border-t border-theme pt-2" : ""}`}>
                <span className="text-sm text-theme">
                  <span className="font-mono text-theme-muted mr-2">{r.accountCode}</span>
                  {r.accountName}
                </span>
                <span className="text-sm font-medium text-green-600">{formatCurrency(r.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 border-t border-theme font-semibold">
              <span className="text-sm text-theme">Total Receitas</span>
              <span className="text-sm text-green-600">{formatCurrency(data.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <h4 className="text-sm font-semibold text-theme uppercase tracking-wider mb-3">Despesas</h4>
          <div className="space-y-2">
            {data.expenses.map((e, idx) => (
              <div key={idx} className={`flex items-center justify-between py-1 ${e.isSubtotal ? "font-semibold border-t border-theme pt-2" : ""}`}>
                <span className="text-sm text-theme">
                  <span className="font-mono text-theme-muted mr-2">{e.accountCode}</span>
                  {e.accountName}
                </span>
                <span className="text-sm font-medium text-red-600">({formatCurrency(e.amount)})</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 border-t border-theme font-semibold">
              <span className="text-sm text-theme">Total Despesas</span>
              <span className="text-sm text-red-600">({formatCurrency(data.totalExpenses)})</span>
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div className="flex items-center justify-between py-4 border-t-2 border-theme">
          <span className="text-base font-bold text-theme">Resultado Líquido</span>
          <span className={`text-lg font-bold ${data.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
            {data.netIncome >= 0 ? formatCurrency(data.netIncome) : `(${formatCurrency(Math.abs(data.netIncome))})`}
          </span>
        </div>
      </div>
    </div>
  );
}
