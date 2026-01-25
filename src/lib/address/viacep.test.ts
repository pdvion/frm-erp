import { describe, it, expect } from "vitest";
import {
  formatCep,
  isValidCep,
  mapAddressToForm,
  type AddressData,
} from "./viacep";

describe("ViaCEP Utils", () => {
  describe("formatCep", () => {
    it("should remove non-numeric characters", () => {
      expect(formatCep("01310-100")).toBe("01310100");
      expect(formatCep("01.310-100")).toBe("01310100");
      expect(formatCep("01310100")).toBe("01310100");
    });

    it("should handle empty string", () => {
      expect(formatCep("")).toBe("");
    });

    it("should handle string with only non-numeric characters", () => {
      expect(formatCep("abc-def")).toBe("");
    });
  });

  describe("isValidCep", () => {
    it("should return true for valid 8-digit CEP", () => {
      expect(isValidCep("01310100")).toBe(true);
      expect(isValidCep("01310-100")).toBe(true);
      expect(isValidCep("12345678")).toBe(true);
    });

    it("should return false for CEP with less than 8 digits", () => {
      expect(isValidCep("1234567")).toBe(false);
      expect(isValidCep("123")).toBe(false);
    });

    it("should return false for CEP with more than 8 digits", () => {
      expect(isValidCep("123456789")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidCep("")).toBe(false);
    });

    it("should return false for non-numeric string", () => {
      expect(isValidCep("abcdefgh")).toBe(false);
    });
  });

  describe("mapAddressToForm", () => {
    it("should map address data to form fields", () => {
      const address: AddressData = {
        zipCode: "01310-100",
        street: "Avenida Paulista",
        complement: "até 610 - lado par",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        ibgeCode: "3550308",
        ddd: "11",
      };

      const result = mapAddressToForm(address);

      expect(result.zipCode).toBe("01310-100");
      expect(result.address).toBe("Avenida Paulista");
      expect(result.neighborhood).toBe("Bela Vista");
      expect(result.city).toBe("São Paulo");
      expect(result.state).toBe("SP");
      expect(result.ibgeCode).toBe("3550308");
    });

    it("should handle empty fields", () => {
      const address: AddressData = {
        zipCode: "01310-100",
        street: "",
        complement: "",
        neighborhood: "",
        city: "São Paulo",
        state: "SP",
        ibgeCode: "",
        ddd: "",
      };

      const result = mapAddressToForm(address);

      expect(result.address).toBe("");
      expect(result.neighborhood).toBe("");
    });
  });

  describe("CEP Format Variations", () => {
    it("should accept CEP with hyphen", () => {
      expect(isValidCep("01310-100")).toBe(true);
    });

    it("should accept CEP with dots", () => {
      expect(isValidCep("01.310-100")).toBe(true);
    });

    it("should accept CEP with spaces", () => {
      expect(isValidCep("01310 100")).toBe(true);
    });

    it("should accept plain numeric CEP", () => {
      expect(isValidCep("01310100")).toBe(true);
    });
  });

  describe("Brazilian State CEPs", () => {
    it("should validate São Paulo CEPs (01xxx-xxx to 19xxx-xxx)", () => {
      expect(isValidCep("01310100")).toBe(true); // São Paulo capital
      expect(isValidCep("13000000")).toBe(true); // Campinas
      expect(isValidCep("19000000")).toBe(true); // Presidente Prudente
    });

    it("should validate Rio de Janeiro CEPs (20xxx-xxx to 28xxx-xxx)", () => {
      expect(isValidCep("20040020")).toBe(true); // Rio de Janeiro
      expect(isValidCep("24000000")).toBe(true); // Niterói
    });

    it("should validate Minas Gerais CEPs (30xxx-xxx to 39xxx-xxx)", () => {
      expect(isValidCep("30130000")).toBe(true); // Belo Horizonte
      expect(isValidCep("35000000")).toBe(true); // Governador Valadares
    });

    it("should validate Rio Grande do Sul CEPs (90xxx-xxx to 99xxx-xxx)", () => {
      expect(isValidCep("90000000")).toBe(true); // Porto Alegre
      expect(isValidCep("95000000")).toBe(true); // Caxias do Sul
    });
  });

  describe("Edge Cases", () => {
    it("should handle CEP starting with zero", () => {
      expect(formatCep("01310100")).toBe("01310100");
      expect(isValidCep("01310100")).toBe(true);
    });

    it("should handle CEP with all zeros", () => {
      expect(isValidCep("00000000")).toBe(true); // Format is valid, but doesn't exist
    });

    it("should handle CEP with all nines", () => {
      expect(isValidCep("99999999")).toBe(true);
    });
  });
});
