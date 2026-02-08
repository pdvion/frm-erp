"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { trpc } from "@/lib/trpc";
import {
  Building2, FileText, Upload, Users, CheckCircle2, ArrowLeft, ArrowRight,
  Loader2, Rocket, Check,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Dados Básicos", icon: Building2, description: "Informações da empresa" },
  { id: 2, title: "Configuração Fiscal", icon: FileText, description: "Regime tributário e inscrições" },
  { id: 3, title: "Importação de Dados", icon: Upload, description: "Deploy Agent - XMLs de NFe" },
  { id: 4, title: "Usuários", icon: Users, description: "Criar usuários e permissões" },
  { id: 5, title: "Revisão", icon: CheckCircle2, description: "Confirmar e ativar" },
];

export default function OnboardingWizardPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const { data: onboarding, isLoading } = trpc.onboarding.getStatus.useQuery({ companyId });
  const { data: company } = trpc.companies.getById.useQuery({ id: companyId });
  const startMutation = trpc.onboarding.start.useMutation();
  const updateStepMutation = trpc.onboarding.updateStep.useMutation();
  const completeMutation = trpc.onboarding.complete.useMutation();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (onboarding) {
      setCurrentStep(onboarding.currentStep);
    }
  }, [onboarding]);

  useEffect(() => {
    if (!onboarding && company && !startMutation.isPending) {
      startMutation.mutate({ companyId });
    }
  }, [onboarding, company, companyId, startMutation]);

  const handleNext = async () => {
    await updateStepMutation.mutateAsync({ companyId, step: currentStep, data: formData });
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      setFormData({});
    }
  };

  const handleComplete = async () => {
    await completeMutation.mutateAsync({ companyId });
    router.push("/setup/onboarding");
  };

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
        title={`Onboarding: ${company?.name || "Empresa"}`}
        subtitle="Configure a empresa para uso no sistema"
        icon={<Rocket className="w-6 h-6" />}
        breadcrumbs={[
          { label: "Setup", href: "/setup" },
          { label: "Onboarding", href: "/setup/onboarding" },
          { label: company?.name || "Empresa" },
        ]}
      />

      {/* Stepper */}
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${index > 0 ? "ml-4" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep > step.id ? "bg-green-500 text-white" :
                    currentStep === step.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1 ${currentStep === step.id ? "text-blue-600 font-medium" : "text-theme-muted"}`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${currentStep > step.id ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-theme-card rounded-lg border border-theme p-6 min-h-[300px]">
        {currentStep === 1 && <Step1Content company={company} formData={formData} setFormData={setFormData} />}
        {currentStep === 2 && <Step2Content formData={formData} setFormData={setFormData} />}
        {currentStep === 3 && <Step3Content companyId={companyId} />}
        {currentStep === 4 && <Step4Content formData={formData} setFormData={setFormData} />}
        {currentStep === 5 && <Step5Content company={company} onboarding={onboarding} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
        </Button>
        {currentStep < 5 ? (
          <Button onClick={handleNext} disabled={updateStepMutation.isPending}>
            {updateStepMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Próximo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={completeMutation.isPending} className="bg-green-600 hover:bg-green-700">
            {completeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Concluir Onboarding
          </Button>
        )}
      </div>
    </div>
  );
}

interface CompanyData {
  name?: string;
  cnpj?: string | null;
  city?: string | null;
  state?: string | null;
  email?: string | null;
}

interface OnboardingData {
  stepsCompleted?: unknown;
}

function Step1Content({ company }: { company: CompanyData | null | undefined; formData: Record<string, unknown>; setFormData: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dados Básicos da Empresa</h3>
      <p className="text-theme-muted">Confirme os dados cadastrais da empresa.</p>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm text-theme-muted">Razão Social</label><p className="font-medium">{company?.name}</p></div>
        <div><label className="text-sm text-theme-muted">CNPJ</label><p className="font-medium">{company?.cnpj || "-"}</p></div>
        <div><label className="text-sm text-theme-muted">Cidade/UF</label><p className="font-medium">{company?.city || "-"} / {company?.state || "-"}</p></div>
        <div><label className="text-sm text-theme-muted">Email</label><p className="font-medium">{company?.email || "-"}</p></div>
      </div>
    </div>
  );
}

function Step2Content({ formData, setFormData }: { formData: Record<string, unknown>; setFormData: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Configuração Fiscal</h3>
      <p className="text-theme-muted">Defina o regime tributário e inscrições.</p>
      <div className="grid grid-cols-1 gap-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Regime Tributário</label>
          <NativeSelect className="w-full p-2 border rounded-lg" value={(formData.taxRegime as string) || ""} onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}>
            <option value="">Selecione...</option>
            <option value="simples_nacional">Simples Nacional</option>
            <option value="lucro_presumido">Lucro Presumido</option>
            <option value="lucro_real">Lucro Real</option>
          </NativeSelect>
        </div>
      </div>
    </div>
  );
}

function Step3Content({ companyId }: { companyId: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Importação de Dados via Deploy Agent</h3>
      <p className="text-theme-muted">Use o Deploy Agent para importar dados de XMLs de NFe.</p>
      <Link href={`/setup/deploy-agent/wizard?onboarding=true&companyId=${companyId}`}>
        <Button className="mt-4"><Upload className="w-4 h-4 mr-2" /> Abrir Deploy Agent</Button>
      </Link>
    </div>
  );
}

function Step4Content({ formData, setFormData }: { formData: Record<string, unknown>; setFormData: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Usuários e Permissões</h3>
      <p className="text-theme-muted">Configure os usuários iniciais da empresa.</p>
      <Link href="/settings/users"><Button variant="outline"><Users className="w-4 h-4 mr-2" /> Gerenciar Usuários</Button></Link>
    </div>
  );
}

function Step5Content({ company, onboarding }: { company: CompanyData | null | undefined; onboarding: OnboardingData | null | undefined }) {
  const stepsCompleted = (onboarding?.stepsCompleted as Record<string, boolean>) || {};
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Revisão Final</h3>
      <p className="text-theme-muted">Confirme as configurações antes de ativar a empresa.</p>
      <div className="space-y-2">
        {STEPS.slice(0, 4).map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            {stepsCompleted[String(step.id)] ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
            <span className={stepsCompleted[String(step.id)] ? "text-theme-primary" : "text-theme-muted"}>{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
