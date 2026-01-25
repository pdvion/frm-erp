import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listLeadsInputSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ALL"]).optional(),
  assignedTo: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const getLeadInputSchema = z.object({ id: z.string() });

const createLeadInputSchema = z.object({
  code: z.string(),
  companyName: z.string(),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).default("OTHER"),
  estimatedValue: z.number().optional(),
  probability: z.number().optional(),
  expectedCloseDate: z.date().optional(),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  customerId: z.string().optional(),
});

const updateLeadInputSchema = z.object({
  id: z.string(),
  companyName: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).optional(),
  estimatedValue: z.number().optional(),
  probability: z.number().optional(),
  expectedCloseDate: z.date().optional(),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
});

const listSalesOrdersInputSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "INVOICED", "SHIPPED", "DELIVERED", "CANCELLED", "ALL"]).optional(),
  customerId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const getSalesOrderInputSchema = z.object({ id: z.string() });

const createSalesOrderInputSchema = z.object({
  customerId: z.string(),
  leadId: z.string().optional(),
  orderDate: z.date().default(() => new Date()),
  deliveryDate: z.date().optional(),
  paymentTerms: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
    notes: z.string().optional(),
  })).min(1),
});

const updateSalesOrderInputSchema = z.object({
  id: z.string(),
  deliveryDate: z.date().optional(),
  paymentTerms: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "INVOICED", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
});

const addSalesOrderItemInputSchema = z.object({
  orderId: z.string(),
  materialId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

const updateSalesOrderItemInputSchema = z.object({
  id: z.string(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const removeSalesOrderItemInputSchema = z.object({ id: z.string() });

const confirmSalesOrderInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const cancelSalesOrderInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const deleteSalesOrderInputSchema = z.object({ id: z.string() });

const getDashboardInputSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
}).optional();

describe("Sales Router Schemas", () => {
  describe("listLeads input", () => {
    it("should accept empty input", () => {
      const result = listLeadsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listLeadsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept all status values", () => {
      const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ALL"];
      for (const status of statuses) {
        const result = listLeadsInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listLeadsInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept search and assignedTo", () => {
      const result = listLeadsInputSchema.safeParse({
        search: "empresa",
        assignedTo: "user-123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getLead input", () => {
    it("should accept valid id", () => {
      const result = getLeadInputSchema.safeParse({ id: "lead-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = getLeadInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createLead input", () => {
    it("should accept valid input", () => {
      const result = createLeadInputSchema.safeParse({
        code: "LEAD001",
        companyName: "Empresa ABC",
      });
      expect(result.success).toBe(true);
    });

    it("should apply default source", () => {
      const result = createLeadInputSchema.safeParse({
        code: "LEAD001",
        companyName: "Empresa ABC",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("OTHER");
      }
    });

    it("should accept full input", () => {
      const result = createLeadInputSchema.safeParse({
        code: "LEAD002",
        companyName: "Empresa XYZ",
        contactName: "João Silva",
        email: "joao@empresa.com",
        phone: "(11) 99999-9999",
        source: "WEBSITE",
        estimatedValue: 50000,
        probability: 75,
        expectedCloseDate: new Date("2026-03-01"),
        description: "Lead qualificado",
        assignedTo: "user-123",
        customerId: "cust-456",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all source values", () => {
      const sources = ["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"];
      for (const source of sources) {
        const result = createLeadInputSchema.safeParse({
          code: `LEAD-${source}`,
          companyName: "Empresa",
          source,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject missing code", () => {
      const result = createLeadInputSchema.safeParse({
        companyName: "Empresa",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing companyName", () => {
      const result = createLeadInputSchema.safeParse({
        code: "LEAD001",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateLead input", () => {
    it("should accept id only", () => {
      const result = updateLeadInputSchema.safeParse({ id: "lead-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateLeadInputSchema.safeParse({
        id: "lead-123",
        status: "QUALIFIED",
        estimatedValue: 75000,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateLeadInputSchema.safeParse({
        companyName: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all status transitions", () => {
      const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
      for (const status of statuses) {
        const result = updateLeadInputSchema.safeParse({ id: "lead-123", status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("listSalesOrders input", () => {
    it("should accept empty input", () => {
      const result = listSalesOrdersInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listSalesOrdersInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept all status values", () => {
      const statuses = ["DRAFT", "CONFIRMED", "INVOICED", "SHIPPED", "DELIVERED", "CANCELLED", "ALL"];
      for (const status of statuses) {
        const result = listSalesOrdersInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listSalesOrdersInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept date range", () => {
      const result = listSalesOrdersInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getSalesOrder input", () => {
    it("should accept valid id", () => {
      const result = getSalesOrderInputSchema.safeParse({ id: "order-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = getSalesOrderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createSalesOrder input", () => {
    it("should accept valid input", () => {
      const result = createSalesOrderInputSchema.safeParse({
        customerId: "cust-123",
        items: [
          { materialId: "mat-001", quantity: 10, unitPrice: 100 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = createSalesOrderInputSchema.safeParse({
        customerId: "cust-123",
        leadId: "lead-456",
        orderDate: new Date(),
        deliveryDate: new Date("2026-02-15"),
        paymentTerms: "30 dias",
        shippingAddress: "Rua das Flores, 100",
        notes: "Pedido urgente",
        items: [
          { materialId: "mat-001", quantity: 10, unitPrice: 100, discount: 5, notes: "Item 1" },
          { materialId: "mat-002", quantity: 5, unitPrice: 200, discount: 10 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty items array", () => {
      const result = createSalesOrderInputSchema.safeParse({
        customerId: "cust-123",
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing customerId", () => {
      const result = createSalesOrderInputSchema.safeParse({
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = createSalesOrderInputSchema.safeParse({
        customerId: "cust-123",
        items: [{ materialId: "mat-001", quantity: 0, unitPrice: 100 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative unitPrice", () => {
      const result = createSalesOrderInputSchema.safeParse({
        customerId: "cust-123",
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: -100 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject discount greater than 100", () => {
      const result = createSalesOrderInputSchema.safeParse({
        customerId: "cust-123",
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100, discount: 101 }],
      });
      expect(result.success).toBe(false);
    });

    it("should apply default discount", () => {
      const result = createSalesOrderInputSchema.safeParse({
        customerId: "cust-123",
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].discount).toBe(0);
      }
    });
  });

  describe("updateSalesOrder input", () => {
    it("should accept id only", () => {
      const result = updateSalesOrderInputSchema.safeParse({ id: "order-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateSalesOrderInputSchema.safeParse({
        id: "order-123",
        deliveryDate: new Date("2026-02-20"),
        status: "CONFIRMED",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateSalesOrderInputSchema.safeParse({
        status: "CONFIRMED",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all status values", () => {
      const statuses = ["DRAFT", "CONFIRMED", "INVOICED", "SHIPPED", "DELIVERED", "CANCELLED"];
      for (const status of statuses) {
        const result = updateSalesOrderInputSchema.safeParse({ id: "order-123", status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("addSalesOrderItem input", () => {
    it("should accept valid input", () => {
      const result = addSalesOrderItemInputSchema.safeParse({
        orderId: "order-123",
        materialId: "mat-001",
        quantity: 10,
        unitPrice: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default discount", () => {
      const result = addSalesOrderItemInputSchema.safeParse({
        orderId: "order-123",
        materialId: "mat-001",
        quantity: 10,
        unitPrice: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discount).toBe(0);
      }
    });

    it("should reject missing orderId", () => {
      const result = addSalesOrderItemInputSchema.safeParse({
        materialId: "mat-001",
        quantity: 10,
        unitPrice: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = addSalesOrderItemInputSchema.safeParse({
        orderId: "order-123",
        materialId: "mat-001",
        quantity: 0,
        unitPrice: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateSalesOrderItem input", () => {
    it("should accept id only", () => {
      const result = updateSalesOrderItemInputSchema.safeParse({ id: "item-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateSalesOrderItemInputSchema.safeParse({
        id: "item-123",
        quantity: 20,
        discount: 15,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateSalesOrderItemInputSchema.safeParse({
        quantity: 20,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity on update", () => {
      const result = updateSalesOrderItemInputSchema.safeParse({
        id: "item-123",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("removeSalesOrderItem input", () => {
    it("should accept valid id", () => {
      const result = removeSalesOrderItemInputSchema.safeParse({ id: "item-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = removeSalesOrderItemInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("confirmSalesOrder input", () => {
    it("should accept valid input", () => {
      const result = confirmSalesOrderInputSchema.safeParse({ id: "order-123" });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = confirmSalesOrderInputSchema.safeParse({
        id: "order-123",
        notes: "Confirmado pelo gerente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = confirmSalesOrderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("cancelSalesOrder input", () => {
    it("should accept valid input", () => {
      const result = cancelSalesOrderInputSchema.safeParse({
        id: "order-123",
        reason: "Cliente desistiu",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelSalesOrderInputSchema.safeParse({
        id: "order-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelSalesOrderInputSchema.safeParse({
        id: "order-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteSalesOrder input", () => {
    it("should accept valid id", () => {
      const result = deleteSalesOrderInputSchema.safeParse({ id: "order-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteSalesOrderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("getDashboard input", () => {
    it("should accept empty input", () => {
      const result = getDashboardInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = getDashboardInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });
  });
});
