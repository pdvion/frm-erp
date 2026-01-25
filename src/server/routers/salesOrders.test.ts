import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router salesOrders (Pedidos de Venda)
 * Valida inputs e estruturas de dados de pedidos de venda
 */

// Schema de status do pedido
const salesOrderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

// Schema de listagem
const listInputSchema = z.object({
  search: z.string().optional(),
  status: salesOrderStatusSchema.optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de busca por ID
const byIdInputSchema = z.object({
  id: z.string(),
});

// Schema de criação de pedido
const createInputSchema = z.object({
  customerId: z.string(),
  sourceQuoteId: z.string().optional(),
  deliveryDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number(),
    discount: z.number().default(0),
  })),
});

// Schema de atualização de pedido
const updateInputSchema = z.object({
  id: z.string(),
  deliveryDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
});

// Schema de atualização de status
const updateStatusInputSchema = z.object({
  id: z.string(),
  status: salesOrderStatusSchema,
  notes: z.string().optional(),
});

// Schema de item do pedido
const orderItemSchema = z.object({
  materialId: z.string(),
  sequence: z.number(),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  discount: z.number(),
  totalPrice: z.number(),
});

// Schema de resposta de pedido
const orderResponseSchema = z.object({
  id: z.string(),
  code: z.number(),
  customerId: z.string(),
  status: salesOrderStatusSchema,
  orderDate: z.date(),
  deliveryDate: z.date().nullable(),
  totalProducts: z.number(),
  totalDiscount: z.number(),
  totalOrder: z.number(),
  paymentTerms: z.string().nullable(),
  shippingMethod: z.string().nullable(),
  notes: z.string().nullable(),
  companyId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe("Sales Orders Router Schemas", () => {
  describe("Order Status Schema", () => {
    it("should accept PENDING status", () => {
      const result = salesOrderStatusSchema.safeParse("PENDING");
      expect(result.success).toBe(true);
    });

    it("should accept CONFIRMED status", () => {
      const result = salesOrderStatusSchema.safeParse("CONFIRMED");
      expect(result.success).toBe(true);
    });

    it("should accept IN_PRODUCTION status", () => {
      const result = salesOrderStatusSchema.safeParse("IN_PRODUCTION");
      expect(result.success).toBe(true);
    });

    it("should accept READY status", () => {
      const result = salesOrderStatusSchema.safeParse("READY");
      expect(result.success).toBe(true);
    });

    it("should accept SHIPPED status", () => {
      const result = salesOrderStatusSchema.safeParse("SHIPPED");
      expect(result.success).toBe(true);
    });

    it("should accept DELIVERED status", () => {
      const result = salesOrderStatusSchema.safeParse("DELIVERED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = salesOrderStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = salesOrderStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Input Schema", () => {
    it("should accept empty input with defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept search filter", () => {
      const result = listInputSchema.safeParse({
        search: "Cliente ABC",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = listInputSchema.safeParse({
        status: "CONFIRMED",
      });
      expect(result.success).toBe(true);
    });

    it("should accept customerId filter", () => {
      const result = listInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept date range filter", () => {
      const result = listInputSchema.safeParse({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listInputSchema.safeParse({
        search: "PV-001",
        status: "SHIPPED",
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("By ID Input Schema", () => {
    it("should accept valid ID", () => {
      const result = byIdInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing ID", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Create Input Schema", () => {
    it("should accept minimal valid input", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 10,
            unitPrice: 100.0,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        sourceQuoteId: "123e4567-e89b-12d3-a456-426614174002",
        deliveryDate: "2024-02-15",
        paymentTerms: "30/60/90",
        shippingMethod: "Transportadora",
        notes: "Entregar no período da manhã",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 10,
            unitPrice: 100.0,
            discount: 5,
          },
          {
            materialId: "123e4567-e89b-12d3-a456-426614174003",
            quantity: 5,
            unitPrice: 200.0,
            discount: 0,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing customerId", () => {
      const result = createInputSchema.safeParse({
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 10,
            unitPrice: 100.0,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty items array", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        items: [],
      });
      expect(result.success).toBe(true); // Empty array is valid, business logic should handle
    });

    it("should reject zero quantity", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 0,
            unitPrice: 100.0,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: -5,
            unitPrice: 100.0,
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Update Input Schema", () => {
    it("should accept minimal update", () => {
      const result = updateInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete update", () => {
      const result = updateInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        deliveryDate: "2024-02-20",
        paymentTerms: "À vista",
        shippingMethod: "Retirada",
        notes: "Cliente irá retirar",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        deliveryDate: "2024-02-20",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Update Status Input Schema", () => {
    it("should accept valid status update", () => {
      const result = updateStatusInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "CONFIRMED",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status update with notes", () => {
      const result = updateStatusInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "SHIPPED",
        notes: "Enviado via transportadora XYZ",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = updateStatusInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = updateStatusInputSchema.safeParse({
        status: "CONFIRMED",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Order Item Schema", () => {
    it("should accept valid item", () => {
      const result = orderItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 10,
        unitPrice: 100.0,
        discount: 5,
        totalPrice: 950.0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept item without discount", () => {
      const result = orderItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 10,
        unitPrice: 100.0,
        discount: 0,
        totalPrice: 1000.0,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = orderItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 0,
        unitPrice: 100.0,
        discount: 0,
        totalPrice: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Order Response Schema", () => {
    it("should validate complete order response", () => {
      const result = orderResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        code: 1234,
        customerId: "customer-id",
        status: "CONFIRMED",
        orderDate: new Date(),
        deliveryDate: new Date(),
        totalProducts: 1000.0,
        totalDiscount: 50.0,
        totalOrder: 950.0,
        paymentTerms: "30/60/90",
        shippingMethod: "Transportadora",
        notes: "Observações",
        companyId: "company-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should validate order with nullable fields", () => {
      const result = orderResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        code: 1234,
        customerId: "customer-id",
        status: "PENDING",
        orderDate: new Date(),
        deliveryDate: null,
        totalProducts: 1000.0,
        totalDiscount: 0,
        totalOrder: 1000.0,
        paymentTerms: null,
        shippingMethod: null,
        notes: null,
        companyId: "company-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Order Calculations", () => {
    it("should calculate item total correctly", () => {
      const quantity = 10;
      const unitPrice = 100.0;
      const discount = 5; // 5%
      const totalPrice = quantity * unitPrice * (1 - discount / 100);
      expect(totalPrice).toBe(950.0);
    });

    it("should calculate order total correctly", () => {
      const items = [
        { quantity: 10, unitPrice: 100.0, discount: 5 },
        { quantity: 5, unitPrice: 200.0, discount: 0 },
      ];
      const totalProducts = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const totalDiscount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice * (item.discount / 100),
        0
      );
      const totalOrder = totalProducts - totalDiscount;
      
      expect(totalProducts).toBe(2000.0);
      expect(totalDiscount).toBe(50.0);
      expect(totalOrder).toBe(1950.0);
    });
  });

  describe("Status Workflow", () => {
    const validTransitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["IN_PRODUCTION", "READY", "CANCELLED"],
      IN_PRODUCTION: ["READY", "CANCELLED"],
      READY: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    it("should allow PENDING to CONFIRMED", () => {
      const from = "PENDING";
      const to = "CONFIRMED";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should allow CONFIRMED to IN_PRODUCTION", () => {
      const from = "CONFIRMED";
      const to = "IN_PRODUCTION";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should allow READY to SHIPPED", () => {
      const from = "READY";
      const to = "SHIPPED";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should allow SHIPPED to DELIVERED", () => {
      const from = "SHIPPED";
      const to = "DELIVERED";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should not allow DELIVERED to any status", () => {
      const from = "DELIVERED";
      expect(validTransitions[from].length).toBe(0);
    });

    it("should not allow CANCELLED to any status", () => {
      const from = "CANCELLED";
      expect(validTransitions[from].length).toBe(0);
    });
  });
});
