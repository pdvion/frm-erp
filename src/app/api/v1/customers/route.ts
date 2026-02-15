/**
 * REST API v1 — Customers
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
  const auth = await authenticateApiKey(request, "CUSTOMERS_READ");
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: Prisma.CustomerWhereInput = {
      companyId: auth.companyId,
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: "insensitive" as const } },
          { tradeName: { contains: search, mode: "insensitive" as const } },
          { cnpj: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status: status as Prisma.CustomerWhereInput["status"] }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          code: true,
          companyName: true,
          tradeName: true,
          cnpj: true,
          stateRegistration: true,
          email: true,
          phone: true,
          status: true,
          addressCity: true,
          addressState: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { companyName: "asc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json(
      { data: customers, pagination: paginationMeta(total, page, limit) },
      { headers: apiHeaders() }
    );
  } catch (e: unknown) {
    console.error("API v1 /customers error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: apiHeaders() }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request, "CUSTOMERS_WRITE");
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();

    if (!body.companyName) {
      return NextResponse.json(
        { error: "companyName is required" },
        { status: 400, headers: apiHeaders() }
      );
    }

    const lastCustomer = await prisma.customer.findFirst({
      where: { companyId: auth.companyId },
      orderBy: { code: "desc" },
      select: { code: true },
    });
    const nextCode = String((parseInt(lastCustomer?.code || "0") || 0) + 1);

    const customer = await prisma.customer.create({
      data: {
        companyId: auth.companyId,
        code: nextCode,
        companyName: body.companyName,
        tradeName: body.tradeName || null,
        cnpj: body.cnpj || null,
        stateRegistration: body.stateRegistration || null,
        email: body.email || null,
        phone: body.phone || null,
        addressCity: body.addressCity || null,
        addressState: body.addressState || null,
        addressStreet: body.addressStreet || null,
        addressNeighborhood: body.addressNeighborhood || null,
        addressZipCode: body.addressZipCode || null,
      },
    });

    return NextResponse.json(
      { data: customer },
      { status: 201, headers: apiHeaders() }
    );
  } catch (e: unknown) {
    console.error("API v1 POST /customers error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: apiHeaders() }
    );
  }
}
