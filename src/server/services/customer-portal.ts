/**
 * Customer Portal Service
 * VIO-1124 — Portal do Cliente (Pedidos, boletos, tracking)
 *
 * Pure functions + class for token management and customer data queries.
 * Pattern follows admission-portal.ts (VIO-1102).
 */

import type { PrismaClient } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_DEFAULT_EXPIRY_DAYS = 30;
const TOKEN_MAX_EXPIRY_DAYS = 365;

// ─── Pure Functions ───────────────────────────────────────────────────────────

export function calculateTokenExpiry(days?: number): Date {
  const d = Math.min(Math.max(days ?? TOKEN_DEFAULT_EXPIRY_DAYS, 1), TOKEN_MAX_EXPIRY_DAYS);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + d);
  return expiresAt;
}

export function isTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
}

export function isTokenRevoked(revokedAt: Date | null | undefined): boolean {
  return revokedAt != null;
}

export function formatCurrency(value: unknown): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

// ─── Service Class ────────────────────────────────────────────────────────────

export class CustomerPortalService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a new portal token for a customer.
   */
  async generateToken(
    companyId: string,
    customerId: string,
    createdBy: string | null,
    expiresInDays?: number
  ) {
    const expiresAt = calculateTokenExpiry(expiresInDays);

    const portalToken = await this.prisma.customerPortalToken.create({
      data: {
        companyId,
        customerId,
        expiresAt,
        createdBy,
      },
    });

    return { token: portalToken.token, expiresAt: portalToken.expiresAt };
  }

  /**
   * Revoke a portal token.
   */
  async revokeToken(tokenId: string, companyId: string) {
    const existing = await this.prisma.customerPortalToken.findFirst({
      where: { id: tokenId, companyId },
    });
    if (!existing) return null;

    return this.prisma.customerPortalToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * List active tokens for a customer.
   */
  async listTokens(companyId: string, customerId: string) {
    return this.prisma.customerPortalToken.findMany({
      where: {
        companyId,
        customerId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  /**
   * Validate a token and return customer + company info.
   * Returns null if token is invalid/expired/revoked.
   */
  async validateToken(token: string) {
    const portalToken = await this.prisma.customerPortalToken.findUnique({
      where: { token },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            companyName: true,
            tradeName: true,
            cnpj: true,
            email: true,
            phone: true,
            contactName: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true,
            cnpj: true,
          },
        },
      },
    });

    if (!portalToken) return null;
    if (isTokenExpired(portalToken.expiresAt)) return { expired: true as const };
    if (isTokenRevoked(portalToken.revokedAt)) return { revoked: true as const };

    // Update lastUsedAt
    await this.prisma.customerPortalToken.update({
      where: { id: portalToken.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => { /* non-critical */ });

    return portalToken;
  }

  /**
   * Get customer orders (paginated).
   */
  async getOrders(
    companyId: string,
    customerId: string,
    options: { limit?: number; offset?: number; status?: string }
  ) {
    const where: Record<string, unknown> = {
      companyId,
      customerId,
      deletedAt: null,
    };
    if (options.status) where.status = options.status;

    const [items, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          orderDate: true,
          deliveryDate: true,
          shippedAt: true,
          deliveredAt: true,
          totalValue: true,
          trackingCode: true,
          invoiceNumber: true,
          paymentTerms: true,
        },
        orderBy: { orderDate: "desc" },
        take: options.limit ?? 20,
        skip: options.offset ?? 0,
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return {
      items: items.map((o) => ({
        ...o,
        totalValue: Number(o.totalValue),
      })),
      total,
    };
  }

  /**
   * Get a single order detail with items.
   */
  async getOrderDetail(companyId: string, customerId: string, orderId: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: orderId, companyId, customerId, deletedAt: null },
      include: {
        items: {
          include: {
            material: {
              select: { id: true, description: true, code: true, unit: true },
            },
          },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      code: order.code,
      status: order.status,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      paymentTerms: order.paymentTerms,
      shippingMethod: order.shippingMethod,
      trackingCode: order.trackingCode,
      invoiceNumber: order.invoiceNumber,
      subtotal: Number(order.subtotal),
      discountValue: Number(order.discountValue),
      shippingValue: Number(order.shippingValue),
      taxValue: Number(order.taxValue),
      totalValue: Number(order.totalValue),
      notes: order.notes,
      items: order.items.map((item) => ({
        id: item.id,
        material: item.material,
        description: item.description,
        quantity: Number(item.quantity),
        deliveredQty: Number(item.deliveredQty),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    };
  }

  /**
   * Get customer receivables (boletos/faturas).
   */
  async getReceivables(
    companyId: string,
    customerId: string,
    options: { limit?: number; offset?: number; status?: string }
  ) {
    const where: Record<string, unknown> = {
      companyId,
      customerId,
      deletedAt: null,
    };
    if (options.status) where.status = options.status;

    const [items, total] = await Promise.all([
      this.prisma.accountsReceivable.findMany({
        where,
        select: {
          id: true,
          code: true,
          documentType: true,
          documentNumber: true,
          description: true,
          dueDate: true,
          issueDate: true,
          originalValue: true,
          paidValue: true,
          netValue: true,
          status: true,
          paidAt: true,
          installmentNumber: true,
          totalInstallments: true,
          boletoUrl: true,
          pixCode: true,
        },
        orderBy: { dueDate: "desc" },
        take: options.limit ?? 20,
        skip: options.offset ?? 0,
      }),
      this.prisma.accountsReceivable.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        ...r,
        originalValue: Number(r.originalValue),
        paidValue: Number(r.paidValue),
        netValue: Number(r.netValue),
      })),
      total,
    };
  }

  /**
   * Get financial summary for the customer.
   */
  async getFinancialSummary(companyId: string, customerId: string) {
    const receivables = await this.prisma.accountsReceivable.findMany({
      where: { companyId, customerId, deletedAt: null },
      select: {
        status: true,
        netValue: true,
        originalValue: true,
        paidValue: true,
        dueDate: true,
      },
    });

    const now = new Date();
    let totalPending = 0;
    let totalOverdue = 0;
    let totalPaid = 0;
    let countPending = 0;
    let countOverdue = 0;
    let countPaid = 0;

    for (const r of receivables) {
      const val = Number(r.netValue);
      if (r.status === "PAID") {
        totalPaid += Number(r.paidValue);
        countPaid++;
      } else if (r.status === "PENDING" || r.status === "PARTIAL") {
        if (new Date(r.dueDate) < now) {
          totalOverdue += val;
          countOverdue++;
        } else {
          totalPending += val;
          countPending++;
        }
      }
    }

    return {
      totalPending,
      totalOverdue,
      totalPaid,
      countPending,
      countOverdue,
      countPaid,
    };
  }
}
