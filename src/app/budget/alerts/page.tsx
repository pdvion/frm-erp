"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { toNumber } from "@/lib/precision";

type AlertType = "WARNING" | "EXCEEDED" | "BLOCKED" | undefined;

export default function BudgetAlertsPage() {
  const [typeFilter, setTypeFilter] = useState<AlertType>(undefined);
  const [showResolved, setShowResolved] = useState(false);

  const { data: alerts, isLoading, refetch } = trpc.budget.listAlerts.useQuery({
    type: typeFilter,
    isResolved: showResolved ? undefined : false,
  });

  const resolveMutation = trpc.budget.resolveAlert.useMutation({
    onSuccess: () => refetch(),
  });

  const typeColors: Record<string, string> = {
    WARNING: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
    EXCEEDED: "text-red-600 bg-red-100 dark:bg-red-900/30",
    BLOCKED: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  };

  const typeLabels: Record<string, string> = {
    WARNING: "Aviso",
    EXCEEDED: "Excedido",
    BLOCKED: "Bloqueado",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Orçamento"
        icon={<Bell className="w-6 h-6" />}
        module="BUDGET"
        breadcrumbs={[
          { label: "Orçamento", href: "/budget" },
          { label: "Alertas" },
        ]}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setTypeFilter(undefined)}
          className={`px-3 py-1.5 rounded-lg text-sm ${!typeFilter ? "bg-blue-600 text-white" : "bg-theme-card border border-theme text-theme"}`}
        >
          Todos
        </button>
        {(["WARNING", "EXCEEDED", "BLOCKED"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-sm ${typeFilter === type ? "bg-blue-600 text-white" : "bg-theme-card border border-theme text-theme"}`}
          >
            {typeLabels[type]}
          </button>
        ))}
        <div className="ml-auto">
          <label className="flex items-center gap-2 text-sm text-theme">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            Mostrar resolvidos
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <div className="space-y-4">
          {alerts?.map((alert) => (
            <div
              key={alert.id}
              className={`bg-theme-card border border-theme rounded-lg p-4 ${alert.isResolved ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${typeColors[alert.type]}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${typeColors[alert.type]}`}>
                        {typeLabels[alert.type]}
                      </span>
                      {alert.isResolved && (
                        <span className="px-2 py-0.5 rounded text-xs text-green-600 bg-green-100 dark:bg-green-900/30">
                          Resolvido
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-theme mt-1">
                      {alert.account?.name} - {alert.version?.name}
                    </h4>
                    <p className="text-sm text-theme-muted mt-1">
                      Orçado: {formatCurrency(toNumber(alert.budgetAmount))} | 
                      Realizado: {formatCurrency(toNumber(alert.actualAmount))} | 
                      Variação: {alert.variancePercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-theme-muted mt-1">
                      {formatDateTime(alert.createdAt)}
                    </p>
                  </div>
                </div>
                {!alert.isResolved && (
                  <button
                    onClick={() => resolveMutation.mutate({ id: alert.id })}
                    disabled={resolveMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolver
                  </button>
                )}
              </div>
            </div>
          ))}
          {alerts?.length === 0 && (
            <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum alerta encontrado</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/budget" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para Orçamento
        </Link>
      </div>
    </div>
  );
}
