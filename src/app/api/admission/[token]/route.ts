/**
 * API Pública — Portal do Candidato
 * VIO-1102 — Admissão Digital Fase 3
 * 
 * GET /api/admission/[token] — Dados do processo + documentos pendentes
 * Sem autenticação — acesso via token único
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/server/services/admission-portal";

async function findAdmissionByToken(token: string) {
  const admission = await prisma.admissionProcess.findUnique({
    where: { accessToken: token },
    include: {
      admission_documents: {
        orderBy: { documentType: "asc" },
        select: {
          id: true,
          documentType: true,
          documentName: true,
          fileUrl: true,
          status: true,
          isRequired: true,
          uploadedAt: true,
          rejectionReason: true,
        },
      },
      admission_steps: {
        orderBy: { stepNumber: "asc" },
        select: {
          id: true,
          stepNumber: true,
          stepName: true,
          stepType: true,
          status: true,
        },
      },
    },
  });

  if (!admission) return null;

  if (isTokenExpired(admission.tokenExpiresAt)) {
    return { expired: true } as const;
  }

  return admission;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 36) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const result = await findAdmissionByToken(token);

    if (!result) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
    }

    if ("expired" in result) {
      return NextResponse.json({ error: "Link expirado. Solicite um novo link ao RH." }, { status: 410 });
    }

    const admission = result;

    return NextResponse.json({
      id: admission.id,
      candidateName: admission.candidateName,
      candidateEmail: admission.candidateEmail,
      candidatePhone: admission.candidatePhone,
      candidateCpf: admission.candidateCpf,
      candidateRg: admission.candidateRg,
      candidateBirthDate: admission.candidateBirthDate,
      candidateGender: admission.candidateGender,
      candidateMaritalStatus: admission.candidateMaritalStatus,
      candidateMobile: admission.candidateMobile,
      candidateAddress: admission.candidateAddress,
      candidateAddressNumber: admission.candidateAddressNumber,
      candidateAddressComplement: admission.candidateAddressComplement,
      candidateAddressNeighborhood: admission.candidateAddressNeighborhood,
      candidateAddressCity: admission.candidateAddressCity,
      candidateAddressState: admission.candidateAddressState,
      candidateAddressZipCode: admission.candidateAddressZipCode,
      candidatePis: admission.candidatePis,
      candidateCtps: admission.candidateCtps,
      candidateCtpsSeries: admission.candidateCtpsSeries,
      candidateVoterRegistration: admission.candidateVoterRegistration,
      candidateMilitaryService: admission.candidateMilitaryService,
      candidateBankName: admission.candidateBankName,
      candidateBankCode: admission.candidateBankCode,
      candidateBankBranch: admission.candidateBankBranch,
      candidateBankAgency: admission.candidateBankAgency,
      candidateBankAccount: admission.candidateBankAccount,
      candidateBankAccountDigit: admission.candidateBankAccountDigit,
      candidateBankAccountType: admission.candidateBankAccountType,
      candidatePixKey: admission.candidatePixKey,
      status: admission.status,
      documents: admission.admission_documents,
      steps: admission.admission_steps,
      tokenExpiresAt: admission.tokenExpiresAt,
    });
  } catch (error) {
    console.error("Admission portal API error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
