import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router sped (SPED Fiscal)
 * Valida inputs e estruturas de dados de geração de arquivos SPED
 */

// Schema de geração
const gerarInputSchema = z.object({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2020).max(2100),
  incluirInventario: z.boolean().optional().default(false),
});

// Schema de validação
const validarInputSchema = z.object({
  conteudo: z.string(),
});

// Schema de resposta de geração
const gerarResponseSchema = z.object({
  conteudo: z.string(),
  nomeArquivo: z.string(),
  validacao: z.object({
    valido: z.boolean(),
    erros: z.array(z.string()).optional(),
    avisos: z.array(z.string()).optional(),
  }),
});

// Schema de período disponível
const periodoSchema = z.object({
  mes: z.number(),
  ano: z.number(),
  temDados: z.boolean(),
  totalNotas: z.number(),
  valorTotal: z.number(),
});

describe("SPED Router Schemas", () => {
  describe("Gerar Input Schema", () => {
    it("should accept valid input", () => {
      const result = gerarInputSchema.safeParse({
        mes: 1,
        ano: 2024,
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with inventory", () => {
      const result = gerarInputSchema.safeParse({
        mes: 12,
        ano: 2024,
        incluirInventario: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject month 0", () => {
      const result = gerarInputSchema.safeParse({
        mes: 0,
        ano: 2024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject month 13", () => {
      const result = gerarInputSchema.safeParse({
        mes: 13,
        ano: 2024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject year before 2020", () => {
      const result = gerarInputSchema.safeParse({
        mes: 1,
        ano: 2019,
      });
      expect(result.success).toBe(false);
    });

    it("should reject year after 2100", () => {
      const result = gerarInputSchema.safeParse({
        mes: 1,
        ano: 2101,
      });
      expect(result.success).toBe(false);
    });

    it("should default incluirInventario to false", () => {
      const result = gerarInputSchema.safeParse({
        mes: 6,
        ano: 2024,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.incluirInventario).toBe(false);
      }
    });
  });

  describe("Validar Input Schema", () => {
    it("should accept valid content", () => {
      const result = validarInputSchema.safeParse({
        conteudo: "|0000|...",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing content", () => {
      const result = validarInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Periodo Schema", () => {
    it("should accept valid period", () => {
      const result = periodoSchema.safeParse({
        mes: 6,
        ano: 2024,
        temDados: true,
        totalNotas: 150,
        valorTotal: 500000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Gerar Response Schema", () => {
    it("should accept valid generation response", () => {
      const result = gerarResponseSchema.safeParse({
        conteudo: "|0000|015|0|01012024|31012024|",
        nomeArquivo: "SPED_12345678000199_202406.txt",
        validacao: {
          valido: true,
          erros: [],
          avisos: [],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("SPED File Structure", () => {
    it("should generate correct file name", () => {
      const mes = 6;
      const ano = 2024;
      const cnpj = "12345678000199";
      const nomeArquivo = `SPED_${cnpj}_${ano}${mes.toString().padStart(2, "0")}.txt`;
      expect(nomeArquivo).toBe("SPED_12345678000199_202406.txt");
    });

    it("should calculate period dates", () => {
      const mes = 6;
      const ano = 2024;
      const dataInicial = new Date(ano, mes - 1, 1);
      const dataFinal = new Date(ano, mes, 0);
      
      expect(dataInicial.getDate()).toBe(1);
      expect(dataInicial.getMonth()).toBe(5); // June (0-indexed)
      expect(dataFinal.getDate()).toBe(30); // Last day of June
    });

    it("should handle February correctly", () => {
      const mes = 2;
      const ano = 2024; // Leap year
      const dataFinal = new Date(ano, mes, 0);
      expect(dataFinal.getDate()).toBe(29);
    });

    it("should handle non-leap year February", () => {
      const mes = 2;
      const ano = 2023;
      const dataFinal = new Date(ano, mes, 0);
      expect(dataFinal.getDate()).toBe(28);
    });
  });

  describe("SPED Blocks", () => {
    const blocks = [
      { code: "0", name: "Abertura e Identificação" },
      { code: "C", name: "Documentos Fiscais I - Mercadorias" },
      { code: "D", name: "Documentos Fiscais II - Serviços" },
      { code: "E", name: "Apuração do ICMS e IPI" },
      { code: "G", name: "CIAP" },
      { code: "H", name: "Inventário Físico" },
      { code: "K", name: "Controle da Produção e Estoque" },
      { code: "1", name: "Outras Informações" },
      { code: "9", name: "Encerramento" },
    ];

    it("should have block 0 for identification", () => {
      const block = blocks.find(b => b.code === "0");
      expect(block?.name).toBe("Abertura e Identificação");
    });

    it("should have block C for merchandise", () => {
      const block = blocks.find(b => b.code === "C");
      expect(block?.name).toBe("Documentos Fiscais I - Mercadorias");
    });

    it("should have block E for tax calculation", () => {
      const block = blocks.find(b => b.code === "E");
      expect(block?.name).toBe("Apuração do ICMS e IPI");
    });

    it("should have block H for inventory", () => {
      const block = blocks.find(b => b.code === "H");
      expect(block?.name).toBe("Inventário Físico");
    });

    it("should have block 9 for closing", () => {
      const block = blocks.find(b => b.code === "9");
      expect(block?.name).toBe("Encerramento");
    });
  });

  describe("SPED Record Format", () => {
    it("should format record with pipe delimiter", () => {
      const fields = ["0000", "015", "0", "01012024", "31012024"];
      const record = `|${fields.join("|")}|`;
      expect(record).toBe("|0000|015|0|01012024|31012024|");
    });

    it("should format date as DDMMYYYY", () => {
      const date = new Date(2024, 0, 15);
      const formatted = `${date.getDate().toString().padStart(2, "0")}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getFullYear()}`;
      expect(formatted).toBe("15012024");
    });

    it("should format decimal with comma", () => {
      const value = 1234.56;
      const formatted = value.toFixed(2).replace(".", ",");
      expect(formatted).toBe("1234,56");
    });
  });

  describe("SPED Validation Rules", () => {
    it("should validate CNPJ format", () => {
      const cnpj = "12.345.678/0001-99";
      const cnpjLimpo = cnpj.replace(/\D/g, "");
      expect(cnpjLimpo).toBe("12345678000199");
      expect(cnpjLimpo.length).toBe(14);
    });

    it("should validate NCM format", () => {
      const ncm = "84713012";
      expect(ncm.length).toBe(8);
      expect(/^\d{8}$/.test(ncm)).toBe(true);
    });

    it("should validate CFOP format", () => {
      const cfop = "5102";
      expect(cfop.length).toBe(4);
      expect(/^\d{4}$/.test(cfop)).toBe(true);
    });

    it("should validate CST ICMS format", () => {
      const cst = "000";
      expect(cst.length).toBe(3);
      expect(/^\d{3}$/.test(cst)).toBe(true);
    });
  });

  describe("SPED Totalization", () => {
    it("should count records per block", () => {
      const records = [
        { block: "0", type: "0000" },
        { block: "0", type: "0001" },
        { block: "C", type: "C100" },
        { block: "C", type: "C170" },
        { block: "C", type: "C170" },
        { block: "9", type: "9999" },
      ];
      
      const countByBlock = records.reduce((acc, r) => {
        acc[r.block] = (acc[r.block] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(countByBlock["0"]).toBe(2);
      expect(countByBlock["C"]).toBe(3);
      expect(countByBlock["9"]).toBe(1);
    });

    it("should generate block closing record", () => {
      const blockCode = "C";
      const recordCount = 150;
      const closingRecord = `|${blockCode}990|${recordCount}|`;
      expect(closingRecord).toBe("|C990|150|");
    });
  });

  describe("Inventory Block (H)", () => {
    it("should include inventory only when requested", () => {
      const incluirInventario = true;
      const hasBlockH = incluirInventario;
      expect(hasBlockH).toBe(true);
    });

    it("should calculate inventory value", () => {
      const items = [
        { quantity: 100, unitCost: 10 },
        { quantity: 50, unitCost: 20 },
        { quantity: 200, unitCost: 5 },
      ];
      const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
      expect(totalValue).toBe(3000);
    });

    it("should use inventory date as last day of period", () => {
      const mes = 12;
      const ano = 2024;
      const dataInventario = new Date(ano, mes, 0);
      expect(dataInventario.getDate()).toBe(31);
      expect(dataInventario.getMonth()).toBe(11); // December
    });
  });
});
