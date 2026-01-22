/**
 * Router tRPC para SPED Fiscal
 * 
 * @see VIO-567 - SPED Fiscal - EFD ICMS/IPI
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { gerarArquivoSped, listarPeriodosDisponiveis } from "../services/sped";

export const spedRouter = createTRPCRouter({
  /**
   * Lista períodos disponíveis para geração do SPED
   */
  listPeriodos: tenantProcedure
    .query(async ({ ctx }) => {
      if (!ctx.companyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Empresa não selecionada" });
      }

      const periodos = await listarPeriodosDisponiveis(ctx.companyId);
      return periodos;
    }),

  /**
   * Gera arquivo SPED Fiscal para um período
   */
  gerar: tenantProcedure
    .input(z.object({
      mes: z.number().min(1).max(12),
      ano: z.number().min(2020).max(2100),
      incluirInventario: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.companyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Empresa não selecionada" });
      }

      // Calcular datas do período
      const dataInicial = new Date(input.ano, input.mes - 1, 1);
      const dataFinal = new Date(input.ano, input.mes, 0); // Último dia do mês

      // Data do inventário (último dia do mês, se incluir)
      const dataInventario = input.incluirInventario ? dataFinal : undefined;

      const resultado = await gerarArquivoSped({
        companyId: ctx.companyId,
        dataInicial,
        dataFinal,
        incluirInventario: input.incluirInventario,
        dataInventario,
      });

      if (!resultado.sucesso) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: resultado.erro || "Erro na geração do SPED" 
        });
      }

      return {
        conteudo: resultado.conteudo,
        nomeArquivo: resultado.nomeArquivo,
        validacao: resultado.validacao,
      };
    }),

  /**
   * Valida arquivo SPED existente
   */
  validar: tenantProcedure
    .input(z.object({
      conteudo: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { validarSped } = await import("@/lib/sped/efd-icms-ipi");
      const resultado = validarSped(input.conteudo);
      return resultado;
    }),
});
