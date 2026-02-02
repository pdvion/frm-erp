/**
 * Deploy Agent - Product Catalog Sync
 * Sincronização automática entre Materiais (Compras) e Produtos (Vendas)
 * VIO-879
 */

import type { NFeParsed } from "@/lib/nfe-parser";

export interface ResaleCandidate {
  materialCode: string;
  materialDescription: string;
  ncm: string;
  unit: string;
  purchaseCount: number;
  saleCount: number;
  lastPurchasePrice: number;
  lastSalePrice: number;
  averagePurchasePrice: number;
  suggestedMarkup: number;
  confidence: number;
}

export interface ProductSyncConfig {
  defaultMarkup: number;
  priceSource: "lastPurchase" | "averagePurchase" | "manual";
  autoSync: boolean;
  syncCategories: boolean;
  syncImages: boolean;
  minPurchaseCount: number;
}

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ code: string; error: string }>;
}

export interface ProductFromMaterial {
  name: string;
  code: string;
  shortDescription: string;
  ncm: string;
  unit: string;
  listPrice: number;
  costPrice: number;
  suggestedCategory: string;
  materialId: string;
  markup: number;
}

const CFOP_ENTRADA = [1101, 1102, 1111, 1113, 1116, 1117, 1118, 1120, 1121, 1122, 1124, 1125, 1126, 1128, 1401, 1403, 1501, 1503, 1551, 1552, 1553, 1556, 1557, 2101, 2102, 2111, 2113, 2116, 2117, 2118, 2120, 2121, 2122, 2124, 2125, 2126, 2128, 2401, 2403, 2501, 2503, 2551, 2552, 2553, 2556, 2557];
const CFOP_SAIDA = [5101, 5102, 5103, 5104, 5105, 5106, 5109, 5110, 5111, 5112, 5113, 5114, 5115, 5116, 5117, 5118, 5119, 5120, 5122, 5123, 5124, 5125, 5401, 5402, 5403, 5405, 5501, 5502, 5503, 5551, 5552, 5553, 5554, 5555, 5556, 5557, 6101, 6102, 6103, 6104, 6105, 6106, 6109, 6110, 6111, 6112, 6113, 6114, 6115, 6116, 6117, 6118, 6119, 6120, 6122, 6123, 6124, 6125, 6401, 6402, 6403, 6404, 6501, 6502, 6503, 6551, 6552, 6553, 6554, 6555, 6556, 6557];

/**
 * Detecta itens de revenda comparando entradas e saídas
 */
export function detectResaleItems(nfes: NFeParsed[]): ResaleCandidate[] {
  const itemStats: Record<string, {
    code: string;
    description: string;
    ncm: string;
    unit: string;
    purchases: Array<{ price: number; quantity: number; date: Date }>;
    sales: Array<{ price: number; quantity: number; date: Date }>;
  }> = {};

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      const key = item.ncm || item.codigo;
      
      if (!itemStats[key]) {
        itemStats[key] = {
          code: item.codigo,
          description: item.descricao,
          ncm: item.ncm || "",
          unit: item.unidade,
          purchases: [],
          sales: [],
        };
      }

      const pricePerUnit = item.valorTotal / item.quantidade;

      if (CFOP_ENTRADA.includes(item.cfop)) {
        itemStats[key].purchases.push({
          price: pricePerUnit,
          quantity: item.quantidade,
          date: nfe.dataEmissao,
        });
      } else if (CFOP_SAIDA.includes(item.cfop)) {
        itemStats[key].sales.push({
          price: pricePerUnit,
          quantity: item.quantidade,
          date: nfe.dataEmissao,
        });
      }
    }
  }

  const candidates: ResaleCandidate[] = [];

  for (const [, stats] of Object.entries(itemStats)) {
    if (stats.purchases.length > 0 && stats.sales.length > 0) {
      const lastPurchase = stats.purchases.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const lastSale = stats.sales.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      const totalPurchaseValue = stats.purchases.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const totalPurchaseQty = stats.purchases.reduce((sum, p) => sum + p.quantity, 0);
      const averagePurchasePrice = totalPurchaseValue / totalPurchaseQty;

      const suggestedMarkup = lastSale.price > 0 && lastPurchase.price > 0
        ? ((lastSale.price - lastPurchase.price) / lastPurchase.price) * 100
        : 30;

      const confidence = Math.min(
        0.5 + (stats.purchases.length * 0.1) + (stats.sales.length * 0.1),
        1.0
      );

      candidates.push({
        materialCode: stats.code,
        materialDescription: stats.description,
        ncm: stats.ncm,
        unit: stats.unit,
        purchaseCount: stats.purchases.length,
        saleCount: stats.sales.length,
        lastPurchasePrice: lastPurchase.price,
        lastSalePrice: lastSale.price,
        averagePurchasePrice,
        suggestedMarkup: Math.round(suggestedMarkup * 100) / 100,
        confidence,
      });
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calcula preço de venda baseado no custo e margem
 */
export function calculateSalePrice(
  costPrice: number,
  markup: number
): number {
  return costPrice * (1 + markup / 100);
}

/**
 * Sugere categoria baseada no NCM
 */
export function suggestCategoryFromNcm(ncm: string): string {
  if (!ncm || ncm.length < 2) return "Geral";

  const chapter = ncm.substring(0, 2);

  const categoryMap: Record<string, string> = {
    "01": "Animais Vivos",
    "02": "Carnes",
    "03": "Peixes",
    "04": "Laticínios",
    "05": "Produtos de Origem Animal",
    "06": "Plantas Vivas",
    "07": "Hortaliças",
    "08": "Frutas",
    "09": "Café e Especiarias",
    "10": "Cereais",
    "11": "Farinhas",
    "12": "Sementes",
    "15": "Óleos e Gorduras",
    "16": "Preparações de Carnes",
    "17": "Açúcares",
    "18": "Cacau",
    "19": "Preparações de Cereais",
    "20": "Preparações de Vegetais",
    "21": "Preparações Alimentícias",
    "22": "Bebidas",
    "23": "Resíduos Alimentares",
    "24": "Tabaco",
    "25": "Sal e Minerais",
    "27": "Combustíveis",
    "28": "Produtos Químicos Inorgânicos",
    "29": "Produtos Químicos Orgânicos",
    "30": "Produtos Farmacêuticos",
    "31": "Adubos",
    "32": "Tintas e Vernizes",
    "33": "Cosméticos",
    "34": "Sabões e Detergentes",
    "35": "Colas e Enzimas",
    "38": "Produtos Químicos Diversos",
    "39": "Plásticos",
    "40": "Borracha",
    "41": "Couros",
    "42": "Artigos de Couro",
    "44": "Madeira",
    "48": "Papel e Cartão",
    "49": "Livros e Impressos",
    "61": "Vestuário de Malha",
    "62": "Vestuário",
    "63": "Têxteis Confeccionados",
    "64": "Calçados",
    "68": "Pedras e Cerâmica",
    "69": "Produtos Cerâmicos",
    "70": "Vidro",
    "71": "Joias",
    "72": "Ferro e Aço",
    "73": "Obras de Ferro",
    "74": "Cobre",
    "75": "Níquel",
    "76": "Alumínio",
    "82": "Ferramentas",
    "83": "Obras de Metais",
    "84": "Máquinas e Equipamentos",
    "85": "Equipamentos Elétricos",
    "87": "Veículos",
    "90": "Instrumentos de Precisão",
    "94": "Móveis",
    "95": "Brinquedos",
    "96": "Obras Diversas",
  };

  return categoryMap[chapter] || "Outros";
}

/**
 * Cria dados de produto a partir de material
 */
export function createProductFromMaterial(
  material: {
    id: string;
    code: number;
    description: string;
    ncm?: string | null;
    unit: string;
  },
  purchasePrice: number,
  config: ProductSyncConfig
): ProductFromMaterial {
  const costPrice = purchasePrice;
  const listPrice = calculateSalePrice(costPrice, config.defaultMarkup);

  return {
    name: material.description,
    code: `P${material.code}`,
    shortDescription: material.description.substring(0, 255),
    ncm: material.ncm || "",
    unit: material.unit,
    listPrice: Math.round(listPrice * 100) / 100,
    costPrice: Math.round(costPrice * 100) / 100,
    suggestedCategory: suggestCategoryFromNcm(material.ncm || ""),
    materialId: material.id,
    markup: config.defaultMarkup,
  };
}

/**
 * Analisa materiais para sincronização
 */
export function analyzeMaterialsForSync(
  materials: Array<{
    id: string;
    code: number;
    description: string;
    ncm?: string | null;
    unit: string;
    lastPurchasePrice?: number;
    averagePurchasePrice?: number;
  }>,
  existingProducts: Array<{ materialId?: string | null }>,
  config: ProductSyncConfig
): {
  toCreate: ProductFromMaterial[];
  toUpdate: ProductFromMaterial[];
  alreadySynced: number;
  statistics: {
    totalMaterials: number;
    eligibleForSync: number;
    alreadySynced: number;
    toCreate: number;
    toUpdate: number;
  };
} {
  const syncedMaterialIds = new Set(
    existingProducts
      .filter((p) => p.materialId)
      .map((p) => p.materialId)
  );

  const toCreate: ProductFromMaterial[] = [];
  const toUpdate: ProductFromMaterial[] = [];

  for (const material of materials) {
    const purchasePrice = material.lastPurchasePrice || material.averagePurchasePrice || 0;
    
    if (purchasePrice <= 0) continue;

    const productData = createProductFromMaterial(material, purchasePrice, config);

    if (syncedMaterialIds.has(material.id)) {
      toUpdate.push(productData);
    } else {
      toCreate.push(productData);
    }
  }

  return {
    toCreate,
    toUpdate,
    alreadySynced: syncedMaterialIds.size,
    statistics: {
      totalMaterials: materials.length,
      eligibleForSync: toCreate.length + toUpdate.length,
      alreadySynced: syncedMaterialIds.size,
      toCreate: toCreate.length,
      toUpdate: toUpdate.length,
    },
  };
}

/**
 * Gera relatório de sincronização
 */
export function generateSyncReport(
  candidates: ResaleCandidate[],
  config: ProductSyncConfig
): string {
  const lines: string[] = [
    "=".repeat(60),
    "RELATÓRIO DE SINCRONIZAÇÃO MATERIAL → PRODUTO",
    "=".repeat(60),
    "",
    "CONFIGURAÇÃO",
    "-".repeat(40),
    `Margem padrão: ${config.defaultMarkup}%`,
    `Fonte de preço: ${config.priceSource}`,
    `Sincronização automática: ${config.autoSync ? "Sim" : "Não"}`,
    "",
    "CANDIDATOS À REVENDA",
    "-".repeat(40),
    `Total identificados: ${candidates.length}`,
    "",
  ];

  if (candidates.length > 0) {
    lines.push("TOP 10 CANDIDATOS:");
    for (const candidate of candidates.slice(0, 10)) {
      lines.push(`  ${candidate.materialCode} - ${candidate.materialDescription.substring(0, 40)}`);
      lines.push(`    NCM: ${candidate.ncm} | Compras: ${candidate.purchaseCount} | Vendas: ${candidate.saleCount}`);
      lines.push(`    Preço Compra: R$ ${candidate.lastPurchasePrice.toFixed(2)} | Venda: R$ ${candidate.lastSalePrice.toFixed(2)}`);
      lines.push(`    Margem Sugerida: ${candidate.suggestedMarkup.toFixed(1)}% | Confiança: ${(candidate.confidence * 100).toFixed(0)}%`);
      lines.push("");
    }
  }

  lines.push("=".repeat(60));

  return lines.join("\n");
}
