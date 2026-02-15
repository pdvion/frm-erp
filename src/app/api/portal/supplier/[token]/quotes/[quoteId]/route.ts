/**
 * API Pública — Portal do Fornecedor: Detalhe/Resposta de Cotação
 * GET  /api/portal/supplier/[token]/quotes/[quoteId] — Detalhe da cotação
 * POST /api/portal/supplier/[token]/quotes/[quoteId] — Responder cotação
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SupplierPortalService } from "@/server/services/supplier-portal";

async function validateAccess(token: string) {
  const svc = new SupplierPortalService(prisma);
  const result = await svc.validateToken(token);
  if (!result || "expired" in result || "revoked" in result) return null;
  return { svc, result };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; quoteId: string }> }
) {
  try {
    const { token, quoteId } = await params;
    const access = await validateAccess(token);
    if (!access) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const quote = await access.svc.getQuoteDetail(access.result.supplierId, quoteId);
    if (!quote) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });

    return NextResponse.json(quote);
  } catch (error: unknown) {
    console.error("Supplier portal quote detail error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; quoteId: string }> }
) {
  try {
    const { token, quoteId } = await params;
    const access = await validateAccess(token);
    if (!access) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Itens são obrigatórios" }, { status: 400 });
    }

    const invalidItem = body.items.find(
      (item: unknown) =>
        typeof item !== "object" ||
        item === null ||
        typeof (item as Record<string, unknown>).id !== "string" ||
        typeof (item as Record<string, unknown>).unitPrice !== "number"
    );
    if (invalidItem) {
      return NextResponse.json(
        { error: "Estrutura de item inválida: id (string) e unitPrice (number) são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await access.svc.respondToQuote(access.result.supplierId, quoteId, {
      paymentTerms: body.paymentTerms,
      deliveryTerms: body.deliveryTerms,
      validUntil: body.validUntil,
      items: body.items,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Supplier portal quote response error:", message);

    if (message.includes("não encontrada")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
