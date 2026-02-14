"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { UserMinus, Loader2 } from "lucide-react";

const typeLabels: Record<string, string> = {
  RESIGNATION: "Pedido de Demissão",
  DISMISSAL_WITH_CAUSE: "Justa Causa",
  DISMISSAL_NO_CAUSE: "Sem Justa Causa",
  MUTUAL_AGREEMENT: "Acordo Mútuo",
  CONTRACT_END: "Fim de Contrato",
  RETIREMENT: "Aposentadoria",
  DEATH: "Falecimento",
};

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Rascunho", variant: "default" },
  CALCULATED: { label: "Calculado", variant: "info" },
  APPROVED: { label: "Aprovado", variant: "success" },
  PAID: { label: "Pago", variant: "emerald" },
  HOMOLOGATED: { label: "Homologado", variant: "purple" },
  CANCELLED: { label: "Cancelado", variant: "error" },
};

export default function TerminationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: termination, isLoading } = trpc.terminations.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-theme-muted" />
      </div>
    );
  }

  if (!termination) {
    return (
      <div className="p-8 text-center">
        <p className="text-theme-muted">Rescisão não encontrada.</p>
      </div>
    );
  }

  const status = statusConfig[termination.status as string] || statusConfig.DRAFT;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<UserMinus className="w-6 h-6 text-red-500" />}
        title={`Rescisão — ${termination.employee?.name || "Funcionário"}`}
        subtitle={typeLabels[termination.type] || termination.type}
        backHref="/hr/terminations"
      />

      <div className="flex items-center gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Dados da Rescisão</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-theme-muted">Tipo</span>
              <p className="font-medium text-theme mt-1">{typeLabels[termination.type] || termination.type}</p>
            </div>
            <div>
              <span className="text-theme-muted">Data da Rescisão</span>
              <p className="font-medium text-theme mt-1">{formatDate(termination.terminationDate)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Último Dia de Trabalho</span>
              <p className="font-medium text-theme mt-1">{termination.lastWorkDay ? formatDate(termination.lastWorkDay) : "—"}</p>
            </div>
            <div>
              <span className="text-theme-muted">Data do Aviso</span>
              <p className="font-medium text-theme mt-1">{termination.noticeDate ? formatDate(termination.noticeDate) : "—"}</p>
            </div>
            <div>
              <span className="text-theme-muted">Aviso Trabalhado</span>
              <p className="font-medium text-theme mt-1">{termination.noticePeriodWorked ? "Sim" : "Não"}</p>
            </div>
            <div>
              <span className="text-theme-muted">Aviso Indenizado</span>
              <p className="font-medium text-theme mt-1">{termination.noticePeriodIndemnity ? "Sim" : "Não"}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Valores</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-theme-muted">Salário Base</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(termination.baseSalary)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Saldo de Salário</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(termination.salaryBalance)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Férias Proporcionais</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(termination.vacationProportional)}</p>
            </div>
            <div>
              <span className="text-theme-muted">13º Proporcional</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(termination.thirteenthProportional)}</p>
            </div>
            <div>
              <span className="text-theme-muted">FGTS</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(termination.fgtsBalance)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Multa FGTS</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(termination.fgtsFine)}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-theme">
              <span className="text-theme-muted">Total Líquido</span>
              <p className="text-xl font-bold text-theme mt-1">{formatCurrency(termination.totalNet)}</p>
            </div>
          </div>
        </div>
      </div>

      {termination.reason && (
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-2">Motivo</h2>
          <p className="text-sm text-theme whitespace-pre-wrap">{termination.reason}</p>
        </div>
      )}

      {termination.notes && (
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-2">Observações</h2>
          <p className="text-sm text-theme whitespace-pre-wrap">{termination.notes}</p>
        </div>
      )}
    </div>
  );
}
