import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).optional(),
  assignedTo: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

const byIdInputSchema = z.object({ id: z.string() });

const createInputSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).default("OTHER"),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

const updateInputSchema = z.object({
  id: z.string(),
  companyName: z.string().min(1).optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).optional(),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

const convertToCustomerInputSchema = z.object({
  leadId: z.string(),
  cnpj: z.string().min(11).max(18),
  stateRegistration: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const addActivityInputSchema = z.object({
  leadId: z.string(),
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "TASK"]),
  description: z.string().min(1),
  scheduledAt: z.date().optional(),
  completedAt: z.date().optional(),
});

const updateActivityInputSchema = z.object({
  id: z.string(),
  description: z.string().min(1).optional(),
  scheduledAt: z.date().optional(),
  completedAt: z.date().optional(),
});

const deleteActivityInputSchema = z.object({ id: z.string() });

const deleteInputSchema = z.object({ id: z.string() });

describe("Leads Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input with defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "empresa" });
      expect(result.success).toBe(true);
    });

    it("should accept all status values", () => {
      const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
      for (const status of statuses) {
        const result = listInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept all source values", () => {
      const sources = ["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"];
      for (const source of sources) {
        const result = listInputSchema.safeParse({ source });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid source", () => {
      const result = listInputSchema.safeParse({ source: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept assignedTo", () => {
      const result = listInputSchema.safeParse({ assignedTo: "user-123" });
      expect(result.success).toBe(true);
    });

    it("should accept custom pagination", () => {
      const result = listInputSchema.safeParse({ page: 5, limit: 50 });
      expect(result.success).toBe(true);
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "lead-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("create input", () => {
    it("should accept minimal valid input", () => {
      const result = createInputSchema.safeParse({
        companyName: "Empresa ABC",
      });
      expect(result.success).toBe(true);
    });

    it("should apply default source", () => {
      const result = createInputSchema.safeParse({
        companyName: "Empresa ABC",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("OTHER");
      }
    });

    it("should accept full input", () => {
      const result = createInputSchema.safeParse({
        companyName: "Empresa XYZ",
        contactName: "João Silva",
        email: "joao@empresa.com",
        phone: "(11) 99999-9999",
        website: "https://empresa.com",
        source: "WEBSITE",
        estimatedValue: 50000,
        notes: "Lead qualificado",
        assignedTo: "user-123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing companyName", () => {
      const result = createInputSchema.safeParse({
        contactName: "João",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty companyName", () => {
      const result = createInputSchema.safeParse({
        companyName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = createInputSchema.safeParse({
        companyName: "Empresa",
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative estimatedValue", () => {
      const result = createInputSchema.safeParse({
        companyName: "Empresa",
        estimatedValue: -1000,
      });
      expect(result.success).toBe(false);
    });

    it("should accept zero estimatedValue", () => {
      const result = createInputSchema.safeParse({
        companyName: "Empresa",
        estimatedValue: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "lead-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "lead-123",
        status: "QUALIFIED",
        estimatedValue: 75000,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        companyName: "Nova Empresa",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all status transitions", () => {
      const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
      for (const status of statuses) {
        const result = updateInputSchema.safeParse({ id: "lead-123", status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject empty companyName on update", () => {
      const result = updateInputSchema.safeParse({
        id: "lead-123",
        companyName: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("convertToCustomer input", () => {
    it("should accept valid input", () => {
      const result = convertToCustomerInputSchema.safeParse({
        leadId: "lead-123",
        cnpj: "12345678000190",
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = convertToCustomerInputSchema.safeParse({
        leadId: "lead-123",
        cnpj: "12345678000190",
        stateRegistration: "123456789",
        address: "Rua das Flores, 100",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing leadId", () => {
      const result = convertToCustomerInputSchema.safeParse({
        cnpj: "12345678000190",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing cnpj", () => {
      const result = convertToCustomerInputSchema.safeParse({
        leadId: "lead-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject cnpj too short", () => {
      const result = convertToCustomerInputSchema.safeParse({
        leadId: "lead-123",
        cnpj: "123",
      });
      expect(result.success).toBe(false);
    });

    it("should accept CPF (11 digits)", () => {
      const result = convertToCustomerInputSchema.safeParse({
        leadId: "lead-123",
        cnpj: "12345678901",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("addActivity input", () => {
    it("should accept valid activity", () => {
      const result = addActivityInputSchema.safeParse({
        leadId: "lead-123",
        type: "CALL",
        description: "Ligação de prospecção",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all activity types", () => {
      const types = ["CALL", "EMAIL", "MEETING", "NOTE", "TASK"];
      for (const type of types) {
        const result = addActivityInputSchema.safeParse({
          leadId: "lead-123",
          type,
          description: `Atividade ${type}`,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept with dates", () => {
      const result = addActivityInputSchema.safeParse({
        leadId: "lead-123",
        type: "MEETING",
        description: "Reunião de apresentação",
        scheduledAt: new Date("2026-02-01T10:00:00"),
        completedAt: new Date("2026-02-01T11:00:00"),
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing leadId", () => {
      const result = addActivityInputSchema.safeParse({
        type: "CALL",
        description: "Ligação",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing type", () => {
      const result = addActivityInputSchema.safeParse({
        leadId: "lead-123",
        description: "Atividade",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing description", () => {
      const result = addActivityInputSchema.safeParse({
        leadId: "lead-123",
        type: "CALL",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty description", () => {
      const result = addActivityInputSchema.safeParse({
        leadId: "lead-123",
        type: "CALL",
        description: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid type", () => {
      const result = addActivityInputSchema.safeParse({
        leadId: "lead-123",
        type: "INVALID",
        description: "Atividade",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateActivity input", () => {
    it("should accept id only", () => {
      const result = updateActivityInputSchema.safeParse({ id: "act-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateActivityInputSchema.safeParse({
        id: "act-123",
        description: "Nova descrição",
        completedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateActivityInputSchema.safeParse({
        description: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty description on update", () => {
      const result = updateActivityInputSchema.safeParse({
        id: "act-123",
        description: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteActivity input", () => {
    it("should accept valid id", () => {
      const result = deleteActivityInputSchema.safeParse({ id: "act-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteActivityInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "lead-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
