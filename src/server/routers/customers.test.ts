import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "ALL"]).optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const byIdOrCodeInputSchema = z.object({ idOrCode: z.string() });

const createInputSchema = z.object({
  code: z.string().min(1),
  cnpj: z.string().min(11).max(18),
  companyName: z.string().min(1),
  tradeName: z.string().optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("Brasil"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  creditLimit: z.number().default(0),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

const updateInputSchema = z.object({
  id: z.string(),
  cnpj: z.string().optional(),
  companyName: z.string().optional(),
  tradeName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  creditLimit: z.number().optional(),
  notes: z.string().optional(),
});

const deleteInputSchema = z.object({ id: z.string() });

describe("Customers Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "empresa" });
      expect(result.success).toBe(true);
    });

    it("should accept status ACTIVE", () => {
      const result = listInputSchema.safeParse({ status: "ACTIVE" });
      expect(result.success).toBe(true);
    });

    it("should accept status INACTIVE", () => {
      const result = listInputSchema.safeParse({ status: "INACTIVE" });
      expect(result.success).toBe(true);
    });

    it("should accept status BLOCKED", () => {
      const result = listInputSchema.safeParse({ status: "BLOCKED" });
      expect(result.success).toBe(true);
    });

    it("should accept status ALL", () => {
      const result = listInputSchema.safeParse({ status: "ALL" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "DELETED" });
      expect(result.success).toBe(false);
    });

    it("should default page to 1", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
      }
    });

    it("should default limit to 20", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.limit).toBe(20);
      }
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "cust-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("byIdOrCode input", () => {
    it("should accept UUID", () => {
      const result = byIdOrCodeInputSchema.safeParse({ 
        idOrCode: "550e8400-e29b-41d4-a716-446655440000" 
      });
      expect(result.success).toBe(true);
    });

    it("should accept code string", () => {
      const result = byIdOrCodeInputSchema.safeParse({ idOrCode: "CLI001" });
      expect(result.success).toBe(true);
    });
  });

  describe("create input", () => {
    it("should accept minimal valid input", () => {
      const result = createInputSchema.safeParse({
        code: "CLI001",
        cnpj: "12345678000190",
        companyName: "Cliente Teste LTDA",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createInputSchema.safeParse({
        code: "CLI002",
        cnpj: "98765432000199",
        companyName: "Cliente ABC",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.country).toBe("Brasil");
        expect(result.data.creditLimit).toBe(0);
      }
    });

    it("should accept full input", () => {
      const result = createInputSchema.safeParse({
        code: "CLI003",
        cnpj: "11222333000144",
        companyName: "Cliente Completo LTDA",
        tradeName: "Cliente Completo",
        stateRegistration: "123456789",
        municipalRegistration: "987654321",
        email: "contato@cliente.com",
        phone: "(11) 99999-9999",
        website: "https://cliente.com",
        address: "Rua das Flores",
        addressNumber: "100",
        addressComplement: "Sala 10",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        country: "Brasil",
        contactName: "Maria Silva",
        contactPhone: "(11) 88888-8888",
        contactEmail: "maria@cliente.com",
        creditLimit: 50000,
        paymentTerms: "30/60/90",
        notes: "Cliente VIP",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing code", () => {
      const result = createInputSchema.safeParse({
        cnpj: "12345678000190",
        companyName: "Empresa sem código",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code", () => {
      const result = createInputSchema.safeParse({
        code: "",
        cnpj: "12345678000190",
        companyName: "Empresa código vazio",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing cnpj", () => {
      const result = createInputSchema.safeParse({
        code: "CLI004",
        companyName: "Empresa sem CNPJ",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing companyName", () => {
      const result = createInputSchema.safeParse({
        code: "CLI005",
        cnpj: "12345678000190",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty companyName", () => {
      const result = createInputSchema.safeParse({
        code: "CLI006",
        cnpj: "12345678000190",
        companyName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject cnpj too short", () => {
      const result = createInputSchema.safeParse({
        code: "CLI007",
        cnpj: "123",
        companyName: "Empresa CNPJ curto",
      });
      expect(result.success).toBe(false);
    });

    it("should accept CPF (11 digits)", () => {
      const result = createInputSchema.safeParse({
        code: "CLI008",
        cnpj: "12345678901",
        companyName: "Pessoa Física",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = createInputSchema.safeParse({
        code: "CLI009",
        cnpj: "12345678000190",
        companyName: "Empresa Email Inválido",
        email: "email-invalido",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid contactEmail", () => {
      const result = createInputSchema.safeParse({
        code: "CLI010",
        cnpj: "12345678000190",
        companyName: "Empresa Contact Email Inválido",
        contactEmail: "not-an-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "cust-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "cust-123",
        companyName: "Novo Nome",
        status: "INACTIVE",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        companyName: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should accept status change to BLOCKED", () => {
      const result = updateInputSchema.safeParse({
        id: "cust-123",
        status: "BLOCKED",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email on update", () => {
      const result = updateInputSchema.safeParse({
        id: "cust-123",
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("should accept creditLimit update", () => {
      const result = updateInputSchema.safeParse({
        id: "cust-123",
        creditLimit: 100000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "cust-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
