/**
 * Financial Flow Mapping - Mapeamento de naturezas financeiras
 * VIO-880
 *
 * Analisa XMLs de NFe para configurar automaticamente:
 * - Naturezas de despesa (compras)
 * - Naturezas de receita (vendas)
 * - Formas de pagamento
 * - Condições de pagamento
 */

import type { NFeParsed } from "@/lib/nfe-parser";

/**
 * Padrão de pagamento detectado
 */
export interface PaymentPattern {
  formaPagamento: string;
  formaPagamentoDescricao: string;
  prazoMedio: number;
  parcelamento: number;
  fornecedorCnpj?: string;
  fornecedorNome?: string;
  clienteCnpj?: string;
  clienteNome?: string;
  frequency: number;
  valorMedio: number;
}

/**
 * Mapeamento CFOP → Natureza
 */
export interface NatureMapping {
  cfop: number;
  cfopDescricao: string;
  naturezaId?: string;
  naturezaSugerida: string;
  tipo: "receita" | "despesa";
  categoria: string;
  occurrences: number;
}

/**
 * Condição de pagamento detectada
 */
export interface PaymentCondition {
  descricao: string;
  diasPrimeiraParcela: number;
  intervaloParcelas: number;
  numeroParcelas: number;
  frequency: number;
}

/**
 * Configuração financeira gerada
 */
export interface FinancialConfiguration {
  paymentPatterns: PaymentPattern[];
  natureMappings: NatureMapping[];
  paymentConditions: PaymentCondition[];
  paymentMethodDistribution: Record<string, { count: number; percentage: number }>;
  statistics: {
    totalNfes: number;
    totalDuplicatas: number;
    totalPagamentos: number;
    valorTotalCompras: number;
    valorTotalVendas: number;
  };
}

/**
 * Descrições de formas de pagamento (NFe)
 */
const FORMA_PAGAMENTO_DESCRICAO: Record<string, string> = {
  "01": "Dinheiro",
  "02": "Cheque",
  "03": "Cartão de Crédito",
  "04": "Cartão de Débito",
  "05": "Crédito Loja",
  "10": "Vale Alimentação",
  "11": "Vale Refeição",
  "12": "Vale Presente",
  "13": "Vale Combustível",
  "14": "Duplicata Mercantil",
  "15": "Boleto Bancário",
  "16": "Depósito Bancário",
  "17": "PIX",
  "18": "Transferência Bancária",
  "19": "Programa de Fidelidade",
  "90": "Sem Pagamento",
  "99": "Outros",
};

/**
 * Mapeamento CFOP → Categoria/Natureza sugerida
 */
const CFOP_NATUREZA_MAP: Record<number, { natureza: string; categoria: string; tipo: "receita" | "despesa" }> = {
  // Entradas - Compras
  1101: { natureza: "Compra para Industrialização", categoria: "Matéria-Prima", tipo: "despesa" },
  1102: { natureza: "Compra para Comercialização", categoria: "Mercadorias", tipo: "despesa" },
  1111: { natureza: "Compra para Industrialização - Triangular", categoria: "Matéria-Prima", tipo: "despesa" },
  1113: { natureza: "Compra para Comercialização - Triangular", categoria: "Mercadorias", tipo: "despesa" },
  1116: { natureza: "Compra para Industrialização - Entrega Futura", categoria: "Matéria-Prima", tipo: "despesa" },
  1117: { natureza: "Compra para Comercialização - Entrega Futura", categoria: "Mercadorias", tipo: "despesa" },
  1120: { natureza: "Compra para Industrialização - Zona Franca", categoria: "Matéria-Prima", tipo: "despesa" },
  1121: { natureza: "Compra para Comercialização - Zona Franca", categoria: "Mercadorias", tipo: "despesa" },
  1122: { natureza: "Compra para Industrialização - Suframa", categoria: "Matéria-Prima", tipo: "despesa" },
  1124: { natureza: "Compra para Industrialização - Suframa", categoria: "Matéria-Prima", tipo: "despesa" },
  1125: { natureza: "Compra para Comercialização - Suframa", categoria: "Mercadorias", tipo: "despesa" },
  1126: { natureza: "Compra para Industrialização - Mercadoria ST", categoria: "Matéria-Prima", tipo: "despesa" },
  1128: { natureza: "Compra para Industrialização - Mercadoria ST", categoria: "Matéria-Prima", tipo: "despesa" },
  1401: { natureza: "Compra para Industrialização - ST", categoria: "Matéria-Prima", tipo: "despesa" },
  1403: { natureza: "Compra para Comercialização - ST", categoria: "Mercadorias", tipo: "despesa" },
  1551: { natureza: "Compra de Ativo Imobilizado", categoria: "Ativo Imobilizado", tipo: "despesa" },
  1556: { natureza: "Compra de Material de Uso e Consumo", categoria: "Material de Consumo", tipo: "despesa" },
  1557: { natureza: "Transferência de Material de Uso e Consumo", categoria: "Material de Consumo", tipo: "despesa" },
  1653: { natureza: "Compra de Combustível", categoria: "Combustível", tipo: "despesa" },
  1910: { natureza: "Entrada de Bonificação", categoria: "Bonificação", tipo: "despesa" },
  1949: { natureza: "Outra Entrada", categoria: "Outros", tipo: "despesa" },

  // Entradas - Interestadual
  2101: { natureza: "Compra para Industrialização", categoria: "Matéria-Prima", tipo: "despesa" },
  2102: { natureza: "Compra para Comercialização", categoria: "Mercadorias", tipo: "despesa" },
  2401: { natureza: "Compra para Industrialização - ST", categoria: "Matéria-Prima", tipo: "despesa" },
  2403: { natureza: "Compra para Comercialização - ST", categoria: "Mercadorias", tipo: "despesa" },
  2551: { natureza: "Compra de Ativo Imobilizado", categoria: "Ativo Imobilizado", tipo: "despesa" },
  2556: { natureza: "Compra de Material de Uso e Consumo", categoria: "Material de Consumo", tipo: "despesa" },
  2653: { natureza: "Compra de Combustível", categoria: "Combustível", tipo: "despesa" },
  2910: { natureza: "Entrada de Bonificação", categoria: "Bonificação", tipo: "despesa" },
  2949: { natureza: "Outra Entrada", categoria: "Outros", tipo: "despesa" },

  // Saídas - Vendas
  5101: { natureza: "Venda de Produção Própria", categoria: "Receita de Vendas", tipo: "receita" },
  5102: { natureza: "Venda de Mercadoria Adquirida", categoria: "Receita de Vendas", tipo: "receita" },
  5103: { natureza: "Venda de Produção - Encomenda", categoria: "Receita de Vendas", tipo: "receita" },
  5104: { natureza: "Venda de Mercadoria - Encomenda", categoria: "Receita de Vendas", tipo: "receita" },
  5105: { natureza: "Venda de Produção - Zona Franca", categoria: "Receita de Vendas", tipo: "receita" },
  5106: { natureza: "Venda de Mercadoria - Zona Franca", categoria: "Receita de Vendas", tipo: "receita" },
  5109: { natureza: "Venda de Produção - Entrega Futura", categoria: "Receita de Vendas", tipo: "receita" },
  5110: { natureza: "Venda de Mercadoria - Entrega Futura", categoria: "Receita de Vendas", tipo: "receita" },
  5111: { natureza: "Venda de Produção - Triangular", categoria: "Receita de Vendas", tipo: "receita" },
  5112: { natureza: "Venda de Mercadoria - Triangular", categoria: "Receita de Vendas", tipo: "receita" },
  5113: { natureza: "Venda de Produção - Entrega Futura Triangular", categoria: "Receita de Vendas", tipo: "receita" },
  5114: { natureza: "Venda de Mercadoria - Entrega Futura Triangular", categoria: "Receita de Vendas", tipo: "receita" },
  5115: { natureza: "Venda de Mercadoria - Comodato", categoria: "Receita de Vendas", tipo: "receita" },
  5116: { natureza: "Venda de Produção - Suframa", categoria: "Receita de Vendas", tipo: "receita" },
  5117: { natureza: "Venda de Mercadoria - Suframa", categoria: "Receita de Vendas", tipo: "receita" },
  5118: { natureza: "Venda de Produção - Entrega Futura Suframa", categoria: "Receita de Vendas", tipo: "receita" },
  5119: { natureza: "Venda de Mercadoria - Entrega Futura Suframa", categoria: "Receita de Vendas", tipo: "receita" },
  5120: { natureza: "Venda de Mercadoria - Entrega Futura", categoria: "Receita de Vendas", tipo: "receita" },
  5401: { natureza: "Venda de Produção - ST", categoria: "Receita de Vendas", tipo: "receita" },
  5403: { natureza: "Venda de Mercadoria - ST", categoria: "Receita de Vendas", tipo: "receita" },
  5405: { natureza: "Venda de Mercadoria - ST Contribuinte", categoria: "Receita de Vendas", tipo: "receita" },
  5551: { natureza: "Venda de Ativo Imobilizado", categoria: "Outras Receitas", tipo: "receita" },
  5910: { natureza: "Remessa em Bonificação", categoria: "Bonificação", tipo: "receita" },
  5911: { natureza: "Remessa em Consignação", categoria: "Consignação", tipo: "receita" },
  5912: { natureza: "Remessa de Mercadoria - Demonstração", categoria: "Demonstração", tipo: "receita" },
  5913: { natureza: "Remessa de Mercadoria - Feira/Exposição", categoria: "Feira/Exposição", tipo: "receita" },
  5914: { natureza: "Remessa de Mercadoria - Conserto", categoria: "Conserto", tipo: "receita" },
  5915: { natureza: "Remessa de Mercadoria - Consignação", categoria: "Consignação", tipo: "receita" },
  5916: { natureza: "Retorno de Mercadoria - Demonstração", categoria: "Demonstração", tipo: "receita" },
  5917: { natureza: "Remessa de Mercadoria - Industrialização", categoria: "Industrialização", tipo: "receita" },
  5918: { natureza: "Devolução de Mercadoria - Consignação", categoria: "Consignação", tipo: "receita" },
  5919: { natureza: "Devolução Simbólica - Consignação", categoria: "Consignação", tipo: "receita" },
  5920: { natureza: "Remessa de Vasilhame/Sacaria", categoria: "Vasilhame", tipo: "receita" },
  5921: { natureza: "Devolução de Vasilhame/Sacaria", categoria: "Vasilhame", tipo: "receita" },
  5922: { natureza: "Lançamento de Cupom Fiscal", categoria: "Receita de Vendas", tipo: "receita" },
  5923: { natureza: "Remessa de Mercadoria - Armazém", categoria: "Armazenagem", tipo: "receita" },
  5924: { natureza: "Remessa para Industrialização - Conta e Ordem", categoria: "Industrialização", tipo: "receita" },
  5925: { natureza: "Retorno de Mercadoria - Armazém", categoria: "Armazenagem", tipo: "receita" },
  5949: { natureza: "Outra Saída", categoria: "Outros", tipo: "receita" },

  // Saídas - Interestadual
  6101: { natureza: "Venda de Produção Própria", categoria: "Receita de Vendas", tipo: "receita" },
  6102: { natureza: "Venda de Mercadoria Adquirida", categoria: "Receita de Vendas", tipo: "receita" },
  6401: { natureza: "Venda de Produção - ST", categoria: "Receita de Vendas", tipo: "receita" },
  6403: { natureza: "Venda de Mercadoria - ST", categoria: "Receita de Vendas", tipo: "receita" },
  6551: { natureza: "Venda de Ativo Imobilizado", categoria: "Outras Receitas", tipo: "receita" },
  6910: { natureza: "Remessa em Bonificação", categoria: "Bonificação", tipo: "receita" },
  6949: { natureza: "Outra Saída", categoria: "Outros", tipo: "receita" },

  // Exportação
  7101: { natureza: "Venda de Produção - Exportação", categoria: "Receita de Exportação", tipo: "receita" },
  7102: { natureza: "Venda de Mercadoria - Exportação", categoria: "Receita de Exportação", tipo: "receita" },
  7949: { natureza: "Outra Saída - Exportação", categoria: "Outros", tipo: "receita" },
};

/**
 * Obtém descrição da forma de pagamento
 */
export function getPaymentMethodDescription(code: string): string {
  return FORMA_PAGAMENTO_DESCRICAO[code] || `Forma ${code}`;
}

/**
 * Obtém natureza sugerida para CFOP
 */
export function getNaturezaSugerida(cfop: number): { natureza: string; categoria: string; tipo: "receita" | "despesa" } | null {
  return CFOP_NATUREZA_MAP[cfop] || null;
}

/**
 * Extrai padrões de pagamento das NFes
 */
export function extractPaymentPatterns(nfes: NFeParsed[]): PaymentPattern[] {
  const patternMap = new Map<string, PaymentPattern>();

  for (const nfe of nfes) {
    const isEntrada = nfe.tipoOperacao === 0;
    const parceiro = isEntrada ? nfe.emitente : nfe.destinatario;

    // Analisar pagamentos
    for (const pag of nfe.pagamentos || []) {
      const forma = pag.forma || "99";
      const key = `${forma}-${parceiro?.cnpj || ""}`;

      const existing = patternMap.get(key);
      if (existing) {
        existing.frequency++;
        existing.valorMedio = (existing.valorMedio * (existing.frequency - 1) + (pag.valor || 0)) / existing.frequency;
      } else {
        patternMap.set(key, {
          formaPagamento: forma,
          formaPagamentoDescricao: getPaymentMethodDescription(forma),
          prazoMedio: 0,
          parcelamento: 1,
          fornecedorCnpj: isEntrada ? parceiro?.cnpj : undefined,
          fornecedorNome: isEntrada ? parceiro?.razaoSocial : undefined,
          clienteCnpj: !isEntrada ? parceiro?.cnpj : undefined,
          clienteNome: !isEntrada ? parceiro?.razaoSocial : undefined,
          frequency: 1,
          valorMedio: pag.valor || 0,
        });
      }
    }

    // Analisar duplicatas para prazo médio
    if (nfe.duplicatas && nfe.duplicatas.length > 0) {
      const dataEmissao = new Date(nfe.dataEmissao);
      let totalDias = 0;

      for (const dup of nfe.duplicatas) {
        if (dup.vencimento) {
          const dataVenc = new Date(dup.vencimento);
          const dias = Math.floor((dataVenc.getTime() - dataEmissao.getTime()) / (1000 * 60 * 60 * 24));
          totalDias += dias;
        }
      }

      const prazoMedio = nfe.duplicatas.length > 0 ? totalDias / nfe.duplicatas.length : 0;

      // Atualizar padrões com prazo médio
      for (const pattern of patternMap.values()) {
        if (
          (pattern.fornecedorCnpj && pattern.fornecedorCnpj === parceiro?.cnpj) ||
          (pattern.clienteCnpj && pattern.clienteCnpj === parceiro?.cnpj)
        ) {
          pattern.prazoMedio = (pattern.prazoMedio * (pattern.frequency - 1) + prazoMedio) / pattern.frequency;
          pattern.parcelamento = Math.max(pattern.parcelamento, nfe.duplicatas.length);
        }
      }
    }
  }

  return Array.from(patternMap.values()).sort((a, b) => b.frequency - a.frequency);
}

/**
 * Extrai mapeamentos de natureza por CFOP
 */
export function extractNatureMappings(nfes: NFeParsed[]): NatureMapping[] {
  const mappingMap = new Map<number, NatureMapping>();

  for (const nfe of nfes) {
    for (const item of nfe.itens) {
      const cfop = item.cfop;
      if (!cfop) continue;

      const existing = mappingMap.get(cfop);
      if (existing) {
        existing.occurrences++;
      } else {
        const natureza = getNaturezaSugerida(cfop);
        mappingMap.set(cfop, {
          cfop,
          cfopDescricao: nfe.naturezaOperacao || "",
          naturezaSugerida: natureza?.natureza || "Não mapeado",
          tipo: natureza?.tipo || (cfop >= 5000 ? "receita" : "despesa"),
          categoria: natureza?.categoria || "Outros",
          occurrences: 1,
        });
      }
    }
  }

  return Array.from(mappingMap.values()).sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Extrai condições de pagamento das duplicatas
 */
export function extractPaymentConditions(nfes: NFeParsed[]): PaymentCondition[] {
  const conditionMap = new Map<string, PaymentCondition>();

  for (const nfe of nfes) {
    if (!nfe.duplicatas || nfe.duplicatas.length === 0) continue;

    const dataEmissao = new Date(nfe.dataEmissao);
    const prazos: number[] = [];

    for (const dup of nfe.duplicatas) {
      if (dup.vencimento) {
        const dataVenc = new Date(dup.vencimento);
        const dias = Math.floor((dataVenc.getTime() - dataEmissao.getTime()) / (1000 * 60 * 60 * 24));
        prazos.push(dias);
      }
    }

    if (prazos.length === 0) continue;

    prazos.sort((a, b) => a - b);
    const diasPrimeira = prazos[0];
    const intervalo = prazos.length > 1 ? prazos[1] - prazos[0] : 30;
    const numParcelas = prazos.length;

    // Criar descrição da condição
    let descricao: string;
    if (numParcelas === 1) {
      descricao = `${diasPrimeira} dias`;
    } else if (intervalo === 30) {
      descricao = `${numParcelas}x ${diasPrimeira}/${diasPrimeira + 30}/${diasPrimeira + 60}...`;
    } else {
      descricao = `${numParcelas}x a cada ${intervalo} dias`;
    }

    const key = `${diasPrimeira}-${intervalo}-${numParcelas}`;
    const existing = conditionMap.get(key);
    if (existing) {
      existing.frequency++;
    } else {
      conditionMap.set(key, {
        descricao,
        diasPrimeiraParcela: diasPrimeira,
        intervaloParcelas: intervalo,
        numeroParcelas: numParcelas,
        frequency: 1,
      });
    }
  }

  return Array.from(conditionMap.values()).sort((a, b) => b.frequency - a.frequency);
}

/**
 * Calcula distribuição de formas de pagamento
 */
export function calculatePaymentMethodDistribution(
  nfes: NFeParsed[]
): Record<string, { count: number; percentage: number }> {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const nfe of nfes) {
    for (const pag of nfe.pagamentos || []) {
      const forma = pag.forma || "99";
      counts[forma] = (counts[forma] || 0) + 1;
      total++;
    }
  }

  const result: Record<string, { count: number; percentage: number }> = {};
  for (const [forma, count] of Object.entries(counts)) {
    result[forma] = {
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    };
  }

  return result;
}

/**
 * Gera configuração financeira completa
 */
export function generateFinancialConfiguration(nfes: NFeParsed[]): FinancialConfiguration {
  let totalDuplicatas = 0;
  let totalPagamentos = 0;
  let valorCompras = 0;
  let valorVendas = 0;

  for (const nfe of nfes) {
    totalDuplicatas += nfe.duplicatas?.length || 0;
    totalPagamentos += nfe.pagamentos?.length || 0;

    const valor = nfe.totais?.valorNota || 0;
    if (nfe.tipoOperacao === 0) {
      valorCompras += valor;
    } else {
      valorVendas += valor;
    }
  }

  return {
    paymentPatterns: extractPaymentPatterns(nfes),
    natureMappings: extractNatureMappings(nfes),
    paymentConditions: extractPaymentConditions(nfes),
    paymentMethodDistribution: calculatePaymentMethodDistribution(nfes),
    statistics: {
      totalNfes: nfes.length,
      totalDuplicatas,
      totalPagamentos,
      valorTotalCompras: valorCompras,
      valorTotalVendas: valorVendas,
    },
  };
}

/**
 * Gera relatório de configuração financeira em texto
 */
export function generateFinancialReport(config: FinancialConfiguration): string {
  const lines: string[] = [];

  lines.push("=== RELATÓRIO DE CONFIGURAÇÃO FINANCEIRA ===");
  lines.push("");

  // Estatísticas
  lines.push("--- Estatísticas ---");
  lines.push(`NFes analisadas: ${config.statistics.totalNfes}`);
  lines.push(`Total de duplicatas: ${config.statistics.totalDuplicatas}`);
  lines.push(`Total de pagamentos: ${config.statistics.totalPagamentos}`);
  lines.push(`Valor total compras: R$ ${config.statistics.valorTotalCompras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  lines.push(`Valor total vendas: R$ ${config.statistics.valorTotalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  lines.push("");

  // Distribuição de formas de pagamento
  if (Object.keys(config.paymentMethodDistribution).length > 0) {
    lines.push("--- Formas de Pagamento ---");
    for (const [forma, data] of Object.entries(config.paymentMethodDistribution)) {
      const descricao = getPaymentMethodDescription(forma);
      lines.push(`  ${descricao}: ${data.count} (${data.percentage}%)`);
    }
    lines.push("");
  }

  // Condições de pagamento
  if (config.paymentConditions.length > 0) {
    lines.push("--- Condições de Pagamento (Top 10) ---");
    for (const cond of config.paymentConditions.slice(0, 10)) {
      lines.push(`  ${cond.descricao}: ${cond.frequency} ocorrências`);
    }
    lines.push("");
  }

  // Mapeamentos de natureza
  if (config.natureMappings.length > 0) {
    lines.push("--- Mapeamento CFOP → Natureza (Top 15) ---");
    for (const mapping of config.natureMappings.slice(0, 15)) {
      lines.push(`  CFOP ${mapping.cfop}: ${mapping.naturezaSugerida}`);
      lines.push(`    Tipo: ${mapping.tipo}, Categoria: ${mapping.categoria}, Ocorrências: ${mapping.occurrences}`);
    }
    lines.push("");
  }

  // Padrões de pagamento por parceiro
  const topPatterns = config.paymentPatterns.slice(0, 10);
  if (topPatterns.length > 0) {
    lines.push("--- Padrões de Pagamento por Parceiro (Top 10) ---");
    for (const pattern of topPatterns) {
      const parceiro = pattern.fornecedorNome || pattern.clienteNome || "Não identificado";
      lines.push(`  ${parceiro}`);
      lines.push(`    Forma: ${pattern.formaPagamentoDescricao}, Prazo médio: ${Math.round(pattern.prazoMedio)} dias`);
      lines.push(`    Valor médio: R$ ${pattern.valorMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    }
  }

  return lines.join("\n");
}
