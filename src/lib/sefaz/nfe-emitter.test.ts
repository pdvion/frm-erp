import { describe, it, expect } from "vitest";
import { gerarChaveAcesso, gerarXmlNFe, NFeData } from "./nfe-emitter";

describe("NFe Emitter", () => {
  describe("gerarChaveAcesso", () => {
    it("should generate a 44-digit access key", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );

      expect(chave).toHaveLength(44);
    });

    it("should start with UF code", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );

      expect(chave.slice(0, 2)).toBe("35"); // SP = 35
    });

    it("should include AAMM after UF code", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );

      expect(chave.slice(2, 6)).toBe("2601"); // Jan 2026
    });

    it("should include CNPJ after AAMM", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );

      expect(chave.slice(6, 20)).toBe("12345678000199");
    });

    it("should include model after CNPJ", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );

      expect(chave.slice(20, 22)).toBe("55");
    });

    it("should include serie padded to 3 digits", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );

      expect(chave.slice(22, 25)).toBe("001");
    });

    it("should include number padded to 9 digits", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );

      expect(chave.slice(25, 34)).toBe("000000123");
    });

    it("should throw error for invalid UF", () => {
      expect(() =>
        gerarChaveAcesso(
          "XX",
          new Date("2026-01-15"),
          "12345678000199",
          "55",
          "1",
          123
        )
      ).toThrow("UF inválida");
    });

    it("should throw error for invalid CNPJ length", () => {
      expect(() =>
        gerarChaveAcesso(
          "SP",
          new Date("2026-01-15"),
          "123456",
          "55",
          "1",
          123
        )
      ).toThrow("CNPJ inválido");
    });

    it("should throw error for invalid model", () => {
      expect(() =>
        gerarChaveAcesso(
          "SP",
          new Date("2026-01-15"),
          "12345678000199",
          "99",
          "1",
          123
        )
      ).toThrow("Modelo inválido");
    });

    it("should throw error for invalid serie", () => {
      expect(() =>
        gerarChaveAcesso(
          "SP",
          new Date("2026-01-15"),
          "12345678000199",
          "55",
          "1000",
          123
        )
      ).toThrow("Série inválida");
    });

    it("should throw error for invalid number (too small)", () => {
      expect(() =>
        gerarChaveAcesso(
          "SP",
          new Date("2026-01-15"),
          "12345678000199",
          "55",
          "1",
          0
        )
      ).toThrow("Número inválido");
    });

    it("should throw error for invalid number (too large)", () => {
      expect(() =>
        gerarChaveAcesso(
          "SP",
          new Date("2026-01-15"),
          "12345678000199",
          "55",
          "1",
          9999999999
        )
      ).toThrow("Número inválido");
    });

    it("should work with different UFs", () => {
      const chaveRJ = gerarChaveAcesso(
        "RJ",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );
      expect(chaveRJ.slice(0, 2)).toBe("33"); // RJ = 33

      const chaveMG = gerarChaveAcesso(
        "MG",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123
      );
      expect(chaveMG.slice(0, 2)).toBe("31"); // MG = 31
    });

    it("should work with NFC-e model 65", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "65",
        "1",
        123
      );

      expect(chave.slice(20, 22)).toBe("65");
    });

    it("should use custom codigo numerico when provided", () => {
      const chave = gerarChaveAcesso(
        "SP",
        new Date("2026-01-15"),
        "12345678000199",
        "55",
        "1",
        123,
        "1",
        "12345678"
      );

      expect(chave.slice(35, 43)).toBe("12345678");
    });
  });

  describe("gerarXmlNFe", () => {
    const mockNFeData: NFeData = {
      naturezaOperacao: "VENDA",
      modelo: "55",
      serie: "1",
      numero: 123,
      dataEmissao: new Date("2026-01-15"),
      tipoOperacao: "1",
      destino: "1",
      tipoImpressao: "1",
      finalidade: "1",
      consumidorFinal: "1",
      presencaComprador: "1",
      emitente: {
        cnpj: "12345678000199",
        ie: "123456789",
        razaoSocial: "Empresa Teste",
        endereco: {
          logradouro: "Rua Teste",
          numero: "123",
          bairro: "Centro",
          codigoMunicipio: "3550308",
          municipio: "São Paulo",
          uf: "SP",
          cep: "01234567",
          pais: "Brasil",
          codigoPais: "1058",
        },
        crt: "3",
      },
      destinatario: {
        cpfCnpj: "98765432000199",
        razaoSocial: "Cliente Teste",
        endereco: {
          logradouro: "Av Teste",
          numero: "456",
          bairro: "Centro",
          codigoMunicipio: "3550308",
          municipio: "São Paulo",
          uf: "SP",
          cep: "01234567",
        },
        indIEDest: "9",
      },
      itens: [
        {
          numero: 1,
          codigo: "PROD001",
          descricao: "Produto Teste",
          ncm: "12345678",
          cfop: "5102",
          unidade: "UN",
          quantidade: 10,
          valorUnitario: 100,
          valorTotal: 1000,
          icms: { origem: "0", cst: "00" },
          pis: { cst: "01" },
          cofins: { cst: "01" },
        },
      ],
      totais: {
        baseCalculoIcms: 1000,
        valorIcms: 180,
        valorProdutos: 1000,
        valorNota: 1000,
      },
      pagamento: {
        indicador: "0",
        formas: [{ tipo: "01", valor: 1000 }],
      },
    };

    it("should generate valid XML string", () => {
      const chave = "35260112345678000199550010000001231123456789";
      const xml = gerarXmlNFe(mockNFeData, chave);

      expect(typeof xml).toBe("string");
      expect(xml.length).toBeGreaterThan(0);
    });

    it("should include NFe namespace", () => {
      const chave = "35260112345678000199550010000001231123456789";
      const xml = gerarXmlNFe(mockNFeData, chave);

      expect(xml).toContain("http://www.portalfiscal.inf.br/nfe");
    });

    it("should include infNFe with Id attribute", () => {
      const chave = "35260112345678000199550010000001231123456789";
      const xml = gerarXmlNFe(mockNFeData, chave);

      expect(xml).toContain(`NFe${chave}`);
    });

    it("should include emitente data", () => {
      const chave = "35260112345678000199550010000001231123456789";
      const xml = gerarXmlNFe(mockNFeData, chave);

      expect(xml).toContain("Empresa Teste");
      expect(xml).toContain("12345678000199");
    });

    it("should include destinatario data", () => {
      const chave = "35260112345678000199550010000001231123456789";
      const xml = gerarXmlNFe(mockNFeData, chave);

      expect(xml).toContain("Cliente Teste");
      expect(xml).toContain("98765432000199");
    });

    it("should include item data", () => {
      const chave = "35260112345678000199550010000001231123456789";
      const xml = gerarXmlNFe(mockNFeData, chave);

      expect(xml).toContain("PROD001");
      expect(xml).toContain("Produto Teste");
    });
  });
});
