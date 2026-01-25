import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router companies
 * Valida inputs e estruturas de dados
 */

// Schema de criação de empresa
const createCompanySchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  ie: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

// Schema de atualização de empresa
const updateCompanySchema = z.object({
  id: z.string(),
  name: z.string().min(3).optional(),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  ie: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

// Schema de busca por ID
const getByIdSchema = z.object({
  id: z.string(),
});

// Schema de resposta de empresa
const companyResponseSchema = z.object({
  id: z.string(),
  code: z.number(),
  name: z.string(),
  tradeName: z.string().nullable(),
  cnpj: z.string().nullable(),
  ie: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema de resposta com contadores
const companyWithCountsSchema = companyResponseSchema.extend({
  _count: z.object({
    users: z.number(),
    materials: z.number(),
    suppliers: z.number(),
  }),
});

describe("Companies Router Schemas", () => {
  describe("Create Company Schema", () => {
    it("should validate minimal company data", () => {
      const minimalCompany = {
        name: "Empresa Teste",
      };

      const result = createCompanySchema.safeParse(minimalCompany);
      expect(result.success).toBe(true);
    });

    it("should validate complete company data", () => {
      const completeCompany = {
        name: "Empresa Completa LTDA",
        tradeName: "Empresa Completa",
        cnpj: "12.345.678/0001-90",
        ie: "123.456.789.012",
        address: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        phone: "(11) 99999-9999",
        email: "contato@empresa.com.br",
      };

      const result = createCompanySchema.safeParse(completeCompany);
      expect(result.success).toBe(true);
    });

    it("should reject name with less than 3 characters", () => {
      const invalidCompany = {
        name: "AB",
      };

      const result = createCompanySchema.safeParse(invalidCompany);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nome deve ter pelo menos 3 caracteres");
      }
    });

    it("should reject invalid email format", () => {
      const invalidEmail = {
        name: "Empresa Teste",
        email: "email-invalido",
      };

      const result = createCompanySchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it("should accept empty optional fields", () => {
      const withEmptyOptionals = {
        name: "Empresa Teste",
        tradeName: "",
        cnpj: "",
        address: "",
      };

      const result = createCompanySchema.safeParse(withEmptyOptionals);
      expect(result.success).toBe(true);
    });

    it("should reject missing name", () => {
      const noName = {
        tradeName: "Nome Fantasia",
        cnpj: "12.345.678/0001-90",
      };

      const result = createCompanySchema.safeParse(noName);
      expect(result.success).toBe(false);
    });
  });

  describe("Update Company Schema", () => {
    it("should validate update with only id", () => {
      const updateOnlyId = {
        id: "uuid-123-456",
      };

      const result = updateCompanySchema.safeParse(updateOnlyId);
      expect(result.success).toBe(true);
    });

    it("should validate update with partial data", () => {
      const partialUpdate = {
        id: "uuid-123-456",
        name: "Novo Nome",
        phone: "(11) 88888-8888",
      };

      const result = updateCompanySchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("should validate complete update", () => {
      const completeUpdate = {
        id: "uuid-123-456",
        name: "Empresa Atualizada LTDA",
        tradeName: "Empresa Atualizada",
        cnpj: "98.765.432/0001-10",
        ie: "987.654.321.098",
        address: "Av. Brasil, 456",
        city: "Rio de Janeiro",
        state: "RJ",
        zipCode: "20000-000",
        phone: "(21) 99999-9999",
        email: "novo@empresa.com.br",
      };

      const result = updateCompanySchema.safeParse(completeUpdate);
      expect(result.success).toBe(true);
    });

    it("should reject update without id", () => {
      const noId = {
        name: "Novo Nome",
      };

      const result = updateCompanySchema.safeParse(noId);
      expect(result.success).toBe(false);
    });

    it("should reject update with invalid email", () => {
      const invalidEmail = {
        id: "uuid-123",
        email: "not-an-email",
      };

      const result = updateCompanySchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it("should reject name with less than 3 characters when provided", () => {
      const shortName = {
        id: "uuid-123",
        name: "AB",
      };

      const result = updateCompanySchema.safeParse(shortName);
      expect(result.success).toBe(false);
    });
  });

  describe("GetById Schema", () => {
    it("should validate valid UUID", () => {
      const validId = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = getByIdSchema.safeParse(validId);
      expect(result.success).toBe(true);
    });

    it("should validate any string as id", () => {
      const anyString = {
        id: "any-string-id",
      };

      const result = getByIdSchema.safeParse(anyString);
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const noId = {};

      const result = getByIdSchema.safeParse(noId);
      expect(result.success).toBe(false);
    });

    it("should reject non-string id", () => {
      const numericId = {
        id: 123,
      };

      const result = getByIdSchema.safeParse(numericId);
      expect(result.success).toBe(false);
    });
  });

  describe("Company Response Schema", () => {
    it("should validate complete company response", () => {
      const company = {
        id: "uuid-123",
        code: 1,
        name: "Empresa Teste",
        tradeName: "Teste",
        cnpj: "12.345.678/0001-90",
        ie: "123456789",
        address: "Rua Teste, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        phone: "(11) 99999-9999",
        email: "teste@empresa.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = companyResponseSchema.safeParse(company);
      expect(result.success).toBe(true);
    });

    it("should validate company with null optional fields", () => {
      const companyWithNulls = {
        id: "uuid-123",
        code: 1,
        name: "Empresa Mínima",
        tradeName: null,
        cnpj: null,
        ie: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        phone: null,
        email: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = companyResponseSchema.safeParse(companyWithNulls);
      expect(result.success).toBe(true);
    });

    it("should reject company without required fields", () => {
      const incomplete = {
        id: "uuid-123",
        name: "Empresa",
        // missing code, createdAt, updatedAt
      };

      const result = companyResponseSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });

  describe("Company With Counts Schema", () => {
    it("should validate company with counts", () => {
      const companyWithCounts = {
        id: "uuid-123",
        code: 1,
        name: "Empresa Teste",
        tradeName: null,
        cnpj: null,
        ie: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        phone: null,
        email: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          users: 5,
          materials: 150,
          suppliers: 30,
        },
      };

      const result = companyWithCountsSchema.safeParse(companyWithCounts);
      expect(result.success).toBe(true);
    });

    it("should validate company with zero counts", () => {
      const companyZeroCounts = {
        id: "uuid-123",
        code: 1,
        name: "Nova Empresa",
        tradeName: null,
        cnpj: null,
        ie: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        phone: null,
        email: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          users: 0,
          materials: 0,
          suppliers: 0,
        },
      };

      const result = companyWithCountsSchema.safeParse(companyZeroCounts);
      expect(result.success).toBe(true);
    });

    it("should reject company without _count", () => {
      const noCounts = {
        id: "uuid-123",
        code: 1,
        name: "Empresa",
        tradeName: null,
        cnpj: null,
        ie: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        phone: null,
        email: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = companyWithCountsSchema.safeParse(noCounts);
      expect(result.success).toBe(false);
    });
  });

  describe("CNPJ Validation", () => {
    it("should accept formatted CNPJ", () => {
      const formatted = {
        name: "Empresa",
        cnpj: "12.345.678/0001-90",
      };

      const result = createCompanySchema.safeParse(formatted);
      expect(result.success).toBe(true);
    });

    it("should accept unformatted CNPJ", () => {
      const unformatted = {
        name: "Empresa",
        cnpj: "12345678000190",
      };

      const result = createCompanySchema.safeParse(unformatted);
      expect(result.success).toBe(true);
    });
  });

  describe("State Validation", () => {
    it("should accept valid state abbreviations", () => {
      const states = ["SP", "RJ", "MG", "RS", "PR", "BA", "SC", "GO", "PE", "CE"];
      
      states.forEach(state => {
        const company = {
          name: "Empresa",
          state,
        };
        const result = createCompanySchema.safeParse(company);
        expect(result.success).toBe(true);
      });
    });

    it("should accept full state names", () => {
      const company = {
        name: "Empresa",
        state: "São Paulo",
      };

      const result = createCompanySchema.safeParse(company);
      expect(result.success).toBe(true);
    });
  });

  describe("Email Validation", () => {
    it("should accept valid email formats", () => {
      const validEmails = [
        "user@domain.com",
        "user.name@domain.com.br",
        "user+tag@domain.org",
        "user@subdomain.domain.com",
      ];

      validEmails.forEach(email => {
        const company = {
          name: "Empresa",
          email,
        };
        const result = createCompanySchema.safeParse(company);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "not-an-email",
        "@domain.com",
        "user@",
        "user@domain",
        "user domain.com",
      ];

      invalidEmails.forEach(email => {
        const company = {
          name: "Empresa",
          email,
        };
        const result = createCompanySchema.safeParse(company);
        expect(result.success).toBe(false);
      });
    });
  });
});
