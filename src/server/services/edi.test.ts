/**
 * Tests for EDI Service
 * VIO-1126 — Troca eletrônica com montadoras/varejo
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseEdifactSegments,
  parseEdifactOrders,
  formatEdifactDate,
  generateDesadvEdifact,
  generateInvoicEdifact,
  parseFlatFileLine,
  parseFlatFile,
  generateFlatFileLine,
  applyFieldMappings,
  EdiService,
} from "./edi";
import type { FlatFileFieldDef, FieldMapping } from "./edi";

// ─── Pure Function Tests: EDIFACT Parser ──────────────────────────────────────

describe("parseEdifactSegments", () => {
  it("should parse segments from raw EDIFACT", () => {
    const raw = "UNH+1+ORDERS:D:96A:UN'BGM+220+PO-001+9'DTM+137:20260101:102'";
    const segments = parseEdifactSegments(raw);
    expect(segments).toHaveLength(3);
    expect(segments[0].tag).toBe("UNH");
    expect(segments[1].tag).toBe("BGM");
    expect(segments[2].tag).toBe("DTM");
  });

  it("should parse element sub-components with colon separator", () => {
    const raw = "DTM+137:20260101:102'";
    const segments = parseEdifactSegments(raw);
    expect(segments[0].elements[0]).toEqual(["137", "20260101", "102"]);
  });

  it("should handle empty input", () => {
    expect(parseEdifactSegments("")).toHaveLength(0);
  });
});

describe("formatEdifactDate", () => {
  it("should format 8-digit date to ISO", () => {
    expect(formatEdifactDate("20260115")).toBe("2026-01-15");
  });

  it("should return raw if not 8 digits", () => {
    expect(formatEdifactDate("2026")).toBe("2026");
  });
});

describe("parseEdifactOrders", () => {
  it("should parse a complete ORDERS message", () => {
    const raw = [
      "UNH+1+ORDERS:D:96A:UN'",
      "BGM+220+PO-12345+9'",
      "DTM+137:20260115:102'",
      "DTM+2:20260201:102'",
      "NAD+BY+BUYER001'",
      "LIN+1++PROD-A:SA'",
      "QTY+21:100'",
      "PRI+AAA:25.50'",
      "IMD+F++:::Widget A'",
      "LIN+2++PROD-B:SA'",
      "QTY+21:50'",
      "PRI+AAA:10.00'",
    ].join("");

    const segments = parseEdifactSegments(raw);
    const order = parseEdifactOrders(segments);

    expect(order).not.toBeNull();
    expect(order!.orderNumber).toBe("PO-12345");
    expect(order!.buyerCode).toBe("BUYER001");
    expect(order!.orderDate).toBe("2026-01-15");
    expect(order!.deliveryDate).toBe("2026-02-01");
    expect(order!.items).toHaveLength(2);
    expect(order!.items[0].productCode).toBe("PROD-A");
    expect(order!.items[0].quantity).toBe(100);
    expect(order!.items[0].unitPrice).toBe(25.5);
    expect(order!.items[0].description).toBe("Widget A");
    expect(order!.items[1].productCode).toBe("PROD-B");
  });

  it("should return null for empty segments", () => {
    expect(parseEdifactOrders([])).toBeNull();
  });
});

// ─── Pure Function Tests: EDIFACT Generator ──────────────────────────────────

describe("generateDesadvEdifact", () => {
  it("should generate valid DESADV message", () => {
    const result = generateDesadvEdifact({
      shipmentNumber: "SHP-001",
      orderReference: "PO-123",
      shipDate: "2026-01-15",
      carrier: "FEDEX",
      trackingCode: "TRACK123",
      items: [
        { productCode: "PROD-A", quantity: 100, lotNumber: "LOT-1" },
        { productCode: "PROD-B", quantity: 50 },
      ],
    });

    expect(result).toContain("DESADV");
    expect(result).toContain("SHP-001");
    expect(result).toContain("PO-123");
    expect(result).toContain("FEDEX");
    expect(result).toContain("TRACK123");
    expect(result).toContain("PROD-A");
    expect(result).toContain("PROD-B");
    expect(result).toContain("LOT-1");
    expect(result).toContain("UNT+");
  });
});

describe("generateInvoicEdifact", () => {
  it("should generate valid INVOIC message", () => {
    const result = generateInvoicEdifact({
      invoiceNumber: "INV-001",
      invoiceDate: "2026-01-15",
      orderReference: "PO-123",
      totalValue: 2550,
      items: [
        { productCode: "PROD-A", quantity: 100, unitPrice: 25.5, totalPrice: 2550, description: "Widget" },
      ],
    });

    expect(result).toContain("INVOIC");
    expect(result).toContain("INV-001");
    expect(result).toContain("PO-123");
    expect(result).toContain("2550.00");
    expect(result).toContain("Widget");
  });
});

// ─── Pure Function Tests: Flat File ───────────────────────────────────────────

describe("parseFlatFileLine", () => {
  const fields: FlatFileFieldDef[] = [
    { name: "type", start: 0, length: 1, type: "string" },
    { name: "code", start: 1, length: 10, type: "string" },
    { name: "qty", start: 11, length: 8, type: "number" },
  ];

  it("should parse a fixed-width line", () => {
    const line = "DPROD-A    00000100";
    const result = parseFlatFileLine(line, fields);
    expect(result.type).toBe("D");
    expect(result.code).toBe("PROD-A");
    expect(result.qty).toBe(100);
  });
});

describe("parseFlatFile", () => {
  it("should parse multiple lines", () => {
    const content = "H HEADER    00000000\nD PROD-A    00000100\nD PROD-B    00000050";
    const fields: FlatFileFieldDef[] = [
      { name: "type", start: 0, length: 2, type: "string" },
      { name: "code", start: 2, length: 10, type: "string" },
      { name: "qty", start: 12, length: 8, type: "number" },
    ];
    const result = parseFlatFile(content, fields);
    expect(result).toHaveLength(3);
  });
});

describe("generateFlatFileLine", () => {
  it("should generate a fixed-width line", () => {
    const fields: FlatFileFieldDef[] = [
      { name: "type", start: 0, length: 1, type: "string" },
      { name: "code", start: 1, length: 10, type: "string" },
      { name: "qty", start: 11, length: 8, type: "number" },
    ];
    const line = generateFlatFileLine({ type: "D", code: "PROD-A", qty: 100 }, fields);
    expect(line).toBe("DPROD-A    00000100");
  });
});

// ─── Pure Function Tests: Field Mapping ───────────────────────────────────────

describe("applyFieldMappings", () => {
  it("should map fields with transforms", () => {
    const source = { name: "  Test  ", code: "abc", price: "25.5" };
    const mappings: FieldMapping[] = [
      { sourceField: "name", targetField: "productName", transform: "trim" },
      { sourceField: "code", targetField: "productCode", transform: "uppercase" },
      { sourceField: "price", targetField: "unitPrice", transform: "number" },
    ];
    const result = applyFieldMappings(source, mappings);
    expect(result.productName).toBe("Test");
    expect(result.productCode).toBe("ABC");
    expect(result.unitPrice).toBe(25.5);
  });

  it("should use default values for missing fields", () => {
    const mappings: FieldMapping[] = [
      { sourceField: "missing", targetField: "output", defaultValue: "DEFAULT" },
    ];
    const result = applyFieldMappings({}, mappings);
    expect(result.output).toBe("DEFAULT");
  });

  it("should handle cnpj transform", () => {
    const mappings: FieldMapping[] = [
      { sourceField: "doc", targetField: "cnpj", transform: "cnpj" },
    ];
    const result = applyFieldMappings({ doc: "12345678000190" }, mappings);
    expect(result.cnpj).toBe("12345678000190");
  });
});

// ─── Service Tests ────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("EdiService", () => {
  const mockPrisma: any = {
    ediPartner: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    ediMessage: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    ediMapping: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  let svc: EdiService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new EdiService(mockPrisma);
  });

  describe("createPartner", () => {
    it("should create a partner", async () => {
      mockPrisma.ediPartner.create.mockResolvedValue({ id: "p1", code: "VW", name: "Volkswagen" });
      const result = await svc.createPartner("comp-1", { code: "VW", name: "Volkswagen" });
      expect(result.code).toBe("VW");
      expect(mockPrisma.ediPartner.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ companyId: "comp-1", code: "VW" }),
      });
    });
  });

  describe("updatePartner", () => {
    it("should throw if not found", async () => {
      mockPrisma.ediPartner.findFirst.mockResolvedValue(null);
      await expect(svc.updatePartner("p1", "comp-1", { name: "New" })).rejects.toThrow("Parceiro EDI não encontrado");
    });
  });

  describe("createMessage", () => {
    it("should create a message", async () => {
      mockPrisma.ediMessage.create.mockResolvedValue({ id: "m1", messageType: "ORDERS" });
      const result = await svc.createMessage("comp-1", {
        partnerId: "p1", messageType: "ORDERS", direction: "INBOUND",
      });
      expect(result.messageType).toBe("ORDERS");
    });
  });

  describe("processMessage", () => {
    it("should throw if not found", async () => {
      mockPrisma.ediMessage.findFirst.mockResolvedValue(null);
      await expect(svc.processMessage("m1", "comp-1")).rejects.toThrow("Mensagem não encontrada");
    });

    it("should process EDIFACT ORDERS message", async () => {
      const raw = "UNH+1+ORDERS:D:96A:UN'BGM+220+PO-001+9'LIN+1++PROD-A:SA'QTY+21:10'PRI+AAA:5'";
      mockPrisma.ediMessage.findFirst.mockResolvedValue({
        id: "m1", direction: "INBOUND", messageType: "ORDERS", rawContent: raw,
        partner: { format: "EDIFACT" },
      });
      mockPrisma.ediMessage.update.mockResolvedValue({});

      const result = await svc.processMessage("m1", "comp-1");
      expect(result.success).toBe(true);
      expect(result.parsedData).toMatchObject({ orderNumber: "PO-001" });
    });
  });

  describe("getStats", () => {
    it("should return aggregated stats", async () => {
      mockPrisma.ediPartner.count.mockResolvedValue(5);
      mockPrisma.ediMessage.count.mockResolvedValue(100);

      const result = await svc.getStats("comp-1");
      expect(result.totalPartners).toBe(5);
      expect(result.totalMessages).toBe(100);
    });
  });
});
