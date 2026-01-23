import { describe, it, expect } from "vitest";
import {
  calcularFatorVencimento,
  gerarCodigoBarras,
  gerarLinhaDigitavel,
  gerarBoleto,
  gerarCampoLivreBB,
  gerarCampoLivreBradesco,
  gerarCampoLivreItau,
  gerarCampoLivreSantander,
  gerarCampoLivreCaixa,
  gerarCampoLivreSicoob,
  validarCodigoBarras,
  extrairInfoCodigoBarras,
} from "./barcode";

describe("Boleto Barcode", () => {
  describe("calcularFatorVencimento", () => {
    it("deve calcular fator para data base (07/10/1997)", () => {
      const dataBase = new Date(1997, 9, 7);
      expect(calcularFatorVencimento(dataBase)).toBe(0);
    });

    it("deve calcular fator para data futura", () => {
      const data = new Date(1997, 9, 8); // 08/10/1997
      expect(calcularFatorVencimento(data)).toBe(1);
    });

    it("deve calcular fator para data distante", () => {
      const data = new Date(2000, 0, 1); // 01/01/2000
      const fator = calcularFatorVencimento(data);
      expect(fator).toBeGreaterThan(800);
    });

    it("deve reiniciar após 9999", () => {
      // Data muito distante que ultrapassa 9999 dias
      const data = new Date(2030, 0, 1);
      const fator = calcularFatorVencimento(data);
      expect(fator).toBeGreaterThanOrEqual(1000);
      expect(fator).toBeLessThanOrEqual(9999);
    });
  });

  describe("gerarCodigoBarras", () => {
    it("deve gerar código de barras com 44 dígitos", () => {
      const codigo = gerarCodigoBarras({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      expect(codigo).toHaveLength(44);
    });

    it("deve incluir código do banco no início", () => {
      const codigo = gerarCodigoBarras({
        bankCode: "237",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      expect(codigo.substring(0, 3)).toBe("237");
    });

    it("deve usar moeda 9 (Real) por padrão", () => {
      const codigo = gerarCodigoBarras({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      expect(codigo.substring(3, 4)).toBe("9");
    });

    it("deve formatar valor corretamente", () => {
      const codigo = gerarCodigoBarras({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 1234.56,
        campoLivre: "1234567890123456789012345",
      });

      // Valor está nas posições 9-18 (10 dígitos)
      const valorNoCodigo = codigo.substring(9, 19);
      expect(valorNoCodigo).toBe("0000123456");
    });

    it("deve truncar campo livre para 25 dígitos", () => {
      const codigo = gerarCodigoBarras({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "12345678901234567890123456789", // 29 dígitos
      });

      expect(codigo).toHaveLength(44);
    });
  });

  describe("gerarLinhaDigitavel", () => {
    it("deve lançar erro para código com tamanho inválido", () => {
      expect(() => gerarLinhaDigitavel("123")).toThrow("Código de barras deve ter 44 dígitos");
    });

    it("deve gerar linha digitável formatada", () => {
      const codigoBarras = "00191000010000000100001234567890123456789012";
      const linha = gerarLinhaDigitavel(codigoBarras);

      // Linha digitável tem formato específico com pontos e espaços
      expect(linha).toContain(".");
      expect(linha).toContain(" ");
    });

    it("deve ter 5 campos separados por espaço", () => {
      const codigoBarras = "00191000010000000100001234567890123456789012";
      const linha = gerarLinhaDigitavel(codigoBarras);
      const campos = linha.split(" ");

      expect(campos).toHaveLength(5);
    });
  });

  describe("gerarBoleto", () => {
    it("deve retornar código de barras e linha digitável", () => {
      const boleto = gerarBoleto({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      expect(boleto.codigoBarras).toHaveLength(44);
      expect(boleto.linhaDigitavel).toBeDefined();
      expect(boleto.linhaDigitavel.length).toBeGreaterThan(44);
    });
  });

  describe("gerarCampoLivreBB", () => {
    it("deve gerar campo livre para convênio de 6 dígitos", () => {
      const campo = gerarCampoLivreBB({
        convenio: "123456",
        nossoNumero: "12345",
        agencia: "1234",
        conta: "12345678",
        carteira: "17",
      });

      expect(campo).toHaveLength(25);
      expect(campo.substring(0, 6)).toBe("123456");
    });

    it("deve gerar campo livre para convênio de 7 dígitos", () => {
      const campo = gerarCampoLivreBB({
        convenio: "1234567",
        nossoNumero: "1234567890",
        agencia: "1234",
        conta: "12345678",
        carteira: "17",
      });

      expect(campo).toHaveLength(25);
    });

    it("deve lançar erro para convênio inválido", () => {
      expect(() =>
        gerarCampoLivreBB({
          convenio: "12345", // 5 dígitos - inválido
          nossoNumero: "12345",
          agencia: "1234",
          conta: "12345678",
          carteira: "17",
        })
      ).toThrow("Convênio deve ter 6 ou 7 dígitos");
    });
  });

  describe("gerarCampoLivreBradesco", () => {
    it("deve gerar campo livre com 25 dígitos", () => {
      const campo = gerarCampoLivreBradesco({
        agencia: "1234",
        carteira: "09",
        nossoNumero: "12345678901",
        conta: "1234567",
      });

      expect(campo).toHaveLength(25);
    });

    it("deve terminar com 0", () => {
      const campo = gerarCampoLivreBradesco({
        agencia: "1234",
        carteira: "09",
        nossoNumero: "12345678901",
        conta: "1234567",
      });

      expect(campo.charAt(24)).toBe("0");
    });
  });

  describe("gerarCampoLivreItau", () => {
    it("deve gerar campo livre com 25 dígitos", () => {
      const campo = gerarCampoLivreItau({
        carteira: "109",
        nossoNumero: "12345678",
        agencia: "1234",
        conta: "12345",
      });

      expect(campo).toHaveLength(25);
    });

    it("deve terminar com 000", () => {
      const campo = gerarCampoLivreItau({
        carteira: "109",
        nossoNumero: "12345678",
        agencia: "1234",
        conta: "12345",
      });

      expect(campo.substring(22)).toBe("000");
    });
  });

  describe("gerarCampoLivreSantander", () => {
    it("deve gerar campo livre com 26 dígitos", () => {
      // Santander: 9 + codigoCedente(7) + nossoNumero(13) + 0 + ios(3) + 0 = 26
      const campo = gerarCampoLivreSantander({
        codigoCedente: "1234567",
        nossoNumero: "1234567890123",
      });

      expect(campo).toHaveLength(26);
    });

    it("deve começar com 9", () => {
      const campo = gerarCampoLivreSantander({
        codigoCedente: "1234567",
        nossoNumero: "1234567890123",
      });

      expect(campo.charAt(0)).toBe("9");
    });

    it("deve usar IOS padrão 0", () => {
      const campo = gerarCampoLivreSantander({
        codigoCedente: "1234567",
        nossoNumero: "1234567890123",
      });

      expect(campo).toContain("000");
    });
  });

  describe("gerarCampoLivreCaixa", () => {
    it("deve gerar campo livre com 25 dígitos", () => {
      const campo = gerarCampoLivreCaixa({
        codigoCedente: "123456",
        nossoNumero: "12345678901234567",
      });

      expect(campo).toHaveLength(25);
    });
  });

  describe("gerarCampoLivreSicoob", () => {
    it("deve gerar campo livre com 25 dígitos", () => {
      const campo = gerarCampoLivreSicoob({
        carteira: "01",
        codigoCedente: "12345",
        nossoNumero: "12345678901",
        agencia: "123",
        conta: "12345",
      });

      // Sicoob tem 27 caracteres (2+5+11+3+5+1)
      expect(campo).toHaveLength(27);
    });

    it("deve terminar com modalidade 1", () => {
      const campo = gerarCampoLivreSicoob({
        carteira: "01",
        codigoCedente: "12345",
        nossoNumero: "12345678901",
        agencia: "123",
        conta: "12345",
      });

      expect(campo.charAt(campo.length - 1)).toBe("1");
    });
  });

  describe("validarCodigoBarras", () => {
    it("deve rejeitar código com tamanho incorreto", () => {
      const result = validarCodigoBarras("123");
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Código de barras deve ter 44 dígitos (tem 3)");
    });

    it("deve rejeitar código com caracteres não numéricos", () => {
      const result = validarCodigoBarras("0019100001000000010000123456789012345678901A");
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Código de barras deve conter apenas números");
    });

    it("deve validar código com DV correto", () => {
      // Gerar um código válido primeiro
      const boleto = gerarBoleto({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      const result = validarCodigoBarras(boleto.codigoBarras);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("deve rejeitar código com DV incorreto", () => {
      // Código com DV alterado (posição 4)
      const codigoInvalido = "00190000010000000100001234567890123456789012";
      const result = validarCodigoBarras(codigoInvalido);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Dígito verificador inválido"))).toBe(true);
    });
  });

  describe("extrairInfoCodigoBarras", () => {
    it("deve extrair banco corretamente", () => {
      const boleto = gerarBoleto({
        bankCode: "237",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      const info = extrairInfoCodigoBarras(boleto.codigoBarras);
      expect(info.banco).toBe("237");
    });

    it("deve extrair moeda corretamente", () => {
      const boleto = gerarBoleto({
        bankCode: "001",
        moeda: "9",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      const info = extrairInfoCodigoBarras(boleto.codigoBarras);
      expect(info.moeda).toBe("9");
    });

    it("deve extrair valor corretamente", () => {
      const boleto = gerarBoleto({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 1234.56,
        campoLivre: "1234567890123456789012345",
      });

      const info = extrairInfoCodigoBarras(boleto.codigoBarras);
      expect(info.valor).toBe(1234.56);
    });

    it("deve extrair fator de vencimento corretamente", () => {
      const boleto = gerarBoleto({
        bankCode: "001",
        fatorVencimento: 5000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      const info = extrairInfoCodigoBarras(boleto.codigoBarras);
      expect(info.fatorVencimento).toBe(5000);
    });

    it("deve calcular data de vencimento", () => {
      const boleto = gerarBoleto({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre: "1234567890123456789012345",
      });

      const info = extrairInfoCodigoBarras(boleto.codigoBarras);
      expect(info.dataVencimento).toBeInstanceOf(Date);
    });

    it("deve extrair campo livre corretamente", () => {
      const campoLivre = "1234567890123456789012345";
      const boleto = gerarBoleto({
        bankCode: "001",
        fatorVencimento: 1000,
        valor: 100.0,
        campoLivre,
      });

      const info = extrairInfoCodigoBarras(boleto.codigoBarras);
      expect(info.campoLivre).toBe(campoLivre);
    });
  });
});
