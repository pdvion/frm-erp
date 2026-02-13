/**
 * API Pública — Portal do Candidato: Atualizar dados pessoais
 * VIO-1102 — Admissão Digital Fase 3
 * 
 * POST /api/admission/[token]/data — Preencher/atualizar dados pessoais
 * Sem autenticação — acesso via token único
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_FIELDS = [
  "candidateRg",
  "candidateBirthDate",
  "candidateGender",
  "candidateMaritalStatus",
  "candidateMobile",
  "candidateAddress",
  "candidateAddressNumber",
  "candidateAddressComplement",
  "candidateAddressNeighborhood",
  "candidateAddressCity",
  "candidateAddressState",
  "candidateAddressZipCode",
  "candidatePis",
  "candidateCtps",
  "candidateCtpsSeries",
  "candidateVoterRegistration",
  "candidateMilitaryService",
  "candidateBankName",
  "candidateBankCode",
  "candidateBankBranch",
  "candidateBankAgency",
  "candidateBankAccount",
  "candidateBankAccountDigit",
  "candidateBankAccountType",
  "candidatePixKey",
] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 36) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const admission = await prisma.admissionProcess.findUnique({
      where: { accessToken: token },
    });

    if (!admission) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
    }

    if (admission.tokenExpiresAt && admission.tokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "Link expirado. Solicite um novo link ao RH." }, { status: 410 });
    }

    if (admission.status === "COMPLETED" || admission.status === "CANCELLED" || admission.status === "REJECTED") {
      return NextResponse.json({ error: "Este processo não aceita mais alterações." }, { status: 403 });
    }

    const body = await request.json();

    // Filter only allowed fields (prevent candidate from changing status, salary, etc.)
    const data: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body && body[field] !== undefined) {
        if (field === "candidateBirthDate" && body[field]) {
          data[field] = new Date(body[field]);
        } else {
          data[field] = body[field];
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido enviado" }, { status: 400 });
    }

    const updated = await prisma.admissionProcess.update({
      where: { id: admission.id },
      data,
    });

    return NextResponse.json({
      success: true,
      updatedFields: Object.keys(data),
      candidateName: updated.candidateName,
    });
  } catch (error) {
    console.error("Admission portal data update error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
