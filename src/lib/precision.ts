/**
 * Precision Utilities - Cálculos com precisão decimal exata
 * VIO-831 - Robustez do Domínio Industrial
 * 
 * Evita problemas de ponto flutuante em cálculos fiscais e de estoque
 */

import Decimal from "decimal.js";

// Configurar precisão global
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Converte valor para Decimal com precisão
 */
export function toDecimal(value: number | string | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined) {
    return new Decimal(0);
  }
  return new Decimal(value);
}

/**
 * Arredonda para casas decimais específicas
 */
export function round(value: number | string | Decimal, decimals: number = 2): Decimal {
  return toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}

/**
 * Formata valor monetário (2 casas decimais)
 */
export function toMoney(value: number | string | Decimal): number {
  return round(value, 2).toNumber();
}

/**
 * Formata quantidade (4 casas decimais para precisão de estoque)
 */
export function toQuantity(value: number | string | Decimal): number {
  return round(value, 4).toNumber();
}

/**
 * Formata percentual (2 casas decimais)
 */
export function toPercent(value: number | string | Decimal): number {
  return round(value, 2).toNumber();
}

/**
 * Converte Decimal/Prisma Decimal para number
 * Útil para renderização em React e operações que exigem number
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return parseFloat(value) || 0;
  }
  if (typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return new Decimal(value).toNumber();
}

/**
 * Soma valores com precisão
 */
export function sum(...values: (number | string | Decimal | null | undefined)[]): Decimal {
  return values.reduce<Decimal>(
    (acc, val) => acc.plus(toDecimal(val)),
    new Decimal(0)
  );
}

/**
 * Subtrai valores com precisão
 */
export function subtract(
  minuend: number | string | Decimal,
  subtrahend: number | string | Decimal
): Decimal {
  return toDecimal(minuend).minus(toDecimal(subtrahend));
}

/**
 * Multiplica valores com precisão
 */
export function multiply(
  a: number | string | Decimal,
  b: number | string | Decimal
): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * Divide valores com precisão
 */
export function divide(
  dividend: number | string | Decimal,
  divisor: number | string | Decimal
): Decimal {
  const d = toDecimal(divisor);
  if (d.isZero()) {
    return new Decimal(0);
  }
  return toDecimal(dividend).dividedBy(d);
}

/**
 * Calcula percentual de um valor
 */
export function percentOf(
  value: number | string | Decimal,
  percent: number | string | Decimal
): Decimal {
  return multiply(value, divide(percent, 100));
}

/**
 * Verifica se valor é positivo
 */
export function isPositive(value: number | string | Decimal): boolean {
  return toDecimal(value).isPositive() && !toDecimal(value).isZero();
}

/**
 * Verifica se valor é negativo
 */
export function isNegative(value: number | string | Decimal): boolean {
  return toDecimal(value).isNegative();
}

/**
 * Verifica se valor é zero
 */
export function isZero(value: number | string | Decimal): boolean {
  return toDecimal(value).isZero();
}

/**
 * Compara dois valores
 * Retorna: -1 se a < b, 0 se a == b, 1 se a > b
 */
export function compare(
  a: number | string | Decimal,
  b: number | string | Decimal
): number {
  return toDecimal(a).comparedTo(toDecimal(b));
}

/**
 * Retorna o maior valor
 */
export function max(...values: (number | string | Decimal)[]): Decimal {
  return Decimal.max(...values.map(toDecimal));
}

/**
 * Retorna o menor valor
 */
export function min(...values: (number | string | Decimal)[]): Decimal {
  return Decimal.min(...values.map(toDecimal));
}

/**
 * Calcula valor absoluto
 */
export function abs(value: number | string | Decimal): Decimal {
  return toDecimal(value).abs();
}

/**
 * Validação de estoque - não permite negativo sem flag
 */
export function validateStock(
  currentStock: number | string | Decimal,
  quantity: number | string | Decimal,
  allowNegative: boolean = false
): { valid: boolean; newStock: Decimal; error?: string } {
  const current = toDecimal(currentStock);
  const qty = toDecimal(quantity);
  const newStock = current.minus(qty);

  if (!allowNegative && newStock.isNegative()) {
    return {
      valid: false,
      newStock,
      error: `Estoque insuficiente. Disponível: ${current.toFixed(4)}, Solicitado: ${qty.toFixed(4)}`,
    };
  }

  return { valid: true, newStock };
}

/**
 * Calcula markup sobre custo
 */
export function calculateMarkup(
  cost: number | string | Decimal,
  markupPercent: number | string | Decimal
): Decimal {
  const costDecimal = toDecimal(cost);
  const markup = divide(markupPercent, 100);
  return costDecimal.plus(costDecimal.times(markup));
}

/**
 * Calcula margem sobre preço de venda
 */
export function calculateMargin(
  cost: number | string | Decimal,
  marginPercent: number | string | Decimal
): Decimal {
  const costDecimal = toDecimal(cost);
  const margin = divide(marginPercent, 100);
  const divisor = new Decimal(1).minus(margin);
  
  if (divisor.isZero() || divisor.isNegative()) {
    return costDecimal;
  }
  
  return costDecimal.dividedBy(divisor);
}

/**
 * Calcula ICMS
 */
export function calculateICMS(
  baseCalculo: number | string | Decimal,
  aliquota: number | string | Decimal
): Decimal {
  return round(percentOf(baseCalculo, aliquota), 2);
}

/**
 * Calcula IPI
 */
export function calculateIPI(
  baseCalculo: number | string | Decimal,
  aliquota: number | string | Decimal
): Decimal {
  return round(percentOf(baseCalculo, aliquota), 2);
}

/**
 * Calcula PIS
 */
export function calculatePIS(
  baseCalculo: number | string | Decimal,
  aliquota: number | string | Decimal = 1.65
): Decimal {
  return round(percentOf(baseCalculo, aliquota), 2);
}

/**
 * Calcula COFINS
 */
export function calculateCOFINS(
  baseCalculo: number | string | Decimal,
  aliquota: number | string | Decimal = 7.6
): Decimal {
  return round(percentOf(baseCalculo, aliquota), 2);
}

/**
 * Calcula total de impostos
 */
export function calculateTotalTaxes(
  baseCalculo: number | string | Decimal,
  icmsAliquota: number | string | Decimal,
  ipiAliquota: number | string | Decimal = 0,
  pisAliquota: number | string | Decimal = 1.65,
  cofinsAliquota: number | string | Decimal = 7.6
): {
  icms: Decimal;
  ipi: Decimal;
  pis: Decimal;
  cofins: Decimal;
  total: Decimal;
} {
  const icms = calculateICMS(baseCalculo, icmsAliquota);
  const ipi = calculateIPI(baseCalculo, ipiAliquota);
  const pis = calculatePIS(baseCalculo, pisAliquota);
  const cofins = calculateCOFINS(baseCalculo, cofinsAliquota);
  const total = sum(icms, ipi, pis, cofins);

  return { icms, ipi, pis, cofins, total };
}
