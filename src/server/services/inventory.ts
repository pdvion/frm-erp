import type { PrismaClient, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type Decimal = Prisma.Decimal;

// ==========================================================================
// TYPES
// ==========================================================================

export type MovementType = "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT" | "RETURN" | "PRODUCTION";
export type InventoryType = "RAW_MATERIAL" | "SEMI_FINISHED" | "FINISHED" | "CRITICAL" | "DEAD" | "SCRAP";
export type ReservationStatus = "ACTIVE" | "CONSUMED" | "RELEASED" | "EXPIRED";

const ENTRY_TYPES: MovementType[] = ["ENTRY", "RETURN", "PRODUCTION"];

export interface CreateMovementInput {
  materialId: string;
  inventoryType: InventoryType;
  movementType: MovementType;
  quantity: number;
  unitCost: number;
  companyId: string;
  documentType?: string;
  documentNumber?: string;
  documentId?: string;
  supplierId?: string;
  notes?: string;
  userId?: string;
}

export interface CreateReservationInput {
  materialId: string;
  quantity: number;
  documentType: string;
  documentId: string;
  documentNumber?: string;
  expiresAt?: Date;
  notes?: string;
  companyId: string;
  userId?: string | null;
}

export interface ReleaseReservationInput {
  reservationId: string;
  companyId: string;
  userId?: string | null;
  reason?: string;
}

export interface ConsumeReservationInput {
  reservationId: string;
  quantity?: number;
  companyId: string;
  userId?: string | null;
}

export type LowStockSeverity = "critical" | "high" | "medium";

export interface LowStockAlert {
  inventoryId: string;
  materialId: string;
  materialCode: number;
  materialDescription: string;
  unit: string;
  category: string;
  currentStock: Decimal | number;
  minStock: Decimal | number;
  deficit: number;
  percentOfMin: number;
  severity: LowStockSeverity;
}

export interface LowStockResult {
  totalAlerts: number;
  critical: number;
  high: number;
  medium: number;
  alerts: LowStockAlert[];
}

// ==========================================================================
// SERVICE
// ==========================================================================

export class InventoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Registra um movimento de estoque com optimistic locking e custo médio ponderado.
   * 
   * - Cria o registro de estoque se não existir (upsert semântico)
   * - Valida saldo para saídas
   * - Recalcula custo médio para entradas
   * - Usa version field para detectar conflitos de concorrência
   */
  async createMovement(input: CreateMovementInput) {
    const { materialId, inventoryType, movementType, quantity, unitCost, companyId, ...movementData } = input;
    const isEntry = ENTRY_TYPES.includes(movementType);

    const result = await this.prisma.$transaction(async (tx) => {
      // Buscar ou criar registro de estoque
      let inventory = await tx.inventory.findFirst({
        where: { materialId, inventoryType, companyId },
      });

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            materialId,
            inventoryType,
            companyId,
            quantity: 0,
            availableQty: 0,
            unitCost: 0,
            totalCost: 0,
            version: 1,
          },
        });
      }

      // Calcular novo saldo
      const quantityChange = isEntry ? quantity : -quantity;
      const newQuantity = Number(inventory.quantity) + quantityChange;
      const totalCost = quantity * unitCost;

      // Verificar saldo disponível para saídas
      if (!isEntry && newQuantity < 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Saldo insuficiente. Disponível: ${inventory.quantity}, Solicitado: ${quantity}`,
        });
      }

      // Criar movimento
      const movement = await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          movementType,
          quantity,
          unitCost,
          totalCost,
          balanceAfter: newQuantity,
          ...movementData,
        },
        include: {
          inventory: {
            include: { material: true },
          },
        },
      });

      // Atualizar estoque com optimistic locking
      const currentVersion = inventory.version;
      const updated = await tx.inventory.updateMany({
        where: {
          id: inventory.id,
          version: currentVersion,
        },
        data: {
          quantity: newQuantity,
          availableQty: newQuantity - Number(inventory.reservedQty),
          lastMovementAt: new Date(),
          version: currentVersion + 1,
          // Recalcular custo médio para entradas
          ...(isEntry && unitCost > 0 && {
            unitCost: (Number(inventory.totalCost) + totalCost) / (Number(inventory.quantity) + quantity),
            totalCost: Number(inventory.totalCost) + totalCost,
          }),
        },
      });

      if (updated.count === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Conflito de concorrência detectado. O estoque foi modificado por outro usuário. Por favor, tente novamente.",
        });
      }

      return movement;
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    return result;
  }

  /**
   * Verifica itens com estoque abaixo do mínimo e classifica por severidade.
   * 
   * Severidade:
   * - critical: estoque zerado ou negativo
   * - high: abaixo de 50% do mínimo
   * - medium: abaixo do mínimo mas acima de 50%
   */
  async checkLowStock(companyId: string): Promise<LowStockResult> {
    const inventoryItems = await this.prisma.inventory.findMany({
      where: { companyId },
      include: {
        material: {
          include: { category: true },
        },
      },
    });

    const alerts: LowStockAlert[] = inventoryItems
      .filter((inv) => inv.material.minQuantity && inv.quantity < inv.material.minQuantity)
      .map((inv) => ({
        inventoryId: inv.id,
        materialId: inv.material.id,
        materialCode: inv.material.code,
        materialDescription: inv.material.description,
        unit: inv.material.unit,
        category: inv.material.category?.name || "Sem categoria",
        currentStock: inv.quantity,
        minStock: inv.material.minQuantity || 0,
        deficit: (Number(inv.material.minQuantity) || 0) - Number(inv.quantity),
        percentOfMin: inv.material.minQuantity
          ? Math.round((Number(inv.quantity) / Number(inv.material.minQuantity)) * 100)
          : 0,
        severity: this.classifyStockSeverity(Number(inv.quantity), Number(inv.material.minQuantity)),
      }))
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.deficit - a.deficit;
      });

    return {
      totalAlerts: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      high: alerts.filter((a) => a.severity === "high").length,
      medium: alerts.filter((a) => a.severity === "medium").length,
      alerts,
    };
  }

  /**
   * Classifica a severidade do estoque baixo.
   */
  private classifyStockSeverity(currentQty: number, minQty: number): LowStockSeverity {
    if (currentQty <= 0) return "critical";
    if (currentQty < minQty * 0.5) return "high";
    return "medium";
  }

  // ==========================================================================
  // RESERVAS
  // ==========================================================================

  /**
   * Cria uma reserva de material, decrementando a quantidade disponível.
   * 
   * Valida:
   * - Material existe no estoque
   * - Quantidade disponível suficiente
   */
  async createReservation(input: CreateReservationInput) {
    const { materialId, quantity, companyId, userId, ...reservationData } = input;

    const inventory = await this.prisma.inventory.findFirst({
      where: { materialId, companyId },
      include: { material: true },
    });

    if (!inventory) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Material não encontrado no estoque" });
    }

    if (Number(inventory.availableQty) < quantity) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Quantidade disponível insuficiente. Disponível: ${inventory.availableQty}`,
      });
    }

    // Gerar código da reserva
    const lastReservation = await this.prisma.stockReservation.findFirst({
      where: { companyId },
      orderBy: { code: "desc" },
    });
    const nextCode = (lastReservation?.code || 0) + 1;

    // Criar reserva e atualizar estoque em transação
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.create({
        data: {
          code: nextCode,
          companyId,
          inventoryId: inventory.id,
          materialId,
          quantity,
          ...reservationData,
          status: "ACTIVE",
          createdBy: userId,
        },
        include: {
          material: true,
          inventory: true,
        },
      });

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedQty: Number(inventory.reservedQty) + quantity,
          availableQty: Number(inventory.availableQty) - quantity,
        },
      });

      return reservation;
    });
  }

  /**
   * Libera uma reserva ativa, devolvendo a quantidade ao estoque disponível.
   */
  async releaseReservation(input: ReleaseReservationInput) {
    const { reservationId, companyId, userId, reason } = input;

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findFirst({
        where: { id: reservationId, companyId, status: "ACTIVE" },
        include: { inventory: true },
      });

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada ou já liberada" });
      }

      const updated = await tx.stockReservation.update({
        where: { id: reservationId },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          releasedBy: userId,
          releaseReason: reason,
        },
      });

      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          reservedQty: Number(reservation.inventory.reservedQty) - Number(reservation.quantity),
          availableQty: Number(reservation.inventory.availableQty) + Number(reservation.quantity),
        },
      });

      return updated;
    });
  }

  /**
   * Consome uma reserva (baixa efetiva), criando movimento de saída e atualizando estoque.
   * 
   * Se quantity não for informado, consome toda a reserva.
   * Consumo parcial mantém a reserva ativa com saldo reduzido.
   */
  async consumeReservation(input: ConsumeReservationInput) {
    const { reservationId, companyId, userId } = input;

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findFirst({
        where: { id: reservationId, companyId, status: "ACTIVE" },
        include: { inventory: { include: { material: true } } },
      });

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada ou já consumida" });
      }

      const quantityToConsume = input.quantity || reservation.quantity;
      if (quantityToConsume > reservation.quantity) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Quantidade a consumir maior que a reservada" });
      }
      // Criar movimento de saída
      await tx.inventoryMovement.create({
        data: {
          inventoryId: reservation.inventoryId,
          movementType: "EXIT",
          quantity: quantityToConsume,
          unitCost: reservation.inventory.unitCost,
          totalCost: Number(quantityToConsume) * Number(reservation.inventory.unitCost),
          balanceAfter: Number(reservation.inventory.quantity) - Number(quantityToConsume),
          documentType: reservation.documentType,
          documentNumber: reservation.documentNumber,
          notes: `Consumo de reserva #${reservation.code}`,
          userId,
        },
      });

      // Atualizar estoque
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          quantity: Number(reservation.inventory.quantity) - Number(quantityToConsume),
          reservedQty: Number(reservation.inventory.reservedQty) - Number(quantityToConsume),
          totalCost: (Number(reservation.inventory.quantity) - Number(quantityToConsume)) * Number(reservation.inventory.unitCost),
          lastMovementAt: new Date(),
        },
      });

      // Atualizar ou finalizar reserva
      const remainingQty = Number(reservation.quantity) - Number(quantityToConsume);
      const updated = await tx.stockReservation.update({
        where: { id: reservationId },
        data: {
          quantity: remainingQty,
          consumedQty: (Number(reservation.consumedQty) || 0) + Number(quantityToConsume),
          status: remainingQty <= 0 ? "CONSUMED" : "ACTIVE",
          ...(remainingQty <= 0 && { consumedAt: new Date() }),
        },
      });

      return updated;
    });
  }

  /**
   * Busca ou cria um registro de estoque para um material.
   * Útil para operações de produção que precisam garantir que o registro existe.
   */
  async getOrCreateInventory(
    tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
    materialId: string,
    companyId: string,
    inventoryType: InventoryType = "RAW_MATERIAL",
  ) {
    let inventory = await tx.inventory.findFirst({
      where: { materialId, companyId, inventoryType },
    });

    if (!inventory) {
      inventory = await tx.inventory.create({
        data: {
          materialId,
          companyId,
          inventoryType,
          quantity: 0,
          availableQty: 0,
          unitCost: 0,
          totalCost: 0,
          version: 1,
        },
      });
    }

    return inventory;
  }

  /**
   * Registra entrada de produto acabado no estoque (usado por produção).
   * Executa dentro de uma transação existente.
   */
  async recordProductionEntry(
    tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
    params: {
      inventoryId: string;
      currentQuantity: number;
      quantity: number;
      unitCost: number;
      documentNumber: string;
      documentId: string;
      productDescription: string;
      userId?: string | null;
    },
  ) {
    const totalCost = params.unitCost * params.quantity;

    await tx.inventoryMovement.create({
      data: {
        inventoryId: params.inventoryId,
        movementType: "ENTRY",
        quantity: params.quantity,
        unitCost: params.unitCost,
        totalCost,
        balanceAfter: params.currentQuantity + params.quantity,
        documentType: "OP",
        documentNumber: params.documentNumber,
        documentId: params.documentId,
        notes: `Produção OP #${params.documentNumber} - ${params.productDescription}`,
        userId: params.userId,
      },
    });

    // availableQty é calculado automaticamente pelo trigger fn_inventory_compute_available_qty
    await tx.inventory.update({
      where: { id: params.inventoryId },
      data: {
        quantity: { increment: params.quantity },
        lastMovementAt: new Date(),
      },
    });
  }

  /**
   * Registra consumo de material pela produção.
   * Executa dentro de uma transação existente.
   */
  async recordProductionConsumption(
    tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
    params: {
      inventoryId: string;
      currentQuantity: number;
      quantity: number;
      unitCost: Decimal | number;
      totalCost: number;
      documentNumber: string;
      documentId: string;
      materialDescription: string;
      userId?: string | null;
    },
  ) {
    await tx.inventoryMovement.create({
      data: {
        inventoryId: params.inventoryId,
        movementType: "EXIT",
        quantity: params.quantity,
        unitCost: params.unitCost,
        totalCost: params.totalCost,
        balanceAfter: params.currentQuantity - params.quantity,
        documentType: "OP",
        documentNumber: params.documentNumber,
        documentId: params.documentId,
        notes: `Consumo OP #${params.documentNumber} - ${params.materialDescription}`,
        userId: params.userId,
      },
    });

    // availableQty é calculado automaticamente pelo trigger fn_inventory_compute_available_qty
    await tx.inventory.update({
      where: { id: params.inventoryId },
      data: {
        quantity: { decrement: params.quantity },
        totalCost: { decrement: params.totalCost },
        lastMovementAt: new Date(),
      },
    });
  }
}
