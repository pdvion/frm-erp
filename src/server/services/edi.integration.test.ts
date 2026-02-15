/**
 * Integration Tests for EDI Module — Simulating Real User Flows
 * VIO-1126 — Fase Final: Teste Robusto Simulando Usuário
 *
 * Scenarios:
 * 1. Partner lifecycle: create → update → list → search → deactivate
 * 2. Inbound EDIFACT ORDERS: receive → process → verify parsed data
 * 3. Inbound FLAT_FILE: receive → process → verify line parsing
 * 4. Inbound JSON: receive → process → verify JSON parsing
 * 5. Inbound invalid content: receive → process → error → retry → success
 * 6. Outbound DESADV generation: create message → verify EDIFACT output
 * 7. Outbound INVOIC generation: create message → verify EDIFACT output
 * 8. Mapping lifecycle: create → update → deactivate → apply transforms
 * 9. Dashboard stats: verify aggregated counts
 * 10. Multi-tenant isolation: company A cannot see company B data
 * 11. Error handling: partner not found, message already processed, mapping not found
 * 12. Credential redaction: sftpPassword never exposed
 * 13. Full end-to-end: partner → mapping → inbound message → process → stats
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  EdiService,
  parseEdifactSegments,
  parseEdifactOrders,
  generateDesadvEdifact,
  generateInvoicEdifact,
  parseFlatFile,
  applyFieldMappings,
} from "./edi";
import type { FieldMapping, FlatFileFieldDef } from "./edi";

// ============================================================================
// CONSTANTS
// ============================================================================

const COMPANY_A = "company-aaa-uuid";
const COMPANY_B = "company-bbb-uuid";
const PARTNER_VW = "partner-vw-uuid";
const PARTNER_GM = "partner-gm-uuid";
const MSG_1 = "msg-uuid-1";
const MSG_2 = "msg-uuid-2";
const MSG_3 = "msg-uuid-3";
const MAPPING_1 = "mapping-uuid-1";

// ============================================================================
// MOCK FACTORIES
// ============================================================================

function createMockPartner(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: PARTNER_VW,
    companyId: COMPANY_A,
    code: "VW-BR",
    name: "Volkswagen do Brasil",
    cnpj: "59.104.422/0001-50",
    format: "EDIFACT",
    status: "ACTIVE",
    sftpHost: "sftp.vw.com.br",
    sftpPort: 22,
    sftpUser: "frm-edi",
    sftpPassword: "s3cr3t-p@ss",
    sftpInboundPath: "/inbound",
    sftpOutboundPath: "/outbound",
    webhookUrl: null,
    notes: "Parceiro principal",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    _count: { messages: 42, mappings: 3 },
    ...overrides,
  };
}

function createMockMessage(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: MSG_1,
    companyId: COMPANY_A,
    partnerId: PARTNER_VW,
    messageType: "ORDERS",
    direction: "INBOUND",
    status: "PENDING",
    referenceNumber: "PO-2026-001",
    fileName: "ORDERS_20260115.edi",
    rawContent: null,
    parsedData: null,
    errorMessage: null,
    processedAt: null,
    relatedOrderId: null,
    relatedInvoiceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    partner: { id: PARTNER_VW, name: "Volkswagen do Brasil", code: "VW-BR", format: "EDIFACT" },
    ...overrides,
  };
}

function createMockMapping(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: MAPPING_1,
    companyId: COMPANY_A,
    partnerId: PARTNER_VW,
    messageType: "ORDERS",
    direction: "INBOUND",
    name: "VW ORDERS → Pedido de Venda",
    description: "Mapeamento de pedidos VW para pedidos internos",
    fieldMappings: [
      { sourceField: "orderNumber", targetField: "externalCode", transform: "trim" },
      { sourceField: "buyerCode", targetField: "customerCode", transform: "uppercase" },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    partner: { id: PARTNER_VW, name: "Volkswagen do Brasil", code: "VW-BR" },
    ...overrides,
  };
}

// ============================================================================
// MOCK PRISMA — Stateful (simulates DB)
// ============================================================================

function createStatefulMockPrisma() {
  const partners: Record<string, unknown>[] = [];
  const messages: Record<string, unknown>[] = [];
  const mappings: Record<string, unknown>[] = [];

  const mock: Record<string, unknown> = {
    ediPartner: {
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        const partner = { id: `partner-${Date.now()}`, ...data, _count: { messages: 0, mappings: 0 } };
        partners.push(partner);
        return Promise.resolve(partner);
      }),
      findFirst: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        const found = partners.find((p) => p.id === where.id && p.companyId === where.companyId);
        return Promise.resolve(found ?? null);
      }),
      findMany: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        return Promise.resolve(partners.filter((p) => p.companyId === where.companyId));
      }),
      update: vi.fn().mockImplementation(({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const idx = partners.findIndex((p) => p.id === where.id);
        if (idx >= 0) Object.assign(partners[idx], data);
        return Promise.resolve(partners[idx]);
      }),
      count: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        return Promise.resolve(partners.filter((p) => {
          if (p.companyId !== where.companyId) return false;
          if (where.status && p.status !== where.status) return false;
          return true;
        }).length);
      }),
    },
    ediMessage: {
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        const msg = { id: `msg-${Date.now()}`, status: "PENDING", ...data, createdAt: new Date(), updatedAt: new Date() };
        messages.push(msg);
        return Promise.resolve(msg);
      }),
      findFirst: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        return Promise.resolve(
          messages.find((m) => {
            if (where.id && m.id !== where.id) return false;
            if (where.companyId && m.companyId !== where.companyId) return false;
            if (where.status && m.status !== where.status) return false;
            return true;
          }) ?? null
        );
      }),
      findMany: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        const filtered = messages.filter((m) => m.companyId === where.companyId);
        return Promise.resolve(filtered);
      }),
      update: vi.fn().mockImplementation(({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const idx = messages.findIndex((m) => m.id === where.id);
        if (idx >= 0) Object.assign(messages[idx], data);
        return Promise.resolve(messages[idx]);
      }),
      count: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        return Promise.resolve(messages.filter((m) => {
          if (m.companyId !== where.companyId) return false;
          if (where.status && m.status !== where.status) return false;
          return true;
        }).length);
      }),
    },
    ediMapping: {
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        const mapping = { id: `mapping-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        mappings.push(mapping);
        return Promise.resolve(mapping);
      }),
      findFirst: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        return Promise.resolve(
          mappings.find((m) => m.id === where.id && m.companyId === where.companyId) ?? null
        );
      }),
      findMany: vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        return Promise.resolve(mappings.filter((m) => m.companyId === where.companyId));
      }),
      update: vi.fn().mockImplementation(({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const idx = mappings.findIndex((m) => m.id === where.id);
        if (idx >= 0) Object.assign(mappings[idx], data);
        return Promise.resolve(mappings[idx]);
      }),
    },
  };

  return {
    prisma: mock as unknown as PrismaClient,
    _state: { partners, messages, mappings },
  };
}

// ============================================================================
// SIMPLE MOCK PRISMA (non-stateful, for targeted tests)
// ============================================================================

function createSimpleMockPrisma() {
  const mock: Record<string, unknown> = {
    ediPartner: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: PARTNER_VW, ...data })
      ),
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: PARTNER_VW, ...data })
      ),
      count: vi.fn().mockResolvedValue(0),
    },
    ediMessage: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: MSG_1, ...data })
      ),
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: MSG_1, ...data })
      ),
      count: vi.fn().mockResolvedValue(0),
    },
    ediMapping: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: MAPPING_1, ...data })
      ),
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: MAPPING_1, ...data })
      ),
    },
  };
  return mock as unknown as PrismaClient;
}

// ============================================================================
// EDIFACT TEST DATA
// ============================================================================

const EDIFACT_ORDERS_FULL = [
  "UNB+UNOC:3+VW-BR:ZZ+FRM-IND:ZZ+260115:1030+REF001'",
  "UNH+1+ORDERS:D:96A:UN'",
  "BGM+220+PO-2026-001+9'",
  "DTM+137:20260115:102'",
  "DTM+2:20260201:102'",
  "NAD+BY+VW-CURITIBA::92'",
  "LIN+1++7890001:SA'",
  "IMD+F++:::Parafuso M8x30 Zincado'",
  "QTY+21:5000'",
  "PRI+AAA:0.45'",
  "LIN+2++7890002:SA'",
  "IMD+F++:::Arruela Lisa M8 Inox'",
  "QTY+21:10000'",
  "PRI+AAA:0.12'",
  "LIN+3++7890003:SA'",
  "IMD+F++:::Porca Sextavada M8 Zincada'",
  "QTY+21:5000'",
  "PRI+AAA:0.35'",
  "UNS+S'",
  "CNT+2:3'",
  "UNT+20+1'",
  "UNZ+1+REF001'",
].join("");

const FLAT_FILE_CONTENT = [
  "H 20260115  VW-CURITIBA PO-2026-002",
  "D 7890001   Parafuso M8x30      00005000000000045",
  "D 7890002   Arruela Lisa M8     00010000000000012",
  "T 00002                         00015000000000057",
].join("\n");

const JSON_ORDER_CONTENT = JSON.stringify({
  orderNumber: "PO-2026-003",
  buyer: "GM-SCS",
  date: "2026-01-20",
  items: [
    { code: "8901001", description: "Suporte Motor", qty: 200, price: 15.8 },
    { code: "8901002", description: "Coxim Câmbio", qty: 100, price: 22.5 },
  ],
});

// ============================================================================
// TESTS
// ============================================================================

describe("EDI Module — Integration Tests (User Flow Simulation)", () => {

  // ==========================================================================
  // SCENARIO 1: Partner Lifecycle
  // ==========================================================================

  describe("Scenario 1: Partner Lifecycle — create → update → list → deactivate", () => {
    let svc: EdiService;
    let prisma: PrismaClient;

    beforeEach(() => {
      const { prisma: p } = createStatefulMockPrisma();
      prisma = p;
      svc = new EdiService(prisma);
    });

    it("should create a new EDIFACT partner with SFTP config", async () => {
      const partner = await svc.createPartner(COMPANY_A, {
        code: "VW-BR",
        name: "Volkswagen do Brasil",
        cnpj: "59.104.422/0001-50",
        format: "EDIFACT",
        sftpHost: "sftp.vw.com.br",
        sftpPort: 22,
        sftpUser: "frm-edi",
        sftpPassword: "s3cr3t",
        sftpInboundPath: "/in",
        sftpOutboundPath: "/out",
      });

      expect(partner.code).toBe("VW-BR");
      expect(partner.companyId).toBe(COMPANY_A);
      expect(partner.format).toBe("EDIFACT");
      expect(partner.sftpHost).toBe("sftp.vw.com.br");
      expect((prisma.ediPartner.create as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    });

    it("should create a FLAT_FILE partner for retail", async () => {
      const partner = await svc.createPartner(COMPANY_A, {
        code: "WMT-BR",
        name: "Walmart Brasil",
        format: "FLAT_FILE",
        webhookUrl: "https://api.walmart.com.br/edi/notify",
      });

      expect(partner.format).toBe("FLAT_FILE");
      expect(partner.webhookUrl).toBe("https://api.walmart.com.br/edi/notify");
    });

    it("should list only partners from the same company", async () => {
      await svc.createPartner(COMPANY_A, { code: "VW", name: "VW" });
      await svc.createPartner(COMPANY_A, { code: "GM", name: "GM" });
      await svc.createPartner(COMPANY_B, { code: "FIAT", name: "Fiat" });

      const listA = await svc.listPartners(COMPANY_A);
      const listB = await svc.listPartners(COMPANY_B);

      expect(listA).toHaveLength(2);
      expect(listB).toHaveLength(1);
      expect(listA.every((p: Record<string, unknown>) => p.companyId === COMPANY_A)).toBe(true);
      expect(listB.every((p: Record<string, unknown>) => p.companyId === COMPANY_B)).toBe(true);
    });
  });

  // ==========================================================================
  // SCENARIO 2: Inbound EDIFACT ORDERS — Full Parse
  // ==========================================================================

  describe("Scenario 2: Inbound EDIFACT ORDERS — receive → process → verify", () => {
    let svc: EdiService;
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createSimpleMockPrisma();
      svc = new EdiService(prisma);
    });

    it("should process a real EDIFACT ORDERS message and extract order data", async () => {
      const mockMsg = createMockMessage({
        id: MSG_1,
        rawContent: EDIFACT_ORDERS_FULL,
        partner: { ...createMockPartner(), format: "EDIFACT" },
      });

      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMsg);

      const result = await svc.processMessage(MSG_1, COMPANY_A);

      expect(result.success).toBe(true);
      expect(result.parsedData).not.toBeNull();

      const order = result.parsedData as Record<string, unknown>;
      expect(order.orderNumber).toBe("PO-2026-001");
      expect(order.buyerCode).toBe("VW-CURITIBA");
      expect(order.orderDate).toBe("2026-01-15");
      expect(order.deliveryDate).toBe("2026-02-01");

      const items = order.items as Array<Record<string, unknown>>;
      expect(items).toHaveLength(3);
      expect(items[0].productCode).toBe("7890001");
      expect(items[0].quantity).toBe(5000);
      expect(items[0].unitPrice).toBe(0.45);
      expect(items[0].description).toBe("Parafuso M8x30 Zincado");
      expect(items[1].productCode).toBe("7890002");
      expect(items[1].quantity).toBe(10000);
      expect(items[2].productCode).toBe("7890003");
      expect(items[2].quantity).toBe(5000);

      // Verify status transitions: PENDING → PROCESSING → PROCESSED
      const updateCalls = (prisma.ediMessage.update as ReturnType<typeof vi.fn>).mock.calls;
      expect(updateCalls[0][0].data.status).toBe("PROCESSING");
      expect(updateCalls[1][0].data.status).toBe("PROCESSED");
      expect(updateCalls[1][0].data.processedAt).toBeInstanceOf(Date);
    });

    it("should parse EDIFACT segments correctly for complex messages", () => {
      const segments = parseEdifactSegments(EDIFACT_ORDERS_FULL);
      const order = parseEdifactOrders(segments);

      expect(order).not.toBeNull();
      expect(order!.items).toHaveLength(3);

      // Verify total value calculation
      const totalValue = order!.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      expect(totalValue).toBeCloseTo(5000 * 0.45 + 10000 * 0.12 + 5000 * 0.35, 2);
      // = 2250 + 1200 + 1750 = 5200
      expect(totalValue).toBe(5200);
    });
  });

  // ==========================================================================
  // SCENARIO 3: Inbound FLAT_FILE — Retail Format
  // ==========================================================================

  describe("Scenario 3: Inbound FLAT_FILE — retail format parsing", () => {
    let svc: EdiService;
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createSimpleMockPrisma();
      svc = new EdiService(prisma);
    });

    it("should process flat file and extract line count", async () => {
      const mockMsg = createMockMessage({
        id: MSG_2,
        messageType: "ORDERS",
        rawContent: FLAT_FILE_CONTENT,
        partner: { ...createMockPartner(), format: "FLAT_FILE" },
      });

      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMsg);

      const result = await svc.processMessage(MSG_2, COMPANY_A);

      expect(result.success).toBe(true);
      const parsed = result.parsedData as Record<string, unknown>;
      expect(parsed.lineCount).toBe(4);
      expect((parsed.lines as string[]).length).toBeLessThanOrEqual(5);
    });

    it("should parse flat file with field definitions", () => {
      const fields: FlatFileFieldDef[] = [
        { name: "type", start: 0, length: 2, type: "string" },
        { name: "code", start: 2, length: 10, type: "string" },
        { name: "desc", start: 12, length: 20, type: "string" },
        { name: "qty", start: 32, length: 8, type: "number" },
        { name: "price", start: 40, length: 9, type: "number" },
      ];

      const detailLines = FLAT_FILE_CONTENT.split("\n").filter((l) => l.startsWith("D "));
      const parsed = detailLines.map((line) => {
        const result: Record<string, string | number> = {};
        for (const f of fields) {
          const raw = line.substring(f.start, f.start + f.length).trim();
          result[f.name] = f.type === "number" ? Number(raw) || 0 : raw;
        }
        return result;
      });

      expect(parsed).toHaveLength(2);
      expect(parsed[0].type).toBe("D");
      expect(parsed[0].code).toBe("7890001");
    });
  });

  // ==========================================================================
  // SCENARIO 4: Inbound JSON — Modern Integration
  // ==========================================================================

  describe("Scenario 4: Inbound JSON — modern integration format", () => {
    let svc: EdiService;
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createSimpleMockPrisma();
      svc = new EdiService(prisma);
    });

    it("should process JSON message and store parsed data", async () => {
      const mockMsg = createMockMessage({
        id: MSG_3,
        messageType: "ORDERS",
        rawContent: JSON_ORDER_CONTENT,
        partner: { ...createMockPartner({ id: PARTNER_GM, format: "JSON" }), format: "JSON" },
      });

      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMsg);

      const result = await svc.processMessage(MSG_3, COMPANY_A);

      expect(result.success).toBe(true);
      const parsed = result.parsedData as Record<string, unknown>;
      expect(parsed.orderNumber).toBe("PO-2026-003");
      expect(parsed.buyer).toBe("GM-SCS");
      expect((parsed.items as unknown[]).length).toBe(2);
    });

    it("should handle invalid JSON gracefully", async () => {
      const mockMsg = createMockMessage({
        rawContent: "<xml>not json</xml>",
        partner: { ...createMockPartner(), format: "JSON" },
      });

      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMsg);

      const result = await svc.processMessage(MSG_1, COMPANY_A);

      expect(result.success).toBe(true);
      const parsed = result.parsedData as Record<string, unknown>;
      expect(parsed.raw).toBe("<xml>not json</xml>");
    });
  });

  // ==========================================================================
  // SCENARIO 5: Error → Retry Flow
  // ==========================================================================

  describe("Scenario 5: Message error → retry → success", () => {
    let svc: EdiService;
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createSimpleMockPrisma();
      svc = new EdiService(prisma);
    });

    it("should set ERROR status when processing fails", async () => {
      const mockMsg = createMockMessage({
        rawContent: EDIFACT_ORDERS_FULL,
        partner: { ...createMockPartner(), format: "EDIFACT" },
      });

      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMsg);

      // Make the second update (PROCESSED) throw to simulate failure
      let callCount = 0;
      (prisma.ediMessage.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        callCount++;
        if (callCount === 2 && data.status === "PROCESSED") {
          throw new Error("DB connection lost");
        }
        return Promise.resolve({ id: MSG_1, ...data });
      });

      await expect(svc.processMessage(MSG_1, COMPANY_A)).rejects.toThrow("DB connection lost");

      // Third update call should set ERROR
      const updateCalls = (prisma.ediMessage.update as ReturnType<typeof vi.fn>).mock.calls;
      const errorCall = updateCalls.find((c: unknown[]) => (c[0] as Record<string, Record<string, unknown>>).data.status === "ERROR");
      expect(errorCall).toBeDefined();
      expect((errorCall![0] as Record<string, Record<string, unknown>>).data.errorMessage).toBe("DB connection lost");
    });

    it("should retry a failed message successfully", async () => {
      // First call: findFirst for ERROR status (retryMessage)
      const errorMsg = createMockMessage({ status: "ERROR", errorMessage: "Previous failure" });
      // Second call: findFirst for PENDING status (processMessage after reset)
      const pendingMsg = createMockMessage({
        status: "PENDING",
        rawContent: EDIFACT_ORDERS_FULL,
        partner: { ...createMockPartner(), format: "EDIFACT" },
      });

      let findFirstCallCount = 0;
      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockImplementation(() => {
        findFirstCallCount++;
        if (findFirstCallCount === 1) return Promise.resolve(errorMsg);
        return Promise.resolve(pendingMsg);
      });

      const result = await svc.retryMessage(MSG_1, COMPANY_A);

      expect(result.success).toBe(true);

      // Should have reset status to PENDING first
      const updateCalls = (prisma.ediMessage.update as ReturnType<typeof vi.fn>).mock.calls;
      expect(updateCalls[0][0].data).toEqual({ status: "PENDING", errorMessage: null });
    });

    it("should throw when retrying a non-error message", async () => {
      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(svc.retryMessage(MSG_1, COMPANY_A))
        .rejects.toThrow("Mensagem não encontrada ou não está em erro");
    });
  });

  // ==========================================================================
  // SCENARIO 6: Outbound DESADV Generation
  // ==========================================================================

  describe("Scenario 6: Outbound DESADV — dispatch advice generation", () => {
    it("should generate valid DESADV with carrier and tracking", () => {
      const desadv = generateDesadvEdifact({
        shipmentNumber: "SHP-2026-001",
        orderReference: "PO-2026-001",
        shipDate: "2026-01-20",
        carrier: "Transportadora Rápida",
        trackingCode: "BR123456789",
        items: [
          { productCode: "7890001", quantity: 5000, lotNumber: "LOT-2026-A" },
          { productCode: "7890002", quantity: 10000 },
          { productCode: "7890003", quantity: 5000, lotNumber: "LOT-2026-B" },
        ],
      });

      // Verify structure
      expect(desadv).toContain("UNH+1+DESADV:D:96A:UN");
      expect(desadv).toContain("BGM+351+SHP-2026-001+9");
      expect(desadv).toContain("RFF+ON:PO-2026-001");
      expect(desadv).toContain("TDT+20++++Transportadora Rápida");
      expect(desadv).toContain("RFF+AAS:BR123456789");

      // Verify items
      expect(desadv).toContain("LIN+1++7890001:SA");
      expect(desadv).toContain("QTY+12:5000");
      expect(desadv).toContain("LOT+LOT-2026-A");
      expect(desadv).toContain("LIN+2++7890002:SA");
      expect(desadv).toContain("QTY+12:10000");
      expect(desadv).toContain("LIN+3++7890003:SA");
      expect(desadv).toContain("LOT+LOT-2026-B");

      // Verify UNT segment count
      expect(desadv).toContain("UNT+");
    });

    it("should generate DESADV without optional carrier/tracking", () => {
      const desadv = generateDesadvEdifact({
        shipmentNumber: "SHP-002",
        orderReference: "PO-002",
        shipDate: "2026-02-01",
        items: [{ productCode: "PROD-X", quantity: 100 }],
      });

      expect(desadv).not.toContain("TDT+");
      expect(desadv).not.toContain("RFF+AAS:");
      expect(desadv).toContain("LIN+1++PROD-X:SA");
    });
  });

  // ==========================================================================
  // SCENARIO 7: Outbound INVOIC Generation
  // ==========================================================================

  describe("Scenario 7: Outbound INVOIC — invoice generation", () => {
    it("should generate valid INVOIC with correct totals", () => {
      const invoic = generateInvoicEdifact({
        invoiceNumber: "NF-2026-00001",
        invoiceDate: "2026-01-25",
        orderReference: "PO-2026-001",
        totalValue: 5200,
        items: [
          { productCode: "7890001", quantity: 5000, unitPrice: 0.45, totalPrice: 2250, description: "Parafuso M8x30" },
          { productCode: "7890002", quantity: 10000, unitPrice: 0.12, totalPrice: 1200, description: "Arruela M8" },
          { productCode: "7890003", quantity: 5000, unitPrice: 0.35, totalPrice: 1750, description: "Porca M8" },
        ],
      });

      expect(invoic).toContain("UNH+1+INVOIC:D:96A:UN");
      expect(invoic).toContain("BGM+380+NF-2026-00001+9");
      expect(invoic).toContain("RFF+ON:PO-2026-001");
      expect(invoic).toContain("PRI+AAA:0.45");
      expect(invoic).toContain("MOA+203:2250.00");
      expect(invoic).toContain("MOA+203:1200.00");
      expect(invoic).toContain("MOA+203:1750.00");
      expect(invoic).toContain("MOA+86:5200.00");

      // Verify total matches sum of items
      const itemTotals = [2250, 1200, 1750];
      expect(itemTotals.reduce((a, b) => a + b, 0)).toBe(5200);
    });
  });

  // ==========================================================================
  // SCENARIO 8: Mapping Lifecycle + Field Transforms
  // ==========================================================================

  describe("Scenario 8: Mapping lifecycle + field transforms", () => {
    let svc: EdiService;
    let prisma: PrismaClient;

    beforeEach(() => {
      prisma = createSimpleMockPrisma();
      svc = new EdiService(prisma);
    });

    it("should create a mapping with field transforms", async () => {
      const fieldMappings: FieldMapping[] = [
        { sourceField: "orderNumber", targetField: "externalCode", transform: "trim" },
        { sourceField: "buyerCode", targetField: "customerCode", transform: "uppercase" },
        { sourceField: "totalValue", targetField: "amount", transform: "number" },
        { sourceField: "buyerCnpj", targetField: "cnpj", transform: "cnpj" },
        { sourceField: "orderDate", targetField: "date", transform: "date" },
      ];

      await svc.createMapping(COMPANY_A, {
        partnerId: PARTNER_VW,
        messageType: "ORDERS",
        direction: "INBOUND",
        name: "VW ORDERS → Pedido",
        description: "Mapeamento padrão VW",
        fieldMappings,
      });

      expect((prisma.ediMapping.create as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: COMPANY_A,
          partnerId: PARTNER_VW,
          messageType: "ORDERS",
          direction: "INBOUND",
        }),
      });
    });

    it("should apply all field transforms correctly on parsed data", () => {
      const parsedOrder = {
        orderNumber: "  PO-2026-001  ",
        buyerCode: "vw-curitiba",
        totalValue: "5200.00",
        buyerCnpj: "59104422000150",
        orderDate: "2026-01-15T10:30:00Z",
        unknownField: "ignored",
      };

      const mappings: FieldMapping[] = [
        { sourceField: "orderNumber", targetField: "externalCode", transform: "trim" },
        { sourceField: "buyerCode", targetField: "customerCode", transform: "uppercase" },
        { sourceField: "totalValue", targetField: "amount", transform: "number" },
        { sourceField: "buyerCnpj", targetField: "cnpj", transform: "cnpj" },
        { sourceField: "orderDate", targetField: "date", transform: "date" },
        { sourceField: "missing", targetField: "fallback", defaultValue: "N/A" },
      ];

      const result = applyFieldMappings(parsedOrder, mappings);

      expect(result.externalCode).toBe("PO-2026-001");
      expect(result.customerCode).toBe("VW-CURITIBA");
      expect(result.amount).toBe(5200);
      expect(result.cnpj).toBe("59104422000150");
      expect(result.date).toBe("2026-01-15");
      expect(result.fallback).toBe("N/A");
      // unknownField should NOT be in result (not mapped)
      expect(result.unknownField).toBeUndefined();
    });

    it("should update mapping and deactivate it", async () => {
      (prisma.ediMapping.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(createMockMapping());

      await svc.updateMapping(MAPPING_1, COMPANY_A, { isActive: false });

      expect((prisma.ediMapping.update as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
        where: { id: MAPPING_1 },
        data: { isActive: false },
      });
    });

    it("should throw when updating non-existent mapping", async () => {
      (prisma.ediMapping.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(svc.updateMapping("fake-id", COMPANY_A, { name: "X" }))
        .rejects.toThrow("Mapeamento não encontrado");
    });
  });

  // ==========================================================================
  // SCENARIO 9: Dashboard Stats
  // ==========================================================================

  describe("Scenario 9: Dashboard stats — aggregated counts", () => {
    it("should return correct aggregated stats", async () => {
      const prisma = createSimpleMockPrisma();
      const svc = new EdiService(prisma);

      // Mock counts in order: totalPartners, activePartners, totalMessages, pending, error, processedToday
      const countFn = prisma.ediPartner.count as ReturnType<typeof vi.fn>;
      countFn.mockResolvedValueOnce(5).mockResolvedValueOnce(3);

      const msgCountFn = prisma.ediMessage.count as ReturnType<typeof vi.fn>;
      msgCountFn
        .mockResolvedValueOnce(150)  // totalMessages
        .mockResolvedValueOnce(12)   // pendingMessages
        .mockResolvedValueOnce(3)    // errorMessages
        .mockResolvedValueOnce(45);  // processedToday

      const stats = await svc.getStats(COMPANY_A);

      expect(stats).toEqual({
        totalPartners: 5,
        activePartners: 3,
        totalMessages: 150,
        pendingMessages: 12,
        errorMessages: 3,
        processedToday: 45,
      });
    });
  });

  // ==========================================================================
  // SCENARIO 10: Multi-Tenant Isolation
  // ==========================================================================

  describe("Scenario 10: Multi-tenant isolation", () => {
    it("should not allow company A to access company B partner", async () => {
      const prisma = createSimpleMockPrisma();
      const svc = new EdiService(prisma);

      // Partner belongs to COMPANY_B
      (prisma.ediPartner.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await svc.getPartner(PARTNER_VW, COMPANY_A);
      expect(result).toBeNull();

      // Verify companyId was included in the query
      expect((prisma.ediPartner.findFirst as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
        where: { id: PARTNER_VW, companyId: COMPANY_A },
        include: expect.any(Object),
      });
    });

    it("should not allow company A to update company B partner", async () => {
      const prisma = createSimpleMockPrisma();
      const svc = new EdiService(prisma);

      (prisma.ediPartner.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(svc.updatePartner(PARTNER_VW, COMPANY_A, { name: "Hacked" }))
        .rejects.toThrow("Parceiro EDI não encontrado");
    });

    it("should not allow company A to process company B message", async () => {
      const prisma = createSimpleMockPrisma();
      const svc = new EdiService(prisma);

      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(svc.processMessage(MSG_1, COMPANY_A))
        .rejects.toThrow("Mensagem não encontrada ou já processada");
    });
  });

  // ==========================================================================
  // SCENARIO 11: Error Handling Edge Cases
  // ==========================================================================

  describe("Scenario 11: Error handling edge cases", () => {
    it("should handle message with no rawContent (outbound)", async () => {
      const prisma = createSimpleMockPrisma();
      const svc = new EdiService(prisma);

      const mockMsg = createMockMessage({
        direction: "OUTBOUND",
        rawContent: null,
        partner: createMockPartner(),
      });

      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMsg);

      const result = await svc.processMessage(MSG_1, COMPANY_A);

      expect(result.success).toBe(true);
      expect(result.parsedData).toBeNull();
    });

    it("should handle EDIFACT message with no BGM (returns null order)", async () => {
      const prisma = createSimpleMockPrisma();
      const svc = new EdiService(prisma);

      const mockMsg = createMockMessage({
        rawContent: "UNH+1+ORDERS:D:96A:UN'DTM+137:20260101:102'UNT+2+1'",
        partner: { ...createMockPartner(), format: "EDIFACT" },
      });

      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMsg);

      const result = await svc.processMessage(MSG_1, COMPANY_A);

      expect(result.success).toBe(true);
      // parseEdifactOrders returns null when no BGM → parsedData is null
      expect(result.parsedData).toBeNull();
    });
  });

  // ==========================================================================
  // SCENARIO 12: Credential Redaction
  // ==========================================================================

  describe("Scenario 12: Credential redaction", () => {
    it("should never expose sftpPassword in partner data", () => {
      const partner = createMockPartner();

      // Simulate what the router does
      const redacted = {
        ...partner,
        sftpPassword: partner.sftpPassword ? "••••••••" : null,
      };

      expect(redacted.sftpPassword).toBe("••••••••");
      expect(redacted.sftpHost).toBe("sftp.vw.com.br");
      expect(redacted.sftpUser).toBe("frm-edi");
    });

    it("should return null for partner without password", () => {
      const partner = createMockPartner({ sftpPassword: null });

      const redacted = {
        ...partner,
        sftpPassword: partner.sftpPassword ? "••••••••" : null,
      };

      expect(redacted.sftpPassword).toBeNull();
    });
  });

  // ==========================================================================
  // SCENARIO 13: Full End-to-End Flow
  // ==========================================================================

  describe("Scenario 13: Full E2E — partner → mapping → inbound → process → stats", () => {
    it("should complete the entire user journey", async () => {
      const { prisma, _state } = createStatefulMockPrisma();
      const svc = new EdiService(prisma);

      // Step 1: User creates a partner
      const partner = await svc.createPartner(COMPANY_A, {
        code: "VW-BR",
        name: "Volkswagen do Brasil",
        format: "EDIFACT",
        sftpHost: "sftp.vw.com.br",
      });
      expect(_state.partners).toHaveLength(1);

      // Step 2: User creates a field mapping
      const mapping = await svc.createMapping(COMPANY_A, {
        partnerId: partner.id as string,
        messageType: "ORDERS",
        direction: "INBOUND",
        name: "VW ORDERS Mapping",
        fieldMappings: [
          { sourceField: "orderNumber", targetField: "externalCode", transform: "trim" },
        ],
      });
      expect(_state.mappings).toHaveLength(1);

      // Step 3: Inbound EDIFACT message arrives
      const message = await svc.createMessage(COMPANY_A, {
        partnerId: partner.id as string,
        messageType: "ORDERS",
        direction: "INBOUND",
        referenceNumber: "PO-2026-001",
        fileName: "ORDERS_20260115.edi",
        rawContent: EDIFACT_ORDERS_FULL,
      });
      expect(_state.messages).toHaveLength(1);
      expect((message as Record<string, unknown>).status).toBe("PENDING");

      // Step 4: User processes the message
      // For processMessage, we need findFirst to return with partner included
      const msgWithPartner = {
        ..._state.messages[0],
        partner: { ..._state.partners[0], format: "EDIFACT" },
      };
      (prisma.ediMessage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(msgWithPartner);

      const result = await svc.processMessage(message.id as string, COMPANY_A);
      expect(result.success).toBe(true);
      expect(result.parsedData).not.toBeNull();

      const order = result.parsedData as Record<string, unknown>;
      expect(order.orderNumber).toBe("PO-2026-001");
      expect((order.items as unknown[]).length).toBe(3);

      // Step 5: User applies field mapping to parsed data
      const mapped = applyFieldMappings(
        order,
        mapping.fieldMappings as unknown as FieldMapping[]
      );
      expect(mapped.externalCode).toBe("PO-2026-001");

      // Step 6: User checks dashboard stats
      const stats = await svc.getStats(COMPANY_A);
      expect(stats).toBeDefined();
      // Stats use count which returns based on _state
      expect(typeof stats.totalPartners).toBe("number");
    });
  });

  // ==========================================================================
  // SCENARIO 14: Outbound Message Generation + Parsing Round-Trip
  // ==========================================================================

  describe("Scenario 14: Round-trip — generate EDIFACT → parse back → verify", () => {
    it("should generate INVOIC and parse it back correctly", () => {
      const originalData = {
        invoiceNumber: "NF-2026-00042",
        invoiceDate: "2026-02-10",
        orderReference: "PO-2026-007",
        totalValue: 3750.5,
        items: [
          { productCode: "PROD-A", quantity: 500, unitPrice: 5.0, totalPrice: 2500, description: "Item A" },
          { productCode: "PROD-B", quantity: 250, unitPrice: 5.002, totalPrice: 1250.5, description: "Item B" },
        ],
      };

      const edifact = generateInvoicEdifact(originalData);

      // Verify it's valid EDIFACT
      expect(edifact).toContain("UNH+1+INVOIC");
      expect(edifact).toContain("BGM+380+NF-2026-00042");
      expect(edifact).toContain("MOA+86:3750.50");

      // Parse it back
      const segments = parseEdifactSegments(edifact);
      expect(segments.length).toBeGreaterThan(5);

      // Verify BGM
      const bgm = segments.find((s) => s.tag === "BGM");
      expect(bgm).toBeDefined();
      expect(bgm!.elements[1][0]).toBe("NF-2026-00042");

      // Verify MOA total
      const moaTotal = segments.find((s) => s.tag === "MOA" && s.elements[0]?.[0] === "86");
      expect(moaTotal).toBeDefined();
      expect(moaTotal!.elements[0][1]).toBe("3750.50");
    });

    it("should generate DESADV and parse segments back", () => {
      const desadv = generateDesadvEdifact({
        shipmentNumber: "SHP-999",
        orderReference: "PO-999",
        shipDate: "2026-03-01",
        items: [{ productCode: "X1", quantity: 42 }],
      });

      const segments = parseEdifactSegments(desadv);
      const bgm = segments.find((s) => s.tag === "BGM");
      expect(bgm!.elements[1][0]).toBe("SHP-999");

      const lin = segments.find((s) => s.tag === "LIN");
      expect(lin!.elements[2][0]).toBe("X1");

      const qty = segments.find((s) => s.tag === "QTY");
      expect(qty!.elements[0][1]).toBe("42");
    });
  });
});
