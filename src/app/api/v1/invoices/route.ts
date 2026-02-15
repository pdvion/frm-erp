/**
 * REST API v1 — Invoices (Issued Invoices / NF-e)
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
  const auth = await authenticateApiKey(request, "INVOICES_READ");
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;

    const where: Record<string, unknown> = {
      companyId: auth.companyId,
    };

    if (search) {
      where.OR = [
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status) where.status = status;
    if (startDate || endDate) {
      where.issueDate = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        select: {
          id: true,
          code: true,
          invoiceNumber: true,
          status: true,
          orderDate: true,
          totalValue: true,
          customer: { select: { id: true, code: true, companyName: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return NextResponse.json(
      { data: invoices, pagination: paginationMeta(total, page, limit) },
      { headers: apiHeaders() }
    );
  } catch (e: unknown) {
    console.error("API v1 /invoices error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: apiHeaders() }
    );
  }
}
