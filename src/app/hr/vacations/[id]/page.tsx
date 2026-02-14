"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { Palmtree, Loader2 } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  SCHEDULED: { label: "Agendada", variant: "info" },
  IN_PROGRESS: { label: "Em Andamento", variant: "warning" },
  COMPLETED: { label: "Concluída", variant: "success" },
  CANCELLED: { label: "Cancelada", variant: "error" },
};

export default function VacationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: vacation, isLoading } = trpc.vacations.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-theme-muted" />
      </div>
    );
  }

  if (!vacation) {
    return (
      <div className="p-8 text-center">
        <p className="text-theme-muted">Férias não encontradas.</p>
      </div>
    );
  }

  const status = statusConfig[vacation.status as string] || statusConfig.SCHEDULED;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Palmtree className="w-6 h-6 text-green-500" />}
        title={`Férias — ${vacation.employee?.name || "Funcionário"}`}
        subtitle={`${formatDate(vacation.startDate)} a ${formatDate(vacation.endDate)}`}
        backHref="/hr/vacations"
      />

      <div className="flex items-center gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Período Aquisitivo</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-theme-muted">Início</span>
              <p className="font-medium text-theme mt-1">{formatDate(vacation.acquisitionStart)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Fim</span>
              <p className="font-medium text-theme mt-1">{formatDate(vacation.acquisitionEnd)}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Período de Gozo</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-theme-muted">Início</span>
              <p className="font-medium text-theme mt-1">{formatDate(vacation.startDate)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Fim</span>
              <p className="font-medium text-theme mt-1">{formatDate(vacation.endDate)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Dias</span>
              <p className="font-medium text-theme mt-1">{vacation.totalDays}</p>
            </div>
            <div>
              <span className="text-theme-muted">Abono Pecuniário</span>
              <p className="font-medium text-theme mt-1">{vacation.soldDays ? `${vacation.soldDays} dias` : "Não"}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Valores</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-theme-muted">Férias</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(vacation.vacationPay)}</p>
            </div>
            <div>
              <span className="text-theme-muted">1/3 Constitucional</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(vacation.oneThirdBonus)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Abono</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(vacation.soldDaysValue)}</p>
            </div>
            <div>
              <span className="text-theme-muted">Descontos</span>
              <p className="font-medium text-theme mt-1">{formatCurrency(vacation.otherDeductions)}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-theme">
              <span className="text-theme-muted">Total Líquido</span>
              <p className="text-xl font-bold text-theme mt-1">{formatCurrency(vacation.totalNet)}</p>
            </div>
          </div>
        </div>
      </div>

      {vacation.notes && (
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-2">Observações</h2>
          <p className="text-sm text-theme whitespace-pre-wrap">{vacation.notes}</p>
        </div>
      )}
    </div>
  );
}
