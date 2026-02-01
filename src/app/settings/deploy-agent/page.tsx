"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Package,
  Users,
  Building2,
  FileCheck,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ValidationTable, type ValidationItem } from "@/components/deploy-agent";
import { ConfidenceBadge } from "@/components/deploy-agent";

type WizardStep = "upload" | "analyze" | "review" | "apply";

interface AnalysisStats {
  materials: number;
  suppliers: number;
  customers: number;
  fiscalRules: number;
}

export default function DeployAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [xmlFiles, setXmlFiles] = useState<File[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const xmls = files.filter((f) => f.name.endsWith(".xml"));
    setXmlFiles((prev) => [...prev, ...xmls]);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setStep("analyze");

    // Simular análise (em produção, chamar API)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Dados simulados
    setStats({
      materials: 156,
      suppliers: 42,
      customers: 89,
      fiscalRules: 23,
    });

    // Itens simulados para validação
    const mockItems: ValidationItem[] = [
      {
        id: "1",
        type: "material",
        name: "ROLAMENTO 6205 2RS",
        description: "NCM: 8482.10.10",
        action: "create",
        confidence: 95,
        reason: "Novo material identificado em 15 NFes",
      },
      {
        id: "2",
        type: "material",
        name: "PARAFUSO M8X30 INOX",
        description: "NCM: 7318.15.00",
        action: "create",
        confidence: 92,
        reason: "Novo material identificado em 8 NFes",
      },
      {
        id: "3",
        type: "material",
        name: "PEÇA ESPECIAL XYZ",
        description: "NCM: 8483.40.90",
        action: "review",
        confidence: 45,
        reason: "Descrição ambígua, verificar manualmente",
      },
      {
        id: "4",
        type: "supplier",
        name: "FORNECEDOR ABC LTDA",
        description: "CNPJ: 12.345.678/0001-90",
        action: "create",
        confidence: 98,
        reason: "Novo fornecedor em 5 NFes",
      },
      {
        id: "5",
        type: "fiscal_rule",
        name: "CFOP 5102 → Venda PR",
        description: "ICMS 18%",
        action: "create",
        confidence: 96,
        reason: "Padrão identificado em 120 operações",
      },
      {
        id: "6",
        type: "material",
        name: "ITEM DUPLICADO ABC",
        description: "Já existe no sistema",
        action: "skip",
        confidence: 100,
        reason: "Material já cadastrado (código 12345)",
      },
    ];

    setValidationItems(mockItems);
    setIsAnalyzing(false);
    setStep("review");
  };

  const handleApprove = (ids: string[]) => {
    setValidationItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, action: "create" as const } : item
      )
    );
  };

  const handleReject = (ids: string[]) => {
    setValidationItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, action: "skip" as const } : item
      )
    );
  };

  const handleEdit = (id: string) => {
    // TODO: Abrir modal de edição
    alert(`Editar item ${id}`);
  };

  const handleApply = async () => {
    setIsApplying(true);
    setStep("apply");

    // Simular aplicação
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsApplying(false);
  };

  const itemsToApply = validationItems.filter(
    (item) => item.action === "create" || item.action === "update"
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Deploy Agent"
        subtitle="Configuração inteligente baseada em XMLs de NFe"
        icon={<Bot size={24} />}
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        {[
          { id: "upload", label: "Upload", icon: Upload },
          { id: "analyze", label: "Análise", icon: FileText },
          { id: "review", label: "Revisão", icon: CheckCircle },
          { id: "apply", label: "Aplicar", icon: FileCheck },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                step === s.id
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : ["upload", "analyze", "review", "apply"].indexOf(step) >
                      ["upload", "analyze", "review", "apply"].indexOf(s.id)
                    ? "text-green-600"
                    : "text-gray-400"
              }`}
            >
              <s.icon size={20} />
              <span className="font-medium">{s.label}</span>
            </div>
            {i < 3 && (
              <ArrowRight size={20} className="mx-4 text-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium mb-4">Upload de XMLs de NFe</h3>
            <p className="text-gray-500 mb-6">
              Faça upload dos XMLs de NFe para que o Deploy Agent analise e sugira
              configurações automáticas.
            </p>

            <label className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Arraste XMLs aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Suporta múltiplos arquivos XML de NFe
              </p>
              <input
                type="file"
                accept=".xml"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {xmlFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">
                  {xmlFiles.length} arquivo(s) selecionado(s)
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {xmlFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <FileText size={16} />
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={xmlFiles.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analisar XMLs
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Analyze */}
      {step === "analyze" && isAnalyzing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
          <h3 className="text-xl font-medium mb-2">Analisando XMLs...</h3>
          <p className="text-gray-500">
            O Deploy Agent está processando {xmlFiles.length} arquivo(s)
          </p>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Package size={24} className="text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.materials}</div>
                  <div className="text-sm text-gray-500">Materiais</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.suppliers}</div>
                  <div className="text-sm text-gray-500">Fornecedores</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Building2 size={24} className="text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.customers}</div>
                  <div className="text-sm text-gray-500">Clientes</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <FileCheck size={24} className="text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.fiscalRules}</div>
                  <div className="text-sm text-gray-500">Regras Fiscais</div>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-medium mb-3">Resumo de Confiança</h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={95} size="sm" />
                <span className="text-sm text-gray-500">
                  {validationItems.filter((i) => i.confidence >= 80).length} itens
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={60} size="sm" />
                <span className="text-sm text-gray-500">
                  {validationItems.filter((i) => i.confidence >= 50 && i.confidence < 80).length} itens
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={30} size="sm" />
                <span className="text-sm text-gray-500">
                  {validationItems.filter((i) => i.confidence < 50).length} itens
                </span>
              </div>
            </div>
          </div>

          {/* Validation Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Itens para Validação</h3>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                <span className="text-sm text-gray-500">
                  {validationItems.filter((i) => i.action === "review").length} item(s) requerem revisão
                </span>
              </div>
            </div>
            <ValidationTable
              items={validationItems}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={handleEdit}
              isApplying={isApplying}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Voltar
            </button>
            <button
              onClick={handleApply}
              disabled={itemsToApply.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Aplicar {itemsToApply.length} item(s)
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Apply */}
      {step === "apply" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          {isApplying ? (
            <>
              <Loader2 size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
              <h3 className="text-xl font-medium mb-2">Aplicando configurações...</h3>
              <p className="text-gray-500">
                Criando {itemsToApply.length} registro(s) no sistema
              </p>
            </>
          ) : (
            <>
              <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-medium mb-2">Configuração Concluída!</h3>
              <p className="text-gray-500 mb-6">
                {itemsToApply.length} registro(s) foram criados com sucesso
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setStep("upload");
                    setXmlFiles([]);
                    setValidationItems([]);
                    setStats(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Nova Importação
                </button>
                <button
                  onClick={() => router.push("/materials")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ver Materiais
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
