import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { auditUpdate } from "../services/audit";
import { AdmissionNotificationService } from "../services/admission-notification";
// admission-portal service used by API routes, not directly by this router

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
        ctx.prisma.admissionProcess.findMany({
          where,
          include: {
            _count: { select: { admission_documents: true, admission_steps: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.admissionProcess.count({ where }),
      ]);

      return { admissions, total, page, pages: Math.ceil(total / limit) };
    }),

  // Obter processo por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.findFirst({
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
      proposedStartDate: z.coerce.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.create({
        data: {
          companyId: ctx.companyId,
          candidateName: input.candidateName,
          candidateEmail: input.candidateEmail,
          candidatePhone: input.candidatePhone,
          candidateCpf: input.candidateCpf,
          positionId: input.positionId,
          departmentId: input.departmentId,
          proposedSalary: input.proposedSalary,
          proposedStartDate: input.proposedStartDate ?? undefined,
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

      // Notify: process created
      const notifSvc = new AdmissionNotificationService(ctx.prisma);
      await notifSvc.onStatusChange(
        {
          admissionId: admission.id,
          candidateName: admission.candidateName,
          companyId: ctx.companyId,
          recruiterId: admission.recruiterId,
          userId: ctx.tenant.userId ?? ctx.companyId,
        },
        null,
        "DRAFT"
      );

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
      candidateRg: z.string().optional(),
      candidateBirthDate: z.string().optional(),
      candidateGender: z.string().optional(),
      candidateMaritalStatus: z.string().optional(),
      candidateMobile: z.string().optional(),
      candidateAddress: z.string().optional(),
      candidateAddressNumber: z.string().optional(),
      candidateAddressComplement: z.string().optional(),
      candidateAddressNeighborhood: z.string().optional(),
      candidateAddressCity: z.string().optional(),
      candidateAddressState: z.string().optional(),
      candidateAddressZipCode: z.string().optional(),
      positionId: z.string().optional(),
      departmentId: z.string().optional(),
      proposedSalary: z.number().optional(),
      proposedStartDate: z.string().optional(),
      contractType: z.string().optional(),
      workHoursPerDay: z.number().optional(),
      workDaysPerWeek: z.number().optional(),
      managerId: z.string().optional(),
      candidatePis: z.string().optional(),
      candidateCtps: z.string().optional(),
      candidateCtpsSeries: z.string().optional(),
      candidateVoterRegistration: z.string().optional(),
      candidateMilitaryService: z.string().optional(),
      candidateBankName: z.string().optional(),
      candidateBankCode: z.string().optional(),
      candidateBankBranch: z.string().optional(),
      candidateBankAgency: z.string().optional(),
      candidateBankAccount: z.string().optional(),
      candidateBankAccountDigit: z.string().optional(),
      candidateBankAccountType: z.string().optional(),
      candidatePixKey: z.string().optional(),
      candidatePhoto: z.string().nullable().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, proposedStartDate, candidateBirthDate, ...data } = input;
      
      const existing = await ctx.prisma.admissionProcess.findFirst({
        where: { id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }
      
      const updated = await ctx.prisma.admissionProcess.update({
        where: { id },
        data: {
          ...data,
          proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : undefined,
          candidateBirthDate: candidateBirthDate ? new Date(candidateBirthDate) : undefined,
        },
      });

      const PII_FIELDS = [
        "candidateCpf", "candidateRg",
        "candidateBankAccount", "candidateBankAccountDigit", "candidatePixKey",
        "candidateAddress", "candidateAddressNumber", "candidateAddressComplement",
        "candidateAddressNeighborhood", "candidateAddressCity", "candidateAddressState", "candidateAddressZipCode",
        "candidateEmail", "candidatePhone", "candidateMobile",
        "candidatePis", "candidateCtps", "candidateCtpsSeries",
      ] as const;
      const redact = <T extends Record<string, unknown>>(obj: T): T => {
        const copy = { ...obj };
        for (const f of PII_FIELDS) if (f in copy) (copy as Record<string, unknown>)[f] = "[REDACTED]";
        return copy;
      };

      await auditUpdate("AdmissionProcess", id, existing.candidateName, redact(existing), redact(updated), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });
      return updated;
    }),

  // Gerar token de acesso para portal do candidato
  generateToken: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      expiresInDays: z.number().min(1).max(90).default(7),
    }))
    .mutation(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      const token = crypto.randomUUID();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + input.expiresInDays);

      const updated = await ctx.prisma.admissionProcess.update({
        where: { id: input.id },
        data: { accessToken: token, tokenExpiresAt },
      });

      return {
        accessToken: updated.accessToken,
        tokenExpiresAt: updated.tokenExpiresAt,
        portalUrl: `/admission/portal/${token}`,
      };
    }),

  // Revogar token de acesso
  revokeToken: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      return ctx.prisma.admissionProcess.update({
        where: { id: input.id },
        data: { accessToken: null, tokenExpiresAt: null },
      });
    }),

  // Upload de documento
  uploadDocument: tenantProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      fileUrl: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const doc = await ctx.prisma.admissionDocument.findFirst({
        where: { id: input.documentId },
        include: { admissionProcess: { select: { companyId: true } } },
      });
      if (!doc || doc.admissionProcess.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado" });
      }

      const updated = await ctx.prisma.admissionDocument.update({
        where: { id: input.documentId },
        data: {
          fileUrl: input.fileUrl,
          status: "UPLOADED",
          uploadedAt: new Date(),
        },
        include: { admissionProcess: { select: { id: true, candidateName: true, companyId: true, recruiterId: true } } },
      });

      // Notify: document uploaded
      const notifSvc = new AdmissionNotificationService(ctx.prisma);
      await notifSvc.onDocumentUploaded(
        {
          admissionId: updated.admissionProcess.id,
          candidateName: updated.admissionProcess.candidateName,
          companyId: updated.admissionProcess.companyId,
          recruiterId: updated.admissionProcess.recruiterId,
          userId: ctx.tenant.userId ?? ctx.companyId,
        },
        updated.documentName
      );

      return updated;
    }),

  // Verificar documento
  verifyDocument: tenantProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      approved: z.boolean(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!input.approved && !input.rejectionReason?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o motivo da rejeição" });
      }

      const doc = await ctx.prisma.admissionDocument.findFirst({
        where: { id: input.documentId },
        include: { admissionProcess: { select: { companyId: true } } },
      });
      if (!doc || doc.admissionProcess.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado" });
      }

      const updatedDoc = await ctx.prisma.admissionDocument.update({
        where: { id: input.documentId },
        data: {
          status: input.approved ? "VERIFIED" : "REJECTED",
          verifiedAt: new Date(),
          verifiedBy: ctx.tenant.userId,
          rejectionReason: input.approved ? null : input.rejectionReason,
        },
        include: { admissionProcess: { select: { id: true, candidateName: true, companyId: true, recruiterId: true } } },
      });

      // Notify: document rejected
      if (!input.approved) {
        const notifSvc = new AdmissionNotificationService(ctx.prisma);
        await notifSvc.onDocumentRejected(
          {
            admissionId: updatedDoc.admissionProcess.id,
            candidateName: updatedDoc.admissionProcess.candidateName,
            companyId: updatedDoc.admissionProcess.companyId,
            recruiterId: updatedDoc.admissionProcess.recruiterId,
            userId: ctx.tenant.userId ?? ctx.companyId,
          },
          updatedDoc.documentName,
          input.rejectionReason ?? "Sem motivo informado"
        );
      }

      return updatedDoc;
    }),

  // Agendar exame
  scheduleExam: tenantProcedure
    .input(z.object({
      admissionId: z.string().uuid(),
      examType: z.string().default("ADMISSIONAL"),
      clinicName: z.string().optional(),
      scheduledDate: z.coerce.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.findFirst({
        where: { id: input.admissionId, companyId: ctx.companyId },
      });
      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      return ctx.prisma.admissionExam.create({
        data: {
          admissionId: input.admissionId,
          examType: input.examType,
          clinicName: input.clinicName,
          scheduledDate: input.scheduledDate,
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
      validUntil: z.coerce.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const exam = await ctx.prisma.admissionExam.findFirst({
        where: { id: input.examId },
        include: { admissionProcess: { select: { companyId: true } } },
      });
      if (!exam || exam.admissionProcess.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Exame não encontrado" });
      }

      const updatedExam = await ctx.prisma.admissionExam.update({
        where: { id: input.examId },
        data: {
          result: input.result,
          completedDate: new Date(),
          asoNumber: input.asoNumber,
          asoUrl: input.asoUrl,
          validUntil: input.validUntil ?? undefined,
          notes: input.notes,
        },
        include: { admissionProcess: { select: { id: true, candidateName: true, companyId: true, recruiterId: true, managerId: true } } },
      });

      // Notify: exam result
      if (input.result !== "PENDING") {
        const notifSvc = new AdmissionNotificationService(ctx.prisma);
        await notifSvc.onExamResult(
          {
            admissionId: updatedExam.admissionProcess.id,
            candidateName: updatedExam.admissionProcess.candidateName,
            companyId: updatedExam.admissionProcess.companyId,
            recruiterId: updatedExam.admissionProcess.recruiterId,
            managerId: updatedExam.admissionProcess.managerId,
            userId: ctx.tenant.userId ?? ctx.companyId,
          },
          input.result as "FIT" | "UNFIT" | "FIT_RESTRICTIONS"
        );
      }

      return updatedExam;
    }),

  // Completar etapa
  completeStep: tenantProcedure
    .input(z.object({
      stepId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existingStep = await ctx.prisma.admissionStep.findFirst({
        where: { id: input.stepId },
        include: { admissionProcess: { select: { companyId: true } } },
      });
      if (!existingStep || existingStep.admissionProcess.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Etapa não encontrada" });
      }

      if (existingStep.stepType === "DOCUMENT") {
        const [requiredTotal, verifiedTotal] = await Promise.all([
          ctx.prisma.admissionDocument.count({
            where: { admissionId: existingStep.admissionId, isRequired: true },
          }),
          ctx.prisma.admissionDocument.count({
            where: { admissionId: existingStep.admissionId, isRequired: true, status: "VERIFIED" },
          }),
        ]);
        if (verifiedTotal < requiredTotal) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Documentos obrigatórios pendentes de verificação" });
        }
      }

      const step = await ctx.prisma.admissionStep.update({
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
      const nextStep = await ctx.prisma.admissionStep.findFirst({
        where: {
          admissionId: step.admissionId,
          stepNumber: step.stepNumber + 1,
        },
      });

      if (nextStep) {
        await ctx.prisma.admissionStep.update({
          where: { id: nextStep.id },
          data: { status: "IN_PROGRESS" },
        });

        await ctx.prisma.admissionProcess.update({
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
    .mutation(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      const approved = await ctx.prisma.admissionProcess.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          notes: input.notes,
        },
      });

      // Notify: approved
      const notifSvcApprove = new AdmissionNotificationService(ctx.prisma);
      await notifSvcApprove.onStatusChange(
        {
          admissionId: approved.id,
          candidateName: approved.candidateName,
          companyId: ctx.companyId,
          recruiterId: approved.recruiterId,
          managerId: approved.managerId,
          userId: ctx.tenant.userId ?? ctx.companyId,
        },
        admission.status as "APPROVAL",
        "APPROVED"
      );

      return approved;
    }),

  // Rejeitar admissão
  reject: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      const rejected = await ctx.prisma.admissionProcess.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          notes: input.reason,
        },
      });

      // Notify: rejected
      const notifSvcReject = new AdmissionNotificationService(ctx.prisma);
      await notifSvcReject.onStatusChange(
        {
          admissionId: rejected.id,
          candidateName: rejected.candidateName,
          companyId: ctx.companyId,
          recruiterId: rejected.recruiterId,
          managerId: rejected.managerId,
          userId: ctx.tenant.userId ?? ctx.companyId,
        },
        admission.status as "APPROVAL",
        "REJECTED"
      );

      return rejected;
    }),

  // Completar admissão (criar funcionário)
  complete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      if (admission.status !== "APPROVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Processo precisa estar aprovado" });
      }

      // Buscar próximo código de funcionário
      const lastEmployee = await ctx.prisma.employee.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastEmployee?.code || 0) + 1;

      // Criar funcionário
      const employee = await ctx.prisma.employee.create({
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
      await ctx.prisma.admissionProcess.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Notify: completed
      const notifSvcComplete = new AdmissionNotificationService(ctx.prisma);
      await notifSvcComplete.onStatusChange(
        {
          admissionId: admission.id,
          candidateName: admission.candidateName,
          companyId: ctx.companyId,
          recruiterId: admission.recruiterId,
          managerId: admission.managerId,
          userId: ctx.tenant.userId ?? ctx.companyId,
        },
        "APPROVED",
        "COMPLETED"
      );

      return { admission, employee };
    }),

  // Cancelar admissão
  cancel: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admission = await ctx.prisma.admissionProcess.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!admission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      const cancelled = await ctx.prisma.admissionProcess.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: input.reason,
        },
      });

      // Notify: cancelled
      const notifSvcCancel = new AdmissionNotificationService(ctx.prisma);
      await notifSvcCancel.onStatusChange(
        {
          admissionId: cancelled.id,
          candidateName: cancelled.candidateName,
          companyId: ctx.companyId,
          recruiterId: cancelled.recruiterId,
          managerId: cancelled.managerId,
          userId: ctx.tenant.userId ?? ctx.companyId,
        },
        admission.status as "DRAFT" | "DOCUMENTS" | "EXAM" | "APPROVAL",
        "CANCELLED"
      );

      return cancelled;
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
      ctx.prisma.admissionProcess.count({ where: { companyId: ctx.companyId } }),
      ctx.prisma.admissionProcess.count({ where: { companyId: ctx.companyId, status: "DRAFT" } }),
      ctx.prisma.admissionProcess.count({
        where: {
          companyId: ctx.companyId,
          status: { in: ["DOCUMENTS", "EXAM", "APPROVAL"] },
        },
      }),
      ctx.prisma.admissionProcess.count({ where: { companyId: ctx.companyId, status: "APPROVED" } }),
      ctx.prisma.admissionProcess.count({ where: { companyId: ctx.companyId, status: "COMPLETED" } }),
      ctx.prisma.admissionProcess.count({ where: { companyId: ctx.companyId, status: "REJECTED" } }),
      ctx.prisma.admissionProcess.groupBy({
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
