"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Settings,
  Play,
  Building2,
  Package,
  Calculator,
  DollarSign,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Input } from "@/components/ui/Input";

type WizardStepId = "upload" | "analysis" | "review" | "apply";

interface UploadedFile {
  name: string;
  size: number;
  content: string;
  status: "pending" | "valid" | "invalid";
  error?: string;
}

interface AnalysisResult {
  regime: string;
  confidence: number;
  suppliers: number;
  materials: number;
  cfops: number;
  aliquotas: { uf: string; aliquota: number }[];
  paymentMethods: { code: string; name: string; percentage: number }[];
}

export default function DeployAgentWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStepId>("upload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [applyOptions, setApplyOptions] = useState({
    importSuppliers: true,
    importMaterials: true,
    applyTaxConfig: true,
    applyFinancialConfig: true,
    updateIfExists: false,
  });

  const utils = trpc.useUtils();

  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const analyzeMutation = trpc.deployAgent.analyzeXmlBatch.useMutation({
    onSuccess: (data) => {
      setAnalysisResult({
        regime: data.taxConfig?.regime?.regime ?? "Não detectado",
        confidence: data.taxConfig?.regime?.confidence ?? 0,
        suppliers: data.entities?.suppliers ?? 0,
        materials: data.entities?.materials ?? 0,
        cfops: data.fiscalPatterns?.statistics?.uniqueCfops ?? 0,
        aliquotas: data.taxConfig?.stateAliquotas?.slice(0, 5).map((a) => ({
          uf: `${a.ufOrigem} → ${a.ufDestino}`,
          aliquota: a.aliquotaInterestadual || a.aliquotaInterna,
        })) ?? [],
        paymentMethods: Object.entries(data.financialConfig?.paymentMethodDistribution ?? {})
          .slice(0, 4)
          .map(([code, d]) => ({
            code,
            name: getPaymentMethodName(code),
            percentage: d.percentage,
          })),
      });
      setCurrentStep("review");
      setAnalyzeError(null);
    },
    onError: (error) => {
      setAnalyzeError(error.message || "Erro ao analisar XMLs. Tente novamente.");
    },
  });

  const applyMutation = trpc.deployAgent.applyConfiguration.useMutation({
    onSuccess: () => {
      utils.deployAgent.getStats.invalidate();
      setCurrentStep("apply");
      setIsApplying(false);
      setApplyError(null);
    },
    onError: (error) => {
      setIsApplying(false);
      setApplyError(error.message || "Erro ao aplicar configuração. Tente novamente.");
    },
  });

  const processFiles = useCallback(async (fileList: File[]) => {
    const newFiles: UploadedFile[] = [];

    for (const file of fileList) {
      try {
        const content = await file.text();
        const isValid = content.includes("<NFe") || content.includes("<nfeProc");
        newFiles.push({
          name: file.name,
          size: file.size,
          content,
          status: isValid ? "valid" : "invalid",
          error: isValid ? undefined : "Arquivo não é uma NFe válida",
        });
      } catch {
        newFiles.push({
          name: file.name,
          size: file.size,
          content: "",
          status: "invalid",
          error: "Erro ao ler arquivo",
        });
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".xml")
    );
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []).filter(
      (f) => f.name.endsWith(".xml")
    );
    processFiles(selectedFiles);
  }, [processFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = () => {
    const validFiles = files.filter((f) => f.status === "valid");
    if (validFiles.length === 0) return;

    setCurrentStep("analysis");
    analyzeMutation.mutate({
      xmlContents: validFiles.map((f) => f.content),
    });
  };

  const applyConfiguration = () => {
    setIsApplying(true);
    applyMutation.mutate({
      ...applyOptions,
    });
  };

  const steps: WizardStepDef[] = [
    { id: "upload", title: "1. Upload", description: "Selecione XMLs de NFe" },
    { id: "analysis", title: "2. Análise", description: "IA processa os dados" },
    { id: "review", title: "3. Revisão", description: "Confirme o que importar" },
    { id: "apply", title: "4. Pronto", description: "Configuração aplicada" },
  ];

  const validFilesCount = files.filter((f) => f.status === "valid").length;

  return (
    <div className="min-h-screen bg-theme p-4 md:p-6">
      <Breadcrumbs
        items={[
          { label: "Setup", href: "/setup" },
          { label: "Deploy Agent", href: "/setup/deploy-agent" },
          { label: "Wizard" },
        ]}
      />

      <PageHeader
        title="Wizard de Configuração"
        subtitle="Configure o ERP automaticamente a partir de XMLs de NFe"
        icon={<Settings className="w-6 h-6" />}
      />

      {/* Wizard Steps */}
      <WizardSteps steps={steps} currentStep={currentStep} />

      {/* Step Content */}
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        {/* Upload Step */}
        {currentStep === "upload" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-theme mb-2">
                Upload de XMLs de NFe
              </h2>
              <p className="text-theme-secondary">
                Arraste arquivos XML ou clique para selecionar. O sistema analisará os
                dados para configurar automaticamente o ERP.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-theme rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50/5 transition-colors cursor-pointer"
            >
              <Input
                type="file"
                multiple
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-theme-muted mb-4" />
                <p className="text-theme font-medium mb-1">
                  Arraste arquivos XML aqui
                </p>
                <p className="text-sm text-theme-secondary">
                  ou clique para selecionar
                </p>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-theme">
                    Arquivos ({validFilesCount} válidos de {files.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Limpar todos
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        file.status === "valid"
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-red-50 dark:bg-red-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {file.status === "valid" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-theme text-sm">{file.name}</p>
                          <p className="text-xs text-theme-secondary">
                            {(file.size / 1024).toFixed(1)} KB
                            {file.error && ` • ${file.error}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="p-1"
                      >
                        <X className="w-4 h-4 text-theme-secondary" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <Button
                onClick={startAnalysis}
                disabled={validFilesCount === 0}
                rightIcon={<ArrowRight size={16} />}
              >
                Analisar {validFilesCount} arquivo(s)
              </Button>
            </div>
          </div>
        )}

        {/* Analysis Step */}
        {currentStep === "analysis" && (
          <div className="text-center py-12">
            {analyzeError ? (
              <>
                <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-6" />
                <h2 className="text-xl font-semibold text-theme mb-2">
                  Erro na Análise
                </h2>
                <p className="text-red-500 mb-6 max-w-md mx-auto text-sm">
                  {analyzeError}
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => { setCurrentStep("upload"); setAnalyzeError(null); }}
                    leftIcon={<ArrowLeft size={16} />}
                  >
                    Voltar ao Upload
                  </Button>
                  <Button
                    onClick={() => { setAnalyzeError(null); startAnalysis(); }}
                    leftIcon={<Play size={16} />}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-6" />
                <h2 className="text-xl font-semibold text-theme mb-2">
                  Analisando {validFilesCount} XML{validFilesCount !== 1 ? "s" : ""}...
                </h2>
                <p className="text-theme-secondary mb-6">
                  Extraindo fornecedores, materiais, impostos e formas de pagamento.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep("upload")}
                  className="text-theme-muted"
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        )}

        {/* Review Step */}
        {currentStep === "review" && analysisResult && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <h2 className="text-xl font-semibold text-theme mb-2">
                Análise Concluída
              </h2>
              <p className="text-theme-secondary">
                Revise as configurações detectadas antes de aplicar.
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Regime Tributário */}
              <div className="bg-theme-tertiary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium text-theme">Regime Tributário</h3>
                </div>
                <p className="text-2xl font-bold text-theme capitalize mb-1">
                  {analysisResult.regime.replace("_", " ")}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-theme rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${analysisResult.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-theme-secondary">
                    {(analysisResult.confidence * 100).toFixed(0)}% confiança
                  </span>
                </div>
              </div>

              {/* Entidades */}
              <div className="bg-theme-tertiary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-green-500" />
                  <h3 className="font-medium text-theme">Entidades Detectadas</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-theme">
                      {analysisResult.suppliers}
                    </p>
                    <p className="text-sm text-theme-secondary">Fornecedores</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-theme">
                      {analysisResult.materials}
                    </p>
                    <p className="text-sm text-theme-secondary">Materiais</p>
                  </div>
                </div>
              </div>

              {/* Alíquotas */}
              <div className="bg-theme-tertiary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  <h3 className="font-medium text-theme">Alíquotas por UF</h3>
                </div>
                <div className="space-y-2">
                  {analysisResult.aliquotas.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-theme-secondary">{a.uf}</span>
                      <span className="font-medium text-theme">{a.aliquota}%</span>
                    </div>
                  ))}
                  {analysisResult.aliquotas.length === 0 && (
                    <p className="text-sm text-theme-muted">Nenhuma alíquota detectada</p>
                  )}
                </div>
              </div>

              {/* Formas de Pagamento */}
              <div className="bg-theme-tertiary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-orange-500" />
                  <h3 className="font-medium text-theme">Formas de Pagamento</h3>
                </div>
                <div className="space-y-2">
                  {analysisResult.paymentMethods.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-theme-secondary">{p.name}</span>
                      <span className="font-medium text-theme">{p.percentage}%</span>
                    </div>
                  ))}
                  {analysisResult.paymentMethods.length === 0 && (
                    <p className="text-sm text-theme-muted">Nenhuma forma detectada</p>
                  )}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-theme-tertiary rounded-lg p-4">
              <h3 className="font-medium text-theme mb-4">Opções de Aplicação</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={applyOptions.importSuppliers}
                    onChange={(e) =>
                      setApplyOptions((p) => ({ ...p, importSuppliers: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-theme"
                  />
                  <span className="text-theme">Importar fornecedores</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={applyOptions.importMaterials}
                    onChange={(e) =>
                      setApplyOptions((p) => ({ ...p, importMaterials: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-theme"
                  />
                  <span className="text-theme">Importar materiais</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={applyOptions.applyTaxConfig}
                    onChange={(e) =>
                      setApplyOptions((p) => ({ ...p, applyTaxConfig: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-theme"
                  />
                  <span className="text-theme">Aplicar configuração tributária</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={applyOptions.applyFinancialConfig}
                    onChange={(e) =>
                      setApplyOptions((p) => ({
                        ...p,
                        applyFinancialConfig: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-theme"
                  />
                  <span className="text-theme">Aplicar configuração financeira</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={applyOptions.updateIfExists}
                    onChange={(e) =>
                      setApplyOptions((p) => ({ ...p, updateIfExists: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-theme"
                  />
                  <span className="text-theme">Atualizar registros existentes</span>
                </label>
              </div>
            </div>

            {/* Error */}
            {applyError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Erro ao aplicar</p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{applyError}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={() => { setCurrentStep("upload"); setApplyError(null); }}
                leftIcon={<ArrowLeft size={16} />}
              >
                Voltar
              </Button>
              <Button
                onClick={applyConfiguration}
                disabled={isApplying}
                leftIcon={isApplying ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              >
                {isApplying ? "Aplicando..." : "Aplicar Configuração"}
              </Button>
            </div>
          </div>
        )}

        {/* Apply Step */}
        {currentStep === "apply" && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-6" />
            <h2 className="text-xl font-semibold text-theme mb-2">
              Configuração Aplicada com Sucesso!
            </h2>
            <p className="text-theme-secondary mb-8">
              O ERP foi configurado automaticamente com base nos XMLs analisados.
            </p>

            <div className="flex justify-center gap-4">
              <Button
                variant="secondary"
                onClick={() => router.push("/setup/deploy-agent/analysis")}
                leftIcon={<FileText size={16} />}
              >
                Ver Análise Detalhada
              </Button>
              <Button
                onClick={() => router.push("/setup/deploy-agent")}
                leftIcon={<ArrowRight size={16} />}
              >
                Ir para Deploy Agent
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getPaymentMethodName(code: string): string {
  const names: Record<string, string> = {
    "01": "Dinheiro",
    "02": "Cheque",
    "03": "Cartão de Crédito",
    "04": "Cartão de Débito",
    "05": "Crédito Loja",
    "14": "Duplicata Mercantil",
    "15": "Boleto Bancário",
    "17": "PIX",
    "99": "Outros",
  };
  return names[code] || `Forma ${code}`;
}

interface WizardStepDef {
  id: string;
  title: string;
  description: string;
}

function WizardSteps({
  steps,
  currentStep,
}: {
  steps: WizardStepDef[];
  currentStep: string;
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = step.id === currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-theme-tertiary text-theme-secondary"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? "text-theme" : "text-theme-secondary"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-theme-muted hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  index < currentIndex ? "bg-green-500" : "bg-theme-tertiary"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
