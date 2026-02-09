"use client";

import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export default function VacationsPage() {
  const { data: vacations, isLoading } = trpc.employeePortal.getMyVacations.useQuery();

  const getStatusBadge = (status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "SCHEDULED" | "IN_PROGRESS" | "CANCELLED" | string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3" />
            Aprovado
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="error">
            <XCircle className="w-3 h-3" />
            Rejeitado
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="info">
            <CheckCircle className="w-3 h-3" />
            Concluído
          </Badge>
        );
      default:
        return (
          <Badge variant="default">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Minhas Férias"
        icon={<Calendar className="w-6 h-6" />}
        backHref="/portal"
        backLabel="Voltar ao Portal"
        actions={
          <Link href="/portal/vacations/request">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Férias
            </Button>
          </Link>
        }
      />

      {/* Balance Card */}
      {vacations?.balance && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Saldo de Férias</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-purple-200 text-sm">Dias Adquiridos</p>
              <p className="text-3xl font-bold">{vacations.balance.totalEarned}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Dias Usados</p>
              <p className="text-3xl font-bold">{vacations.balance.used}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Disponível</p>
              <p className="text-3xl font-bold">{vacations.balance.available}</p>
            </div>
          </div>
          <p className="text-purple-200 text-sm mt-4">
            Data de admissão: {new Date(vacations.balance.hireDate).toLocaleDateString("pt-BR")}
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Regras de Férias:</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 list-disc list-inside">
              <li>Mínimo de 5 dias por período</li>
              <li>Máximo de 30 dias por período aquisitivo</li>
              <li>Possibilidade de vender até 10 dias (abono pecuniário)</li>
              <li>Solicite com pelo menos 30 dias de antecedência</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Vacation History */}
      <div className="bg-theme-card rounded-lg border border-theme">
        <div className="p-4 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme">
            Histórico de Férias
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-theme-secondary rounded animate-pulse" />
            ))}
          </div>
        ) : vacations?.history && vacations.history.length > 0 ? (
          <div className="divide-y divide-theme">
            {vacations.history.map((vacation: { id: string; startDate: string | Date; endDate: string | Date; totalDays?: number | null; soldDays?: number | null; status?: string | null; notes?: string | null }) => (
              <div key={vacation.id} className="p-4 hover:bg-theme-hover">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-theme">
                        {new Date(vacation.startDate).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(vacation.endDate).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-theme-muted">
                        {vacation.totalDays || 30} dias
                        {(vacation.soldDays || 0) > 0 && ` (${vacation.soldDays} dias vendidos)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {vacation.status && getStatusBadge(vacation.status)}
                  </div>
                </div>
                {vacation.notes && (
                  <p className="text-sm text-theme-muted mt-2 ml-16">
                    {vacation.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <p className="text-theme-muted">
              Nenhum registro de férias encontrado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
