/**
 * REST API v1 — Sales Orders
 * VIO-1123
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  isErrorResponse,
  parsePagination,
  paginationMeta,
  apiHeaders,
  handleOptions,
} from "@/lib/api-auth";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request, "ORDERS_READ");
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const customerId = searchParams.get("customer_id") || undefined;
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;

    const where: Record<string, unknown> = {
      companyId: auth.companyId,
    };

    if (search) {
      where.OR = [
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.orderDate = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, code: true, companyName: true } },
          items: {
            select: {
              id: true,
              materialId: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              material: { select: { id: true, code: true, description: true, unit: true } },
            },
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return NextResponse.json(
      { data: orders, pagination: paginationMeta(total, page, limit) },
      { headers: apiHeaders() }
    );
  } catch (e: unknown) {
    console.error("API v1 /orders error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: apiHeaders() }
    );
  }
}
