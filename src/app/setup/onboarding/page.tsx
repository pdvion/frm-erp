"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, Clock, ArrowRight, Loader2, Rocket } from "lucide-react";

export default function OnboardingDashboardPage() {
  const { data: pendingOnboardings, isLoading } = trpc.onboarding.list.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();

  const companiesWithoutOnboarding = companies?.filter(
    (c) => !pendingOnboardings?.some((o) => o.companyId === c.id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding de Empresas"
        subtitle="Configure novas empresas para uso no sistema"
        icon={<Rocket className="w-6 h-6" />}
        breadcrumbs={[{ label: "Setup", href: "/setup" }, { label: "Onboarding" }]}
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Onboarding em Andamento
        </h2>
        {pendingOnboardings && pendingOnboardings.length > 0 ? (
          <div className="space-y-3">
            {pendingOnboardings.map((o) => (
              <Link key={o.id} href={`/setup/onboarding/${o.companyId}`}
                className="flex items-center justify-between p-4 bg-theme-secondary rounded-lg hover:bg-theme-hover transition-colors">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-theme-muted" />
                  <div>
                    <p className="font-medium text-theme-primary">{o.company.name}</p>
                    <p className="text-sm text-theme-muted">Etapa {o.currentStep} de 5</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${(o.currentStep / 5) * 100}%` }} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-theme-muted" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-theme-muted">Nenhum onboarding em andamento.</p>
        )}
      </div>

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Empresas Disponíveis
        </h2>
        {companiesWithoutOnboarding && companiesWithoutOnboarding.length > 0 ? (
          <div className="space-y-3">
            {companiesWithoutOnboarding.map((c) => (
              <Link key={c.id} href={`/setup/onboarding/${c.id}`}
                className="flex items-center justify-between p-4 bg-theme-secondary rounded-lg hover:bg-theme-hover transition-colors">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-theme-muted" />
                  <p className="font-medium text-theme-primary">{c.name}</p>
                </div>
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  Iniciar Onboarding <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-theme-muted">Todas as empresas já passaram pelo onboarding.</p>
        )}
      </div>
    </div>
  );
}
