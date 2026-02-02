/**
 * Deploy Agent - NCM Intelligence
 * Sugestões baseadas em NCM para categoria, unidade e produtos similares
 * VIO-882
 */

import type { NFeParsed } from "@/lib/nfe-parser";

export interface NcmInfo {
  ncm: string;
  descricao: string;
  capitulo: string;
  posicao: string;
  subposicao: string;
  item: string;
  subitem: string;
  categoria: string;
  unidadePadrao: string;
  aliquotaIpiPadrao: number;
  exTipi?: string;
}

export interface NcmSuggestion {
  field: "categoria" | "unidade" | "ncm" | "similar";
  value: string;
  confidence: number;
  reason: string;
}

export interface SimilarProduct {
  codigo: string;
  descricao: string;
  ncm: string;
  similarity: number;
}

const NCM_DATABASE: Record<string, Partial<NcmInfo>> = {
  "84": { capitulo: "84", descricao: "Reatores nucleares, caldeiras, máquinas", categoria: "Máquinas", unidadePadrao: "UN" },
  "8481": { posicao: "8481", descricao: "Torneiras, válvulas e dispositivos", categoria: "Válvulas", unidadePadrao: "UN" },
  "84818099": { descricao: "Outras torneiras e válvulas", categoria: "Válvulas", unidadePadrao: "UN", aliquotaIpiPadrao: 5 },
  "8482": { posicao: "8482", descricao: "Rolamentos de esferas ou de rolos", categoria: "Rolamentos", unidadePadrao: "UN" },
  "84821010": { descricao: "Rolamentos de esferas", categoria: "Rolamentos", unidadePadrao: "UN", aliquotaIpiPadrao: 5 },
  "85": { capitulo: "85", descricao: "Máquinas e aparelhos elétricos", categoria: "Elétricos", unidadePadrao: "UN" },
  "8544": { posicao: "8544", descricao: "Fios, cabos e condutores elétricos", categoria: "Cabos", unidadePadrao: "M" },
  "85444900": { descricao: "Outros condutores elétricos", categoria: "Cabos", unidadePadrao: "M", aliquotaIpiPadrao: 10 },
  "72": { capitulo: "72", descricao: "Ferro fundido, ferro e aço", categoria: "Metais", unidadePadrao: "KG" },
  "7214": { posicao: "7214", descricao: "Barras de ferro ou aço", categoria: "Barras", unidadePadrao: "KG" },
  "72142000": { descricao: "Barras de ferro ou aço dentadas", categoria: "Barras", unidadePadrao: "KG", aliquotaIpiPadrao: 5 },
  "73": { capitulo: "73", descricao: "Obras de ferro fundido, ferro ou aço", categoria: "Obras de Metal", unidadePadrao: "UN" },
  "7318": { posicao: "7318", descricao: "Parafusos, porcas, arruelas", categoria: "Fixadores", unidadePadrao: "UN" },
  "73181500": { descricao: "Parafusos e pinos roscados", categoria: "Fixadores", unidadePadrao: "UN", aliquotaIpiPadrao: 5 },
  "39": { capitulo: "39", descricao: "Plásticos e suas obras", categoria: "Plásticos", unidadePadrao: "KG" },
  "3917": { posicao: "3917", descricao: "Tubos e acessórios de plástico", categoria: "Tubos Plásticos", unidadePadrao: "M" },
  "39172300": { descricao: "Tubos rígidos de polímeros de cloreto", categoria: "Tubos PVC", unidadePadrao: "M", aliquotaIpiPadrao: 10 },
  "40": { capitulo: "40", descricao: "Borracha e suas obras", categoria: "Borracha", unidadePadrao: "KG" },
  "4016": { posicao: "4016", descricao: "Outras obras de borracha vulcanizada", categoria: "Borracha", unidadePadrao: "UN" },
  "40169300": { descricao: "Juntas, gaxetas e semelhantes", categoria: "Vedações", unidadePadrao: "UN", aliquotaIpiPadrao: 5 },
  "48": { capitulo: "48", descricao: "Papel e cartão", categoria: "Papel", unidadePadrao: "KG" },
  "4802": { posicao: "4802", descricao: "Papel e cartão não revestidos", categoria: "Papel", unidadePadrao: "RS" },
  "48025610": { descricao: "Papel para escrita A4", categoria: "Papel Escritório", unidadePadrao: "RS", aliquotaIpiPadrao: 0 },
  "27": { capitulo: "27", descricao: "Combustíveis minerais, óleos", categoria: "Combustíveis", unidadePadrao: "L" },
  "2710": { posicao: "2710", descricao: "Óleos de petróleo", categoria: "Óleos", unidadePadrao: "L" },
  "27101259": { descricao: "Óleo diesel", categoria: "Diesel", unidadePadrao: "L", aliquotaIpiPadrao: 0 },
  "90": { capitulo: "90", descricao: "Instrumentos e aparelhos de óptica", categoria: "Instrumentos", unidadePadrao: "UN" },
  "9031": { posicao: "9031", descricao: "Instrumentos e aparelhos de medida", categoria: "Medição", unidadePadrao: "UN" },
  "90318099": { descricao: "Outros instrumentos de medida", categoria: "Medição", unidadePadrao: "UN", aliquotaIpiPadrao: 0 },
  "87": { capitulo: "87", descricao: "Veículos automóveis, tratores", categoria: "Veículos", unidadePadrao: "UN" },
  "8708": { posicao: "8708", descricao: "Partes e acessórios de veículos", categoria: "Autopeças", unidadePadrao: "UN" },
  "87089990": { descricao: "Outras partes e acessórios", categoria: "Autopeças", unidadePadrao: "UN", aliquotaIpiPadrao: 8 },
};

const UNIT_SYNONYMS: Record<string, string> = {
  "UN": "UN",
  "UND": "UN",
  "UNID": "UN",
  "UNIDADE": "UN",
  "PC": "UN",
  "PÇ": "UN",
  "PCA": "UN",
  "PECA": "UN",
  "KG": "KG",
  "K": "KG",
  "KILO": "KG",
  "QUILO": "KG",
  "G": "G",
  "GR": "G",
  "GRAMA": "G",
  "L": "L",
  "LT": "L",
  "LITRO": "L",
  "M": "M",
  "MT": "M",
  "METRO": "M",
  "M2": "M2",
  "M²": "M2",
  "M3": "M3",
  "M³": "M3",
  "CX": "CX",
  "CAIXA": "CX",
  "PCT": "PCT",
  "PACOTE": "PCT",
  "RS": "RS",
  "RESMA": "RS",
  "RL": "RL",
  "ROLO": "RL",
  "FD": "FD",
  "FARDO": "FD",
  "SC": "SC",
  "SACO": "SC",
  "GL": "GL",
  "GALAO": "GL",
  "TB": "TB",
  "TUBO": "TB",
  "BR": "BR",
  "BARRA": "BR",
  "CH": "CH",
  "CHAPA": "CH",
  "BL": "BL",
  "BLOCO": "BL",
  "JG": "JG",
  "JOGO": "JG",
  "KIT": "KIT",
  "PAR": "PAR",
  "DZ": "DZ",
  "DUZIA": "DZ",
  "CT": "CT",
  "CENTO": "CT",
  "ML": "ML",
  "MIL": "ML",
};

/**
 * Obtém informações do NCM
 */
export function getNcmInfo(ncm: string): NcmInfo | null {
  if (!ncm || ncm.length < 2) return null;

  const ncmClean = ncm.replace(/\D/g, "");
  let info: Partial<NcmInfo> = {};

  if (NCM_DATABASE[ncmClean]) {
    info = { ...NCM_DATABASE[ncmClean] };
  }

  for (let len = ncmClean.length; len >= 2; len--) {
    const prefix = ncmClean.substring(0, len);
    if (NCM_DATABASE[prefix]) {
      info = { ...NCM_DATABASE[prefix], ...info };
    }
  }

  if (!info.descricao) return null;

  return {
    ncm: ncmClean,
    descricao: info.descricao || "",
    capitulo: ncmClean.substring(0, 2),
    posicao: ncmClean.substring(0, 4),
    subposicao: ncmClean.substring(0, 6),
    item: ncmClean.substring(0, 7),
    subitem: ncmClean,
    categoria: info.categoria || "Outros",
    unidadePadrao: info.unidadePadrao || "UN",
    aliquotaIpiPadrao: info.aliquotaIpiPadrao || 0,
  };
}

/**
 * Sugere categoria baseada no NCM
 */
export function suggestCategory(ncm: string): NcmSuggestion | null {
  const info = getNcmInfo(ncm);
  if (!info) return null;

  return {
    field: "categoria",
    value: info.categoria,
    confidence: ncm.length >= 8 ? 0.9 : 0.7,
    reason: `NCM ${ncm} pertence ao capítulo ${info.capitulo}: ${info.descricao}`,
  };
}

/**
 * Sugere unidade de medida baseada no NCM
 */
export function suggestUnit(ncm: string): NcmSuggestion | null {
  const info = getNcmInfo(ncm);
  if (!info) return null;

  return {
    field: "unidade",
    value: info.unidadePadrao,
    confidence: 0.7,
    reason: `Unidade padrão para ${info.categoria}: ${info.unidadePadrao}`,
  };
}

/**
 * Normaliza unidade de medida
 */
export function normalizeUnit(unit: string): string {
  const normalized = unit.toUpperCase().trim();
  return UNIT_SYNONYMS[normalized] || normalized;
}

/**
 * Valida se o NCM está correto para a descrição
 */
export function validateNcm(ncm: string, description: string): {
  valid: boolean;
  confidence: number;
  suggestion?: string;
  reason: string;
} {
  const info = getNcmInfo(ncm);
  if (!info) {
    return {
      valid: false,
      confidence: 0,
      reason: "NCM não encontrado na base de dados",
    };
  }

  const descLower = description.toLowerCase();
  const ncmDescLower = info.descricao.toLowerCase();

  const descWords = descLower.split(/\s+/).filter((w) => w.length > 3);
  const ncmWords = ncmDescLower.split(/\s+/).filter((w) => w.length > 3);

  let matchCount = 0;
  for (const word of descWords) {
    if (ncmWords.some((nw) => nw.includes(word) || word.includes(nw))) {
      matchCount++;
    }
  }

  const similarity = descWords.length > 0 ? matchCount / descWords.length : 0;

  if (similarity >= 0.3) {
    return {
      valid: true,
      confidence: Math.min(0.9, 0.5 + similarity),
      reason: `NCM compatível com a descrição (${(similarity * 100).toFixed(0)}% similaridade)`,
    };
  }

  return {
    valid: false,
    confidence: similarity,
    reason: `NCM pode estar incorreto - baixa similaridade com a descrição`,
  };
}

/**
 * Encontra produtos similares baseado no NCM
 */
export function findSimilarProducts(
  ncm: string,
  products: Array<{ codigo: string; descricao: string; ncm: string }>
): SimilarProduct[] {
  if (!ncm || ncm.length < 4) return [];

  const ncmPrefix = ncm.substring(0, 4);
  const similar: SimilarProduct[] = [];

  for (const product of products) {
    if (product.ncm === ncm) {
      similar.push({
        ...product,
        similarity: 1.0,
      });
    } else if (product.ncm.startsWith(ncmPrefix)) {
      const commonLength = getCommonPrefixLength(ncm, product.ncm);
      const similarity = commonLength / 8;
      similar.push({
        ...product,
        similarity,
      });
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
}

function getCommonPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return i;
}

/**
 * Analisa NCMs de NFes e gera sugestões
 */
export function analyzeNcmPatterns(nfes: NFeParsed[]): {
  ncmDistribution: Record<string, { count: number; categoria: string; descricao: string }>;
  categoryDistribution: Record<string, number>;
  unitSuggestions: Record<string, string>;
  invalidNcms: Array<{ ncm: string; descricao: string; reason: string }>;
  statistics: {
    totalItems: number;
    uniqueNcms: number;
    validNcms: number;
    invalidNcms: number;
  };
} {
  const ncmCounts: Record<string, { count: number; descricao: string }> = {};
  const categoryCounts: Record<string, number> = {};
  const unitSuggestions: Record<string, string> = {};
  const invalidNcms: Array<{ ncm: string; descricao: string; reason: string }> = [];
  let validNcmCount = 0;

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      const ncm = item.ncm;
      if (!ncm) continue;

      if (!ncmCounts[ncm]) {
        ncmCounts[ncm] = { count: 0, descricao: item.descricao };
      }
      ncmCounts[ncm].count++;

      const info = getNcmInfo(ncm);
      if (info) {
        validNcmCount++;
        categoryCounts[info.categoria] = (categoryCounts[info.categoria] || 0) + 1;
        unitSuggestions[ncm] = info.unidadePadrao;
      }

      const validation = validateNcm(ncm, item.descricao);
      if (!validation.valid && !invalidNcms.find((i) => i.ncm === ncm)) {
        invalidNcms.push({
          ncm,
          descricao: item.descricao,
          reason: validation.reason,
        });
      }
    }
  }

  const ncmDistribution: Record<string, { count: number; categoria: string; descricao: string }> = {};
  for (const [ncm, data] of Object.entries(ncmCounts)) {
    const info = getNcmInfo(ncm);
    ncmDistribution[ncm] = {
      count: data.count,
      categoria: info?.categoria || "Outros",
      descricao: info?.descricao || data.descricao,
    };
  }

  return {
    ncmDistribution,
    categoryDistribution: categoryCounts,
    unitSuggestions,
    invalidNcms,
    statistics: {
      totalItems: Object.values(ncmCounts).reduce((a, b) => a + b.count, 0),
      uniqueNcms: Object.keys(ncmCounts).length,
      validNcms: validNcmCount,
      invalidNcms: invalidNcms.length,
    },
  };
}

/**
 * Gera relatório de análise NCM
 */
export function generateNcmReport(analysis: ReturnType<typeof analyzeNcmPatterns>): string {
  const lines: string[] = [
    "=".repeat(60),
    "RELATÓRIO DE ANÁLISE NCM",
    "=".repeat(60),
    "",
    "ESTATÍSTICAS GERAIS",
    "-".repeat(40),
    `Total de itens: ${analysis.statistics.totalItems}`,
    `NCMs únicos: ${analysis.statistics.uniqueNcms}`,
    `NCMs válidos: ${analysis.statistics.validNcms}`,
    `NCMs com problemas: ${analysis.statistics.invalidNcms}`,
    "",
    "DISTRIBUIÇÃO POR CATEGORIA",
    "-".repeat(40),
  ];

  const sortedCategories = Object.entries(analysis.categoryDistribution)
    .sort((a, b) => b[1] - a[1]);

  for (const [category, count] of sortedCategories) {
    lines.push(`${category}: ${count} itens`);
  }

  if (analysis.invalidNcms.length > 0) {
    lines.push("");
    lines.push("NCMs COM PROBLEMAS");
    lines.push("-".repeat(40));
    for (const item of analysis.invalidNcms.slice(0, 10)) {
      lines.push(`NCM ${item.ncm}: ${item.reason}`);
      lines.push(`  Descrição: ${item.descricao.substring(0, 50)}...`);
    }
  }

  lines.push("");
  lines.push("=".repeat(60));

  return lines.join("\n");
}
