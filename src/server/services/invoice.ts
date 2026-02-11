/**
 * InvoiceService
 * Centraliza lógica de negócio de notas fiscais (emitidas e recebidas).
 *
 * Consolida:
 * - Cálculo de custo médio ponderado na entrada de NFe
 * - Geração automática de contas a pagar a partir de NFe aprovada
 * - Atualização de status de pedido de compra
 * - Auto-match de itens de NFe com materiais e OC
 * - Cálculo de totais de itens de NF emitida
 * - Geração de código sequencial para NF emitida
 */

import type { PrismaClient, Prisma } from "@prisma/client";

type Decimal = Prisma.Decimal;

// ==========================================================================
// TYPES
// ==========================================================================

export interface WeightedAverageCostInput {
  currentQuantity: number;
  currentUnitCost: number;
  incomingQuantity: number;
  incomingUnitCost: number;
}

export interface WeightedAverageCostResult {
  newQuantity: number;
  newUnitCost: number;
  newTotalCost: number;
}

export interface InvoiceItemInput {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface InvoiceItemResult {
  totalPrice: number;
}

export interface AutoMatchItemResult {
  matchStatus: "MATCHED" | "DIVERGENT" | "NOT_FOUND";
  materialId?: string;
  purchaseOrderItemId?: string;
  divergenceType?: string | null;
  divergenceNote?: string | null;
}

export interface AutoMatchSummary {
  matchedCount: number;
  divergentCount: number;
  notFoundCount: number;
  totalItems: number;
}

export interface ApproveInvoiceResult {
  movementsCreated: number;
  payableId: string | null;
}

export interface DueDateInput {
  issueDate: Date;
  defaultDays?: number;
}

// ==========================================================================
// PURE CALCULATION FUNCTIONS
// ==========================================================================

/**
 * Calcula custo médio ponderado para entrada de estoque
 */
export function calculateWeightedAverageCost(
  input: WeightedAverageCostInput,
): WeightedAverageCostResult {
  const currentTotal = input.currentQuantity * input.currentUnitCost;
  const incomingTotal = input.incomingQuantity * input.incomingUnitCost;
  const newQuantity = input.currentQuantity + input.incomingQuantity;
  const newUnitCost =
    newQuantity > 0
      ? (currentTotal + incomingTotal) / newQuantity
      : input.incomingUnitCost;
  const newTotalCost = newQuantity * newUnitCost;

  return { newQuantity, newUnitCost, newTotalCost };
}

/**
 * Calcula total de um item de nota fiscal
 */
export function calculateItemTotal(input: InvoiceItemInput): InvoiceItemResult {
  const discountFactor = 1 - (input.discountPercent || 0) / 100;
  const totalPrice = input.quantity * input.unitPrice * discountFactor;
  return { totalPrice: Math.round(totalPrice * 100) / 100 };
}

/**
 * Calcula data de vencimento padrão (30 dias após emissão)
 */
export function calculateDueDate(input: DueDateInput): Date {
  const dueDate = new Date(input.issueDate);
  dueDate.setDate(dueDate.getDate() + (input.defaultDays || 30));
  return dueDate;
}

/**
 * Gera próximo código sequencial
 */
export function generateNextCode(lastCode: number | null | undefined): number {
  return (lastCode || 0) + 1;
}

/**
 * Formata número de NF com zeros à esquerda (9 dígitos)
 */
export function formatInvoiceNumber(code: number): string {
  return String(code).padStart(9, "0");
}

/**
 * Detecta divergência de quantidade entre NFe e OC
 */
export function detectQuantityDivergence(
  nfeQuantity: number,
  pendingQuantity: number,
): { isDivergent: boolean; note: string | null } {
  if (nfeQuantity > pendingQuantity) {
    return {
      isDivergent: true,
      note: `Qtd NFe (${nfeQuantity}) > Qtd pendente OC (${pendingQuantity})`,
    };
  }
  return { isDivergent: false, note: null };
}

/**
 * Detecta divergência de preço entre NFe e OC (tolerância de 5%)
 */
export function detectPriceDivergence(
  nfePrice: number,
  poPrice: number,
  tolerancePercent: number = 5,
): { isDivergent: boolean; note: string | null } {
  if (poPrice === 0) return { isDivergent: false, note: null };

  const priceDiff = Math.abs(nfePrice - poPrice) / poPrice;
  if (priceDiff > tolerancePercent / 100) {
    return {
      isDivergent: true,
      note: `Preço NFe (${nfePrice.toFixed(2)}) difere do OC (${poPrice.toFixed(2)})`,
    };
  }
  return { isDivergent: false, note: null };
}

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

export class InvoiceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Processa entrada de estoque para um item de NFe aprovada.
   * Calcula custo médio ponderado e cria movimentação.
   */
  async processStockEntry(
    tx: Prisma.TransactionClient,
    params: {
      materialId: string;
      companyId: string;
      quantity: Decimal | number;
      unitPrice: Decimal | number;
      totalPrice: Decimal | number;
      invoiceId: string;
      invoiceNumber: number;
      supplierName: string;
      supplierId?: string | null;
    },
  ): Promise<string> {
    const qty = Number(params.quantity);
    const price = Number(params.unitPrice);

    // Buscar ou criar registro de estoque
    let inventory = await tx.inventory.findFirst({
      where: { materialId: params.materialId, companyId: params.companyId },
    });

    if (!inventory) {
      inventory = await tx.inventory.create({
        data: {
          materialId: params.materialId,
          quantity: 0,
          unitCost: price,
          totalCost: 0,
          companyId: params.companyId,
        },
      });
    }

    // Calcular custo médio ponderado
    const costResult = calculateWeightedAverageCost({
      currentQuantity: Number(inventory.quantity),
      currentUnitCost: Number(inventory.unitCost),
      incomingQuantity: qty,
      incomingUnitCost: price,
    });

    // Atualizar estoque
    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity: costResult.newQuantity,
        unitCost: costResult.newUnitCost,
        totalCost: costResult.newTotalCost,
        availableQty: costResult.newQuantity - Number(inventory.reservedQty),
        lastMovementAt: new Date(),
      },
    });

    // Criar movimentação de entrada
    const movement = await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        movementType: "ENTRY",
        quantity: params.quantity,
        unitCost: params.unitPrice,
        totalCost: params.totalPrice,
        balanceAfter: costResult.newQuantity,
        documentType: "NFE",
        documentNumber: String(params.invoiceNumber),
        documentId: params.invoiceId,
        supplierId: params.supplierId,
        notes: `Entrada via NFe ${params.invoiceNumber} - ${params.supplierName}`,
      },
    });

    return movement.id;
  }

  /**
   * Atualiza preço do fornecedor para um material
   */
  async updateSupplierPrice(
    tx: Prisma.TransactionClient,
    params: {
      supplierId: string;
      materialId: string;
      unitPrice: Decimal | number;
    },
  ): Promise<void> {
    const supplierMaterial = await tx.supplierMaterial.findFirst({
      where: {
        supplierId: params.supplierId,
        materialId: params.materialId,
      },
    });

    if (supplierMaterial) {
      await tx.supplierMaterial.update({
        where: { id: supplierMaterial.id },
        data: {
          lastPrice: params.unitPrice,
          lastPriceDate: new Date(),
        },
      });
    }
  }

  /**
   * Atualiza status do pedido de compra baseado nas NFes recebidas
   */
  async updatePurchaseOrderStatus(
    tx: Prisma.TransactionClient,
    purchaseOrderId: string,
  ): Promise<void> {
    const pendingInvoices = await tx.receivedInvoice.count({
      where: {
        purchaseOrderId,
        status: { not: "APPROVED" },
      },
    });

    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: pendingInvoices === 0 ? "COMPLETED" : "PARTIAL" },
    });
  }

  /**
   * Gera título a pagar automaticamente a partir de NFe aprovada
   */
  async generatePayable(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      supplierId: string;
      invoiceId: string;
      invoiceNumber: number;
      supplierName: string;
      issueDate: Date;
      totalInvoice: Decimal | number;
    },
  ): Promise<string> {
    const lastPayable = await tx.accountsPayable.findFirst({
      where: { companyId: params.companyId },
      orderBy: { code: "desc" },
    });

    const nextCode = generateNextCode(lastPayable?.code);
    const dueDate = calculateDueDate({ issueDate: params.issueDate });

    const payable = await tx.accountsPayable.create({
      data: {
        code: nextCode,
        supplierId: params.supplierId,
        description: `NFe ${params.invoiceNumber} - ${params.supplierName}`,
        documentNumber: String(params.invoiceNumber),
        documentType: "INVOICE",
        documentId: params.invoiceId,
        invoiceId: params.invoiceId,
        issueDate: params.issueDate,
        dueDate,
        originalValue: params.totalInvoice,
        netValue: params.totalInvoice,
        status: "PENDING",
        companyId: params.companyId,
        notes: `Título gerado automaticamente a partir da NFe ${params.invoiceNumber}`,
      },
    });

    return payable.id;
  }

  /**
   * Gera próximo código e número para NF emitida
   */
  async getNextIssuedInvoiceCode(companyId: string): Promise<{ code: number; invoiceNumber: string }> {
    const lastInvoice = await this.prisma.issuedInvoice.findFirst({
      where: { companyId },
      orderBy: { code: "desc" },
      select: { code: true },
    });

    const code = generateNextCode(lastInvoice?.code);
    return { code, invoiceNumber: formatInvoiceNumber(code) };
  }
}
