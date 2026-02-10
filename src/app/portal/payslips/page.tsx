"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { FileText, Download, Eye, Calendar } from "lucide-react";
import Link from "next/link";
import { generatePdfFromHtml, formatCurrency as formatCurrencyPdf } from "@/lib/pdf-generator";

export default function PayslipsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: payslips, isLoading } =
    trpc.employeePortal.getMyPayslips.useQuery({
      year: selectedYear,
      limit: 12,
    });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const getMonthName = (month: number) => {
    return new Date(currentYear, month - 1).toLocaleDateString("pt-BR", {
      month: "long",
    });
  };

  const handleDownloadPdf = (payslip: NonNullable<typeof payslips>[number]) => {
    const monthName = getMonthName(payslip.payroll.referenceMonth);
    const content = `
      <div class="header">
        <h1>HOLERITE</h1>
        <p>${monthName} de ${payslip.payroll.referenceYear}</p>
      </div>
      <table>
        <tr><th>Salário Bruto</th><td style="text-align: right">${formatCurrencyPdf(payslip.grossSalary || 0)}</td></tr>
        <tr><th>INSS</th><td style="text-align: right">${formatCurrencyPdf(payslip.inss || 0)}</td></tr>
        <tr><th>IRRF</th><td style="text-align: right">${formatCurrencyPdf(payslip.irrf || 0)}</td></tr>
        <tr><th>Outros Descontos</th><td style="text-align: right">${formatCurrencyPdf(payslip.totalDeductions || 0)}</td></tr>
        <tr style="background: #e8f5e9"><th>Salário Líquido</th><td style="text-align: right; font-weight: bold">${formatCurrencyPdf(payslip.netSalary || 0)}</td></tr>
      </table>
    `;
    generatePdfFromHtml(content, {
      title: `Holerite - ${monthName} ${payslip.payroll.referenceYear}`,
      filename: `holerite-${payslip.payroll.referenceYear}-${payslip.payroll.referenceMonth}.pdf`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Meus Holerites"
        icon={<FileText className="w-6 h-6" />}
        backHref="/portal"
        backLabel="Voltar ao Portal"
      />

      {/* Year Filter */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-theme-muted" />
          <span className="text-theme-secondary">Ano:</span>
          <div className="flex gap-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Payslips List */}
      <div className="bg-theme-card rounded-lg border border-theme">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-theme-secondary rounded animate-pulse"
              />
            ))}
          </div>
        ) : payslips && payslips.length > 0 ? (
          <div className="divide-y divide-theme">
            {payslips.map((payslip) => (
              <div
                key={payslip.id}
                className="p-4 hover:bg-theme-hover transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-theme capitalize">
                        {getMonthName(payslip.payroll.referenceMonth)}{" "}
                        {payslip.payroll.referenceYear}
                      </p>
                      <p className="text-sm text-theme-muted">
                        {payslip.payroll.status === "CLOSED" ? (
                          <span className="text-green-600">Fechado</span>
                        ) : (
                          <span className="text-yellow-600">
                            Em processamento
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-theme-muted">
                          Bruto
                        </p>
                        <p className="font-medium text-theme">
                          {formatCurrency(Number(payslip.grossSalary))}
                        </p>
                      </div>
                      <div>
                        <p className="text-theme-muted">
                          Descontos
                        </p>
                        <p className="font-medium text-red-600">
                          {formatCurrency(
                            (Number(payslip.inss) || 0) +
                              (Number(payslip.irrf) || 0) +
                              (Number(payslip.totalDeductions) || 0)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-theme-muted">
                          Líquido
                        </p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(Number(payslip.netSalary))}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/portal/payslips/${payslip.id}`}>
                        <Button variant="secondary" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadPdf(payslip)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <p className="text-theme-muted">
              Nenhum holerite encontrado para {selectedYear}
            </p>
          </div>
        )}
      </div>

      {/* Income Report Link */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Informe de Rendimentos
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Baixe seu informe de rendimentos para declaração do IR
            </p>
          </div>
          <Link href={`/portal/income-report?year=${selectedYear}`}>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Baixar Informe {selectedYear}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
