import { describe, it, expect } from "vitest";
import { generateRemessaCobranca, validateCnab240 } from "./generator";
import type { CnabConfig, BoletoData } from "./types";

// Configuração de teste
const mockConfig: CnabConfig = {
  bankCode: "001",
  layout: "240",
  agencia: "1234",
  agenciaDigito: "5",
  conta: "123456",
  contaDigito: "7",
  cedente: "Empresa Teste LTDA",
  cedenteDocumento: "12345678901234",
  convenio: "1234567",
  carteira: "17",
};

// Boleto de teste
const mockBoleto: BoletoData = {
  id: "boleto-1",
  nossoNumero: "12345678901234567890",
  numeroDocumento: "DOC123456",
  dataEmissao: new Date(2026, 0, 15),
  dataVencimento: new Date(2026, 1, 15),
  valor: 1500.50,
  sacado: {
    nome: "João da Silva",
    documento: "12345678901",
    endereco: "Rua Teste, 123",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01234-567",
  },
};

describe("CNAB Generator", () => {
  describe("generateRemessaCobranca", () => {
    it("deve gerar arquivo de remessa com sucesso", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.filename).toBeDefined();
    });

    it("deve gerar filename com padrão correto", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      expect(result.filename).toMatch(/^CNAB240_001_\d{8}_000001\.rem$/);
    });

    it("deve retornar total de registros correto", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      expect(result.totalRegistros).toBe(1);
    });

    it("deve retornar valor total correto", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      expect(result.valorTotal).toBe(1500.50);
    });

    it("deve somar valores de múltiplos boletos", () => {
      const boleto2: BoletoData = {
        ...mockBoleto,
        nossoNumero: "98765432109876543210",
        valor: 500.00,
      };

      const result = generateRemessaCobranca(mockConfig, [mockBoleto, boleto2], 1);

      expect(result.totalRegistros).toBe(2);
      expect(result.valorTotal).toBe(2000.50);
    });

    it("deve gerar linhas com 240 caracteres", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        for (const line of lines) {
          expect(line.length).toBe(240);
        }
      }
    });

    it("deve incluir código do banco no início de cada linha", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        for (const line of lines) {
          expect(line.substring(0, 3)).toBe("001");
        }
      }
    });

    it("deve gerar header de arquivo com tipo 0", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        expect(lines[0].substring(7, 8)).toBe("0");
      }
    });

    it("deve gerar header de lote com tipo 1", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        expect(lines[1].substring(7, 8)).toBe("1");
      }
    });

    it("deve gerar segmento P com tipo 3 e código P", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        expect(lines[2].substring(7, 8)).toBe("3");
        expect(lines[2].substring(13, 14)).toBe("P");
      }
    });

    it("deve gerar segmento Q com tipo 3 e código Q", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        expect(lines[3].substring(7, 8)).toBe("3");
        expect(lines[3].substring(13, 14)).toBe("Q");
      }
    });

    it("deve gerar trailer de lote com tipo 5", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        expect(lines[4].substring(7, 8)).toBe("5");
      }
    });

    it("deve gerar trailer de arquivo com tipo 9", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        const lastLine = lines[lines.length - 1];
        expect(lastLine.substring(7, 8)).toBe("9");
      }
    });

    it("deve incluir CNPJ do cedente no header", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        expect(lines[0]).toContain("12345678901234");
      }
    });

    it("deve incluir nome do sacado no segmento Q", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        expect(lines[3].toUpperCase()).toContain("JOAO DA SILVA");
      }
    });

    it("deve remover acentos do nome do sacado", () => {
      const boletoComAcento: BoletoData = {
        ...mockBoleto,
        sacado: {
          ...mockBoleto.sacado,
          nome: "José da Conceição",
        },
      };

      const result = generateRemessaCobranca(mockConfig, [boletoComAcento], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        expect(lines[3]).toContain("JOSE DA CONCEICAO");
        expect(lines[3]).not.toContain("é");
        expect(lines[3]).not.toContain("ç");
        expect(lines[3]).not.toContain("ã");
      }
    });

    it("deve usar tipo de inscrição 1 para CPF", () => {
      const boletoComCPF: BoletoData = {
        ...mockBoleto,
        sacado: {
          ...mockBoleto.sacado,
          documento: "12345678901", // CPF
        },
      };

      const result = generateRemessaCobranca(mockConfig, [boletoComCPF], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        // Segmento Q, posição 18 (tipo inscrição sacado)
        expect(lines[3].substring(17, 18)).toBe("1");
      }
    });

    it("deve usar tipo de inscrição 2 para CNPJ", () => {
      const boletoComCNPJ: BoletoData = {
        ...mockBoleto,
        sacado: {
          ...mockBoleto.sacado,
          documento: "12345678901234", // CNPJ
        },
      };

      const result = generateRemessaCobranca(mockConfig, [boletoComCNPJ], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        // Segmento Q, posição 18 (tipo inscrição sacado)
        expect(lines[3].substring(17, 18)).toBe("2");
      }
    });

    it("deve gerar arquivo vazio quando não há boletos", () => {
      const result = generateRemessaCobranca(mockConfig, [], 1);

      expect(result.success).toBe(true);
      expect(result.totalRegistros).toBe(0);
      expect(result.valorTotal).toBe(0);
    });

    it("deve incrementar sequencial corretamente", () => {
      const result = generateRemessaCobranca(mockConfig, [mockBoleto], 999);

      expect(result.filename).toMatch(/000999\.rem$/);
    });
  });

  describe("validateCnab240", () => {
    it("deve rejeitar arquivo com menos de 4 linhas", () => {
      const content = "linha1\nlinha2\nlinha3";
      const result = validateCnab240(content);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Arquivo deve ter no mínimo 4 linhas (Header Arquivo, Header Lote, Trailer Lote, Trailer Arquivo)");
    });

    it("deve rejeitar linhas com tamanho diferente de 240", () => {
      const content = [
        "a".repeat(240),
        "b".repeat(100), // Linha curta
        "c".repeat(240),
        "d".repeat(240),
      ].join("\n");

      const result = validateCnab240(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Tamanho inválido"))).toBe(true);
    });

    it("deve validar arquivo gerado corretamente", () => {
      const remessa = generateRemessaCobranca(mockConfig, [mockBoleto], 1);
      
      if (remessa.content) {
        const result = validateCnab240(remessa.content);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("deve rejeitar header de arquivo com tipo incorreto", () => {
      const content = [
        "001" + "0000" + "1" + " ".repeat(232), // Tipo 1 em vez de 0
        "001" + "0001" + "1" + " ".repeat(232),
        "001" + "0001" + "5" + " ".repeat(232),
        "001" + "9999" + "9" + " ".repeat(232),
      ].join("\n");

      const result = validateCnab240(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Header de Arquivo"))).toBe(true);
    });

    it("deve rejeitar trailer de arquivo com tipo incorreto", () => {
      const content = [
        "001" + "0000" + "0" + " ".repeat(232),
        "001" + "0001" + "1" + " ".repeat(232),
        "001" + "0001" + "5" + " ".repeat(232),
        "001" + "9999" + "5" + " ".repeat(232), // Tipo 5 em vez de 9
      ].join("\n");

      const result = validateCnab240(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Trailer de Arquivo"))).toBe(true);
    });

    it("deve aceitar arquivo válido com estrutura correta", () => {
      const content = [
        "001" + "0000" + "0" + " ".repeat(232),
        "001" + "0001" + "1" + " ".repeat(232),
        "001" + "0001" + "5" + " ".repeat(232),
        "001" + "9999" + "9" + " ".repeat(232),
      ].join("\n");

      const result = validateCnab240(content);

      expect(result.valid).toBe(true);
    });
  });

  describe("Formatação de valores", () => {
    it("deve formatar valor monetário corretamente", () => {
      const boleto: BoletoData = {
        ...mockBoleto,
        valor: 1234.56,
      };

      const result = generateRemessaCobranca(mockConfig, [boleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        // Segmento P, posições 86-100 (valor do título)
        const valorStr = lines[2].substring(85, 100);
        expect(valorStr).toBe("000000000123456");
      }
    });

    it("deve formatar data de vencimento corretamente", () => {
      const boleto: BoletoData = {
        ...mockBoleto,
        dataVencimento: new Date(2026, 1, 15), // 15/02/2026
      };

      const result = generateRemessaCobranca(mockConfig, [boleto], 1);

      if (result.content) {
        const lines = result.content.split("\r\n");
        // Segmento P, posições 78-85 (data vencimento)
        const dataStr = lines[2].substring(77, 85);
        expect(dataStr).toBe("15022026");
      }
    });
  });

  describe("Diferentes bancos", () => {
    it("deve gerar para Banco do Brasil (001)", () => {
      const config: CnabConfig = { ...mockConfig, bankCode: "001" };
      const result = generateRemessaCobranca(config, [mockBoleto], 1);

      expect(result.success).toBe(true);
      if (result.content) {
        expect(result.content.substring(0, 3)).toBe("001");
      }
    });

    it("deve gerar para Bradesco (237)", () => {
      const config: CnabConfig = { ...mockConfig, bankCode: "237" };
      const result = generateRemessaCobranca(config, [mockBoleto], 1);

      expect(result.success).toBe(true);
      if (result.content) {
        expect(result.content.substring(0, 3)).toBe("237");
      }
    });

    it("deve gerar para Itaú (341)", () => {
      const config: CnabConfig = { ...mockConfig, bankCode: "341" };
      const result = generateRemessaCobranca(config, [mockBoleto], 1);

      expect(result.success).toBe(true);
      if (result.content) {
        expect(result.content.substring(0, 3)).toBe("341");
      }
    });

    it("deve gerar para Santander (033)", () => {
      const config: CnabConfig = { ...mockConfig, bankCode: "033" };
      const result = generateRemessaCobranca(config, [mockBoleto], 1);

      expect(result.success).toBe(true);
      if (result.content) {
        expect(result.content.substring(0, 3)).toBe("033");
      }
    });

    it("deve gerar para Caixa (104)", () => {
      const config: CnabConfig = { ...mockConfig, bankCode: "104" };
      const result = generateRemessaCobranca(config, [mockBoleto], 1);

      expect(result.success).toBe(true);
      if (result.content) {
        expect(result.content.substring(0, 3)).toBe("104");
      }
    });
  });
});
