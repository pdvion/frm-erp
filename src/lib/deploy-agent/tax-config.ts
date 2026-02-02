/**
 * Tax Auto-Config - Parametrização automática de impostos
 * VIO-877
 *
 * Analisa XMLs de NFe para configurar automaticamente:
 * - Regime tributário (Simples, Lucro Presumido, Lucro Real)
 * - Alíquotas por estado
 * - Substituição tributária
 * - Preparação para IBS/CBS (Reforma Tributária)
 */

import type { NFeParsed } from "@/lib/nfe-parser";

/**
 * Regimes tributários
 */
export type TaxRegime = "simples_nacional" | "lucro_presumido" | "lucro_real" | "mei" | "unknown";

/**
 * Configuração de alíquota por estado
 */
export interface StateAliquota {
  ufOrigem: string;
  ufDestino: string;
  aliquotaInterna: number;
  aliquotaInterestadual: number;
  fcp: number; // Fundo de Combate à Pobreza
  difal: number; // Diferencial de alíquota
  occurrences: number;
}

/**
 * Configuração de Substituição Tributária
 */
export interface STConfig {
  ncm: string;
  ncmDescription?: string;
  mva: number; // Margem de Valor Agregado
  aliquotaST: number;
  ufOrigem: string;
  ufDestino: string;
  occurrences: number;
}

/**
 * Padrão de imposto detectado
 */
export interface TaxPattern {
  cst: string;
  csosn?: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
  aliquotaIpi: number;
  reducaoBaseCalculo: number;
  occurrences: number;
}

/**
 * Resultado da análise de regime tributário
 */
export interface TaxRegimeAnalysis {
  regime: TaxRegime;
  confidence: number;
  indicators: {
    simplesNacional: number;
    regimeNormal: number;
    lucroPresumido: number;
    lucroReal: number;
  };
  cstDistribution: Record<string, number>;
  csosnDistribution: Record<string, number>;
}

/**
 * Configuração de impostos gerada
 */
export interface TaxConfiguration {
  regime: TaxRegimeAnalysis;
  stateAliquotas: StateAliquota[];
  stConfigs: STConfig[];
  taxPatterns: TaxPattern[];
  pisCofinsSummary: {
    regimeCumulativo: boolean;
    aliquotaPisMedia: number;
    aliquotaCofinsMedia: number;
  };
  ipiSummary: {
    hasIpi: boolean;
    aliquotaMedia: number;
    ncmsWithIpi: string[];
  };
  statistics: {
    totalNfes: number;
    totalItems: number;
    uniqueUfs: number;
    uniqueNcms: number;
  };
}

/**
 * Descrições de CST ICMS
 */
const CST_DESCRIPTIONS: Record<string, string> = {
  "00": "Tributada integralmente",
  "10": "Tributada com ST",
  "20": "Com redução de base de cálculo",
  "30": "Isenta ou não tributada com ST",
  "40": "Isenta",
  "41": "Não tributada",
  "50": "Suspensão",
  "51": "Diferimento",
  "60": "ICMS cobrado anteriormente por ST",
  "70": "Com redução de BC e ST",
  "90": "Outras",
};

/**
 * Descrições de CSOSN (Simples Nacional)
 */
const CSOSN_DESCRIPTIONS: Record<string, string> = {
  "101": "Tributada com permissão de crédito",
  "102": "Tributada sem permissão de crédito",
  "103": "Isenção do ICMS para faixa de receita bruta",
  "201": "Tributada com permissão de crédito e ST",
  "202": "Tributada sem permissão de crédito e ST",
  "203": "Isenção do ICMS para faixa de receita bruta e ST",
  "300": "Imune",
  "400": "Não tributada pelo Simples Nacional",
  "500": "ICMS cobrado anteriormente por ST ou antecipação",
  "900": "Outros",
};

/**
 * Alíquotas interestaduais padrão
 */
const ALIQUOTAS_INTERESTADUAIS: Record<string, number> = {
  // Origem Sul/Sudeste (exceto ES) para Norte/Nordeste/Centro-Oeste/ES
  "SP-AC": 7, "SP-AL": 7, "SP-AM": 7, "SP-AP": 7, "SP-BA": 7, "SP-CE": 7,
  "SP-DF": 7, "SP-ES": 7, "SP-GO": 7, "SP-MA": 7, "SP-MT": 7, "SP-MS": 7,
  "SP-PA": 7, "SP-PB": 7, "SP-PE": 7, "SP-PI": 7, "SP-RN": 7, "SP-RO": 7,
  "SP-RR": 7, "SP-SE": 7, "SP-TO": 7,
  // Origem Sul/Sudeste para Sul/Sudeste
  "SP-MG": 12, "SP-PR": 12, "SP-RJ": 12, "SP-RS": 12, "SP-SC": 12,
  // Demais origens
  "DEFAULT-SAME": 0, // Mesma UF
  "DEFAULT-INTER": 12, // Interestadual padrão
};

/**
 * Detecta o regime tributário baseado nos CST/CSOSN
 */
export function detectTaxRegime(nfes: NFeParsed[]): TaxRegimeAnalysis {
  const cstDistribution: Record<string, number> = {};
  const csosnDistribution: Record<string, number> = {};
  let simplesCount = 0;
  let normalCount = 0;
  let totalItems = 0;

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      totalItems++;
      const cst = item.icms?.cst || "";

      // CSOSN indica Simples Nacional (códigos 101-900)
      if (cst.length === 3 && parseInt(cst) >= 100) {
        simplesCount++;
        csosnDistribution[cst] = (csosnDistribution[cst] || 0) + 1;
      } else if (cst.length === 2) {
        // CST normal (00-90)
        normalCount++;
        cstDistribution[cst] = (cstDistribution[cst] || 0) + 1;
      }
    }
  }

  // Calcular indicadores
  const simplesRatio = totalItems > 0 ? simplesCount / totalItems : 0;
  const normalRatio = totalItems > 0 ? normalCount / totalItems : 0;

  // Determinar regime
  let regime: TaxRegime = "unknown";
  let confidence = 0;

  if (simplesRatio > 0.8) {
    regime = "simples_nacional";
    confidence = simplesRatio;
  } else if (normalRatio > 0.8) {
    // Diferenciar Lucro Presumido de Lucro Real
    // Lucro Real geralmente tem mais créditos de PIS/COFINS (alíquotas 1.65% e 7.6%)
    const hasNonCumulativePisCofins = nfes.some((nfe) =>
      nfe.itens.some(
        (item) =>
          (item.pis?.aliquota === 1.65 || item.pis?.aliquota === 1.6500) &&
          (item.cofins?.aliquota === 7.6 || item.cofins?.aliquota === 7.6000)
      )
    );

    if (hasNonCumulativePisCofins) {
      regime = "lucro_real";
      confidence = normalRatio * 0.9;
    } else {
      regime = "lucro_presumido";
      confidence = normalRatio * 0.85;
    }
  } else if (simplesRatio > 0.5) {
    regime = "simples_nacional";
    confidence = simplesRatio;
  } else if (normalRatio > 0.5) {
    regime = "lucro_presumido";
    confidence = normalRatio * 0.7;
  }

  return {
    regime,
    confidence,
    indicators: {
      simplesNacional: simplesRatio,
      regimeNormal: normalRatio,
      lucroPresumido: regime === "lucro_presumido" ? confidence : 0,
      lucroReal: regime === "lucro_real" ? confidence : 0,
    },
    cstDistribution,
    csosnDistribution,
  };
}

/**
 * Extrai alíquotas por estado
 */
export function extractStateAliquotas(nfes: NFeParsed[]): StateAliquota[] {
  const aliquotaMap = new Map<string, StateAliquota>();

  for (const nfe of nfes) {
    const ufOrigem = nfe.emitente?.endereco?.uf || "";
    const ufDestino = nfe.destinatario?.endereco?.uf || "";

    if (!ufOrigem || !ufDestino) continue;

    for (const item of nfe.itens) {
      const key = `${ufOrigem}-${ufDestino}`;
      const aliquota = item.icms?.aliquota || 0;
      const fcp = 0; // FCP geralmente vem separado no XML

      const existing = aliquotaMap.get(key);
      if (existing) {
        // Média ponderada
        const total = existing.occurrences + 1;
        existing.aliquotaInterna =
          ufOrigem === ufDestino
            ? (existing.aliquotaInterna * existing.occurrences + aliquota) / total
            : existing.aliquotaInterna;
        existing.aliquotaInterestadual =
          ufOrigem !== ufDestino
            ? (existing.aliquotaInterestadual * existing.occurrences + aliquota) / total
            : existing.aliquotaInterestadual;
        existing.occurrences = total;
      } else {
        aliquotaMap.set(key, {
          ufOrigem,
          ufDestino,
          aliquotaInterna: ufOrigem === ufDestino ? aliquota : 0,
          aliquotaInterestadual: ufOrigem !== ufDestino ? aliquota : 0,
          fcp,
          difal: 0,
          occurrences: 1,
        });
      }
    }
  }

  return Array.from(aliquotaMap.values()).sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Detecta configurações de Substituição Tributária
 */
export function detectSTConfigs(nfes: NFeParsed[]): STConfig[] {
  const stMap = new Map<string, STConfig>();

  for (const nfe of nfes) {
    const ufOrigem = nfe.emitente?.endereco?.uf || "";
    const ufDestino = nfe.destinatario?.endereco?.uf || "";

    for (const item of nfe.itens) {
      const cst = item.icms?.cst || "";
      // CST 10, 30, 60, 70 indicam ST
      const hasST = ["10", "30", "60", "70", "201", "202", "203", "500"].includes(cst);

      if (!hasST) continue;

      const ncm = item.ncm || "";
      const key = `${ncm}-${ufOrigem}-${ufDestino}`;

      // Calcular MVA aproximado se houver base de cálculo ST
      let mva = 0;
      const baseCalculo = item.icms?.baseCalculo || 0;
      const baseCalculoST = 0; // Precisaria vir do XML completo

      if (baseCalculo > 0 && baseCalculoST > 0) {
        mva = ((baseCalculoST - baseCalculo) / baseCalculo) * 100;
      }

      const existing = stMap.get(key);
      if (existing) {
        existing.occurrences++;
        if (mva > 0) {
          existing.mva = (existing.mva * (existing.occurrences - 1) + mva) / existing.occurrences;
        }
      } else {
        stMap.set(key, {
          ncm,
          mva,
          aliquotaST: item.icms?.aliquota || 0,
          ufOrigem,
          ufDestino,
          occurrences: 1,
        });
      }
    }
  }

  return Array.from(stMap.values())
    .filter((st) => st.occurrences >= 2) // Mínimo 2 ocorrências
    .sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Extrai padrões de impostos
 */
export function extractTaxPatterns(nfes: NFeParsed[]): TaxPattern[] {
  const patternMap = new Map<string, TaxPattern>();

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      const cst = item.icms?.cst || "00";
      const aliquotaIcms = item.icms?.aliquota || 0;
      const aliquotaPis = item.pis?.aliquota || 0;
      const aliquotaCofins = item.cofins?.aliquota || 0;
      const aliquotaIpi = item.ipi?.aliquota || 0;

      // Criar chave única para o padrão
      const key = `${cst}-${aliquotaIcms}-${aliquotaPis}-${aliquotaCofins}-${aliquotaIpi}`;

      const existing = patternMap.get(key);
      if (existing) {
        existing.occurrences++;
      } else {
        patternMap.set(key, {
          cst,
          csosn: cst.length === 3 ? cst : undefined,
          aliquotaIcms,
          aliquotaPis,
          aliquotaCofins,
          aliquotaIpi,
          reducaoBaseCalculo: 0,
          occurrences: 1,
        });
      }
    }
  }

  return Array.from(patternMap.values()).sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Analisa PIS/COFINS
 */
export function analyzePisCofins(nfes: NFeParsed[]): {
  regimeCumulativo: boolean;
  aliquotaPisMedia: number;
  aliquotaCofinsMedia: number;
} {
  let totalPis = 0;
  let totalCofins = 0;
  let count = 0;

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      if (item.pis?.aliquota) {
        totalPis += item.pis.aliquota;
        count++;
      }
      if (item.cofins?.aliquota) {
        totalCofins += item.cofins.aliquota;
      }
    }
  }

  const aliquotaPisMedia = count > 0 ? totalPis / count : 0;
  const aliquotaCofinsMedia = count > 0 ? totalCofins / count : 0;

  // Regime não-cumulativo: PIS 1.65%, COFINS 7.6%
  // Regime cumulativo: PIS 0.65%, COFINS 3%
  const regimeCumulativo = aliquotaPisMedia < 1.0;

  return {
    regimeCumulativo,
    aliquotaPisMedia: Math.round(aliquotaPisMedia * 100) / 100,
    aliquotaCofinsMedia: Math.round(aliquotaCofinsMedia * 100) / 100,
  };
}

/**
 * Analisa IPI
 */
export function analyzeIpi(nfes: NFeParsed[]): {
  hasIpi: boolean;
  aliquotaMedia: number;
  ncmsWithIpi: string[];
} {
  const ncmsWithIpi = new Set<string>();
  let totalIpi = 0;
  let countIpi = 0;

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      if (item.ipi?.aliquota && item.ipi.aliquota > 0) {
        totalIpi += item.ipi.aliquota;
        countIpi++;
        if (item.ncm) {
          ncmsWithIpi.add(item.ncm);
        }
      }
    }
  }

  return {
    hasIpi: countIpi > 0,
    aliquotaMedia: countIpi > 0 ? Math.round((totalIpi / countIpi) * 100) / 100 : 0,
    ncmsWithIpi: Array.from(ncmsWithIpi),
  };
}

/**
 * Gera configuração completa de impostos
 */
export function generateTaxConfiguration(nfes: NFeParsed[]): TaxConfiguration {
  const ufs = new Set<string>();
  const ncms = new Set<string>();
  let totalItems = 0;

  for (const nfe of nfes) {
    if (nfe.emitente?.endereco?.uf) ufs.add(nfe.emitente.endereco.uf);
    if (nfe.destinatario?.endereco?.uf) ufs.add(nfe.destinatario.endereco.uf);
    for (const item of nfe.itens) {
      totalItems++;
      if (item.ncm) ncms.add(item.ncm);
    }
  }

  return {
    regime: detectTaxRegime(nfes),
    stateAliquotas: extractStateAliquotas(nfes),
    stConfigs: detectSTConfigs(nfes),
    taxPatterns: extractTaxPatterns(nfes),
    pisCofinsSummary: analyzePisCofins(nfes),
    ipiSummary: analyzeIpi(nfes),
    statistics: {
      totalNfes: nfes.length,
      totalItems,
      uniqueUfs: ufs.size,
      uniqueNcms: ncms.size,
    },
  };
}

/**
 * Obtém descrição do CST
 */
export function getCstDescription(cst: string): string {
  if (cst.length === 3) {
    return CSOSN_DESCRIPTIONS[cst] || "CSOSN não especificado";
  }
  return CST_DESCRIPTIONS[cst] || "CST não especificado";
}

/**
 * Obtém alíquota interestadual padrão
 */
export function getDefaultInterstateAliquota(ufOrigem: string, ufDestino: string): number {
  if (ufOrigem === ufDestino) return 0;

  const key = `${ufOrigem}-${ufDestino}`;
  if (ALIQUOTAS_INTERESTADUAIS[key]) {
    return ALIQUOTAS_INTERESTADUAIS[key];
  }

  // Verificar se origem é Sul/Sudeste (exceto ES)
  const sulSudeste = ["SP", "RJ", "MG", "PR", "SC", "RS"];
  const norteNordesteCO = [
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "PA", "PB", "PE", "PI", "RN", "RO", "RR", "SE", "TO",
  ];

  if (sulSudeste.includes(ufOrigem) && norteNordesteCO.includes(ufDestino)) {
    return 7;
  }

  return 12; // Padrão interestadual
}

/**
 * Gera relatório de configuração em texto
 */
export function generateTaxConfigReport(config: TaxConfiguration): string {
  const lines: string[] = [];

  lines.push("=== RELATÓRIO DE CONFIGURAÇÃO TRIBUTÁRIA ===");
  lines.push("");

  // Estatísticas
  lines.push("--- Estatísticas ---");
  lines.push(`NFes analisadas: ${config.statistics.totalNfes}`);
  lines.push(`Itens analisados: ${config.statistics.totalItems}`);
  lines.push(`UFs únicas: ${config.statistics.uniqueUfs}`);
  lines.push(`NCMs únicos: ${config.statistics.uniqueNcms}`);
  lines.push("");

  // Regime Tributário
  lines.push("--- Regime Tributário ---");
  lines.push(`Regime detectado: ${config.regime.regime.toUpperCase()}`);
  lines.push(`Confiança: ${(config.regime.confidence * 100).toFixed(1)}%`);
  lines.push("");

  // PIS/COFINS
  lines.push("--- PIS/COFINS ---");
  lines.push(`Regime: ${config.pisCofinsSummary.regimeCumulativo ? "Cumulativo" : "Não-Cumulativo"}`);
  lines.push(`Alíquota PIS média: ${config.pisCofinsSummary.aliquotaPisMedia}%`);
  lines.push(`Alíquota COFINS média: ${config.pisCofinsSummary.aliquotaCofinsMedia}%`);
  lines.push("");

  // IPI
  if (config.ipiSummary.hasIpi) {
    lines.push("--- IPI ---");
    lines.push(`Alíquota média: ${config.ipiSummary.aliquotaMedia}%`);
    lines.push(`NCMs com IPI: ${config.ipiSummary.ncmsWithIpi.length}`);
    lines.push("");
  }

  // Alíquotas por Estado
  if (config.stateAliquotas.length > 0) {
    lines.push("--- Alíquotas por Estado (Top 10) ---");
    for (const aliq of config.stateAliquotas.slice(0, 10)) {
      const tipo = aliq.ufOrigem === aliq.ufDestino ? "Interna" : "Interestadual";
      const valor = aliq.ufOrigem === aliq.ufDestino ? aliq.aliquotaInterna : aliq.aliquotaInterestadual;
      lines.push(`  ${aliq.ufOrigem} → ${aliq.ufDestino}: ${valor.toFixed(2)}% (${tipo}, ${aliq.occurrences} ocorrências)`);
    }
    lines.push("");
  }

  // Substituição Tributária
  if (config.stConfigs.length > 0) {
    lines.push("--- Substituição Tributária (Top 10) ---");
    for (const st of config.stConfigs.slice(0, 10)) {
      lines.push(`  NCM ${st.ncm}: ${st.ufOrigem} → ${st.ufDestino} (${st.occurrences} ocorrências)`);
    }
    lines.push("");
  }

  // Padrões de Impostos
  if (config.taxPatterns.length > 0) {
    lines.push("--- Padrões de Impostos (Top 5) ---");
    for (const pattern of config.taxPatterns.slice(0, 5)) {
      const cstDesc = getCstDescription(pattern.cst);
      lines.push(`  CST ${pattern.cst} (${cstDesc})`);
      lines.push(`    ICMS: ${pattern.aliquotaIcms}%, PIS: ${pattern.aliquotaPis}%, COFINS: ${pattern.aliquotaCofins}%`);
      lines.push(`    Ocorrências: ${pattern.occurrences}`);
    }
  }

  return lines.join("\n");
}
