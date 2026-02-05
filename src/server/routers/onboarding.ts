import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const onboardingRouter = createTRPCRouter({
  getStatus: publicProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.companyOnboarding.findUnique({
        where: { companyId: input.companyId },
        include: { company: true },
      });
    }),

  start: publicProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return prisma.companyOnboarding.upsert({
        where: { companyId: input.companyId },
        create: { companyId: input.companyId, currentStep: 1 },
        update: {},
      });
    }),

  updateStep: publicProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      step: z.number().min(1).max(5),
      data: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ input }) => {
      const onboarding = await prisma.companyOnboarding.findUnique({
        where: { companyId: input.companyId },
      });
      
      const stepsCompleted = (onboarding?.stepsCompleted as Record<string, boolean>) || {};
      stepsCompleted[String(input.step)] = true;

      // Build update data - only include stepXData for steps 1-4
      const updateData: Record<string, unknown> = {
        stepsCompleted: stepsCompleted as Prisma.InputJsonValue,
        currentStep: Math.min(input.step + 1, 5),
      };

      // Only steps 1-4 have data fields in the schema
      if (input.step >= 1 && input.step <= 4) {
        const stepField = `step${input.step}Data`;
        updateData[stepField] = input.data as Prisma.InputJsonValue;
      }

      return prisma.companyOnboarding.update({
        where: { companyId: input.companyId },
        data: updateData,
      });
    }),

  complete: publicProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return prisma.companyOnboarding.update({
        where: { companyId: input.companyId },
        data: { completedAt: new Date() },
      });
    }),

  list: publicProcedure.query(async () => {
    return prisma.companyOnboarding.findMany({
      where: { completedAt: null },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });
  }),
});
