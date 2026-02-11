/**
 * TaxCalculationService
 * Centraliza lógica de cálculo tributário e análise fiscal.
 *
 * Consolida:
 * - Análise de regime tributário (Simples, Lucro Presumido, Lucro Real)
 * - Alíquotas por estado e substituição tributária
 * - Padrões fiscais (CFOP, CST, NCM)
 * - PIS/COFINS e IPI
 * - Busca e parsing de NFes para análise em lote
 */

import type { PrismaClient } from "@prisma/client";
import { parseNFeXml, type NFeParsed } from "@/lib/nfe-parser";
import {
  detectTaxRegime,
  extractStateAliquotas,
  detectSTConfigs,
  extractTaxPatterns,
  analyzePisCofins,
  analyzeIpi,
  generateTaxConfiguration,
  getCstDescription,
  getDefaultInterstateAliquota,
  generateTaxConfigReport,
  type TaxConfiguration,
  type TaxRegimeAnalysis,
  type StateAliquota,
  type STConfig,
  type TaxPattern,
} from "@/lib/deploy-agent/tax-config";
import {
  analyzeFiscalPatterns,
  getCfopDescription,
  getCstIcmsDescription,
  suggestCfopForOperation,
  type FiscalAnalysisResult,
} from "@/lib/deploy-agent/fiscal-rules-engine";

// ==========================================================================
// RE-EXPORTS (para que os routers importem tudo de um lugar)
// ==========================================================================

export {
  detectTaxRegime,
  extractStateAliquotas,
  detectSTConfigs,
  extractTaxPatterns,
  analyzePisCofins,
  analyzeIpi,
  generateTaxConfiguration,
  getCstDescription,
  getDefaultInterstateAliquota,
  generateTaxConfigReport,
  analyzeFiscalPatterns,
  getCfopDescription,
  getCstIcmsDescription,
  suggestCfopForOperation,
};

export type {
  TaxConfiguration,
  TaxRegimeAnalysis,
  StateAliquota,
  STConfig,
  TaxPattern,
  FiscalAnalysisResult,
};

// ==========================================================================
// TYPES
// ==========================================================================

export interface FetchAndParseOptions {
  companyId: string;
  invoiceIds?: string[];
  limit?: number;
}

export interface InvoiceTaxTotals {
  icmsBase: number;
  icmsValue: number;
  icmsStBase: number;
  icmsStValue: number;
  ipiValue: number;
  pisValue: number;
  cofinsValue: number;
  totalProducts: number;
  totalInvoice: number;
}

export interface ItemTaxBreakdown {
  icmsRate: number;
  icmsValue: number;
  ipiRate: number;
  ipiValue: number;
  pisRate: number;
  pisValue: number;
  cofinsRate: number;
  cofinsValue: number;
  totalTax: number;
  effectiveTaxRate: number;
}

// ==========================================================================
// PURE CALCULATION FUNCTIONS
// ==========================================================================

/**
 * Calcula breakdown de impostos de um item de nota fiscal
 */
export function calculateItemTaxBreakdown(
  totalPrice: number,
  icmsRate: number,
  ipiRate: number,
  pisRate: number,
  cofinsRate: number,
): ItemTaxBreakdown {
  const icmsValue = totalPrice * (icmsRate / 100);
  const ipiValue = totalPrice * (ipiRate / 100);
  const pisValue = totalPrice * (pisRate / 100);
  const cofinsValue = totalPrice * (cofinsRate / 100);
  const totalTax = icmsValue + ipiValue + pisValue + cofinsValue;
  const effectiveTaxRate = totalPrice > 0 ? (totalTax / totalPrice) * 100 : 0;

  return {
    icmsRate,
    icmsValue: Math.round(icmsValue * 100) / 100,
    ipiRate,
    ipiValue: Math.round(ipiValue * 100) / 100,
    pisRate,
    pisValue: Math.round(pisValue * 100) / 100,
    cofinsRate,
    cofinsValue: Math.round(cofinsValue * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
  };
}

/**
 * Calcula totais de impostos de uma lista de itens
 */
export function calculateInvoiceTaxTotals(
  items: Array<{
    totalPrice: number;
    icmsRate?: number;
    icmsValue?: number;
    ipiRate?: number;
    ipiValue?: number;
    pisValue?: number;
    cofinsValue?: number;
  }>,
): InvoiceTaxTotals {
  let icmsBase = 0;
  let icmsValue = 0;
  let ipiValue = 0;
  let pisValue = 0;
  let cofinsValue = 0;
  let totalProducts = 0;

  for (const item of items) {
    totalProducts += item.totalPrice;
    if (item.icmsRate && item.icmsRate > 0) {
      icmsBase += item.totalPrice;
    }
    icmsValue += item.icmsValue || 0;
    ipiValue += item.ipiValue || 0;
    pisValue += item.pisValue || 0;
    cofinsValue += item.cofinsValue || 0;
  }

  const totalInvoice = totalProducts + ipiValue;

  return {
    icmsBase: Math.round(icmsBase * 100) / 100,
    icmsValue: Math.round(icmsValue * 100) / 100,
    icmsStBase: 0,
    icmsStValue: 0,
    ipiValue: Math.round(ipiValue * 100) / 100,
    pisValue: Math.round(pisValue * 100) / 100,
    cofinsValue: Math.round(cofinsValue * 100) / 100,
    totalProducts: Math.round(totalProducts * 100) / 100,
    totalInvoice: Math.round(totalInvoice * 100) / 100,
  };
}

/**
 * Parseia XMLs de NFe de forma segura, filtrando os que falharem
 */
export function safeParseNFeXmls(xmlContents: string[]): NFeParsed[] {
  return xmlContents
    .map((xml) => {
      try {
        return parseNFeXml(xml);
      } catch {
        return null;
      }
    })
    .filter((nfe): nfe is NFeParsed => nfe !== null);
}

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

export class TaxCalculationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca NFes com XML e retorna parsed.
   * Elimina o padrão duplicado "fetch invoices → parse XMLs" dos routers.
   */
  async fetchAndParseNFes(options: FetchAndParseOptions): Promise<NFeParsed[]> {
    const invoices = await this.prisma.receivedInvoice.findMany({
      where: {
        companyId: options.companyId,
        ...(options.invoiceIds ? { id: { in: options.invoiceIds } } : {}),
        xmlContent: { not: null },
      },
      take: options.limit ?? 100,
      select: { xmlContent: true },
    });

    const xmlContents = invoices
      .filter((inv) => inv.xmlContent)
      .map((inv) => inv.xmlContent!);

    return safeParseNFeXmls(xmlContents);
  }

  /**
   * Gera configuração completa de impostos a partir de NFes do banco
   */
  async generateTaxConfig(options: FetchAndParseOptions): Promise<TaxConfiguration> {
    const nfes = await this.fetchAndParseNFes(options);
    return generateTaxConfiguration(nfes);
  }

  /**
   * Detecta regime tributário a partir de NFes do banco
   */
  async detectRegime(options: FetchAndParseOptions): Promise<TaxRegimeAnalysis> {
    const nfes = await this.fetchAndParseNFes(options);
    return detectTaxRegime(nfes);
  }

  /**
   * Analisa padrões fiscais a partir de NFes do banco
   */
  async analyzeFiscal(options: FetchAndParseOptions): Promise<FiscalAnalysisResult> {
    const nfes = await this.fetchAndParseNFes(options);
    return analyzeFiscalPatterns(nfes);
  }

  /**
   * Gera relatório de configuração tributária
   */
  async generateReport(options: FetchAndParseOptions): Promise<{ report: string; config: TaxConfiguration }> {
    const config = await this.generateTaxConfig(options);
    return {
      report: generateTaxConfigReport(config),
      config,
    };
  }

  /**
   * Analisa lote de XMLs diretamente (sem buscar do banco)
   */
  analyzeXmlBatch(xmlContents: string[]): {
    success: boolean;
    error?: string;
    taxConfig: TaxConfiguration | null;
    fiscalPatterns: FiscalAnalysisResult | null;
    entities: { suppliers: number; materials: number } | null;
  } {
    const parsedNfes = safeParseNFeXmls(xmlContents);

    if (parsedNfes.length === 0) {
      return {
        success: false,
        error: "Nenhum XML válido encontrado",
        taxConfig: null,
        fiscalPatterns: null,
        entities: null,
      };
    }

    const taxConfig = generateTaxConfiguration(parsedNfes);
    const fiscalPatterns = analyzeFiscalPatterns(parsedNfes);

    const suppliers = new Set<string>();
    const materials = new Set<string>();

    for (const nfe of parsedNfes) {
      if (nfe.emitente?.cnpj) {
        suppliers.add(nfe.emitente.cnpj);
      }
      for (const item of nfe.itens) {
        if (item.codigo) {
          materials.add(item.codigo);
        }
      }
    }

    return {
      success: true,
      taxConfig,
      fiscalPatterns,
      entities: {
        suppliers: suppliers.size,
        materials: materials.size,
      },
    };
  }
}
