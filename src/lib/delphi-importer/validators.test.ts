/**
 * Tests for Delphi Importer Validators
 * VIO-820, VIO-821
 */

import { describe, it, expect } from "vitest";
import {
  delphiClienteSchema,
  delphiNFeEmitidaSchema,
  delphiNFeItemSchema,
  delphiMovimentoEstoqueSchema,
  validateDelphiClientes,
  validateDelphiNFes,
  generateValidationReport,
} from "./validators";

describe("Delphi Importer Validators", () => {
  describe("delphiClienteSchema", () => {
    it("should validate valid cliente with CNPJ", () => {
      const result = delphiClienteSchema.safeParse({
        codCliente: "001",
        cliente: "Empresa Teste LTDA",
        codCNPJ: "12.345.678/0001-99",
        cidade: "São Paulo",
        stateUf: "SP",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.codCliente).toBe("001");
        expect(result.data.cliente).toBe("Empresa Teste LTDA");
      }
    });

    it("should validate valid cliente with CPF", () => {
      const result = delphiClienteSchema.safeParse({
        codCliente: "002",
        cliente: "João da Silva",
        codCNPJ: "123.456.789-00",
      });

      expect(result.success).toBe(true);
    });

    it("should reject cliente without code", () => {
      const result = delphiClienteSchema.safeParse({
        codCliente: "",
        cliente: "Empresa Teste",
      });

      expect(result.success).toBe(false);
    });

    it("should reject cliente without name", () => {
      const result = delphiClienteSchema.safeParse({
        codCliente: "001",
        cliente: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid document", () => {
      const result = delphiClienteSchema.safeParse({
        codCliente: "001",
        cliente: "Empresa Teste",
        codCNPJ: "123", // Invalid
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delphiNFeEmitidaSchema", () => {
    it("should validate valid NFe", () => {
      const result = delphiNFeEmitidaSchema.safeParse({
        codEmissaoNF: "1",
        numNF: "12345",
        dtEmissao: "15/01/2026",
        vlrTotalProd: "1.000,00",
        vlrNfe: "1.180,00",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vlrTotalProd).toBe(1000);
        expect(result.data.vlrNfe).toBe(1180);
        expect(result.data.dtEmissao).toBeInstanceOf(Date);
      }
    });

    it("should validate NFe with ISO date", () => {
      const result = delphiNFeEmitidaSchema.safeParse({
        codEmissaoNF: "1",
        numNF: "12345",
        dtEmissao: "2026-01-15",
        vlrTotalProd: "1000.00",
        vlrNfe: "1180.00",
      });

      expect(result.success).toBe(true);
    });

    it("should validate NFe with valid chaveNFe", () => {
      const result = delphiNFeEmitidaSchema.safeParse({
        codEmissaoNF: "1",
        numNF: "12345",
        dtEmissao: "2026-01-15",
        chaveNFe: "12345678901234567890123456789012345678901234",
        vlrTotalProd: "1000",
        vlrNfe: "1180",
      });

      expect(result.success).toBe(true);
    });

    it("should reject NFe with invalid chaveNFe", () => {
      const result = delphiNFeEmitidaSchema.safeParse({
        codEmissaoNF: "1",
        numNF: "12345",
        dtEmissao: "2026-01-15",
        chaveNFe: "123", // Invalid - should be 44 digits
        vlrTotalProd: "1000",
        vlrNfe: "1180",
      });

      expect(result.success).toBe(false);
    });

    it("should reject NFe without numNF", () => {
      const result = delphiNFeEmitidaSchema.safeParse({
        codEmissaoNF: "1",
        numNF: "",
        dtEmissao: "2026-01-15",
        vlrTotalProd: "1000",
        vlrNfe: "1180",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delphiNFeItemSchema", () => {
    it("should validate valid item", () => {
      const result = delphiNFeItemSchema.safeParse({
        codEmissaoNF: "1",
        numItem: "1",
        codProduto: "PROD001",
        descricao: "Produto Teste",
        ncm: "84829900",
        cfop: "5102",
        unidade: "UN",
        quantidade: "10,5",
        valorUnitario: "100,00",
        valorTotal: "1.050,00",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantidade).toBe(10.5);
        expect(result.data.valorUnitario).toBe(100);
        expect(result.data.valorTotal).toBe(1050);
        expect(result.data.cfop).toBe(5102);
      }
    });

    it("should reject invalid CFOP", () => {
      const result = delphiNFeItemSchema.safeParse({
        codEmissaoNF: "1",
        numItem: "1",
        codProduto: "PROD001",
        descricao: "Produto Teste",
        cfop: "999", // Invalid
        unidade: "UN",
        quantidade: "10",
        valorUnitario: "100",
        valorTotal: "1000",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid NCM", () => {
      const result = delphiNFeItemSchema.safeParse({
        codEmissaoNF: "1",
        numItem: "1",
        codProduto: "PROD001",
        descricao: "Produto Teste",
        ncm: "123", // Invalid - should be 8 digits
        cfop: "5102",
        unidade: "UN",
        quantidade: "10",
        valorUnitario: "100",
        valorTotal: "1000",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delphiMovimentoEstoqueSchema", () => {
    it("should validate valid movimento entrada", () => {
      const result = delphiMovimentoEstoqueSchema.safeParse({
        codMovimento: "1",
        codProduto: "PROD001",
        tipoMovimento: "E",
        quantidade: "100",
        dataMovimento: "15/01/2026",
      });

      expect(result.success).toBe(true);
    });

    it("should validate valid movimento saida", () => {
      const result = delphiMovimentoEstoqueSchema.safeParse({
        codMovimento: "2",
        codProduto: "PROD001",
        tipoMovimento: "SAIDA",
        quantidade: "50",
        dataMovimento: "2026-01-15",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid tipoMovimento", () => {
      const result = delphiMovimentoEstoqueSchema.safeParse({
        codMovimento: "1",
        codProduto: "PROD001",
        tipoMovimento: "X", // Invalid
        quantidade: "100",
        dataMovimento: "15/01/2026",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("validateDelphiClientes", () => {
    it("should validate batch of clientes", () => {
      const data = [
        { codCliente: "001", cliente: "Empresa A", codCNPJ: "12345678000199" },
        { codCliente: "002", cliente: "Empresa B", codCNPJ: "98765432000188" },
        { codCliente: "", cliente: "Empresa C" }, // Invalid - no code
        { codCliente: "004", cliente: "" }, // Invalid - no name
      ];

      const report = validateDelphiClientes(data);

      expect(report.total).toBe(4);
      expect(report.valid).toBe(2);
      expect(report.invalid).toBe(2);
      expect(report.validRecords.length).toBe(2);
      expect(report.invalidRecords.length).toBe(2);
    });

    it("should track errors by field", () => {
      const data = [
        { codCliente: "", cliente: "A" },
        { codCliente: "", cliente: "B" },
        { codCliente: "001", cliente: "" },
      ];

      const report = validateDelphiClientes(data);

      expect(report.summary.errorsByField["codCliente"]).toBe(2);
      expect(report.summary.errorsByField["cliente"]).toBe(1);
    });
  });

  describe("validateDelphiNFes", () => {
    it("should validate batch of NFes", () => {
      const data = [
        { codEmissaoNF: "1", numNF: "100", dtEmissao: "2026-01-15", vlrTotalProd: "1000", vlrNfe: "1180" },
        { codEmissaoNF: "2", numNF: "101", dtEmissao: "15/01/2026", vlrTotalProd: "2000", vlrNfe: "2360" },
        { codEmissaoNF: "3", numNF: "", dtEmissao: "2026-01-15", vlrTotalProd: "500", vlrNfe: "590" }, // Invalid
      ];

      const report = validateDelphiNFes(data);

      expect(report.total).toBe(3);
      expect(report.valid).toBe(2);
      expect(report.invalid).toBe(1);
    });
  });

  describe("generateValidationReport", () => {
    it("should generate text report", () => {
      const data = [
        { codCliente: "001", cliente: "Empresa A" },
        { codCliente: "", cliente: "Empresa B" },
      ];

      const report = validateDelphiClientes(data);
      const text = generateValidationReport(report);

      expect(text).toContain("Relatório de Validação");
      expect(text).toContain("Total de registros: 2");
      expect(text).toContain("Válidos: 1");
      expect(text).toContain("Inválidos: 1");
    });

    it("should show most common errors", () => {
      const data = [
        { codCliente: "", cliente: "A" },
        { codCliente: "", cliente: "B" },
        { codCliente: "", cliente: "C" },
      ];

      const report = validateDelphiClientes(data);
      const text = generateValidationReport(report);

      expect(text).toContain("Erros Mais Comuns");
    });
  });
});
