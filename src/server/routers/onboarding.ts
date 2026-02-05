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
      const stepField = `step${input.step}Data` as const;
      const onboarding = await prisma.companyOnboarding.findUnique({
        where: { companyId: input.companyId },
      });
      
      const stepsCompleted = (onboarding?.stepsCompleted as Record<string, boolean>) || {};
      stepsCompleted[String(input.step)] = true;

      return prisma.companyOnboarding.update({
        where: { companyId: input.companyId },
        data: {
          [stepField]: input.data as Prisma.InputJsonValue,
          stepsCompleted: stepsCompleted as Prisma.InputJsonValue,
          currentStep: input.step + 1,
        },
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
