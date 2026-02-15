/**
 * API Pública — Portal do Cliente: Financeiro (boletos/faturas)
 * GET /api/portal/customer/[token]/receivables
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CustomerPortalService } from "@/server/services/customer-portal";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const svc = new CustomerPortalService(prisma);
    const result = await svc.validateToken(token);

    if (!result || "expired" in result || "revoked" in result) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const status = url.searchParams.get("status") || undefined;

    const data = await svc.getReceivables(result.companyId, result.customerId, {
      limit,
      offset,
      status,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Customer portal receivables error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
