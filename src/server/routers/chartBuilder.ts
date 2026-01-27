import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import {
  generateChartWithAI,
  getChartSuggestions,
  suggestChartType,
  AVAILABLE_DATA_SOURCES,
  type ChartConfig,
} from "@/lib/ai/chartGenerator";

const chartTypeSchema = z.enum(["line", "bar", "pie", "area", "donut"]);

const chartConfigSchema = z.object({
  type: chartTypeSchema,
  title: z.string(),
  xAxis: z.string().optional(),
  yAxis: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  showGrid: z.boolean().optional(),
  showLegend: z.boolean().optional(),
  stacked: z.boolean().optional(),
});

export const chartBuilderRouter = createTRPCRouter({
  /**
   * Gerar configuração de gráfico usando IA
   */
  generateFromPrompt: tenantProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Buscar token de IA configurado
      const aiSetting = await ctx.prisma.systemSetting.findFirst({
        where: {
          key: "openai_token",
          companyId: ctx.companyId,
        },
      });

      const apiKey = aiSetting?.value
        ? (aiSetting.value as { value: string }).value
        : null;

      if (!apiKey) {
        // Retornar sugestão padrão se não tiver IA configurada
        return {
          config: {
            type: "bar" as const,
            title: "Gráfico",
            xAxis: "mes",
            yAxis: ["valor"],
            showGrid: true,
            showLegend: true,
          },
          explanation: "Configure um token de IA em Configurações > IA para usar geração por linguagem natural.",
          suggestedQueries: getChartSuggestions().map((s) => s.prompt),
        };
      }

      return generateChartWithAI(input.prompt, apiKey);
    }),

  /**
   * Obter sugestões de gráficos
   */
  getSuggestions: tenantProcedure.query(() => {
    return getChartSuggestions();
  }),

  /**
   * Obter fontes de dados disponíveis
   */
  getDataSources: tenantProcedure.query(() => {
    return AVAILABLE_DATA_SOURCES;
  }),

  /**
   * Sugerir tipo de gráfico baseado nos dados
   */
  suggestType: tenantProcedure
    .input(
      z.object({
        xAxisType: z.enum(["string", "number", "date"]),
        yAxisCount: z.number().min(1),
        dataPointCount: z.number().min(1),
      })
    )
    .query(({ input }) => {
      return suggestChartType(input.xAxisType, input.yAxisCount, input.dataPointCount);
    }),

  /**
   * Salvar configuração de gráfico como template
   */
  saveTemplate: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        config: chartConfigSchema,
        dataSource: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Salvar como SystemSetting com categoria chart_template
      const key = `chart_template_${Date.now()}`;

      await ctx.prisma.systemSetting.create({
        data: {
          key,
          value: {
            name: input.name,
            description: input.description,
            config: input.config,
            dataSource: input.dataSource,
          },
          category: "chart_template",
          companyId: ctx.companyId,
          description: `Template de gráfico: ${input.name}`,
          updatedBy: ctx.tenant.userId,
        },
      });

      return { success: true, key };
    }),

  /**
   * Listar templates salvos
   */
  listTemplates: tenantProcedure.query(async ({ ctx }) => {
    const templates = await ctx.prisma.systemSetting.findMany({
      where: {
        category: "chart_template",
        companyId: ctx.companyId,
      },
      orderBy: { createdAt: "desc" },
    });

    interface TemplateValue {
      name: string;
      description?: string;
      config: ChartConfig;
      dataSource: string;
    }
    
    return templates.map((t) => {
      const value = t.value as Prisma.JsonValue;
      const parsed = value as unknown as TemplateValue;
      return {
        id: t.id,
        key: t.key,
        name: parsed.name ?? "",
        description: parsed.description,
        config: parsed.config,
        dataSource: parsed.dataSource ?? "",
        createdAt: t.createdAt,
      };
    });
  }),

  /**
   * Excluir template
   */
  deleteTemplate: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.systemSetting.delete({
        where: {
          id: input.id,
          companyId: ctx.companyId,
        },
      });

      return { success: true };
    }),

  /**
   * Obter dados para o gráfico (mock por enquanto)
   */
  getChartData: tenantProcedure
    .input(
      z.object({
        dataSource: z.string(),
        xAxis: z.string(),
        yAxis: z.array(z.string()),
        limit: z.number().optional().default(12),
      })
    )
    .query(async ({ input }) => {
      // Mock de dados para demonstração
      // Em produção, isso buscaria dados reais do banco
      const mockData: Record<string, Array<Record<string, string | number>>> = {
        vendas: [
          { mes: "Jan", valor: 125000, quantidade: 45, ticket_medio: 2778 },
          { mes: "Fev", valor: 138000, quantidade: 52, ticket_medio: 2654 },
          { mes: "Mar", valor: 142000, quantidade: 48, ticket_medio: 2958 },
          { mes: "Abr", valor: 155000, quantidade: 55, ticket_medio: 2818 },
          { mes: "Mai", valor: 168000, quantidade: 62, ticket_medio: 2710 },
          { mes: "Jun", valor: 175000, quantidade: 58, ticket_medio: 3017 },
          { mes: "Jul", valor: 182000, quantidade: 65, ticket_medio: 2800 },
          { mes: "Ago", valor: 195000, quantidade: 70, ticket_medio: 2786 },
          { mes: "Set", valor: 188000, quantidade: 68, ticket_medio: 2765 },
          { mes: "Out", valor: 210000, quantidade: 75, ticket_medio: 2800 },
          { mes: "Nov", valor: 225000, quantidade: 82, ticket_medio: 2744 },
          { mes: "Dez", valor: 245000, quantidade: 90, ticket_medio: 2722 },
        ],
        compras: [
          { mes: "Jan", valor: 85000, fornecedor: "Fornecedor A" },
          { mes: "Fev", valor: 92000, fornecedor: "Fornecedor B" },
          { mes: "Mar", valor: 88000, fornecedor: "Fornecedor A" },
          { mes: "Abr", valor: 95000, fornecedor: "Fornecedor C" },
          { mes: "Mai", valor: 102000, fornecedor: "Fornecedor A" },
          { mes: "Jun", valor: 98000, fornecedor: "Fornecedor B" },
          { mes: "Jul", valor: 105000, fornecedor: "Fornecedor A" },
          { mes: "Ago", valor: 112000, fornecedor: "Fornecedor C" },
          { mes: "Set", valor: 108000, fornecedor: "Fornecedor B" },
          { mes: "Out", valor: 118000, fornecedor: "Fornecedor A" },
          { mes: "Nov", valor: 125000, fornecedor: "Fornecedor C" },
          { mes: "Dez", valor: 135000, fornecedor: "Fornecedor A" },
        ],
        estoque: [
          { material: "Matéria Prima A", quantidade: 1500, valor: 45000, giro: 4.2 },
          { material: "Matéria Prima B", quantidade: 800, valor: 32000, giro: 3.8 },
          { material: "Componente X", quantidade: 2200, valor: 28000, giro: 5.1 },
          { material: "Componente Y", quantidade: 1800, valor: 22000, giro: 4.5 },
          { material: "Embalagem", quantidade: 5000, valor: 15000, giro: 8.2 },
          { material: "Outros", quantidade: 3500, valor: 18000, giro: 3.2 },
        ],
        financeiro: [
          { mes: "Jan", a_pagar: 95000, a_receber: 125000, saldo: 30000 },
          { mes: "Fev", a_pagar: 102000, a_receber: 138000, saldo: 36000 },
          { mes: "Mar", a_pagar: 98000, a_receber: 142000, saldo: 44000 },
          { mes: "Abr", a_pagar: 105000, a_receber: 155000, saldo: 50000 },
          { mes: "Mai", a_pagar: 112000, a_receber: 168000, saldo: 56000 },
          { mes: "Jun", a_pagar: 108000, a_receber: 175000, saldo: 67000 },
          { mes: "Jul", a_pagar: 115000, a_receber: 182000, saldo: 67000 },
          { mes: "Ago", a_pagar: 122000, a_receber: 195000, saldo: 73000 },
          { mes: "Set", a_pagar: 118000, a_receber: 188000, saldo: 70000 },
          { mes: "Out", a_pagar: 128000, a_receber: 210000, saldo: 82000 },
          { mes: "Nov", a_pagar: 135000, a_receber: 225000, saldo: 90000 },
          { mes: "Dez", a_pagar: 145000, a_receber: 245000, saldo: 100000 },
        ],
        producao: [
          { linha: "Linha 1", oee: 85, producao: 12500, refugo: 125 },
          { linha: "Linha 2", oee: 78, producao: 10800, refugo: 216 },
          { linha: "Linha 3", oee: 92, producao: 15200, refugo: 76 },
          { linha: "Linha 4", oee: 72, producao: 9500, refugo: 285 },
          { linha: "Linha 5", oee: 88, producao: 13800, refugo: 138 },
        ],
      };

      const data = mockData[input.dataSource] ?? [];
      const limitedData = data.slice(0, input.limit);

      // Filtrar apenas os campos solicitados
      return limitedData.map((row) => {
        const result: Record<string, string | number> = {
          name: String(row[input.xAxis] ?? ""),
        };
        for (const yKey of input.yAxis) {
          if (row[yKey] !== undefined) {
            result[yKey] = row[yKey];
          }
        }
        return result;
      });
    }),
});
