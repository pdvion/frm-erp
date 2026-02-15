/**
 * API Pública — Portal do Fornecedor: Pagamentos
 * GET /api/portal/supplier/[token]/payables
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SupplierPortalService } from "@/server/services/supplier-portal";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const svc = new SupplierPortalService(prisma);
    const result = await svc.validateToken(token);

    if (!result || "expired" in result || "revoked" in result) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit"));
    const limit = Math.min(Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 20, 50);
    const offsetParam = Number(url.searchParams.get("offset"));
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? Math.floor(offsetParam) : 0;
    const status = url.searchParams.get("status") || undefined;

    const data = await svc.getPayables(result.companyId, result.supplierId, {
      limit,
      offset,
      status,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Supplier portal payables error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
