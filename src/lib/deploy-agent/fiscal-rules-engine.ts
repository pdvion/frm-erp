/**
 * Deploy Agent - Fiscal Rules Engine
 * Analisa XMLs de NFe e mapeia automaticamente CFOP, CST e alíquotas
 * VIO-876
 */

import type { NFeParsed, NFeItem } from "@/lib/nfe-parser";

export interface FiscalPattern {
  cfop: number;
  cstIcms: string;
  cstPis: string;
  cstCofins: string;
  cstIpi: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
  aliquotaIpi: number;
  ncm: string;
  ufOrigem: string;
  ufDestino: string;
  tipoOperacao: "entrada" | "saida";
  count: number;
}

export interface FiscalRuleSuggestion {
  id: string;
  name: string;
  description: string;
  cfopEntrada?: number;
  cfopSaida?: number;
  cstIcms: string;
  cstPis: string;
  cstCofins: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
  ncmPattern?: string;
  ufOrigem?: string;
  ufDestino?: string;
  confidence: number;
  occurrences: number;
}

export interface FiscalAnalysisResult {
  patterns: FiscalPattern[];
  suggestions: FiscalRuleSuggestion[];
  statistics: {
    totalItems: number;
    uniqueCfops: number;
    uniqueNcms: number;
    uniqueCstIcms: number;
    avgAliquotaIcms: number;
    avgAliquotaPis: number;
    avgAliquotaCofins: number;
  };
  cfopDistribution: Record<number, { count: number; description: string }>;
  cstDistribution: Record<string, number>;
  ncmDistribution: Record<string, { count: number; description: string }>;
}

const CFOP_DESCRIPTIONS: Record<number, string> = {
  1101: "Compra para industrialização",
  1102: "Compra para comercialização",
  1201: "Devolução de venda de produção",
  1202: "Devolução de venda de mercadoria",
  1401: "Compra para industrialização ST",
  1403: "Compra para comercialização ST",
  1551: "Compra de bem para ativo imobilizado",
  1556: "Compra de material para uso/consumo",
  1949: "Outra entrada não especificada",
  2101: "Compra para industrialização",
  2102: "Compra para comercialização",
  2201: "Devolução de venda de produção",
  2202: "Devolução de venda de mercadoria",
  2401: "Compra para industrialização ST",
  2403: "Compra para comercialização ST",
  2551: "Compra de bem para ativo imobilizado",
  2556: "Compra de material para uso/consumo",
  2949: "Outra entrada não especificada",
  5101: "Venda de produção do estabelecimento",
  5102: "Venda de mercadoria adquirida",
  5201: "Devolução de compra para industrialização",
  5202: "Devolução de compra para comercialização",
  5401: "Venda de produção ST",
  5403: "Venda de mercadoria ST",
  5405: "Venda de mercadoria ST (substituído)",
  5551: "Venda de bem do ativo imobilizado",
  5910: "Remessa em bonificação/doação/brinde",
  5949: "Outra saída não especificada",
  6101: "Venda de produção do estabelecimento",
  6102: "Venda de mercadoria adquirida",
  6107: "Venda de produção a não contribuinte",
  6108: "Venda de mercadoria a não contribuinte",
  6201: "Devolução de compra para industrialização",
  6202: "Devolução de compra para comercialização",
  6401: "Venda de produção ST",
  6403: "Venda de mercadoria ST",
  6404: "Venda de mercadoria ST (já retido)",
  6551: "Venda de bem do ativo imobilizado",
  6910: "Remessa em bonificação/doação/brinde",
  6949: "Outra saída não especificada",
  7101: "Exportação de produção",
  7102: "Exportação de mercadoria adquirida",
  7949: "Outra saída para exterior",
};

const CST_ICMS_DESCRIPTIONS: Record<string, string> = {
  "00": "Tributada integralmente",
  "10": "Tributada com ST",
  "20": "Com redução de base",
  "30": "Isenta/não tributada com ST",
  "40": "Isenta",
  "41": "Não tributada",
  "50": "Suspensão",
  "51": "Diferimento",
  "60": "ICMS cobrado anteriormente por ST",
  "70": "Redução de base com ST",
  "90": "Outras",
  "101": "Simples Nacional com crédito",
  "102": "Simples Nacional sem crédito",
  "103": "Isenção Simples Nacional",
  "201": "Simples Nacional com crédito e ST",
  "202": "Simples Nacional sem crédito e ST",
  "300": "Imune",
  "400": "Não tributada Simples Nacional",
  "500": "ICMS cobrado anteriormente (ST/antecipação)",
  "900": "Outros Simples Nacional",
};

function generateSuggestionId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function extractFiscalPattern(item: NFeItem, nfe: NFeParsed): FiscalPattern {
  return {
    cfop: item.cfop,
    cstIcms: item.icms.cst || "",
    cstPis: item.pis.cst || "",
    cstCofins: item.cofins.cst || "",
    cstIpi: item.ipi.cst || "",
    aliquotaIcms: item.icms.aliquota,
    aliquotaPis: item.pis.aliquota,
    aliquotaCofins: item.cofins.aliquota,
    aliquotaIpi: item.ipi.aliquota,
    ncm: item.ncm || "",
    ufOrigem: nfe.emitente.endereco?.uf || "",
    ufDestino: nfe.destinatario.endereco?.uf || "",
    tipoOperacao: nfe.tipoOperacao === 0 ? "entrada" : "saida",
    count: 1,
  };
}

function getPatternKey(pattern: FiscalPattern): string {
  return `${pattern.cfop}_${pattern.cstIcms}_${pattern.ncm}_${pattern.ufOrigem}_${pattern.ufDestino}`;
}

function groupPatterns(patterns: FiscalPattern[]): FiscalPattern[] {
  const grouped = new Map<string, FiscalPattern>();

  for (const pattern of patterns) {
    const key = getPatternKey(pattern);
    const existing = grouped.get(key);

    if (existing) {
      existing.count += 1;
      existing.aliquotaIcms = (existing.aliquotaIcms * (existing.count - 1) + pattern.aliquotaIcms) / existing.count;
      existing.aliquotaPis = (existing.aliquotaPis * (existing.count - 1) + pattern.aliquotaPis) / existing.count;
      existing.aliquotaCofins = (existing.aliquotaCofins * (existing.count - 1) + pattern.aliquotaCofins) / existing.count;
    } else {
      grouped.set(key, { ...pattern });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
}

function generateSuggestions(patterns: FiscalPattern[]): FiscalRuleSuggestion[] {
  const suggestions: FiscalRuleSuggestion[] = [];
  const totalCount = patterns.reduce((acc, p) => acc + p.count, 0);

  const byNcm = new Map<string, FiscalPattern[]>();
  for (const pattern of patterns) {
    const ncm = pattern.ncm.substring(0, 4);
    const existing = byNcm.get(ncm) || [];
    existing.push(pattern);
    byNcm.set(ncm, existing);
  }

  for (const [ncmPrefix, ncmPatterns] of byNcm) {
    if (!ncmPrefix) continue;

    const sorted = ncmPatterns.sort((a, b) => b.count - a.count);
    const dominant = sorted[0];
    const ncmCount = ncmPatterns.reduce((acc, p) => acc + p.count, 0);
    const confidence = ncmCount / totalCount;

    const entradas = ncmPatterns.filter((p) => p.tipoOperacao === "entrada");
    const saidas = ncmPatterns.filter((p) => p.tipoOperacao === "saida");

    const cfopEntrada = entradas.length > 0 ? entradas.sort((a, b) => b.count - a.count)[0].cfop : undefined;
    const cfopSaida = saidas.length > 0 ? saidas.sort((a, b) => b.count - a.count)[0].cfop : undefined;

    suggestions.push({
      id: generateSuggestionId(),
      name: `Regra NCM ${ncmPrefix}`,
      description: `Regra fiscal para produtos NCM ${ncmPrefix}xxxx`,
      cfopEntrada,
      cfopSaida,
      cstIcms: dominant.cstIcms,
      cstPis: dominant.cstPis,
      cstCofins: dominant.cstCofins,
      aliquotaIcms: Math.round(dominant.aliquotaIcms * 100) / 100,
      aliquotaPis: Math.round(dominant.aliquotaPis * 100) / 100,
      aliquotaCofins: Math.round(dominant.aliquotaCofins * 100) / 100,
      ncmPattern: `${ncmPrefix}*`,
      ufOrigem: dominant.ufOrigem,
      ufDestino: dominant.ufDestino,
      confidence: Math.round(confidence * 100) / 100,
      occurrences: ncmCount,
    });
  }

  return suggestions.sort((a, b) => b.occurrences - a.occurrences);
}

export function analyzeFiscalPatterns(nfes: NFeParsed[]): FiscalAnalysisResult {
  const allPatterns: FiscalPattern[] = [];

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      allPatterns.push(extractFiscalPattern(item, nfe));
    }
  }

  const groupedPatterns = groupPatterns(allPatterns);
  const suggestions = generateSuggestions(groupedPatterns);

  const cfopSet = new Set(allPatterns.map((p) => p.cfop));
  const ncmSet = new Set(allPatterns.map((p) => p.ncm).filter(Boolean));
  const cstSet = new Set(allPatterns.map((p) => p.cstIcms).filter(Boolean));

  const cfopDistribution: Record<number, { count: number; description: string }> = {};
  const cstDistribution: Record<string, number> = {};
  const ncmDistribution: Record<string, { count: number; description: string }> = {};

  for (const pattern of allPatterns) {
    if (!cfopDistribution[pattern.cfop]) {
      cfopDistribution[pattern.cfop] = {
        count: 0,
        description: CFOP_DESCRIPTIONS[pattern.cfop] || "Não especificado",
      };
    }
    cfopDistribution[pattern.cfop].count += pattern.count;

    if (pattern.cstIcms) {
      cstDistribution[pattern.cstIcms] = (cstDistribution[pattern.cstIcms] || 0) + pattern.count;
    }

    if (pattern.ncm) {
      const ncm4 = pattern.ncm.substring(0, 4);
      if (!ncmDistribution[ncm4]) {
        ncmDistribution[ncm4] = { count: 0, description: `NCM ${ncm4}` };
      }
      ncmDistribution[ncm4].count += pattern.count;
    }
  }

  const totalItems = allPatterns.length;
  const avgAliquotaIcms = totalItems > 0 ? allPatterns.reduce((acc, p) => acc + p.aliquotaIcms, 0) / totalItems : 0;
  const avgAliquotaPis = totalItems > 0 ? allPatterns.reduce((acc, p) => acc + p.aliquotaPis, 0) / totalItems : 0;
  const avgAliquotaCofins = totalItems > 0 ? allPatterns.reduce((acc, p) => acc + p.aliquotaCofins, 0) / totalItems : 0;

  return {
    patterns: groupedPatterns,
    suggestions,
    statistics: {
      totalItems,
      uniqueCfops: cfopSet.size,
      uniqueNcms: ncmSet.size,
      uniqueCstIcms: cstSet.size,
      avgAliquotaIcms: Math.round(avgAliquotaIcms * 100) / 100,
      avgAliquotaPis: Math.round(avgAliquotaPis * 100) / 100,
      avgAliquotaCofins: Math.round(avgAliquotaCofins * 100) / 100,
    },
    cfopDistribution,
    cstDistribution,
    ncmDistribution,
  };
}

export function getCfopDescription(cfop: number): string {
  return CFOP_DESCRIPTIONS[cfop] || "Não especificado";
}

export function getCstIcmsDescription(cst: string): string {
  return CST_ICMS_DESCRIPTIONS[cst] || "Não especificado";
}

export function suggestCfopForOperation(
  tipoOperacao: "entrada" | "saida",
  finalidade: "industrializacao" | "comercializacao" | "consumo" | "ativo",
  dentroEstado: boolean
): number {
  const prefix = tipoOperacao === "entrada" ? (dentroEstado ? 1 : 2) : dentroEstado ? 5 : 6;

  const cfopMap: Record<string, number> = {
    "entrada_industrializacao": 101,
    "entrada_comercializacao": 102,
    "entrada_consumo": 556,
    "entrada_ativo": 551,
    "saida_industrializacao": 101,
    "saida_comercializacao": 102,
    "saida_consumo": 910,
    "saida_ativo": 551,
  };

  const suffix = cfopMap[`${tipoOperacao}_${finalidade}`] || 949;
  return prefix * 1000 + suffix;
}
