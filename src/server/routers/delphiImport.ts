/**
 * Router tRPC para importação de dados do Delphi
 * VIO-776: Base de dados para validar
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import {
  parseDelphiCSV,
  importDelphiCustomers,
  importDelphiInvoices,
  type DelphiCliente,
  type DelphiNFeEmitida,
} from "@/lib/delphi-importer";

export const delphiImportRouter = createTRPCRouter({
  /**
   * Importar clientes do Delphi
   */
  importCustomers: tenantProcedure
    .input(
      z.object({
        csvContent: z.string().min(1, "Conteúdo CSV é obrigatório"),
        options: z
          .object({
            updateIfExists: z.boolean().default(false),
            dryRun: z.boolean().default(false),
          })
          .default({ updateIfExists: false, dryRun: false }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.companyId) {
        throw new Error("Empresa não selecionada");
      }

      const customers = parseDelphiCSV<DelphiCliente>(input.csvContent);

      if (customers.length === 0) {
        return {
          success: false,
          message: "Nenhum cliente encontrado no CSV",
          summary: null,
        };
      }

      const summary = await importDelphiCustomers(
        customers,
        ctx.companyId,
        input.options
      );

      return {
        success: true,
        message: input.options.dryRun
          ? `Simulação: ${summary.created} seriam criados, ${summary.updated} seriam atualizados, ${summary.skipped} seriam ignorados`
          : `Importação concluída: ${summary.created} criados, ${summary.updated} atualizados, ${summary.skipped} ignorados, ${summary.errors} erros`,
        summary,
      };
    }),

  /**
   * Importar NFe emitidas do Delphi
   */
  importInvoices: tenantProcedure
    .input(
      z.object({
        csvContent: z.string().min(1, "Conteúdo CSV é obrigatório"),
        options: z
          .object({
            updateIfExists: z.boolean().default(false),
            dryRun: z.boolean().default(false),
          })
          .default({ updateIfExists: false, dryRun: false }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.companyId) {
        throw new Error("Empresa não selecionada");
      }

      const invoices = parseDelphiCSV<DelphiNFeEmitida>(input.csvContent);

      if (invoices.length === 0) {
        return {
          success: false,
          message: "Nenhuma NFe encontrada no CSV",
          summary: null,
        };
      }

      const summary = await importDelphiInvoices(
        invoices,
        ctx.companyId,
        input.options
      );

      return {
        success: true,
        message: input.options.dryRun
          ? `Simulação: ${summary.created} seriam criadas, ${summary.updated} seriam atualizadas, ${summary.skipped} seriam ignoradas`
          : `Importação concluída: ${summary.created} criadas, ${summary.updated} atualizadas, ${summary.skipped} ignoradas, ${summary.errors} erros`,
        summary,
      };
    }),

  /**
   * Validar estrutura do CSV antes de importar
   */
  validateCSV: tenantProcedure
    .input(
      z.object({
        csvContent: z.string().min(1, "Conteúdo CSV é obrigatório"),
        type: z.enum(["customers", "invoices"]),
      })
    )
    .query(({ input }) => {
      const lines = input.csvContent.split("\n").filter((l) => l.trim());

      if (lines.length < 2) {
        return {
          valid: false,
          message: "CSV deve ter pelo menos um cabeçalho e uma linha de dados",
          headers: [],
          rowCount: 0,
          requiredFields: [],
          missingFields: [],
        };
      }

      const headers = lines[0].split(";").map((h) => h.trim());
      const rowCount = lines.length - 1;

      const requiredFields =
        input.type === "customers"
          ? ["codCliente", "cliente", "codCNPJ"]
          : ["codEmissaoNF", "numNF"];

      const missingFields = requiredFields.filter(
        (f) => !headers.includes(f)
      );

      return {
        valid: missingFields.length === 0,
        message:
          missingFields.length === 0
            ? `CSV válido com ${rowCount} registros`
            : `Campos obrigatórios ausentes: ${missingFields.join(", ")}`,
        headers,
        rowCount,
        requiredFields,
        missingFields,
      };
    }),

  /**
   * Obter estatísticas de importação prévia
   */
  getImportStats: tenantProcedure.query(async ({ ctx }) => {
    if (!ctx.companyId) {
      return {
        customers: 0,
        invoices: 0,
      };
    }

    const { prisma } = await import("@/lib/prisma");

    const [customers, invoices] = await Promise.all([
      prisma.customer.count({ where: { companyId: ctx.companyId } }),
      prisma.issuedInvoice.count({ where: { companyId: ctx.companyId } }),
    ]);

    return {
      customers,
      invoices,
    };
  }),
});
