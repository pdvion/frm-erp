"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Building2,
  Package,
  DollarSign,
  Calculator,
  MapPin,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

type AnalysisTab = "overview" | "fiscal" | "tax" | "financial";

export default function DeployAgentAnalysisPage() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>("overview");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    regime: true,
    aliquotas: true,
    patterns: true,
    payments: true,
  });

  const { data: stats, isLoading: statsLoading } = trpc.deployAgent.getStats.useQuery();
  const { data: taxConfig, isLoading: taxLoading } = trpc.deployAgent.generateTaxConfig.useQuery({
    limit: 100,
  });
  const { data: financialConfig, isLoading: financialLoading } =
    trpc.deployAgent.generateFinancialConfig.useQuery({ limit: 100 });
  const { data: fiscalPatterns, isLoading: fiscalLoading } =
    trpc.deployAgent.analyzeFiscalPatterns.useQuery({ limit: 100 });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const tabs: { id: AnalysisTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Visão Geral", icon: <BarChart3 size={18} /> },
    { id: "fiscal", label: "Análise Fiscal", icon: <FileText size={18} /> },
    { id: "tax", label: "Configuração Tributária", icon: <Calculator size={18} /> },
    { id: "financial", label: "Mapeamento Financeiro", icon: <DollarSign size={18} /> },
  ];

  const isLoading = statsLoading || taxLoading || financialLoading || fiscalLoading;

  return (
    <div className="min-h-screen bg-theme p-4 md:p-6">
      <Breadcrumbs
        items={[
          { label: "Setup", href: "/setup" },
          { label: "Deploy Agent", href: "/setup/deploy-agent" },
          { label: "Análise" },
        ]}
      />

      <PageHeader
        title="Análise do Deploy Agent"
        subtitle="Visualização detalhada das análises fiscais, tributárias e financeiras"
        icon={<BarChart3 className="w-6 h-6" />}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<RefreshCw size={16} />} disabled={isLoading}>
              Atualizar
            </Button>
            <Button variant="secondary" leftIcon={<Download size={16} />}>
              Exportar
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "primary" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            leftIcon={tab.icon}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="NFes Analisadas"
              value={taxConfig?.statistics?.totalNfes ?? 0}
              icon={<FileText className="w-5 h-5 text-blue-500" />}
              loading={taxLoading}
            />
            <StatCard
              title="Itens Processados"
              value={taxConfig?.statistics?.totalItems ?? 0}
              icon={<Package className="w-5 h-5 text-green-500" />}
              loading={taxLoading}
            />
            <StatCard
              title="Fornecedores"
              value={stats?.totalSuppliers ?? 0}
              icon={<Building2 className="w-5 h-5 text-purple-500" />}
              loading={statsLoading}
            />
            <StatCard
              title="Materiais"
              value={stats?.totalMaterials ?? 0}
              icon={<Package className="w-5 h-5 text-orange-500" />}
              loading={statsLoading}
            />
          </div>

          {/* Quick Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Regime Tributário */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Regime Tributário Detectado
              </h3>
              {taxLoading ? (
                <div className="animate-pulse h-20 bg-theme-tertiary rounded" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-theme-secondary">Regime:</span>
                    <span className="font-semibold text-theme capitalize">
                      {taxConfig?.regime?.regime?.replace("_", " ") ?? "Não detectado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-secondary">Confiança:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-theme-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(taxConfig?.regime?.confidence ?? 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-theme">
                        {((taxConfig?.regime?.confidence ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-secondary">PIS/COFINS:</span>
                    <span className="font-medium text-theme">
                      {taxConfig?.pisCofinsSummary?.regimeCumulativo ? "Cumulativo" : "Não-Cumulativo"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Formas de Pagamento */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                Formas de Pagamento
              </h3>
              {financialLoading ? (
                <div className="animate-pulse h-20 bg-theme-tertiary rounded" />
              ) : (
                <div className="space-y-2">
                  {Object.entries(financialConfig?.paymentMethodDistribution ?? {})
                    .slice(0, 4)
                    .map(([code, data]) => (
                      <div key={code} className="flex items-center justify-between">
                        <span className="text-theme-secondary text-sm">
                          {getPaymentMethodName(code)}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-theme-tertiary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${data.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-theme w-12 text-right">
                            {data.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Import Status */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Status das Importações
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats?.pending ?? 0}</div>
                <div className="text-sm text-theme-secondary">Pendentes</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.approved ?? 0}</div>
                <div className="text-sm text-theme-secondary">Aprovadas</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats?.rejected ?? 0}</div>
                <div className="text-sm text-theme-secondary">Rejeitadas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fiscal Tab */}
      {activeTab === "fiscal" && (
        <div className="space-y-6">
          {/* CFOP Distribution */}
          <CollapsibleSection
            title="Distribuição de CFOPs"
            icon={<FileText className="w-5 h-5 text-blue-500" />}
            expanded={expandedSections.patterns}
            onToggle={() => toggleSection("patterns")}
          >
            {fiscalLoading ? (
              <div className="animate-pulse h-40 bg-theme-tertiary rounded" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-theme">
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">CFOP</th>
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">Descrição</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">Ocorrências</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const cfopEntries = Object.entries(fiscalPatterns?.cfopDistribution ?? {})
                        .map(([cfop, data]) => ({ cfop: Number(cfop), ...data }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10);
                      const total = cfopEntries.reduce((a, b) => a + b.count, 0) || 1;
                      return cfopEntries.map((item) => {
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return (
                          <tr key={item.cfop} className="border-b border-theme hover:bg-theme-tertiary">
                            <td className="py-2 px-3 font-mono text-theme">{item.cfop}</td>
                            <td className="py-2 px-3 text-theme-secondary">{item.description}</td>
                            <td className="py-2 px-3 text-right text-theme">{item.count}</td>
                            <td className="py-2 px-3 text-right">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                {percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleSection>

          {/* CST Distribution */}
          <CollapsibleSection
            title="Distribuição de CST/CSOSN"
            icon={<Calculator className="w-5 h-5 text-green-500" />}
            expanded={true}
            onToggle={() => {}}
          >
            {taxLoading ? (
              <div className="animate-pulse h-40 bg-theme-tertiary rounded" />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* CST Normal */}
                <div>
                  <h4 className="font-medium text-theme mb-3">CST (Regime Normal)</h4>
                  <div className="space-y-2">
                    {Object.entries(taxConfig?.regime?.cstDistribution ?? {})
                      .slice(0, 5)
                      .map(([cst, count]) => (
                        <div key={cst} className="flex items-center justify-between">
                          <span className="text-theme-secondary">CST {cst}</span>
                          <span className="font-medium text-theme">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
                {/* CSOSN */}
                <div>
                  <h4 className="font-medium text-theme mb-3">CSOSN (Simples Nacional)</h4>
                  <div className="space-y-2">
                    {Object.entries(taxConfig?.regime?.csosnDistribution ?? {})
                      .slice(0, 5)
                      .map(([csosn, count]) => (
                        <div key={csosn} className="flex items-center justify-between">
                          <span className="text-theme-secondary">CSOSN {csosn}</span>
                          <span className="font-medium text-theme">{count as number}</span>
                        </div>
                      ))}
                    {Object.keys(taxConfig?.regime?.csosnDistribution ?? {}).length === 0 && (
                      <p className="text-theme-muted text-sm">Nenhum CSOSN detectado</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>
      )}

      {/* Tax Tab */}
      {activeTab === "tax" && (
        <div className="space-y-6">
          {/* Regime Detection */}
          <CollapsibleSection
            title="Detecção de Regime Tributário"
            icon={<Calculator className="w-5 h-5 text-blue-500" />}
            expanded={expandedSections.regime}
            onToggle={() => toggleSection("regime")}
          >
            {taxLoading ? (
              <div className="animate-pulse h-40 bg-theme-tertiary rounded" />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        Regime Detectado
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 capitalize">
                      {taxConfig?.regime?.regime?.replace("_", " ") ?? "Não identificado"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-theme-secondary">Confiança da detecção:</span>
                      <span className="font-medium text-theme">
                        {((taxConfig?.regime?.confidence ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-theme-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                        style={{ width: `${(taxConfig?.regime?.confidence ?? 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-theme">Indicadores</h4>
                  <div className="space-y-2">
                    <IndicatorBar
                      label="Simples Nacional"
                      value={taxConfig?.regime?.indicators?.simplesNacional ?? 0}
                    />
                    <IndicatorBar
                      label="Regime Normal"
                      value={taxConfig?.regime?.indicators?.regimeNormal ?? 0}
                    />
                    <IndicatorBar
                      label="Lucro Presumido"
                      value={taxConfig?.regime?.indicators?.lucroPresumido ?? 0}
                    />
                    <IndicatorBar
                      label="Lucro Real"
                      value={taxConfig?.regime?.indicators?.lucroReal ?? 0}
                    />
                  </div>
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* State Aliquotas */}
          <CollapsibleSection
            title="Alíquotas por Estado"
            icon={<MapPin className="w-5 h-5 text-green-500" />}
            expanded={expandedSections.aliquotas}
            onToggle={() => toggleSection("aliquotas")}
          >
            {taxLoading ? (
              <div className="animate-pulse h-40 bg-theme-tertiary rounded" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-theme">
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">Origem</th>
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">Destino</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">Alíquota Interna</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">Alíquota Interestadual</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">Ocorrências</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxConfig?.stateAliquotas?.slice(0, 10).map((aliq, idx) => (
                      <tr key={idx} className="border-b border-theme hover:bg-theme-tertiary">
                        <td className="py-2 px-3 font-medium text-theme">{aliq.ufOrigem}</td>
                        <td className="py-2 px-3 text-theme">{aliq.ufDestino}</td>
                        <td className="py-2 px-3 text-right text-theme">
                          {aliq.aliquotaInterna > 0 ? `${aliq.aliquotaInterna.toFixed(2)}%` : "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-theme">
                          {aliq.aliquotaInterestadual > 0 ? `${aliq.aliquotaInterestadual.toFixed(2)}%` : "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-theme-secondary">{aliq.occurrences}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleSection>

          {/* PIS/COFINS */}
          <CollapsibleSection
            title="Análise PIS/COFINS"
            icon={<DollarSign className="w-5 h-5 text-purple-500" />}
            expanded={true}
            onToggle={() => {}}
          >
            {taxLoading ? (
              <div className="animate-pulse h-20 bg-theme-tertiary rounded" />
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-theme-tertiary rounded-lg text-center">
                  <div className="text-sm text-theme-secondary mb-1">Regime</div>
                  <div className="text-lg font-bold text-theme">
                    {taxConfig?.pisCofinsSummary?.regimeCumulativo ? "Cumulativo" : "Não-Cumulativo"}
                  </div>
                </div>
                <div className="p-4 bg-theme-tertiary rounded-lg text-center">
                  <div className="text-sm text-theme-secondary mb-1">Alíquota PIS Média</div>
                  <div className="text-lg font-bold text-theme">
                    {taxConfig?.pisCofinsSummary?.aliquotaPisMedia?.toFixed(2) ?? 0}%
                  </div>
                </div>
                <div className="p-4 bg-theme-tertiary rounded-lg text-center">
                  <div className="text-sm text-theme-secondary mb-1">Alíquota COFINS Média</div>
                  <div className="text-lg font-bold text-theme">
                    {taxConfig?.pisCofinsSummary?.aliquotaCofinsMedia?.toFixed(2) ?? 0}%
                  </div>
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          {/* Payment Patterns */}
          <CollapsibleSection
            title="Padrões de Pagamento"
            icon={<CreditCard className="w-5 h-5 text-blue-500" />}
            expanded={expandedSections.payments}
            onToggle={() => toggleSection("payments")}
          >
            {financialLoading ? (
              <div className="animate-pulse h-40 bg-theme-tertiary rounded" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-theme">
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">Forma</th>
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">Parceiro</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">Prazo Médio</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">Valor Médio</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">Frequência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialConfig?.paymentPatterns?.slice(0, 10).map((pattern, idx) => (
                      <tr key={idx} className="border-b border-theme hover:bg-theme-tertiary">
                        <td className="py-2 px-3 text-theme">{pattern.formaPagamentoDescricao}</td>
                        <td className="py-2 px-3 text-theme-secondary truncate max-w-[200px]">
                          {pattern.fornecedorNome || pattern.clienteNome || "-"}
                        </td>
                        <td className="py-2 px-3 text-right text-theme">
                          {Math.round(pattern.prazoMedio)} dias
                        </td>
                        <td className="py-2 px-3 text-right text-theme">
                          R$ {pattern.valorMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right text-theme-secondary">{pattern.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleSection>

          {/* Payment Conditions */}
          <CollapsibleSection
            title="Condições de Pagamento Detectadas"
            icon={<Calendar className="w-5 h-5 text-green-500" />}
            expanded={true}
            onToggle={() => {}}
          >
            {financialLoading ? (
              <div className="animate-pulse h-20 bg-theme-tertiary rounded" />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {financialConfig?.paymentConditions?.slice(0, 6).map((cond, idx) => (
                  <div key={idx} className="p-4 bg-theme-tertiary rounded-lg">
                    <div className="font-medium text-theme mb-1">{cond.descricao}</div>
                    <div className="text-sm text-theme-secondary">
                      {cond.numeroParcelas} parcela(s) • {cond.frequency} ocorrência(s)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Nature Mappings */}
          <CollapsibleSection
            title="Mapeamento CFOP → Natureza"
            icon={<FileText className="w-5 h-5 text-purple-500" />}
            expanded={true}
            onToggle={() => {}}
          >
            {financialLoading ? (
              <div className="animate-pulse h-40 bg-theme-tertiary rounded" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-theme">
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">CFOP</th>
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">Natureza Sugerida</th>
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">Categoria</th>
                      <th className="text-left py-2 px-3 text-theme-secondary font-medium">Tipo</th>
                      <th className="text-right py-2 px-3 text-theme-secondary font-medium">Ocorrências</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialConfig?.natureMappings?.slice(0, 10).map((mapping, idx) => (
                      <tr key={idx} className="border-b border-theme hover:bg-theme-tertiary">
                        <td className="py-2 px-3 font-mono text-theme">{mapping.cfop}</td>
                        <td className="py-2 px-3 text-theme">{mapping.naturezaSugerida}</td>
                        <td className="py-2 px-3 text-theme-secondary">{mapping.categoria}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                              mapping.tipo === "receita"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {mapping.tipo === "receita" ? "Receita" : "Despesa"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-theme-secondary">{mapping.occurrences}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleSection>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="font-semibold text-theme mb-4">Resumo de Compras</h3>
              <div className="text-3xl font-bold text-red-600">
                R$ {(financialConfig?.statistics?.valorTotalCompras ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-theme-secondary mt-1">Total em compras analisadas</div>
            </div>
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="font-semibold text-theme mb-4">Resumo de Vendas</h3>
              <div className="text-3xl font-bold text-green-600">
                R$ {(financialConfig?.statistics?.valorTotalVendas ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-theme-secondary mt-1">Total em vendas analisadas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-theme-card rounded-lg border border-theme p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-theme-tertiary rounded-lg">{icon}</div>
        <div>
          <p className="text-xs text-theme-muted">{title}</p>
          <p className="text-xl font-bold text-theme">
            {loading ? <span className="animate-pulse">...</span> : value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-theme-tertiary h-auto rounded-none"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-theme">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-theme-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-theme-secondary" />
        )}
      </Button>
      {expanded && <div className="p-4 pt-0 border-t border-theme">{children}</div>}
    </div>
  );
}

function IndicatorBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-theme-secondary w-32">{label}</span>
      <div className="flex-1 h-2 bg-theme-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium text-theme w-12 text-right">
        {(value * 100).toFixed(0)}%
      </span>
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
    "10": "Vale Alimentação",
    "11": "Vale Refeição",
    "14": "Duplicata Mercantil",
    "15": "Boleto Bancário",
    "16": "Depósito Bancário",
    "17": "PIX",
    "18": "Transferência",
    "90": "Sem Pagamento",
    "99": "Outros",
  };
  return names[code] || `Forma ${code}`;
}
