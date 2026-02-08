import { callWithFallback, type AITokens } from "./router";

export type ChartType = "line" | "bar" | "pie" | "area" | "donut";

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string[];
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
}

export interface ChartGenerationResult {
  config: ChartConfig;
  explanation: string;
  suggestedQueries?: string[];
}

export interface DataSource {
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: "string" | "number" | "date";
    description?: string;
  }>;
}

const AVAILABLE_DATA_SOURCES: DataSource[] = [
  {
    name: "vendas",
    description: "Dados de vendas e faturamento",
    fields: [
      { name: "mes", type: "string", description: "Mês de referência" },
      { name: "valor", type: "number", description: "Valor total de vendas" },
      { name: "quantidade", type: "number", description: "Quantidade de pedidos" },
      { name: "ticket_medio", type: "number", description: "Ticket médio" },
    ],
  },
  {
    name: "compras",
    description: "Dados de compras e fornecedores",
    fields: [
      { name: "mes", type: "string", description: "Mês de referência" },
      { name: "valor", type: "number", description: "Valor total de compras" },
      { name: "fornecedor", type: "string", description: "Nome do fornecedor" },
    ],
  },
  {
    name: "estoque",
    description: "Dados de estoque e movimentação",
    fields: [
      { name: "material", type: "string", description: "Nome do material" },
      { name: "quantidade", type: "number", description: "Quantidade em estoque" },
      { name: "valor", type: "number", description: "Valor em estoque" },
      { name: "giro", type: "number", description: "Giro de estoque" },
    ],
  },
  {
    name: "financeiro",
    description: "Dados financeiros (contas a pagar/receber)",
    fields: [
      { name: "mes", type: "string", description: "Mês de referência" },
      { name: "a_pagar", type: "number", description: "Total a pagar" },
      { name: "a_receber", type: "number", description: "Total a receber" },
      { name: "saldo", type: "number", description: "Saldo (receber - pagar)" },
    ],
  },
  {
    name: "producao",
    description: "Dados de produção e OEE",
    fields: [
      { name: "linha", type: "string", description: "Linha de produção" },
      { name: "oee", type: "number", description: "OEE (%)" },
      { name: "producao", type: "number", description: "Quantidade produzida" },
      { name: "refugo", type: "number", description: "Quantidade de refugo" },
    ],
  },
];

/**
 * Sugere tipo de gráfico baseado nos dados
 */
export function suggestChartType(
  xAxisType: "string" | "number" | "date",
  yAxisCount: number,
  dataPointCount: number
): ChartType {
  // Poucos pontos de dados categóricos -> Pie/Donut
  if (xAxisType === "string" && dataPointCount <= 6 && yAxisCount === 1) {
    return "pie";
  }

  // Série temporal ou muitos pontos -> Line ou Area
  if (xAxisType === "date" || dataPointCount > 10) {
    return yAxisCount > 1 ? "area" : "line";
  }

  // Comparação de categorias -> Bar
  return "bar";
}

/**
 * Gera configuração de gráfico usando IA
 */
export async function generateChartWithAI(
  prompt: string,
  tokens: AITokens
): Promise<ChartGenerationResult> {
  const dataSourcesDescription = AVAILABLE_DATA_SOURCES.map(
    (ds) =>
      `- ${ds.name}: ${ds.description}\n  Campos: ${ds.fields.map((f) => `${f.name} (${f.type})`).join(", ")}`
  ).join("\n");

  const response = await callWithFallback(
    { primaryProvider: "google", primaryModel: "gemini-2.0-flash-exp", enableFallback: true },
    tokens,
    {
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em visualização de dados para ERP.
Dado um pedido em linguagem natural, você deve gerar uma configuração de gráfico.

Fontes de dados disponíveis:
${dataSourcesDescription}

Tipos de gráfico disponíveis: line, bar, pie, area, donut

Retorne um JSON com:
- config: objeto com type, title, xAxis, yAxis (array), colors (opcional), showGrid, showLegend, stacked
- explanation: breve explicação da escolha
- suggestedQueries: array com 2-3 perguntas relacionadas que o usuário pode fazer

Retorne apenas o JSON, sem markdown.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 1000,
      responseFormat: "json",
    }
  );

  try {
    return JSON.parse(response.content) as ChartGenerationResult;
  } catch {
    return {
      config: {
        type: "bar",
        title: "Gráfico",
        xAxis: "mes",
        yAxis: ["valor"],
        showGrid: true,
        showLegend: true,
      },
      explanation: "Não foi possível interpretar o pedido. Usando configuração padrão.",
      suggestedQueries: [
        "Mostre vendas por mês",
        "Compare compras e vendas",
        "Qual o estoque por material?",
      ],
    };
  }
}

/**
 * Gera sugestões de gráficos baseado no contexto
 */
export function getChartSuggestions(): Array<{
  title: string;
  description: string;
  prompt: string;
}> {
  return [
    {
      title: "Vendas Mensais",
      description: "Evolução das vendas nos últimos 12 meses",
      prompt: "Mostre a evolução das vendas por mês nos últimos 12 meses",
    },
    {
      title: "Comparativo Financeiro",
      description: "Contas a pagar vs receber",
      prompt: "Compare contas a pagar e a receber por mês",
    },
    {
      title: "Top Fornecedores",
      description: "Maiores fornecedores por valor",
      prompt: "Mostre os 10 maiores fornecedores por valor de compras",
    },
    {
      title: "Estoque por Categoria",
      description: "Distribuição do valor em estoque",
      prompt: "Mostre a distribuição do valor em estoque por categoria",
    },
    {
      title: "OEE por Linha",
      description: "Eficiência das linhas de produção",
      prompt: "Compare o OEE de cada linha de produção",
    },
    {
      title: "Ticket Médio",
      description: "Evolução do ticket médio de vendas",
      prompt: "Mostre a evolução do ticket médio de vendas por mês",
    },
  ];
}

export { AVAILABLE_DATA_SOURCES };
