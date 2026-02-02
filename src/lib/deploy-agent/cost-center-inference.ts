/**
 * Deploy Agent - Cost Center Inference
 * Sugere centro de custo baseado em histórico, fornecedor, categoria e NCM
 * VIO-878
 */

import type { NFeParsed, NFeItem } from "@/lib/nfe-parser";

export interface CostCenterSuggestion {
  costCenterId: string;
  costCenterName: string;
  confidence: number;
  reason: string;
  matchType: "ncm" | "supplier" | "category" | "history" | "default";
}

export interface CostCenterRule {
  id: string;
  name: string;
  ncmPatterns?: string[];
  supplierCnpjs?: string[];
  cfopPatterns?: number[];
  keywords?: string[];
  priority: number;
}

export interface CostCenterInferenceConfig {
  rules: CostCenterRule[];
  defaultCostCenter?: { id: string; name: string };
  enableAiSuggestion?: boolean;
}

export interface HistoricalPurchase {
  ncm: string;
  supplierCnpj: string;
  cfop: number;
  costCenterId: string;
  costCenterName: string;
  count: number;
}

export interface InferenceResult {
  suggestions: CostCenterSuggestion[];
  topSuggestion: CostCenterSuggestion | null;
  analysisDetails: {
    ncmMatch: boolean;
    supplierMatch: boolean;
    historyMatch: boolean;
    keywordMatch: boolean;
  };
}

const NCM_TO_COST_CENTER: Record<string, { id: string; name: string; category: string }> = {
  "84": { id: "cc-producao", name: "Produção", category: "Máquinas e equipamentos" },
  "85": { id: "cc-producao", name: "Produção", category: "Equipamentos elétricos" },
  "72": { id: "cc-producao", name: "Produção", category: "Ferro e aço" },
  "73": { id: "cc-producao", name: "Produção", category: "Obras de ferro/aço" },
  "39": { id: "cc-producao", name: "Produção", category: "Plásticos" },
  "40": { id: "cc-producao", name: "Produção", category: "Borracha" },
  "48": { id: "cc-administrativo", name: "Administrativo", category: "Papel e papelão" },
  "49": { id: "cc-administrativo", name: "Administrativo", category: "Livros e impressos" },
  "94": { id: "cc-administrativo", name: "Administrativo", category: "Móveis" },
  "27": { id: "cc-energia", name: "Energia", category: "Combustíveis" },
  "38": { id: "cc-quimico", name: "Químico", category: "Produtos químicos" },
  "29": { id: "cc-quimico", name: "Químico", category: "Produtos orgânicos" },
  "30": { id: "cc-saude", name: "Saúde/Segurança", category: "Produtos farmacêuticos" },
  "90": { id: "cc-qualidade", name: "Qualidade", category: "Instrumentos de medição" },
  "87": { id: "cc-logistica", name: "Logística", category: "Veículos" },
  "62": { id: "cc-rh", name: "RH", category: "Vestuário" },
  "61": { id: "cc-rh", name: "RH", category: "Vestuário de malha" },
  "64": { id: "cc-rh", name: "RH", category: "Calçados" },
};

const CFOP_TO_COST_CENTER: Record<number, { id: string; name: string }> = {
  1551: { id: "cc-ativo", name: "Ativo Imobilizado" },
  2551: { id: "cc-ativo", name: "Ativo Imobilizado" },
  1556: { id: "cc-consumo", name: "Material de Consumo" },
  2556: { id: "cc-consumo", name: "Material de Consumo" },
  1101: { id: "cc-producao", name: "Produção" },
  2101: { id: "cc-producao", name: "Produção" },
  1102: { id: "cc-comercial", name: "Comercial" },
  2102: { id: "cc-comercial", name: "Comercial" },
  1401: { id: "cc-producao", name: "Produção" },
  2401: { id: "cc-producao", name: "Produção" },
  1403: { id: "cc-comercial", name: "Comercial" },
  2403: { id: "cc-comercial", name: "Comercial" },
};

const KEYWORD_TO_COST_CENTER: Record<string, { id: string; name: string }> = {
  "escritorio": { id: "cc-administrativo", name: "Administrativo" },
  "office": { id: "cc-administrativo", name: "Administrativo" },
  "papel": { id: "cc-administrativo", name: "Administrativo" },
  "caneta": { id: "cc-administrativo", name: "Administrativo" },
  "impressora": { id: "cc-ti", name: "TI" },
  "computador": { id: "cc-ti", name: "TI" },
  "notebook": { id: "cc-ti", name: "TI" },
  "servidor": { id: "cc-ti", name: "TI" },
  "software": { id: "cc-ti", name: "TI" },
  "licenca": { id: "cc-ti", name: "TI" },
  "epi": { id: "cc-seguranca", name: "Segurança do Trabalho" },
  "capacete": { id: "cc-seguranca", name: "Segurança do Trabalho" },
  "luva": { id: "cc-seguranca", name: "Segurança do Trabalho" },
  "oculos": { id: "cc-seguranca", name: "Segurança do Trabalho" },
  "protetor": { id: "cc-seguranca", name: "Segurança do Trabalho" },
  "limpeza": { id: "cc-manutencao", name: "Manutenção" },
  "manutencao": { id: "cc-manutencao", name: "Manutenção" },
  "reparo": { id: "cc-manutencao", name: "Manutenção" },
  "peca": { id: "cc-manutencao", name: "Manutenção" },
  "rolamento": { id: "cc-manutencao", name: "Manutenção" },
  "oleo": { id: "cc-manutencao", name: "Manutenção" },
  "lubrificante": { id: "cc-manutencao", name: "Manutenção" },
  "ferramenta": { id: "cc-producao", name: "Produção" },
  "materia-prima": { id: "cc-producao", name: "Produção" },
  "insumo": { id: "cc-producao", name: "Produção" },
  "embalagem": { id: "cc-producao", name: "Produção" },
  "cafe": { id: "cc-copa", name: "Copa/Cozinha" },
  "agua": { id: "cc-copa", name: "Copa/Cozinha" },
  "alimento": { id: "cc-copa", name: "Copa/Cozinha" },
};

/**
 * Infere centro de custo baseado no NCM
 */
export function inferFromNcm(ncm: string): CostCenterSuggestion | null {
  if (!ncm || ncm.length < 2) return null;

  const prefix2 = ncm.substring(0, 2);
  const mapping = NCM_TO_COST_CENTER[prefix2];

  if (mapping) {
    return {
      costCenterId: mapping.id,
      costCenterName: mapping.name,
      confidence: 0.7,
      reason: `NCM ${ncm} pertence à categoria "${mapping.category}"`,
      matchType: "ncm",
    };
  }

  return null;
}

/**
 * Infere centro de custo baseado no CFOP
 */
export function inferFromCfop(cfop: number): CostCenterSuggestion | null {
  const mapping = CFOP_TO_COST_CENTER[cfop];

  if (mapping) {
    return {
      costCenterId: mapping.id,
      costCenterName: mapping.name,
      confidence: 0.8,
      reason: `CFOP ${cfop} indica operação de ${mapping.name}`,
      matchType: "category",
    };
  }

  return null;
}

/**
 * Infere centro de custo baseado em palavras-chave na descrição
 */
export function inferFromKeywords(description: string): CostCenterSuggestion | null {
  if (!description) return null;

  const normalizedDesc = description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, mapping] of Object.entries(KEYWORD_TO_COST_CENTER)) {
    if (normalizedDesc.includes(keyword)) {
      return {
        costCenterId: mapping.id,
        costCenterName: mapping.name,
        confidence: 0.6,
        reason: `Descrição contém palavra-chave "${keyword}"`,
        matchType: "category",
      };
    }
  }

  return null;
}

/**
 * Infere centro de custo baseado no histórico de compras
 */
export function inferFromHistory(
  item: { ncm?: string; supplierCnpj?: string; cfop?: number },
  history: HistoricalPurchase[]
): CostCenterSuggestion | null {
  if (history.length === 0) return null;

  let bestMatch: HistoricalPurchase | null = null;
  let bestScore = 0;

  for (const purchase of history) {
    let score = 0;

    if (item.ncm && purchase.ncm === item.ncm) {
      score += 3;
    }

    if (item.supplierCnpj && purchase.supplierCnpj === item.supplierCnpj) {
      score += 2;
    }

    if (item.cfop && purchase.cfop === item.cfop) {
      score += 1;
    }

    score *= purchase.count;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = purchase;
    }
  }

  if (bestMatch && bestScore > 0) {
    const confidence = Math.min(0.9, 0.5 + (bestScore / 20));
    return {
      costCenterId: bestMatch.costCenterId,
      costCenterName: bestMatch.costCenterName,
      confidence,
      reason: `Baseado em ${bestMatch.count} compras anteriores similares`,
      matchType: "history",
    };
  }

  return null;
}

/**
 * Infere centro de custo para um item de NFe
 */
export function inferCostCenterForItem(
  item: NFeItem,
  supplierCnpj: string,
  history: HistoricalPurchase[] = [],
  config?: CostCenterInferenceConfig
): InferenceResult {
  const suggestions: CostCenterSuggestion[] = [];
  const analysisDetails = {
    ncmMatch: false,
    supplierMatch: false,
    historyMatch: false,
    keywordMatch: false,
  };

  const itemNcm = item.ncm || "";

  const historySuggestion = inferFromHistory(
    { ncm: itemNcm, supplierCnpj, cfop: item.cfop },
    history
  );
  if (historySuggestion) {
    suggestions.push(historySuggestion);
    analysisDetails.historyMatch = true;
  }

  const cfopSuggestion = inferFromCfop(item.cfop);
  if (cfopSuggestion) {
    suggestions.push(cfopSuggestion);
  }

  const ncmSuggestion = inferFromNcm(itemNcm);
  if (ncmSuggestion) {
    suggestions.push(ncmSuggestion);
    analysisDetails.ncmMatch = true;
  }

  const keywordSuggestion = inferFromKeywords(item.descricao);
  if (keywordSuggestion) {
    suggestions.push(keywordSuggestion);
    analysisDetails.keywordMatch = true;
  }

  if (config?.rules) {
    for (const rule of config.rules.sort((a, b) => b.priority - a.priority)) {
      let matches = false;

      if (rule.ncmPatterns?.some((p) => itemNcm.startsWith(p))) {
        matches = true;
      }

      if (rule.supplierCnpjs?.includes(supplierCnpj)) {
        matches = true;
        analysisDetails.supplierMatch = true;
      }

      if (rule.cfopPatterns?.includes(item.cfop)) {
        matches = true;
      }

      if (rule.keywords?.some((k) => item.descricao.toLowerCase().includes(k.toLowerCase()))) {
        matches = true;
      }

      if (matches) {
        suggestions.push({
          costCenterId: rule.id,
          costCenterName: rule.name,
          confidence: 0.85 + (rule.priority * 0.01),
          reason: `Regra personalizada: ${rule.name}`,
          matchType: "category",
        });
      }
    }
  }

  if (suggestions.length === 0 && config?.defaultCostCenter) {
    suggestions.push({
      costCenterId: config.defaultCostCenter.id,
      costCenterName: config.defaultCostCenter.name,
      confidence: 0.3,
      reason: "Centro de custo padrão",
      matchType: "default",
    });
  }

  suggestions.sort((a, b) => b.confidence - a.confidence);

  return {
    suggestions,
    topSuggestion: suggestions[0] || null,
    analysisDetails,
  };
}

/**
 * Analisa NFes e sugere centros de custo para todos os itens
 */
export function analyzeCostCenters(
  nfes: NFeParsed[],
  history: HistoricalPurchase[] = [],
  config?: CostCenterInferenceConfig
): {
  itemSuggestions: Array<{
    nfeNumero: string;
    itemIndex: number;
    descricao: string;
    ncm: string;
    suggestion: CostCenterSuggestion | null;
  }>;
  costCenterDistribution: Record<string, { count: number; percentage: number }>;
  statistics: {
    totalItems: number;
    itemsWithSuggestion: number;
    avgConfidence: number;
    matchTypeDistribution: Record<string, number>;
  };
} {
  const itemSuggestions: Array<{
    nfeNumero: string;
    itemIndex: number;
    descricao: string;
    ncm: string;
    suggestion: CostCenterSuggestion | null;
  }> = [];

  const costCenterCounts: Record<string, number> = {};
  const matchTypeCounts: Record<string, number> = {};
  let totalConfidence = 0;
  let itemsWithSuggestion = 0;

  for (const nfe of nfes) {
    const supplierCnpj = nfe.emitente?.cnpj || "";

    for (let i = 0; i < nfe.itens.length; i++) {
      const item = nfe.itens[i];
      const result = inferCostCenterForItem(item, supplierCnpj, history, config);

      itemSuggestions.push({
        nfeNumero: String(nfe.numero),
        itemIndex: i + 1,
        descricao: item.descricao,
        ncm: item.ncm || "",
        suggestion: result.topSuggestion,
      });

      if (result.topSuggestion) {
        itemsWithSuggestion++;
        totalConfidence += result.topSuggestion.confidence;

        const ccName = result.topSuggestion.costCenterName;
        costCenterCounts[ccName] = (costCenterCounts[ccName] || 0) + 1;

        const matchType = result.topSuggestion.matchType;
        matchTypeCounts[matchType] = (matchTypeCounts[matchType] || 0) + 1;
      }
    }
  }

  const totalItems = itemSuggestions.length;
  const costCenterDistribution: Record<string, { count: number; percentage: number }> = {};

  for (const [name, count] of Object.entries(costCenterCounts)) {
    costCenterDistribution[name] = {
      count,
      percentage: Math.round((count / totalItems) * 100),
    };
  }

  return {
    itemSuggestions,
    costCenterDistribution,
    statistics: {
      totalItems,
      itemsWithSuggestion,
      avgConfidence: itemsWithSuggestion > 0 ? totalConfidence / itemsWithSuggestion : 0,
      matchTypeDistribution: matchTypeCounts,
    },
  };
}

/**
 * Gera relatório de sugestões de centro de custo
 */
export function generateCostCenterReport(
  analysis: ReturnType<typeof analyzeCostCenters>
): string {
  const lines: string[] = [
    "=".repeat(60),
    "RELATÓRIO DE SUGESTÃO DE CENTRO DE CUSTO",
    "=".repeat(60),
    "",
    "ESTATÍSTICAS GERAIS",
    "-".repeat(40),
    `Total de itens analisados: ${analysis.statistics.totalItems}`,
    `Itens com sugestão: ${analysis.statistics.itemsWithSuggestion}`,
    `Confiança média: ${(analysis.statistics.avgConfidence * 100).toFixed(1)}%`,
    "",
    "DISTRIBUIÇÃO POR CENTRO DE CUSTO",
    "-".repeat(40),
  ];

  const sortedCenters = Object.entries(analysis.costCenterDistribution)
    .sort((a, b) => b[1].count - a[1].count);

  for (const [name, data] of sortedCenters) {
    lines.push(`${name}: ${data.count} itens (${data.percentage}%)`);
  }

  lines.push("");
  lines.push("DISTRIBUIÇÃO POR TIPO DE MATCH");
  lines.push("-".repeat(40));

  for (const [type, count] of Object.entries(analysis.statistics.matchTypeDistribution)) {
    lines.push(`${type}: ${count} itens`);
  }

  lines.push("");
  lines.push("=".repeat(60));

  return lines.join("\n");
}
