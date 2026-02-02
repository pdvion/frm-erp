/**
 * Deploy Agent - Unit Conversion
 * Mapeamento e conversão de unidades de medida entre XMLs de diferentes fornecedores
 * VIO-883
 */

import type { NFeParsed } from "@/lib/nfe-parser";

export interface UnitMapping {
  original: string;
  normalized: string;
  factor: number;
  description: string;
}

export interface ConversionRule {
  from: string;
  to: string;
  factor: number;
  reversible: boolean;
}

export interface UnitAnalysisResult {
  unitDistribution: Record<string, { count: number; normalized: string }>;
  conversionSuggestions: Array<{
    original: string;
    suggested: string;
    confidence: number;
    reason: string;
  }>;
  inconsistencies: Array<{
    ncm: string;
    descricao: string;
    units: string[];
    suggestedUnit: string;
  }>;
  statistics: {
    totalItems: number;
    uniqueUnits: number;
    normalizedUnits: number;
    inconsistentProducts: number;
  };
}

const UNIT_SYNONYMS: Record<string, string[]> = {
  UN: ["UN", "UND", "UNID", "UNIDADE", "PC", "PÇ", "PCA", "PECA", "PEÇA"],
  KG: ["KG", "K", "KILO", "QUILO", "QUILOGRAMA"],
  G: ["G", "GR", "GRAMA", "GRAMAS"],
  L: ["L", "LT", "LITRO", "LITROS"],
  ML: ["ML", "MILILITRO", "MILILITROS"],
  M: ["M", "MT", "METRO", "METROS"],
  CM: ["CM", "CENTIMETRO", "CENTIMETROS"],
  MM: ["MM", "MILIMETRO", "MILIMETROS"],
  M2: ["M2", "M²", "METRO QUADRADO", "METROS QUADRADOS"],
  M3: ["M3", "M³", "METRO CUBICO", "METROS CUBICOS"],
  CX: ["CX", "CAIXA", "CAIXAS"],
  PCT: ["PCT", "PACOTE", "PACOTES", "PAC"],
  RS: ["RS", "RESMA", "RESMAS"],
  RL: ["RL", "ROLO", "ROLOS"],
  FD: ["FD", "FARDO", "FARDOS"],
  SC: ["SC", "SACO", "SACOS"],
  GL: ["GL", "GALAO", "GALÃO", "GALOES", "GALÕES"],
  TB: ["TB", "TUBO", "TUBOS"],
  BR: ["BR", "BARRA", "BARRAS"],
  CH: ["CH", "CHAPA", "CHAPAS"],
  BL: ["BL", "BLOCO", "BLOCOS"],
  JG: ["JG", "JOGO", "JOGOS"],
  KIT: ["KIT", "KITS"],
  PAR: ["PAR", "PARES"],
  DZ: ["DZ", "DUZIA", "DÚZIA", "DUZIAS"],
  CT: ["CT", "CENTO", "CENTOS"],
  MIL: ["MIL", "MILHEIRO"],
  TON: ["TON", "T", "TONELADA", "TONELADAS"],
  HR: ["HR", "H", "HORA", "HORAS"],
  DIA: ["DIA", "DIAS", "D"],
  MES: ["MES", "MÊS", "MESES"],
};

const UNIT_DESCRIPTIONS: Record<string, string> = {
  UN: "Unidade",
  KG: "Quilograma",
  G: "Grama",
  L: "Litro",
  ML: "Mililitro",
  M: "Metro",
  CM: "Centímetro",
  MM: "Milímetro",
  M2: "Metro Quadrado",
  M3: "Metro Cúbico",
  CX: "Caixa",
  PCT: "Pacote",
  RS: "Resma",
  RL: "Rolo",
  FD: "Fardo",
  SC: "Saco",
  GL: "Galão",
  TB: "Tubo",
  BR: "Barra",
  CH: "Chapa",
  BL: "Bloco",
  JG: "Jogo",
  KIT: "Kit",
  PAR: "Par",
  DZ: "Dúzia",
  CT: "Cento",
  MIL: "Milheiro",
  TON: "Tonelada",
  HR: "Hora",
  DIA: "Dia",
  MES: "Mês",
};

const CONVERSION_RULES: ConversionRule[] = [
  { from: "KG", to: "G", factor: 1000, reversible: true },
  { from: "TON", to: "KG", factor: 1000, reversible: true },
  { from: "L", to: "ML", factor: 1000, reversible: true },
  { from: "M", to: "CM", factor: 100, reversible: true },
  { from: "M", to: "MM", factor: 1000, reversible: true },
  { from: "CM", to: "MM", factor: 10, reversible: true },
  { from: "DZ", to: "UN", factor: 12, reversible: true },
  { from: "CT", to: "UN", factor: 100, reversible: true },
  { from: "MIL", to: "UN", factor: 1000, reversible: true },
  { from: "PAR", to: "UN", factor: 2, reversible: true },
  { from: "HR", to: "DIA", factor: 1 / 24, reversible: true },
  { from: "DIA", to: "MES", factor: 1 / 30, reversible: true },
];

const UNIT_WITH_FACTOR_PATTERN = /^(CX|PCT|FD|SC|RL)(\d+)$/i;

/**
 * Normaliza uma unidade de medida para o padrão
 */
export function normalizeUnit(unit: string): UnitMapping {
  const cleanUnit = unit.toUpperCase().trim().replace(/\s+/g, " ");

  const factorMatch = cleanUnit.match(UNIT_WITH_FACTOR_PATTERN);
  if (factorMatch) {
    const baseUnit = factorMatch[1].toUpperCase();
    const factor = parseInt(factorMatch[2], 10);
    return {
      original: unit,
      normalized: baseUnit,
      factor,
      description: `${UNIT_DESCRIPTIONS[baseUnit] || baseUnit} com ${factor} unidades`,
    };
  }

  for (const [normalized, synonyms] of Object.entries(UNIT_SYNONYMS)) {
    if (synonyms.some((s) => s === cleanUnit)) {
      return {
        original: unit,
        normalized,
        factor: 1,
        description: UNIT_DESCRIPTIONS[normalized] || normalized,
      };
    }
  }

  return {
    original: unit,
    normalized: cleanUnit,
    factor: 1,
    description: cleanUnit,
  };
}

/**
 * Verifica se duas unidades são equivalentes
 */
export function areUnitsEquivalent(unit1: string, unit2: string): boolean {
  const norm1 = normalizeUnit(unit1);
  const norm2 = normalizeUnit(unit2);
  return norm1.normalized === norm2.normalized;
}

/**
 * Converte quantidade de uma unidade para outra
 */
export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): { quantity: number; success: boolean; factor: number } {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from.normalized === to.normalized) {
    const factor = from.factor / to.factor;
    return { quantity: quantity * factor, success: true, factor };
  }

  const rule = CONVERSION_RULES.find(
    (r) =>
      (r.from === from.normalized && r.to === to.normalized) ||
      (r.reversible && r.to === from.normalized && r.from === to.normalized)
  );

  if (rule) {
    const isReverse = rule.to === from.normalized;
    const baseFactor = isReverse ? 1 / rule.factor : rule.factor;
    const totalFactor = baseFactor * (from.factor / to.factor);
    return { quantity: quantity * totalFactor, success: true, factor: totalFactor };
  }

  return { quantity, success: false, factor: 1 };
}

/**
 * Obtém a descrição de uma unidade
 */
export function getUnitDescription(unit: string): string {
  const normalized = normalizeUnit(unit);
  return normalized.description;
}

/**
 * Lista todas as unidades conhecidas
 */
export function listKnownUnits(): Array<{ code: string; description: string; synonyms: string[] }> {
  return Object.entries(UNIT_SYNONYMS).map(([code, synonyms]) => ({
    code,
    description: UNIT_DESCRIPTIONS[code] || code,
    synonyms,
  }));
}

/**
 * Sugere unidade padronizada baseada na descrição do produto
 */
export function suggestUnitFromDescription(description: string): string | null {
  const descLower = description.toLowerCase();

  const patterns: Array<{ keywords: string[]; unit: string }> = [
    { keywords: ["litro", "galão", "galao", "óleo", "oleo", "combustível", "combustivel"], unit: "L" },
    { keywords: ["quilo", "kilo", "peso", "tonelada"], unit: "KG" },
    { keywords: ["metro", "comprimento", "largura", "altura"], unit: "M" },
    { keywords: ["metro quadrado", "m²", "área", "area"], unit: "M2" },
    { keywords: ["metro cúbico", "m³", "volume"], unit: "M3" },
    { keywords: ["caixa", "embalagem"], unit: "CX" },
    { keywords: ["pacote", "sachê", "sache"], unit: "PCT" },
    { keywords: ["resma", "papel"], unit: "RS" },
    { keywords: ["rolo", "bobina"], unit: "RL" },
    { keywords: ["fardo"], unit: "FD" },
    { keywords: ["saco", "sacaria"], unit: "SC" },
    { keywords: ["tubo", "cano"], unit: "TB" },
    { keywords: ["barra", "vergalhão", "vergalhao"], unit: "BR" },
    { keywords: ["chapa", "placa"], unit: "CH" },
    { keywords: ["par", "pares"], unit: "PAR" },
    { keywords: ["dúzia", "duzia"], unit: "DZ" },
    { keywords: ["jogo", "conjunto", "kit"], unit: "JG" },
    { keywords: ["hora", "serviço", "servico", "mão de obra", "mao de obra"], unit: "HR" },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some((k) => descLower.includes(k))) {
      return pattern.unit;
    }
  }

  return null;
}

/**
 * Analisa unidades de medida em NFes
 */
export function analyzeUnits(nfes: NFeParsed[]): UnitAnalysisResult {
  const unitCounts: Record<string, { count: number; normalized: string }> = {};
  const productUnits: Record<string, Set<string>> = {};
  const productDescriptions: Record<string, string> = {};
  let totalItems = 0;

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      totalItems++;
      const normalized = normalizeUnit(item.unidade);

      if (!unitCounts[item.unidade]) {
        unitCounts[item.unidade] = { count: 0, normalized: normalized.normalized };
      }
      unitCounts[item.unidade].count++;

      const productKey = item.ncm || item.codigo;
      if (!productUnits[productKey]) {
        productUnits[productKey] = new Set();
        productDescriptions[productKey] = item.descricao;
      }
      productUnits[productKey].add(normalized.normalized);
    }
  }

  const conversionSuggestions: UnitAnalysisResult["conversionSuggestions"] = [];
  for (const [original, data] of Object.entries(unitCounts)) {
    if (original !== data.normalized) {
      conversionSuggestions.push({
        original,
        suggested: data.normalized,
        confidence: 0.9,
        reason: `"${original}" é sinônimo de "${data.normalized}"`,
      });
    }
  }

  const inconsistencies: UnitAnalysisResult["inconsistencies"] = [];
  for (const [productKey, units] of Object.entries(productUnits)) {
    if (units.size > 1) {
      const unitsArray = Array.from(units);
      const mostCommon = unitsArray[0];
      inconsistencies.push({
        ncm: productKey,
        descricao: productDescriptions[productKey],
        units: unitsArray,
        suggestedUnit: mostCommon,
      });
    }
  }

  const normalizedSet = new Set(Object.values(unitCounts).map((u) => u.normalized));

  return {
    unitDistribution: unitCounts,
    conversionSuggestions,
    inconsistencies,
    statistics: {
      totalItems,
      uniqueUnits: Object.keys(unitCounts).length,
      normalizedUnits: normalizedSet.size,
      inconsistentProducts: inconsistencies.length,
    },
  };
}

/**
 * Gera relatório de análise de unidades
 */
export function generateUnitReport(analysis: UnitAnalysisResult): string {
  const lines: string[] = [
    "=".repeat(60),
    "RELATÓRIO DE ANÁLISE DE UNIDADES DE MEDIDA",
    "=".repeat(60),
    "",
    "ESTATÍSTICAS GERAIS",
    "-".repeat(40),
    `Total de itens: ${analysis.statistics.totalItems}`,
    `Unidades únicas: ${analysis.statistics.uniqueUnits}`,
    `Unidades normalizadas: ${analysis.statistics.normalizedUnits}`,
    `Produtos com inconsistência: ${analysis.statistics.inconsistentProducts}`,
    "",
    "DISTRIBUIÇÃO DE UNIDADES",
    "-".repeat(40),
  ];

  const sortedUnits = Object.entries(analysis.unitDistribution)
    .sort((a, b) => b[1].count - a[1].count);

  for (const [unit, data] of sortedUnits.slice(0, 15)) {
    const normalized = data.normalized !== unit ? ` → ${data.normalized}` : "";
    lines.push(`${unit}${normalized}: ${data.count} itens`);
  }

  if (analysis.conversionSuggestions.length > 0) {
    lines.push("");
    lines.push("SUGESTÕES DE NORMALIZAÇÃO");
    lines.push("-".repeat(40));
    for (const suggestion of analysis.conversionSuggestions.slice(0, 10)) {
      lines.push(`${suggestion.original} → ${suggestion.suggested}`);
    }
  }

  if (analysis.inconsistencies.length > 0) {
    lines.push("");
    lines.push("INCONSISTÊNCIAS DETECTADAS");
    lines.push("-".repeat(40));
    for (const item of analysis.inconsistencies.slice(0, 10)) {
      lines.push(`NCM ${item.ncm}: ${item.units.join(", ")} (sugerido: ${item.suggestedUnit})`);
      lines.push(`  ${item.descricao.substring(0, 50)}...`);
    }
  }

  lines.push("");
  lines.push("=".repeat(60));

  return lines.join("\n");
}
