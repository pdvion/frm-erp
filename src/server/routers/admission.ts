import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { auditUpdate } from "../services/audit";

// Constants
const MAX_PAGE_SIZE = 100;

// CPF validation helper
function isValidCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === parseInt(cleaned[10]);
}

const admissionStatusEnum = z.enum([
  "DRAFT", "DOCUMENTS", "EXAM", "APPROVAL", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"
]);
const examResultEnum = z.enum(["PENDING", "FIT", "UNFIT", "FIT_RESTRICTIONS"]);

const DEFAULT_STEPS = [
  { stepNumber: 1, stepName: "Coleta de Documentos", stepType: "DOCUMENT" as const },
  { stepNumber: 2, stepName: "Exame Admissional", stepType: "EXAM" as const },
  { stepNumber: 3, stepName: "Aprovação do Gestor", stepType: "APPROVAL" as const },
  { stepNumber: 4, stepName: "Assinatura do Contrato", stepType: "SIGNATURE" as const },
  { stepNumber: 5, stepName: "Cadastro no Sistema", stepType: "SYSTEM" as const },
];

const REQUIRED_DOCUMENTS = [
  { documentType: "CPF", documentName: "CPF", isRequired: true },
  { documentType: "RG", documentName: "RG ou CNH", isRequired: true },
  { documentType: "CTPS", documentName: "Carteira de Trabalho", isRequired: true },
  { documentType: "COMPROVANTE_RESIDENCIA", documentName: "Comprovante de Residência", isRequired: true },
  { documentType: "TITULO_ELEITOR", documentName: "Título de Eleitor", isRequired: false },
  { documentType: "CERTIFICADO_RESERVISTA", documentName: "Certificado de Reservista", isRequired: false },
  { documentType: "FOTO_3X4", documentName: "Foto 3x4", isRequired: true },
  { documentType: "CERTIDAO_NASCIMENTO_FILHOS", documentName: "Certidão de Nascimento dos Filhos", isRequired: false },
  { documentType: "COMPROVANTE_ESCOLARIDADE", documentName: "Comprovante de Escolaridade", isRequired: false },
];

export const admissionRouter = createTRPCRouter({
  // Listar processos de admissão
  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      status: admissionStatusEnum.optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(MAX_PAGE_SIZE).default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, status, page = 1, limit = 20 } = input || {};
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };

      if (search) {
        where.OR = [
          { candidateName: { contains: search, mode: "insensitive" as const } },
          { candidateEmail: { contains: search, mode: "insensitive" as const } },
          { candidateCpf: { contains: search } },
        ];
      }

      if (status) where.status = status;

      const [admissions, total] = await Promise.all([
        prisma.admissionProcess.findMany({
          where,
          include: {
            _count: { select: { admission_documents: true, admission_steps: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.admissionProcess.count({ where }),
      ]);

      return { admissions, total, page, pages: Math.ceil(total / limit) };
    }),

  // Obter processo por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const admission = await prisma.admissionProcess.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          admission_steps: { orderBy: { stepNumber: "asc" } },
          admission_documents: { orderBy: { documentType: "asc" } },
          admission_exams: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      return admission;
    }),

  // Criar novo processo de admissão
  create: tenantProcedure
    .input(z.object({
      candidateName: z.string().min(1),
      candidateEmail: z.string().email().optional(),
      candidatePhone: z.string().optional(),
      candidateCpf: z.string().refine((val) => !val || isValidCpf(val), {
        message: "CPF inválido",
      }).optional(),
      positionId: z.string().optional(),
      departmentId: z.string().optional(),
      proposedSalary: z.number().optional(),
      proposedStartDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admission = await prisma.admissionProcess.create({
        data: {
          companyId: ctx.companyId,
          candidateName: input.candidateName,
          candidateEmail: input.candidateEmail,
          candidatePhone: input.candidatePhone,
          candidateCpf: input.candidateCpf,
          positionId: input.positionId,
          departmentId: input.departmentId,
          proposedSalary: input.proposedSalary,
          proposedStartDate: input.proposedStartDate ? new Date(input.proposedStartDate) : undefined,
          notes: input.notes,
          recruiterId: ctx.tenant.userId,
          totalSteps: DEFAULT_STEPS.length,
          admission_steps: {
            create: DEFAULT_STEPS.map((step) => ({
              ...step,
              status: step.stepNumber === 1 ? "IN_PROGRESS" : "PENDING",
            })),
          },
          admission_documents: {
            create: REQUIRED_DOCUMENTS,
          },
        },
        include: {
          admission_steps: true,
          admission_documents: true,
        },
      });

      return admission;
    }),

  // Atualizar processo
  update: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      candidateName: z.string().optional(),
      candidateEmail: z.string().optional(),
      candidatePhone: z.string().optional(),
      candidateCpf: z.string().optional(),
      positionId: z.string().optional(),
      departmentId: z.string().optional(),
      proposedSalary: z.number().optional(),
      proposedStartDate: z.string().optional(),
      managerId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, proposedStartDate, ...data } = input;
      
      // Validate tenant ownership
      const existing = await prisma.admissionProcess.findFirst({
        where: { id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }
      
      const updated = await prisma.admissionProcess.update({
        where: { id },
        data: {
          ...data,
          proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : undefined,
        },
      });
      
      await auditUpdate("AdmissionProcess", id, existing.candidateName, existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });
      return updated;
    }),

  // Upload de documento
  uploadDocument: tenantProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      fileUrl: z.string(),
    }))
    .mutation(async ({ input }) => {
      return prisma.admissionDocument.update({
        where: { id: input.documentId },
        data: {
          fileUrl: input.fileUrl,
          status: "UPLOADED",
          uploadedAt: new Date(),
        },
      });
    }),

  // Verificar documento
  verifyDocument: tenantProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      approved: z.boolean(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return prisma.admissionDocument.update({
        where: { id: input.documentId },
        data: {
          status: input.approved ? "VERIFIED" : "REJECTED",
          verifiedAt: new Date(),
          verifiedBy: ctx.tenant.userId,
          rejectionReason: input.approved ? null : input.rejectionReason,
        },
      });
    }),

  // Agendar exame
  scheduleExam: tenantProcedure
    .input(z.object({
      admissionId: z.string().uuid(),
      examType: z.string().default("ADMISSIONAL"),
      clinicName: z.string().optional(),
      scheduledDate: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.admissionExam.create({
        data: {
          admissionId: input.admissionId,
          examType: input.examType,
          clinicName: input.clinicName,
          scheduledDate: new Date(input.scheduledDate),
          notes: input.notes,
        },
      });
    }),

  // Registrar resultado do exame
  recordExamResult: tenantProcedure
    .input(z.object({
      examId: z.string().uuid(),
      result: examResultEnum,
      asoNumber: z.string().optional(),
      asoUrl: z.string().optional(),
      validUntil: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.admissionExam.update({
        where: { id: input.examId },
        data: {
          result: input.result,
          completedDate: new Date(),
          asoNumber: input.asoNumber,
          asoUrl: input.asoUrl,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
          notes: input.notes,
        },
      });
    }),

  // Completar etapa
  completeStep: tenantProcedure
    .input(z.object({
      stepId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const step = await prisma.admissionStep.update({
        where: { id: input.stepId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          completedBy: ctx.tenant.userId,
          notes: input.notes,
        },
        include: { admissionProcess: true },
      });

      // Avançar para próxima etapa
      const nextStep = await prisma.admissionStep.findFirst({
        where: {
          admissionId: step.admissionId,
          stepNumber: step.stepNumber + 1,
        },
      });

      if (nextStep) {
        await prisma.admissionStep.update({
          where: { id: nextStep.id },
          data: { status: "IN_PROGRESS" },
        });

        await prisma.admissionProcess.update({
          where: { id: step.admissionId },
          data: { currentStep: nextStep.stepNumber },
        });
      }

      return step;
    }),

  // Aprovar admissão
  approve: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.admissionProcess.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          notes: input.notes,
        },
      });
    }),

  // Rejeitar admissão
  reject: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      return prisma.admissionProcess.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          notes: input.reason,
        },
      });
    }),

  // Completar admissão (criar funcionário)
  complete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const admission = await prisma.admissionProcess.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      if (admission.status !== "APPROVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Processo precisa estar aprovado" });
      }

      // Buscar próximo código de funcionário
      const lastEmployee = await prisma.employee.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastEmployee?.code || 0) + 1;

      // Criar funcionário
      const employee = await prisma.employee.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          name: admission.candidateName,
          cpf: admission.candidateCpf,
          email: admission.candidateEmail,
          phone: admission.candidatePhone,
          positionId: admission.positionId,
          departmentId: admission.departmentId,
          salary: admission.proposedSalary || 0,
          hireDate: admission.proposedStartDate || new Date(),
          status: "ACTIVE",
          createdBy: ctx.tenant.userId,
        },
      });

      // Atualizar processo
      await prisma.admissionProcess.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return { admission, employee };
    }),

  // Cancelar admissão
  cancel: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      return prisma.admissionProcess.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: input.reason,
        },
      });
    }),

  // Dashboard
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const [
      total,
      draft,
      inProgress,
      approved,
      completed,
      rejected,
      byStatus,
    ] = await Promise.all([
      prisma.admissionProcess.count({ where: { companyId: ctx.companyId } }),
      prisma.admissionProcess.count({ where: { companyId: ctx.companyId, status: "DRAFT" } }),
      prisma.admissionProcess.count({
        where: {
          companyId: ctx.companyId,
          status: { in: ["DOCUMENTS", "EXAM", "APPROVAL"] },
        },
      }),
      prisma.admissionProcess.count({ where: { companyId: ctx.companyId, status: "APPROVED" } }),
      prisma.admissionProcess.count({ where: { companyId: ctx.companyId, status: "COMPLETED" } }),
      prisma.admissionProcess.count({ where: { companyId: ctx.companyId, status: "REJECTED" } }),
      prisma.admissionProcess.groupBy({
        by: ["status"],
        where: { companyId: ctx.companyId },
        _count: true,
      }),
    ]);

    return {
      total,
      draft,
      inProgress,
      approved,
      completed,
      rejected,
      byStatus: byStatus.map((s: { status: string; _count: number }) => ({
        status: s.status,
        count: s._count,
      })),
    };
  }),
});
