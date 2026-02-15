/**
 * Supplier Portal Service
 * VIO-1125 — Portal do Fornecedor (Cotações, pagamentos, documentos)
 *
 * Pure functions + class for token management and supplier data queries.
 * Pattern follows customer-portal.ts (VIO-1124).
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

// ─── Service Class ────────────────────────────────────────────────────────────

export class SupplierPortalService {
  constructor(private prisma: PrismaClient) {}

  // ─── Token Management ───────────────────────────────────────────────────

  async generateToken(
    companyId: string,
    supplierId: string,
    createdBy: string | null,
    expiresInDays?: number
  ) {
    const expiresAt = calculateTokenExpiry(expiresInDays);

    const portalToken = await this.prisma.supplierPortalToken.create({
      data: {
        companyId,
        supplierId,
        expiresAt,
        createdBy,
      },
    });

    return { token: portalToken.token, expiresAt: portalToken.expiresAt };
  }

  async revokeToken(tokenId: string, companyId: string) {
    const existing = await this.prisma.supplierPortalToken.findFirst({
      where: { id: tokenId, companyId },
    });
    if (!existing) throw new Error("Token não encontrado");

    return this.prisma.supplierPortalToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async listTokens(companyId: string, supplierId: string) {
    return this.prisma.supplierPortalToken.findMany({
      where: { companyId, supplierId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  async validateToken(token: string) {
    const portalToken = await this.prisma.supplierPortalToken.findUnique({
      where: { token },
      include: {
        supplier: {
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

    // Update lastUsedAt (non-critical)
    await this.prisma.supplierPortalToken.update({
      where: { id: portalToken.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => { /* non-critical */ });

    return portalToken;
  }

  // ─── Quotes ─────────────────────────────────────────────────────────────

  async getQuotes(
    supplierId: string,
    options: { limit?: number; offset?: number; status?: string }
  ) {
    const where: Record<string, unknown> = { supplierId };
    if (options.status) where.status = options.status;

    const [items, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          requestDate: true,
          responseDate: true,
          validUntil: true,
          totalValue: true,
          paymentTerms: true,
          deliveryTerms: true,
          notes: true,
        },
        orderBy: { requestDate: "desc" },
        take: options.limit ?? 20,
        skip: options.offset ?? 0,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      items: items.map((q) => ({
        ...q,
        totalValue: Number(q.totalValue),
      })),
      total,
    };
  }

  async getQuoteDetail(supplierId: string, quoteId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, supplierId },
      include: {
        items: {
          include: {
            material: {
              select: { id: true, description: true, code: true, unit: true },
            },
          },
        },
      },
    });

    if (!quote) return null;

    return {
      id: quote.id,
      code: quote.code,
      status: quote.status,
      requestDate: quote.requestDate,
      responseDate: quote.responseDate,
      validUntil: quote.validUntil,
      paymentTerms: quote.paymentTerms,
      deliveryTerms: quote.deliveryTerms,
      freightValue: Number(quote.freightValue),
      discountPercent: Number(quote.discountPercent),
      totalValue: Number(quote.totalValue),
      notes: quote.notes,
      items: quote.items.map((item) => ({
        id: item.id,
        material: item.material,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        deliveryDays: item.deliveryDays,
        notes: item.notes,
      })),
    };
  }

  /**
   * Supplier responds to a quote — fills in prices and delivery days per item.
   * Only allowed for quotes in SENT or DRAFT status.
   */
  async respondToQuote(
    supplierId: string,
    quoteId: string,
    response: {
      paymentTerms?: string;
      deliveryTerms?: string;
      validUntil?: string;
      items: { id: string; unitPrice: number; deliveryDays?: number; notes?: string }[];
    }
  ) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, supplierId, status: { in: ["DRAFT", "SENT"] } },
      include: { items: true },
    });

    if (!quote) throw new Error("Cotação não encontrada ou já respondida");

    // Update items with supplier prices
    await this.prisma.$transaction(async (tx) => {
      for (const itemResp of response.items) {
        const existing = quote.items.find((i) => i.id === itemResp.id);
        if (!existing) continue;

        const totalPrice = itemResp.unitPrice * Number(existing.quantity);
        await tx.quoteItem.update({
          where: { id: itemResp.id },
          data: {
            unitPrice: itemResp.unitPrice,
            totalPrice,
            deliveryDays: itemResp.deliveryDays ?? existing.deliveryDays,
            notes: itemResp.notes ?? existing.notes,
          },
        });
      }

      // Recalculate quote total
      const updatedItems = await tx.quoteItem.findMany({
        where: { quoteId },
        select: { totalPrice: true },
      });
      const totalValue = updatedItems.reduce((sum, i) => sum + Number(i.totalPrice), 0);

      await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: "RECEIVED",
          responseDate: new Date(),
          totalValue,
          paymentTerms: response.paymentTerms ?? quote.paymentTerms,
          deliveryTerms: response.deliveryTerms ?? quote.deliveryTerms,
          validUntil: response.validUntil ? new Date(response.validUntil) : quote.validUntil,
        },
      });
    });

    return { success: true };
  }

  // ─── Purchase Orders ────────────────────────────────────────────────────

  async getPurchaseOrders(
    companyId: string,
    supplierId: string,
    options: { limit?: number; offset?: number; status?: string }
  ) {
    const where: Record<string, unknown> = {
      companyId,
      supplierId,
      deletedAt: null,
    };
    if (options.status) where.status = options.status;

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          orderDate: true,
          expectedDeliveryDate: true,
          actualDeliveryDate: true,
          totalValue: true,
          paymentTerms: true,
          notes: true,
        },
        orderBy: { orderDate: "desc" },
        take: options.limit ?? 20,
        skip: options.offset ?? 0,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      items: items.map((po) => ({
        ...po,
        totalValue: Number(po.totalValue),
      })),
      total,
    };
  }

  async getPurchaseOrderDetail(companyId: string, supplierId: string, orderId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: orderId, companyId, supplierId, deletedAt: null },
      include: {
        items: {
          include: {
            material: {
              select: { id: true, description: true, code: true, unit: true },
            },
          },
        },
      },
    });

    if (!po) return null;

    return {
      id: po.id,
      code: po.code,
      status: po.status,
      orderDate: po.orderDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      actualDeliveryDate: po.actualDeliveryDate,
      paymentTerms: po.paymentTerms,
      deliveryTerms: po.deliveryTerms,
      freightValue: Number(po.freightValue),
      discountPercent: Number(po.discountPercent),
      totalValue: Number(po.totalValue),
      notes: po.notes,
      items: po.items.map((item) => ({
        id: item.id,
        material: item.material,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        receivedQty: Number(item.receivedQty),
        deliveryDays: item.deliveryDays,
        notes: item.notes,
      })),
    };
  }

  // ─── Payables (payments to supplier) ────────────────────────────────────

  async getPayables(
    companyId: string,
    supplierId: string,
    options: { limit?: number; offset?: number; status?: string }
  ) {
    const where: Record<string, unknown> = {
      companyId,
      supplierId,
      deletedAt: null,
    };
    if (options.status) where.status = options.status;

    const [items, total] = await Promise.all([
      this.prisma.accountsPayable.findMany({
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
          scheduledPaymentDate: true,
        },
        orderBy: { dueDate: "desc" },
        take: options.limit ?? 20,
        skip: options.offset ?? 0,
      }),
      this.prisma.accountsPayable.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        ...p,
        originalValue: Number(p.originalValue),
        paidValue: Number(p.paidValue),
        netValue: Number(p.netValue),
      })),
      total,
    };
  }

  async getPaymentSummary(companyId: string, supplierId: string) {
    const payables = await this.prisma.accountsPayable.findMany({
      where: { companyId, supplierId, deletedAt: null },
      select: {
        status: true,
        netValue: true,
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

    for (const p of payables) {
      const val = Number(p.netValue);
      if (p.status === "PAID") {
        totalPaid += Number(p.paidValue);
        countPaid++;
      } else if (p.status === "PENDING" || p.status === "PARTIAL") {
        if (new Date(p.dueDate) < now) {
          totalOverdue += val;
          countOverdue++;
        } else {
          totalPending += val;
          countPending++;
        }
      }
    }

    return { totalPending, totalOverdue, totalPaid, countPending, countOverdue, countPaid };
  }
}
