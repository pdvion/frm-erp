/**
 * REST API v1 — Products (Materials)
 * VIO-1123
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
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
  const auth = await authenticateApiKey(request, "PRODUCTS_READ");
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("category_id") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: Prisma.MaterialWhereInput = {
      companyId: auth.companyId,
      ...(search && {
        OR: [
          { description: { contains: search, mode: "insensitive" as const } },
          { internalCode: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(status && { status: status as Prisma.MaterialWhereInput["status"] }),
    };

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        select: {
          id: true,
          code: true,
          internalCode: true,
          description: true,
          unit: true,
          status: true,
          categoryId: true,
          minQuantity: true,
          maxQuantity: true,
          lastPurchasePrice: true,
          lastPurchasePriceAvg: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { code: "asc" },
        skip,
        take: limit,
      }),
      prisma.material.count({ where }),
    ]);

    return NextResponse.json(
      { data: materials, pagination: paginationMeta(total, page, limit) },
      { headers: apiHeaders() }
    );
  } catch (e: unknown) {
    console.error("API v1 /products error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: apiHeaders() }
    );
  }
}
