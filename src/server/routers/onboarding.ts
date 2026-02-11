import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

export const onboardingRouter = createTRPCRouter({
  getStatus: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.companyOnboarding.findUnique({
        where: { companyId: ctx.companyId },
        include: { company: true },
      });
    }),

  start: tenantProcedure
    .mutation(async ({ ctx }) => {
      return ctx.prisma.companyOnboarding.upsert({
        where: { companyId: ctx.companyId },
        create: { companyId: ctx.companyId, currentStep: 1 },
        update: {},
      });
    }),

  updateStep: tenantProcedure
    .input(z.object({
      step: z.number().min(1).max(5),
      data: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ input, ctx }) => {
      const onboarding = await ctx.prisma.companyOnboarding.findUnique({
        where: { companyId: ctx.companyId },
      });

      if (!onboarding) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Onboarding não encontrado. Execute 'start' primeiro." });
      }
      
      const raw = onboarding.stepsCompleted;
      const stepsCompleted: Record<string, boolean> = (raw && typeof raw === "object" && !Array.isArray(raw))
        ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Boolean(v)]))
        : {};
      stepsCompleted[String(input.step)] = true;

      // Build update data
      const updateData: Record<string, unknown> = {
        stepsCompleted: stepsCompleted as Prisma.InputJsonValue,
        currentStep: Math.min(input.step + 1, 5),
      };

      // All steps 1-5 have data fields in the schema
      const stepField = `step${input.step}Data`;
      updateData[stepField] = input.data as Prisma.InputJsonValue;

      return ctx.prisma.companyOnboarding.update({
        where: { companyId: ctx.companyId },
        data: updateData,
      });
    }),

  complete: tenantProcedure
    .mutation(async ({ ctx }) => {
      const onboarding = await ctx.prisma.companyOnboarding.findUnique({
        where: { companyId: ctx.companyId },
      });

      if (!onboarding) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Onboarding não encontrado" });
      }

      return ctx.prisma.companyOnboarding.update({
        where: { companyId: ctx.companyId },
        data: { completedAt: new Date() },
      });
    }),

  list: tenantProcedure.query(async ({ ctx }) => {
    return ctx.prisma.companyOnboarding.findMany({
      where: { completedAt: null, companyId: ctx.companyId },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });
  }),
});
