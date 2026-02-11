/**
 * MaintenanceService
 * Centraliza lógica de negócio do PCM (Planejamento e Controle de Manutenção).
 *
 * @see VIO-1078
 */

import type { PrismaClient } from "@prisma/client";

// ==========================================================================
// TYPES
// ==========================================================================

export interface ChecklistItem {
  description: string;
  isRequired: boolean;
}

export interface RequiredPart {
  materialId: string;
  quantity: number;
  description?: string;
}

export interface MaintenanceKPIs {
  mtbf: number;
  mttr: number;
  availability: number;
  totalOrders: number;
  completedOrders: number;
  openOrders: number;
  totalCost: number;
  preventiveRatio: number;
}

// ==========================================================================
// PURE FUNCTIONS
// ==========================================================================

export function calculateMTBF(operatingHours: number, failureCount: number): number {
  if (failureCount <= 0) return operatingHours > 0 ? operatingHours : 0;
  return Math.round((operatingHours / failureCount) * 100) / 100;
}

export function calculateMTTR(totalRepairMinutes: number, repairCount: number): number {
  if (repairCount <= 0) return 0;
  return Math.round((totalRepairMinutes / repairCount / 60) * 100) / 100;
}

export function calculateAvailability(mtbf: number, mttr: number): number {
  if (mtbf + mttr <= 0) return 100;
  return Math.round((mtbf / (mtbf + mttr)) * 10000) / 100;
}

export function calculateMaintenanceCost(partsCost: number, laborCost: number): number {
  return Math.round((partsCost + laborCost) * 100) / 100;
}

export function calculatePreventiveRatio(preventiveCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((preventiveCount / totalCount) * 10000) / 100;
}

export function getNextMaintenanceDate(
  lastDate: Date,
  frequency: string,
  frequencyValue: number = 1,
): Date {
  const next = new Date(lastDate);
  switch (frequency) {
    case "HOURS":
      next.setDate(next.getDate() + Math.ceil(frequencyValue / 8));
      break;
    case "DAILY":
      next.setDate(next.getDate() + frequencyValue);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7 * frequencyValue);
      break;
    case "BIWEEKLY":
      next.setDate(next.getDate() + 14 * frequencyValue);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + frequencyValue);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3 * frequencyValue);
      break;
    case "SEMIANNUAL":
      next.setMonth(next.getMonth() + 6 * frequencyValue);
      break;
    case "ANNUAL":
      next.setFullYear(next.getFullYear() + frequencyValue);
      break;
  }
  return next;
}

export function isMaintenanceDue(nextDueDate: Date | null, now: Date = new Date()): boolean {
  if (!nextDueDate) return false;
  return nextDueDate <= now;
}

export function calculateDurationMinutes(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}

export function getPriorityWeight(priority: string): number {
  const weights: Record<string, number> = {
    EMERGENCY: 1, URGENT: 2, HIGH: 3, NORMAL: 4, LOW: 5,
  };
  return weights[priority] ?? 4;
}

export function generateChecklistFromPlan(checklist: ChecklistItem[] | null): Array<{
  sequence: number; description: string; isRequired: boolean;
}> {
  if (!checklist || !Array.isArray(checklist)) return [];
  return checklist.map((item, index) => ({
    sequence: index + 1,
    description: item.description,
    isRequired: item.isRequired ?? false,
  }));
}

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
export class MaintenanceService {
  constructor(private readonly prisma: PrismaClient) {}

  private get equipment() { return (this.prisma as any).maintenanceEquipment; }
  private get plan() { return (this.prisma as any).maintenancePlan; }
  private get order() { return (this.prisma as any).maintenanceOrder; }
  private get checklist() { return (this.prisma as any).maintenanceChecklist; }

  async createEquipment(companyId: string, data: Record<string, unknown>) {
    return this.equipment.create({ data: { companyId, ...data } });
  }

  async createPlan(companyId: string, data: Record<string, unknown>) {
    const nextDueDate = getNextMaintenanceDate(
      new Date(),
      (data.frequency as string) ?? "MONTHLY",
      (data.frequencyValue as number) ?? 1,
    );
    return this.plan.create({ data: { companyId, nextDueDate, ...data } });
  }

  async generateOrdersFromPlans(companyId: string): Promise<number> {
    const now = new Date();
    const duePlans = await this.plan.findMany({
      where: { companyId, isActive: true, nextDueDate: { lte: now } },
    });

    let generated = 0;
    for (const p of duePlans) {
      const last = await this.order.findFirst({
        where: { companyId }, orderBy: { code: "desc" },
      });
      const nextCode = ((last?.code as number) ?? 0) + 1 + generated;

      const o = await this.order.create({
        data: {
          companyId, code: nextCode, equipmentId: p.equipmentId,
          planId: p.id, type: p.type, status: "PLANNED", priority: "NORMAL",
          title: `${p.name}`, estimatedDuration: p.estimatedDuration,
          plannedStart: now,
        },
      });

      const items = generateChecklistFromPlan(p.checklist as ChecklistItem[] | null);
      for (const item of items) {
        await this.checklist.create({
          data: { orderId: o.id, ...item },
        });
      }

      const nextDueDate = getNextMaintenanceDate(now, p.frequency, p.frequencyValue ?? 1);
      await this.plan.update({
        where: { id: p.id },
        data: { lastExecutedAt: now, nextDueDate },
      });
      generated++;
    }
    return generated;
  }

  async createOrder(companyId: string, data: Record<string, unknown>) {
    const last = await this.order.findFirst({
      where: { companyId }, orderBy: { code: "desc" },
    });
    const nextCode = ((last?.code as number) ?? 0) + 1;
    return this.order.create({
      data: { companyId, code: nextCode, status: "PLANNED", ...data },
    });
  }

  async startOrder(orderId: string) {
    return this.order.update({
      where: { id: orderId },
      data: { status: "IN_PROGRESS", actualStart: new Date() },
    });
  }

  async completeOrder(orderId: string, solution?: string, completedBy?: string) {
    const o = await this.order.findUnique({ where: { id: orderId } });
    if (!o) throw new Error("Ordem não encontrada");

    const actualEnd = new Date();
    const actualDuration = o.actualStart
      ? calculateDurationMinutes(new Date(o.actualStart as string), actualEnd)
      : null;

    return this.order.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED", actualEnd, actualDuration,
        solution, completedBy,
      },
    });
  }

  async cancelOrder(orderId: string, reason: string, cancelledBy?: string) {
    return this.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED", cancelReason: reason,
        cancelledBy, cancelledAt: new Date(),
      },
    });
  }

  async getEquipmentKPIs(companyId: string, equipmentId: string): Promise<MaintenanceKPIs> {
    const equipment = await this.equipment.findFirst({
      where: { id: equipmentId, companyId },
    });

    const orders = await this.order.findMany({
      where: { equipmentId, companyId },
      include: { parts: true, labor: true },
    });

    const completed = orders.filter((o: any) => o.status === "COMPLETED");
    const corrective = completed.filter((o: any) => o.type === "CORRECTIVE");
    const preventive = completed.filter((o: any) => o.type === "PREVENTIVE");
    const open = orders.filter((o: any) => !["COMPLETED", "CANCELLED"].includes(o.status));

    const totalRepairMinutes = corrective.reduce(
      (sum: number, o: any) => sum + (o.actualDuration ?? 0), 0,
    );

    const operatingHours = Number(equipment?.operatingHours ?? 0);
    const failureCount = corrective.length;

    const mtbf = calculateMTBF(operatingHours, failureCount);
    const mttr = calculateMTTR(totalRepairMinutes, failureCount);
    const availability = calculateAvailability(mtbf, mttr);

    let totalCost = 0;
    for (const o of completed) {
      const partsCost = (o.parts as any[]).reduce(
        (s: number, p: any) => s + Number(p.totalCost ?? 0), 0,
      );
      const laborCost = (o.labor as any[]).reduce(
        (s: number, l: any) => s + Number(l.totalCost ?? 0), 0,
      );
      totalCost += calculateMaintenanceCost(partsCost, laborCost);
    }

    return {
      mtbf, mttr, availability,
      totalOrders: orders.length,
      completedOrders: completed.length,
      openOrders: open.length,
      totalCost,
      preventiveRatio: calculatePreventiveRatio(preventive.length, completed.length),
    };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
