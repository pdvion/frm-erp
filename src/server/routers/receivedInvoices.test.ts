import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router receivedInvoices (Notas Fiscais Recebidas)
 * Valida inputs e estruturas de dados de NFe de entrada
 */

// Schema de status da nota fiscal recebida
const invoiceStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
]);

// Schema de listagem
const listInputSchema = z.object({
  search: z.string().optional(),
  status: invoiceStatusSchema.optional(),
  supplierId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de busca por ID
const byIdInputSchema = z.object({
  id: z.string(),
});

// Schema de importação de XML
const importXmlInputSchema = z.object({
  xmlContent: z.string().min(1),
  autoMatch: z.boolean().default(true),
});

// Schema de item da nota recebida
const receivedInvoiceItemSchema = z.object({
  itemNumber: z.number(),
  productCode: z.string(),
  productName: z.string(),
  ncm: z.string().nullable(),
  cfop: z.number(),
  quantity: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  icmsRate: z.number(),
  icmsValue: z.number(),
  ipiRate: z.number(),
  ipiValue: z.number(),
  materialId: z.string().nullable(),
});

// Schema de vinculação de item com material
const linkItemToMaterialInputSchema = z.object({
  invoiceId: z.string(),
  itemId: z.string(),
  materialId: z.string(),
});

// Schema de conferência
const checkInputSchema = z.object({
  invoiceId: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    receivedQuantity: z.number(),
    notes: z.string().optional(),
  })),
});

// Schema de lançamento no estoque
const postToInventoryInputSchema = z.object({
  invoiceId: z.string(),
  stockLocationId: z.string(),
});

// Schema de resposta de nota fiscal recebida
const invoiceResponseSchema = z.object({
  id: z.string(),
  accessKey: z.string(),
  invoiceNumber: z.number(),
  series: z.number(),
  issueDate: z.date(),
  supplierCnpj: z.string(),
  supplierName: z.string(),
  totalProducts: z.number(),
  totalInvoice: z.number(),
  freightValue: z.number(),
  discountValue: z.number(),
  icmsBase: z.number(),
  icmsValue: z.number(),
  icmsStBase: z.number(),
  icmsStValue: z.number(),
  ipiValue: z.number(),
  pisValue: z.number(),
  cofinsValue: z.number(),
  status: invoiceStatusSchema,
  companyId: z.string(),
  supplierId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe("Received Invoices Router Schemas", () => {
  describe("Invoice Status Schema", () => {
    it("should accept PENDING status", () => {
      const result = invoiceStatusSchema.safeParse("PENDING");
      expect(result.success).toBe(true);
    });

    it("should accept PROCESSING status", () => {
      const result = invoiceStatusSchema.safeParse("PROCESSING");
      expect(result.success).toBe(true);
    });

    it("should accept COMPLETED status", () => {
      const result = invoiceStatusSchema.safeParse("COMPLETED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = invoiceStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should accept REJECTED status", () => {
      const result = invoiceStatusSchema.safeParse("REJECTED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = invoiceStatusSchema.safeParse("INVALID");
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
        search: "12345678000199",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = listInputSchema.safeParse({
        status: "COMPLETED",
      });
      expect(result.success).toBe(true);
    });

    it("should accept supplierId filter", () => {
      const result = listInputSchema.safeParse({
        supplierId: "123e4567-e89b-12d3-a456-426614174000",
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
        search: "fornecedor",
        status: "PENDING",
        supplierId: "123e4567-e89b-12d3-a456-426614174000",
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

  describe("Import XML Input Schema", () => {
    it("should accept valid XML content", () => {
      const result = importXmlInputSchema.safeParse({
        xmlContent: "<nfeProc><NFe><infNFe></infNFe></NFe></nfeProc>",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.autoMatch).toBe(true);
      }
    });

    it("should accept XML with autoMatch disabled", () => {
      const result = importXmlInputSchema.safeParse({
        xmlContent: "<nfeProc><NFe><infNFe></infNFe></NFe></nfeProc>",
        autoMatch: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.autoMatch).toBe(false);
      }
    });

    it("should reject empty XML content", () => {
      const result = importXmlInputSchema.safeParse({
        xmlContent: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing XML content", () => {
      const result = importXmlInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Received Invoice Item Schema", () => {
    it("should accept valid item", () => {
      const result = receivedInvoiceItemSchema.safeParse({
        itemNumber: 1,
        productCode: "PROD001",
        productName: "Produto Teste",
        ncm: "84719012",
        cfop: 1102,
        quantity: 10,
        unit: "UN",
        unitPrice: 100.0,
        totalPrice: 1000.0,
        icmsRate: 18,
        icmsValue: 180.0,
        ipiRate: 5,
        ipiValue: 50.0,
        materialId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept item with null materialId (not linked)", () => {
      const result = receivedInvoiceItemSchema.safeParse({
        itemNumber: 1,
        productCode: "PROD001",
        productName: "Produto Teste",
        ncm: null,
        cfop: 1102,
        quantity: 10,
        unit: "UN",
        unitPrice: 100.0,
        totalPrice: 1000.0,
        icmsRate: 0,
        icmsValue: 0,
        ipiRate: 0,
        ipiValue: 0,
        materialId: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = receivedInvoiceItemSchema.safeParse({
        itemNumber: 1,
        productCode: "PROD001",
        productName: "Produto Teste",
        ncm: null,
        cfop: 1102,
        quantity: 0,
        unit: "UN",
        unitPrice: 100.0,
        totalPrice: 0,
        icmsRate: 0,
        icmsValue: 0,
        ipiRate: 0,
        ipiValue: 0,
        materialId: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Link Item To Material Input Schema", () => {
    it("should accept valid link input", () => {
      const result = linkItemToMaterialInputSchema.safeParse({
        invoiceId: "123e4567-e89b-12d3-a456-426614174000",
        itemId: "123e4567-e89b-12d3-a456-426614174001",
        materialId: "123e4567-e89b-12d3-a456-426614174002",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing invoiceId", () => {
      const result = linkItemToMaterialInputSchema.safeParse({
        itemId: "123e4567-e89b-12d3-a456-426614174001",
        materialId: "123e4567-e89b-12d3-a456-426614174002",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing itemId", () => {
      const result = linkItemToMaterialInputSchema.safeParse({
        invoiceId: "123e4567-e89b-12d3-a456-426614174000",
        materialId: "123e4567-e89b-12d3-a456-426614174002",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing materialId", () => {
      const result = linkItemToMaterialInputSchema.safeParse({
        invoiceId: "123e4567-e89b-12d3-a456-426614174000",
        itemId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Check Input Schema", () => {
    it("should accept valid check input", () => {
      const result = checkInputSchema.safeParse({
        invoiceId: "123e4567-e89b-12d3-a456-426614174000",
        items: [
          { itemId: "item-1", receivedQuantity: 10 },
          { itemId: "item-2", receivedQuantity: 5, notes: "Faltou 1 unidade" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept check with empty items", () => {
      const result = checkInputSchema.safeParse({
        invoiceId: "123e4567-e89b-12d3-a456-426614174000",
        items: [],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing invoiceId", () => {
      const result = checkInputSchema.safeParse({
        items: [{ itemId: "item-1", receivedQuantity: 10 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Post To Inventory Input Schema", () => {
    it("should accept valid input", () => {
      const result = postToInventoryInputSchema.safeParse({
        invoiceId: "123e4567-e89b-12d3-a456-426614174000",
        stockLocationId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing invoiceId", () => {
      const result = postToInventoryInputSchema.safeParse({
        stockLocationId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing stockLocationId", () => {
      const result = postToInventoryInputSchema.safeParse({
        invoiceId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Invoice Response Schema", () => {
    it("should validate complete invoice response", () => {
      const result = invoiceResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        accessKey: "35240112345678000199550010000012341234567890",
        invoiceNumber: 1234,
        series: 1,
        issueDate: new Date(),
        supplierCnpj: "12345678000199",
        supplierName: "Fornecedor Teste LTDA",
        totalProducts: 1000.0,
        totalInvoice: 1180.0,
        freightValue: 100.0,
        discountValue: 0,
        icmsBase: 1000.0,
        icmsValue: 180.0,
        icmsStBase: 0,
        icmsStValue: 0,
        ipiValue: 50.0,
        pisValue: 16.5,
        cofinsValue: 76.0,
        status: "COMPLETED",
        companyId: "company-id",
        supplierId: "supplier-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should validate invoice with null supplierId", () => {
      const result = invoiceResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        accessKey: "35240112345678000199550010000012341234567890",
        invoiceNumber: 1234,
        series: 1,
        issueDate: new Date(),
        supplierCnpj: "12345678000199",
        supplierName: "Fornecedor Não Cadastrado",
        totalProducts: 500.0,
        totalInvoice: 500.0,
        freightValue: 0,
        discountValue: 0,
        icmsBase: 500.0,
        icmsValue: 90.0,
        icmsStBase: 0,
        icmsStValue: 0,
        ipiValue: 0,
        pisValue: 0,
        cofinsValue: 0,
        status: "PENDING",
        companyId: "company-id",
        supplierId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("NFe XML Parsing", () => {
    it("should extract access key from XML", () => {
      const xml = '<nfeProc><NFe><infNFe Id="NFe35240112345678000199550010000012341234567890">';
      const match = xml.match(/Id="NFe(\d{44})"/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("35240112345678000199550010000012341234567890");
    });

    it("should extract supplier CNPJ from XML", () => {
      const xml = "<emit><CNPJ>12345678000199</CNPJ><xNome>Fornecedor</xNome></emit>";
      const match = xml.match(/<CNPJ>(\d{14})<\/CNPJ>/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("12345678000199");
    });

    it("should extract invoice number from XML", () => {
      const xml = "<ide><nNF>1234</nNF><serie>1</serie></ide>";
      const match = xml.match(/<nNF>(\d+)<\/nNF>/);
      expect(match).not.toBeNull();
      expect(parseInt(match![1])).toBe(1234);
    });

    it("should extract total value from XML", () => {
      const xml = "<ICMSTot><vNF>1180.00</vNF><vProd>1000.00</vProd></ICMSTot>";
      const match = xml.match(/<vNF>([\d.]+)<\/vNF>/);
      expect(match).not.toBeNull();
      expect(parseFloat(match![1])).toBe(1180.0);
    });
  });

  describe("CFOP Validation (Entry)", () => {
    it("should validate internal purchase CFOP (1xxx)", () => {
      const cfop = 1102;
      expect(Math.floor(cfop / 1000)).toBe(1);
    });

    it("should validate interstate purchase CFOP (2xxx)", () => {
      const cfop = 2102;
      expect(Math.floor(cfop / 1000)).toBe(2);
    });

    it("should validate import CFOP (3xxx)", () => {
      const cfop = 3101;
      expect(Math.floor(cfop / 1000)).toBe(3);
    });
  });

  describe("Tax Credit Calculations", () => {
    it("should calculate ICMS credit", () => {
      const baseCalculo = 1000.0;
      const aliquota = 18;
      const icmsCredito = baseCalculo * (aliquota / 100);
      expect(icmsCredito).toBe(180.0);
    });

    it("should calculate IPI credit", () => {
      const baseCalculo = 1000.0;
      const aliquota = 5;
      const ipiCredito = baseCalculo * (aliquota / 100);
      expect(ipiCredito).toBe(50.0);
    });

    it("should calculate PIS credit", () => {
      const baseCalculo = 1000.0;
      const aliquota = 1.65;
      const pisCredito = baseCalculo * (aliquota / 100);
      expect(pisCredito).toBeCloseTo(16.5, 2);
    });

    it("should calculate COFINS credit", () => {
      const baseCalculo = 1000.0;
      const aliquota = 7.6;
      const cofinsCredito = baseCalculo * (aliquota / 100);
      expect(cofinsCredito).toBeCloseTo(76.0, 2);
    });

    it("should calculate total tax credits", () => {
      const icms = 180.0;
      const ipi = 50.0;
      const pis = 16.5;
      const cofins = 76.0;
      const totalCredits = icms + ipi + pis + cofins;
      expect(totalCredits).toBeCloseTo(322.5, 2);
    });
  });

  describe("Inventory Cost Calculation", () => {
    it("should calculate unit cost with IPI", () => {
      const unitPrice = 100.0;
      const ipiRate = 5;
      const unitCostWithIpi = unitPrice * (1 + ipiRate / 100);
      expect(unitCostWithIpi).toBe(105.0);
    });

    it("should calculate unit cost with freight allocation", () => {
      const totalProducts = 1000.0;
      const freight = 100.0;
      const unitPrice = 100.0;
      const freightPerUnit = (freight / totalProducts) * unitPrice;
      const unitCostWithFreight = unitPrice + freightPerUnit;
      expect(unitCostWithFreight).toBe(110.0);
    });

    it("should calculate average cost", () => {
      const currentQty = 100;
      const currentCost = 10.0;
      const newQty = 50;
      const newCost = 12.0;
      const totalQty = currentQty + newQty;
      const totalValue = currentQty * currentCost + newQty * newCost;
      const averageCost = totalValue / totalQty;
      expect(averageCost).toBeCloseTo(10.67, 2);
    });
  });
});
