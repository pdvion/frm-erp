import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

export const onboardingRouter = createTRPCRouter({
  getStatus: tenantProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.companyOnboarding.findUnique({
        where: { companyId: input.companyId },
        include: { company: true },
      });
    }),

  start: tenantProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.companyOnboarding.upsert({
        where: { companyId: input.companyId },
        create: { companyId: input.companyId, currentStep: 1 },
        update: {},
      });
    }),

  updateStep: tenantProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      step: z.number().min(1).max(5),
      data: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ input, ctx }) => {
      const onboarding = await ctx.prisma.companyOnboarding.findUnique({
        where: { companyId: input.companyId },
      });

      if (!onboarding) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Onboarding não encontrado. Execute 'start' primeiro." });
      }
      
      const stepsCompleted = (onboarding.stepsCompleted as Record<string, boolean>) || {};
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
        where: { companyId: input.companyId },
        data: updateData,
      });
    }),

  complete: tenantProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const onboarding = await ctx.prisma.companyOnboarding.findUnique({
        where: { companyId: input.companyId },
      });

      if (!onboarding) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Onboarding não encontrado" });
      }

      return ctx.prisma.companyOnboarding.update({
        where: { companyId: input.companyId },
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
