import { describe, it, expect } from "vitest";
import {
  formatCnpj,
  formatCnpjDisplay,
  isValidCnpj,
  isValidCnpjFormat,
  mapCnpjToSupplierForm,
  mapCnpjToCompanyForm,
  type CnpjData,
} from "./cnpj";

describe("CNPJ Utils", () => {
  describe("formatCnpj", () => {
    it("should remove non-numeric characters", () => {
      expect(formatCnpj("12.345.678/0001-90")).toBe("12345678000190");
      expect(formatCnpj("12345678000190")).toBe("12345678000190");
    });

    it("should handle empty string", () => {
      expect(formatCnpj("")).toBe("");
    });

    it("should handle string with only non-numeric characters", () => {
      expect(formatCnpj("abc/def-gh")).toBe("");
    });
  });

  describe("formatCnpjDisplay", () => {
    it("should format CNPJ for display", () => {
      expect(formatCnpjDisplay("12345678000190")).toBe("12.345.678/0001-90");
    });

    it("should return original if not 14 digits", () => {
      expect(formatCnpjDisplay("123456")).toBe("123456");
      expect(formatCnpjDisplay("")).toBe("");
    });

    it("should handle already formatted CNPJ", () => {
      const formatted = formatCnpjDisplay(formatCnpj("12.345.678/0001-90"));
      expect(formatted).toBe("12.345.678/0001-90");
    });
  });

  describe("isValidCnpjFormat", () => {
    it("should return true for 14-digit CNPJ", () => {
      expect(isValidCnpjFormat("12345678000190")).toBe(true);
      expect(isValidCnpjFormat("12.345.678/0001-90")).toBe(true);
    });

    it("should return false for CNPJ with less than 14 digits", () => {
      expect(isValidCnpjFormat("1234567800019")).toBe(false);
      expect(isValidCnpjFormat("123")).toBe(false);
    });

    it("should return false for CNPJ with more than 14 digits", () => {
      expect(isValidCnpjFormat("123456780001901")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidCnpjFormat("")).toBe(false);
    });
  });

  describe("isValidCnpj", () => {
    it("should return true for valid CNPJs", () => {
      // CNPJs válidos para teste
      expect(isValidCnpj("11222333000181")).toBe(true);
      expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    });

    it("should return false for invalid check digits", () => {
      expect(isValidCnpj("12345678000199")).toBe(false);
      expect(isValidCnpj("11222333000182")).toBe(false);
    });

    it("should return false for CNPJs with all same digits", () => {
      expect(isValidCnpj("00000000000000")).toBe(false);
      expect(isValidCnpj("11111111111111")).toBe(false);
      expect(isValidCnpj("22222222222222")).toBe(false);
      expect(isValidCnpj("99999999999999")).toBe(false);
    });

    it("should return false for invalid format", () => {
      expect(isValidCnpj("123")).toBe(false);
      expect(isValidCnpj("")).toBe(false);
    });
  });

  describe("mapCnpjToSupplierForm", () => {
    it("should map CNPJ data to supplier form fields", () => {
      const data: CnpjData = {
        cnpj: "12.345.678/0001-90",
        razaoSocial: "Empresa Teste LTDA",
        nomeFantasia: "Empresa Teste",
        situacao: "ATIVA",
        dataAbertura: "2020-01-15",
        naturezaJuridica: "206-2 - Sociedade Empresária Limitada",
        atividadePrincipal: "Comércio varejista",
        logradouro: "Rua das Flores",
        numero: "123",
        complemento: "Sala 101",
        bairro: "Centro",
        municipio: "São Paulo",
        uf: "SP",
        cep: "01310100",
        telefone: "1199999999",
        email: "contato@empresa.com",
        capitalSocial: 100000,
      };

      const result = mapCnpjToSupplierForm(data);

      expect(result.cnpj).toBe("12.345.678/0001-90");
      expect(result.companyName).toBe("Empresa Teste LTDA");
      expect(result.tradeName).toBe("Empresa Teste");
      expect(result.address).toBe("Rua das Flores, 123");
      expect(result.complement).toBe("Sala 101");
      expect(result.neighborhood).toBe("Centro");
      expect(result.city).toBe("São Paulo");
      expect(result.state).toBe("SP");
      expect(result.zipCode).toBe("01310100");
      expect(result.phone).toBe("1199999999");
      expect(result.email).toBe("contato@empresa.com");
    });

    it("should handle empty numero", () => {
      const data: CnpjData = {
        cnpj: "12.345.678/0001-90",
        razaoSocial: "Empresa",
        nomeFantasia: "",
        situacao: "ATIVA",
        dataAbertura: "",
        naturezaJuridica: "",
        atividadePrincipal: "",
        logradouro: "Rua das Flores",
        numero: "",
        complemento: "",
        bairro: "",
        municipio: "São Paulo",
        uf: "SP",
        cep: "",
        telefone: "",
        email: "",
        capitalSocial: 0,
      };

      const result = mapCnpjToSupplierForm(data);
      expect(result.address).toBe("Rua das Flores");
    });
  });

  describe("mapCnpjToCompanyForm", () => {
    it("should map CNPJ data to company form fields", () => {
      const data: CnpjData = {
        cnpj: "12.345.678/0001-90",
        razaoSocial: "Empresa Teste LTDA",
        nomeFantasia: "Empresa Teste",
        situacao: "ATIVA",
        dataAbertura: "2020-01-15",
        naturezaJuridica: "",
        atividadePrincipal: "",
        logradouro: "Avenida Brasil",
        numero: "456",
        complemento: "",
        bairro: "Centro",
        municipio: "Rio de Janeiro",
        uf: "RJ",
        cep: "20040020",
        telefone: "2199999999",
        email: "empresa@teste.com",
        capitalSocial: 500000,
      };

      const result = mapCnpjToCompanyForm(data);

      expect(result.cnpj).toBe("12.345.678/0001-90");
      expect(result.name).toBe("Empresa Teste LTDA");
      expect(result.tradeName).toBe("Empresa Teste");
      expect(result.address).toBe("Avenida Brasil, 456");
      expect(result.city).toBe("Rio de Janeiro");
      expect(result.state).toBe("RJ");
      expect(result.zipCode).toBe("20040020");
      expect(result.phone).toBe("2199999999");
      expect(result.email).toBe("empresa@teste.com");
    });
  });

  describe("CNPJ Validation Edge Cases", () => {
    it("should validate real-world CNPJ patterns", () => {
      // Padrões comuns de CNPJ
      expect(isValidCnpjFormat("00.000.000/0001-00")).toBe(true);
      expect(isValidCnpjFormat("99.999.999/9999-99")).toBe(true);
    });

    it("should handle CNPJ with branch number", () => {
      // Matriz (0001)
      expect(isValidCnpjFormat("12345678000190")).toBe(true);
      // Filial (0002)
      expect(isValidCnpjFormat("12345678000290")).toBe(true);
    });
  });

  describe("Check Digit Calculation", () => {
    it("should correctly validate check digits", () => {
      // CNPJ com dígitos verificadores corretos
      expect(isValidCnpj("11222333000181")).toBe(true);
      
      // Mesmo CNPJ com primeiro dígito verificador errado
      expect(isValidCnpj("11222333000191")).toBe(false);
      
      // Mesmo CNPJ com segundo dígito verificador errado
      expect(isValidCnpj("11222333000182")).toBe(false);
    });
  });

  describe("Known Valid CNPJs", () => {
    it("should validate known valid CNPJs", () => {
      // CNPJs gerados para teste (não são empresas reais)
      const validCnpjs = [
        "11222333000181",
        "19131243000197",
        "03778130000148",
      ];

      validCnpjs.forEach(cnpj => {
        expect(isValidCnpj(cnpj)).toBe(true);
      });
    });
  });
});
