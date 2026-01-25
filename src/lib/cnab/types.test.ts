import { describe, it, expect } from "vitest";
import {
  BANK_NAMES,
  OCORRENCIAS_COBRANCA,
  type BankCode,
  type CnabLayout,
  type RemessaTipo,
  type RetornoTipo,
  type CnabConfig,
  type BoletoData,
  type RemessaRegistro,
  type RemessaResult,
  type RetornoRegistro,
  type RetornoResult,
  type PagamentoData,
} from "./types";

describe("CNAB Types", () => {
  describe("BANK_NAMES", () => {
    it("should have 6 banks", () => {
      expect(Object.keys(BANK_NAMES)).toHaveLength(6);
    });

    it("should have Banco do Brasil", () => {
      expect(BANK_NAMES["001"]).toBe("Banco do Brasil");
    });

    it("should have Santander", () => {
      expect(BANK_NAMES["033"]).toBe("Santander");
    });

    it("should have Caixa", () => {
      expect(BANK_NAMES["104"]).toBe("Caixa Econômica Federal");
    });

    it("should have Bradesco", () => {
      expect(BANK_NAMES["237"]).toBe("Bradesco");
    });

    it("should have Itaú", () => {
      expect(BANK_NAMES["341"]).toBe("Itaú");
    });

    it("should have Sicoob", () => {
      expect(BANK_NAMES["756"]).toBe("Sicoob");
    });
  });

  describe("OCORRENCIAS_COBRANCA", () => {
    it("should have multiple occurrences", () => {
      expect(Object.keys(OCORRENCIAS_COBRANCA).length).toBeGreaterThan(10);
    });

    it("should have Entrada Confirmada", () => {
      expect(OCORRENCIAS_COBRANCA["02"]).toBe("Entrada Confirmada");
    });

    it("should have Liquidação", () => {
      expect(OCORRENCIAS_COBRANCA["06"]).toBe("Liquidação");
    });

    it("should have Baixa", () => {
      expect(OCORRENCIAS_COBRANCA["09"]).toBe("Baixa");
    });
  });

  describe("BankCode type", () => {
    it("should accept valid bank codes", () => {
      const codes: BankCode[] = ["001", "033", "104", "237", "341", "756"];
      expect(codes).toHaveLength(6);
    });
  });

  describe("CnabLayout type", () => {
    it("should accept 240", () => {
      const layout: CnabLayout = "240";
      expect(layout).toBe("240");
    });

    it("should accept 400", () => {
      const layout: CnabLayout = "400";
      expect(layout).toBe("400");
    });
  });

  describe("RemessaTipo type", () => {
    it("should accept COBRANCA", () => {
      const tipo: RemessaTipo = "COBRANCA";
      expect(tipo).toBe("COBRANCA");
    });

    it("should accept PAGAMENTO", () => {
      const tipo: RemessaTipo = "PAGAMENTO";
      expect(tipo).toBe("PAGAMENTO");
    });
  });

  describe("RetornoTipo type", () => {
    it("should accept COBRANCA", () => {
      const tipo: RetornoTipo = "COBRANCA";
      expect(tipo).toBe("COBRANCA");
    });

    it("should accept PAGAMENTO", () => {
      const tipo: RetornoTipo = "PAGAMENTO";
      expect(tipo).toBe("PAGAMENTO");
    });
  });

  describe("CnabConfig interface", () => {
    it("should accept valid config", () => {
      const config: CnabConfig = {
        bankCode: "341",
        layout: "240",
        agencia: "1234",
        agenciaDigito: "5",
        conta: "12345",
        contaDigito: "6",
        convenio: "1234567",
        carteira: "109",
        cedente: "Empresa Teste LTDA",
        cedenteDocumento: "12345678000199",
      };

      expect(config.bankCode).toBe("341");
      expect(config.layout).toBe("240");
    });

    it("should accept config without optional fields", () => {
      const config: CnabConfig = {
        bankCode: "237",
        layout: "400",
        agencia: "1234",
        conta: "12345",
        contaDigito: "6",
        cedente: "Empresa Teste",
        cedenteDocumento: "12345678000199",
      };

      expect(config.convenio).toBeUndefined();
      expect(config.carteira).toBeUndefined();
    });
  });

  describe("BoletoData interface", () => {
    it("should represent boleto data", () => {
      const boleto: BoletoData = {
        id: "boleto-123",
        nossoNumero: "12345678901",
        numeroDocumento: "DOC-001",
        dataEmissao: new Date("2026-01-25"),
        dataVencimento: new Date("2026-02-25"),
        valor: 1500.50,
        sacado: {
          nome: "Cliente Teste",
          documento: "12345678900",
          endereco: "Rua Teste, 123",
          cidade: "São Paulo",
          uf: "SP",
          cep: "01234567",
        },
      };

      expect(boleto.valor).toBe(1500.50);
      expect(boleto.sacado.nome).toBe("Cliente Teste");
    });

    it("should include optional fields", () => {
      const boleto: BoletoData = {
        id: "boleto-456",
        nossoNumero: "12345678902",
        numeroDocumento: "DOC-002",
        dataEmissao: new Date("2026-01-25"),
        dataVencimento: new Date("2026-02-25"),
        valor: 2000,
        valorDesconto: 100,
        valorMulta: 40,
        valorJuros: 20,
        sacado: {
          nome: "Cliente 2",
          documento: "98765432100",
          endereco: "Av Teste, 456",
          cidade: "Rio de Janeiro",
          uf: "RJ",
          cep: "20000000",
        },
        instrucoes: ["Não receber após vencimento", "Cobrar multa de 2%"],
        linhaDigitavel: "34191.79001 01043.510047 91020.150008 1 84410000012345",
        codigoBarras: "34191844100000123451790010104351004791020150",
        pixCopiaECola: "00020126580014br.gov.bcb.pix...",
      };

      expect(boleto.valorDesconto).toBe(100);
      expect(boleto.instrucoes).toHaveLength(2);
    });
  });

  describe("RemessaRegistro interface", () => {
    it("should represent header arquivo", () => {
      const registro: RemessaRegistro = {
        tipo: "HEADER_ARQUIVO",
        dados: { banco: "341", empresa: "Teste" },
      };

      expect(registro.tipo).toBe("HEADER_ARQUIVO");
    });

    it("should represent detalhe with segmento", () => {
      const registro: RemessaRegistro = {
        tipo: "DETALHE",
        segmento: "P",
        dados: { nossoNumero: "12345", valor: 1500 },
      };

      expect(registro.segmento).toBe("P");
    });
  });

  describe("RemessaResult interface", () => {
    it("should represent successful result", () => {
      const result: RemessaResult = {
        success: true,
        filename: "REMESSA_20260125.REM",
        content: "00100000...",
        totalRegistros: 10,
        valorTotal: 15000.50,
      };

      expect(result.success).toBe(true);
      expect(result.totalRegistros).toBe(10);
    });

    it("should represent failed result", () => {
      const result: RemessaResult = {
        success: false,
        errors: ["Dados inválidos", "Conta não encontrada"],
      };

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe("RetornoRegistro interface", () => {
    it("should represent retorno registro", () => {
      const registro: RetornoRegistro = {
        tipo: "DETALHE",
        segmento: "T",
        nossoNumero: "12345678901",
        seuNumero: "DOC-001",
        dataOcorrencia: new Date("2026-01-25"),
        dataPagamento: new Date("2026-01-25"),
        valorPago: 1500.50,
        valorTitulo: 1500.50,
        codigoOcorrencia: "06",
        descricaoOcorrencia: "Liquidação",
      };

      expect(registro.valorPago).toBe(1500.50);
      expect(registro.codigoOcorrencia).toBe("06");
    });
  });

  describe("RetornoResult interface", () => {
    it("should represent successful retorno", () => {
      const result: RetornoResult = {
        success: true,
        banco: "341",
        dataGeracao: new Date("2026-01-25"),
        registros: [],
        totalPagos: 5,
        totalRejeitados: 1,
        valorTotal: 7500.00,
      };

      expect(result.success).toBe(true);
      expect(result.totalPagos).toBe(5);
    });
  });

  describe("PagamentoData interface", () => {
    it("should represent payment to supplier", () => {
      const pagamento: PagamentoData = {
        id: "pag-001",
        tipo: "FORNECEDOR",
        favorecido: {
          nome: "Fornecedor Teste",
          documento: "12345678000199",
          banco: "341",
          agencia: "1234",
          conta: "12345",
          contaDigito: "6",
        },
        valor: 5000.00,
        dataPagamento: new Date("2026-01-30"),
        descricao: "Pagamento NF 12345",
      };

      expect(pagamento.tipo).toBe("FORNECEDOR");
      expect(pagamento.valor).toBe(5000.00);
    });

    it("should represent tax payment", () => {
      const pagamento: PagamentoData = {
        id: "pag-002",
        tipo: "IMPOSTO",
        favorecido: {
          nome: "Receita Federal",
          documento: "00394460000141",
          banco: "001",
          agencia: "0001",
          conta: "00000",
          contaDigito: "0",
        },
        valor: 1234.56,
        dataPagamento: new Date("2026-01-31"),
        codigoBarras: "85800000012-3 45600000000-1 00000000000-2 00000000000-3",
      };

      expect(pagamento.tipo).toBe("IMPOSTO");
      expect(pagamento.codigoBarras).toBeDefined();
    });
  });
});
