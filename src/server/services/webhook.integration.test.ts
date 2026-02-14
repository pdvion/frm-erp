/**
 * Integration tests for WebhookService
 * VIO-1122: Webhooks Configuráveis
 *
 * Tests full user flows with mocked Prisma + fetch:
 * - emit → deliver → success
 * - emit → deliver → failure → retry scheduling
 * - emit → deliver → max retries → dead letter
 * - auto-suspend after 10 dead letters
 * - processRetries flow
 * - sendTestEvent flow
 * - rotateSecret flow
 * - getDeliveryStats flow
 * - emit with no matching configs (no-op)
 * - emit with multiple configs
 * - custom headers forwarding
 * - HMAC signature verification on delivery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { WebhookService, signPayload, verifySignature } from "./webhook";

// ============================================================================
// MOCK HELPERS
// ============================================================================

const COMPANY_ID = "company-uuid-1";
const WEBHOOK_ID = "webhook-uuid-1";
const EVENT_ID = "event-uuid-1";
const DELIVERY_ID = "delivery-uuid-1";
const USER_ID = "user-uuid-1";

function createMockConfig(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: WEBHOOK_ID,
    companyId: COMPANY_ID,
    name: "Test Webhook",
    url: "https://example.com/webhook",
    secret: "whsec_testsecret123456789abcdef",
    events: ["order.created", "invoice.created"],
    status: "ACTIVE",
    headers: { "X-Custom": "value" },
    timeoutMs: 10000,
    maxRetries: 3,
    description: "Test webhook",
    createdBy: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockDelivery(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: DELIVERY_ID,
    webhookId: WEBHOOK_ID,
    eventId: EVENT_ID,
    status: "PENDING",
    attemptNumber: 1,
    requestUrl: "https://example.com/webhook",
    requestHeaders: {},
    requestBody: '{"event":"order.created"}',
    responseStatus: null,
    responseBody: null,
    durationMs: null,
    errorMessage: null,
    nextRetryAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockPrisma() {
  const mock: Record<string, unknown> = {
    webhookConfig: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: WEBHOOK_ID, ...data })
      ),
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: WEBHOOK_ID, ...data })
      ),
      count: vi.fn().mockResolvedValue(0),
    },
    webhookEvent: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: EVENT_ID, ...data })
      ),
      count: vi.fn().mockResolvedValue(0),
    },
    webhookDelivery: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: DELIVERY_ID, ...data })
      ),
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: DELIVERY_ID, ...data })
      ),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _avg: { durationMs: null } }),
    },
  };
  return mock as unknown as PrismaClient;
}

// ============================================================================
// FETCH MOCK HELPERS
// ============================================================================

function mockFetchSuccess(status = 200, body = "OK") {
  return vi.fn().mockResolvedValue({
    status,
    text: () => Promise.resolve(body),
  });
}

function mockFetchFailure(status = 500, body = "Internal Server Error") {
  return vi.fn().mockResolvedValue({
    status,
    text: () => Promise.resolve(body),
  });
}

function mockFetchNetworkError(message = "Connection refused") {
  return vi.fn().mockRejectedValue(new Error(message));
}

// ============================================================================
// TESTS
// ============================================================================

describe("WebhookService — Integration Tests", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: WebhookService;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    service = new WebhookService(prisma);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ==========================================================================
  // EMIT → SUCCESSFUL DELIVERY
  // ==========================================================================

  describe("emit → successful delivery", () => {
    it("should find matching configs, create event, create delivery, and mark SUCCESS", async () => {
      const config = createMockConfig();
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      globalThis.fetch = mockFetchSuccess(200, '{"ok":true}');

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1", total: 1500 });

      // Wait for fire-and-forget delivery
      await new Promise((r) => setTimeout(r, 100));

      // 1. Should query active configs with matching event
      expect(mockConfigFindMany).toHaveBeenCalledWith({
        where: {
          companyId: COMPANY_ID,
          status: "ACTIVE",
          events: { has: "order.created" },
        },
      });

      // 2. Should create event record
      const mockEventCreate = prisma.webhookEvent.create as ReturnType<typeof vi.fn>;
      expect(mockEventCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: COMPANY_ID,
          eventType: "order.created",
          payload: { orderId: "ord-1", total: 1500 },
        }),
      });

      // 3. Should create delivery record
      const mockDeliveryCreate = prisma.webhookDelivery.create as ReturnType<typeof vi.fn>;
      expect(mockDeliveryCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          webhookId: WEBHOOK_ID,
          eventId: EVENT_ID,
          status: "PENDING",
          attemptNumber: 1,
          requestUrl: "https://example.com/webhook",
        }),
      });

      // 4. Should call fetch with correct URL and headers
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://example.com/webhook",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ orderId: "ord-1", total: 1500 }),
        }),
      );

      // 5. Should update delivery as SUCCESS
      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith({
        where: { id: DELIVERY_ID },
        data: expect.objectContaining({
          status: "SUCCESS",
          responseStatus: 200,
          responseBody: '{"ok":true}',
        }),
      });
    });

    it("should include HMAC signature in request headers", async () => {
      const config = createMockConfig();
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      globalThis.fetch = mockFetchSuccess();

      await service.emit(COMPANY_ID, "order.created", { test: true });
      await new Promise((r) => setTimeout(r, 100));

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = fetchCall[1].headers as Record<string, string>;

      // Verify signature header exists and is valid
      expect(headers["X-Webhook-Signature"]).toBeDefined();
      expect(headers["X-Webhook-Signature"]).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(headers["X-Webhook-Event"]).toBe("order.created");
      expect(headers["X-Webhook-Timestamp"]).toBeDefined();

      // Verify signature is correct
      const timestamp = headers["X-Webhook-Timestamp"];
      const body = fetchCall[1].body;
      const expectedSignature = signPayload(`${timestamp}.${body}`, config.secret as string);
      expect(headers["X-Webhook-Signature"]).toBe(expectedSignature);
    });

    it("should forward custom headers from config", async () => {
      const config = createMockConfig({
        headers: { "Authorization": "Bearer token123", "X-Api-Key": "key456" },
      });
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      globalThis.fetch = mockFetchSuccess();

      await service.emit(COMPANY_ID, "order.created", { test: true });
      await new Promise((r) => setTimeout(r, 100));

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = fetchCall[1].headers as Record<string, string>;

      expect(headers["Authorization"]).toBe("Bearer token123");
      expect(headers["X-Api-Key"]).toBe("key456");
    });
  });

  // ==========================================================================
  // EMIT → NO MATCHING CONFIGS
  // ==========================================================================

  describe("emit → no matching configs", () => {
    it("should not create event or delivery when no configs match", async () => {
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([]);

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" });

      const mockEventCreate = prisma.webhookEvent.create as ReturnType<typeof vi.fn>;
      expect(mockEventCreate).not.toHaveBeenCalled();

      const mockDeliveryCreate = prisma.webhookDelivery.create as ReturnType<typeof vi.fn>;
      expect(mockDeliveryCreate).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EMIT → MULTIPLE CONFIGS
  // ==========================================================================

  describe("emit → multiple configs", () => {
    it("should dispatch to all matching configs", async () => {
      const config1 = createMockConfig({ id: "wh-1", url: "https://a.com/hook" });
      const config2 = createMockConfig({ id: "wh-2", url: "https://b.com/hook" });
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config1, config2]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      globalThis.fetch = mockFetchSuccess();

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" });
      await new Promise((r) => setTimeout(r, 150));

      // Should create 1 event
      const mockEventCreate = prisma.webhookEvent.create as ReturnType<typeof vi.fn>;
      expect(mockEventCreate).toHaveBeenCalledTimes(1);

      // Should create 2 deliveries (one per config)
      const mockDeliveryCreate = prisma.webhookDelivery.create as ReturnType<typeof vi.fn>;
      expect(mockDeliveryCreate).toHaveBeenCalledTimes(2);

      // Should call fetch twice
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // EMIT → FAILURE → RETRY SCHEDULING
  // ==========================================================================

  describe("emit → failure → retry scheduling", () => {
    it("should schedule retry on HTTP 500 (attempt 1 of 3)", async () => {
      const config = createMockConfig({ maxRetries: 3 });
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      globalThis.fetch = mockFetchFailure(500, "Server Error");

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" });
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith({
        where: { id: DELIVERY_ID },
        data: expect.objectContaining({
          status: "FAILED",
          responseStatus: 500,
          responseBody: "Server Error",
          errorMessage: "HTTP 500",
          attemptNumber: 2,
          nextRetryAt: expect.any(Date),
        }),
      });
    });

    it("should schedule retry on network error", async () => {
      const config = createMockConfig({ maxRetries: 3 });
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      globalThis.fetch = mockFetchNetworkError("ECONNREFUSED");

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" });
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith({
        where: { id: DELIVERY_ID },
        data: expect.objectContaining({
          status: "FAILED",
          responseStatus: null,
          errorMessage: "ECONNREFUSED",
          attemptNumber: 2,
        }),
      });
    });
  });

  // ==========================================================================
  // EMIT → MAX RETRIES → DEAD LETTER
  // ==========================================================================

  describe("emit → max retries → dead letter", () => {
    it("should mark as DEAD_LETTER when max retries exceeded", async () => {
      const config = createMockConfig({ maxRetries: 3 });
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      // Simulate attempt 3 (last retry)
      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 3 });

      const mockDeliveryCount = prisma.webhookDelivery.count as ReturnType<typeof vi.fn>;
      mockDeliveryCount.mockResolvedValue(5); // Not enough for auto-suspend

      globalThis.fetch = mockFetchFailure(503, "Service Unavailable");

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" });
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith({
        where: { id: DELIVERY_ID },
        data: expect.objectContaining({
          status: "DEAD_LETTER",
          responseStatus: 503,
          errorMessage: "HTTP 503",
        }),
      });

      // Should NOT have nextRetryAt (dead letter = no more retries)
      const updateCall = mockDeliveryUpdate.mock.calls[0][0];
      expect(updateCall.data.nextRetryAt).toBeUndefined();
    });
  });

  // ==========================================================================
  // AUTO-SUSPEND AFTER 10 DEAD LETTERS
  // ==========================================================================

  describe("auto-suspend after 10 dead letters", () => {
    it("should suspend webhook config when 10+ dead letters in 24h", async () => {
      const config = createMockConfig({ maxRetries: 1 });
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      // Attempt 1 with maxRetries=1 → dead letter immediately
      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      // 10 dead letters in 24h → trigger suspension
      const mockDeliveryCount = prisma.webhookDelivery.count as ReturnType<typeof vi.fn>;
      mockDeliveryCount.mockResolvedValue(10);

      globalThis.fetch = mockFetchFailure(500);

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" });
      await new Promise((r) => setTimeout(r, 100));

      // Should update config status to SUSPENDED
      const mockConfigUpdate = prisma.webhookConfig.update as ReturnType<typeof vi.fn>;
      expect(mockConfigUpdate).toHaveBeenCalledWith({
        where: { id: WEBHOOK_ID },
        data: { status: "SUSPENDED" },
      });
    });

    it("should NOT suspend when dead letters < 10", async () => {
      const config = createMockConfig({ maxRetries: 1 });
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      const mockDeliveryCount = prisma.webhookDelivery.count as ReturnType<typeof vi.fn>;
      mockDeliveryCount.mockResolvedValue(9);

      globalThis.fetch = mockFetchFailure(500);

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" });
      await new Promise((r) => setTimeout(r, 100));

      const mockConfigUpdate = prisma.webhookConfig.update as ReturnType<typeof vi.fn>;
      expect(mockConfigUpdate).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EMIT → ERROR RESILIENCE
  // ==========================================================================

  describe("emit → error resilience", () => {
    it("should not throw when Prisma query fails (non-blocking)", async () => {
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockRejectedValue(new Error("DB connection lost"));

      // Should NOT throw
      await expect(
        service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" })
      ).resolves.toBeUndefined();
    });

    it("should not throw when delivery fails (fire-and-forget)", async () => {
      const config = createMockConfig();
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      // Make delivery creation fail
      const mockDeliveryCreate = prisma.webhookDelivery.create as ReturnType<typeof vi.fn>;
      mockDeliveryCreate.mockRejectedValue(new Error("DB write failed"));

      // Should NOT throw
      await expect(
        service.emit(COMPANY_ID, "order.created", { orderId: "ord-1" })
      ).resolves.toBeUndefined();

      await new Promise((r) => setTimeout(r, 100));
    });
  });

  // ==========================================================================
  // EMIT WITH ENTITY METADATA
  // ==========================================================================

  describe("emit with entity metadata", () => {
    it("should pass entityType, entityId, and metadata to event record", async () => {
      const config = createMockConfig();
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      globalThis.fetch = mockFetchSuccess();

      await service.emit(
        COMPANY_ID,
        "order.created",
        { orderId: "ord-1" },
        {
          entityType: "SalesOrder",
          entityId: "ord-uuid-1",
          metadata: { source: "api", version: 2 },
        }
      );

      const mockEventCreate = prisma.webhookEvent.create as ReturnType<typeof vi.fn>;
      expect(mockEventCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: "SalesOrder",
          entityId: "ord-uuid-1",
          metadata: { source: "api", version: 2 },
        }),
      });
    });
  });

  // ==========================================================================
  // PROCESS RETRIES
  // ==========================================================================

  describe("processRetries", () => {
    it("should process pending retries and re-attempt delivery", async () => {
      const delivery = createMockDelivery({
        status: "FAILED",
        attemptNumber: 2,
        nextRetryAt: new Date(Date.now() - 1000),
        requestBody: '{"orderId":"ord-1"}',
        webhook: {
          id: WEBHOOK_ID,
          url: "https://example.com/webhook",
          secret: "whsec_test",
          headers: {},
          timeoutMs: 10000,
          maxRetries: 3,
          status: "ACTIVE",
        },
      });

      const mockDeliveryFindMany = prisma.webhookDelivery.findMany as ReturnType<typeof vi.fn>;
      mockDeliveryFindMany.mockResolvedValue([delivery]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 2 });

      globalThis.fetch = mockFetchSuccess(200, "OK");

      const processed = await service.processRetries();

      expect(processed).toBe(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      // Should update delivery as SUCCESS
      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith({
        where: { id: DELIVERY_ID },
        data: expect.objectContaining({
          status: "SUCCESS",
          responseStatus: 200,
        }),
      });
    });

    it("should skip retries for SUSPENDED webhooks", async () => {
      const delivery = createMockDelivery({
        status: "FAILED",
        nextRetryAt: new Date(Date.now() - 1000),
        webhook: {
          id: WEBHOOK_ID,
          url: "https://example.com/webhook",
          secret: "whsec_test",
          headers: {},
          timeoutMs: 10000,
          maxRetries: 3,
          status: "SUSPENDED",
        },
      });

      const mockDeliveryFindMany = prisma.webhookDelivery.findMany as ReturnType<typeof vi.fn>;
      mockDeliveryFindMany.mockResolvedValue([delivery]);

      globalThis.fetch = mockFetchSuccess();

      const processed = await service.processRetries();

      expect(processed).toBe(0);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("should return 0 when no pending retries", async () => {
      const mockDeliveryFindMany = prisma.webhookDelivery.findMany as ReturnType<typeof vi.fn>;
      mockDeliveryFindMany.mockResolvedValue([]);

      const processed = await service.processRetries();

      expect(processed).toBe(0);
    });

    it("should respect limit parameter", async () => {
      const mockDeliveryFindMany = prisma.webhookDelivery.findMany as ReturnType<typeof vi.fn>;
      mockDeliveryFindMany.mockResolvedValue([]);

      await service.processRetries(10);

      expect(mockDeliveryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  // ==========================================================================
  // SEND TEST EVENT
  // ==========================================================================

  describe("sendTestEvent", () => {
    it("should create test event and deliver to webhook", async () => {
      const config = createMockConfig();
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue(config);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      globalThis.fetch = mockFetchSuccess();

      const eventId = await service.sendTestEvent(WEBHOOK_ID, COMPANY_ID);

      expect(eventId).toBe(EVENT_ID);

      // Should verify ownership
      expect(mockConfigFindFirst).toHaveBeenCalledWith({
        where: { id: WEBHOOK_ID, companyId: COMPANY_ID },
      });

      // Should create event with test type
      const mockEventCreate = prisma.webhookEvent.create as ReturnType<typeof vi.fn>;
      expect(mockEventCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: COMPANY_ID,
          eventType: "webhook.test",
          metadata: { isTest: true },
        }),
      });

      // Should call fetch
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw when config not found", async () => {
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue(null);

      await expect(
        service.sendTestEvent("non-existent", COMPANY_ID)
      ).rejects.toThrow("Webhook config not found");
    });

    it("should throw when config belongs to different company (IDOR)", async () => {
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue(null); // findFirst with companyId filter returns null

      await expect(
        service.sendTestEvent(WEBHOOK_ID, "other-company-id")
      ).rejects.toThrow("Webhook config not found");
    });
  });

  // ==========================================================================
  // ROTATE SECRET
  // ==========================================================================

  describe("rotateSecret", () => {
    it("should generate new secret and update config", async () => {
      const config = createMockConfig();
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue(config);

      const newSecret = await service.rotateSecret(WEBHOOK_ID, COMPANY_ID);

      // Should return a valid secret
      expect(newSecret).toMatch(/^whsec_[a-f0-9]{64}$/);

      // Should update config with new secret
      const mockConfigUpdate = prisma.webhookConfig.update as ReturnType<typeof vi.fn>;
      expect(mockConfigUpdate).toHaveBeenCalledWith({
        where: { id: WEBHOOK_ID },
        data: { secret: newSecret },
      });
    });

    it("should generate different secret each time", async () => {
      const config = createMockConfig();
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue(config);

      const secret1 = await service.rotateSecret(WEBHOOK_ID, COMPANY_ID);
      const secret2 = await service.rotateSecret(WEBHOOK_ID, COMPANY_ID);

      expect(secret1).not.toBe(secret2);
    });

    it("should throw when config not found", async () => {
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue(null);

      await expect(
        service.rotateSecret("non-existent", COMPANY_ID)
      ).rejects.toThrow("Webhook config not found");
    });

    it("should verify ownership (IDOR prevention)", async () => {
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue(null);

      await expect(
        service.rotateSecret(WEBHOOK_ID, "other-company")
      ).rejects.toThrow("Webhook config not found");

      expect(mockConfigFindFirst).toHaveBeenCalledWith({
        where: { id: WEBHOOK_ID, companyId: "other-company" },
      });
    });
  });

  // ==========================================================================
  // GET DELIVERY STATS
  // ==========================================================================

  describe("getDeliveryStats", () => {
    it("should return aggregated stats for a webhook", async () => {
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue({ id: WEBHOOK_ID });

      const mockDeliveryCount = prisma.webhookDelivery.count as ReturnType<typeof vi.fn>;
      mockDeliveryCount
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(85)   // success
        .mockResolvedValueOnce(10)   // failed
        .mockResolvedValueOnce(3)    // dead_letter
        .mockResolvedValueOnce(2);   // pending

      const mockAggregate = prisma.webhookDelivery.aggregate as ReturnType<typeof vi.fn>;
      mockAggregate.mockResolvedValue({ _avg: { durationMs: 245.7 } });

      const stats = await service.getDeliveryStats(WEBHOOK_ID, COMPANY_ID, 7);

      expect(stats).toEqual({
        total: 100,
        success: 85,
        failed: 10,
        deadLetter: 3,
        pending: 2,
        avgDurationMs: 246, // rounded
      });
    });

    it("should return zeros when no deliveries", async () => {
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue({ id: WEBHOOK_ID });

      const mockDeliveryCount = prisma.webhookDelivery.count as ReturnType<typeof vi.fn>;
      mockDeliveryCount.mockResolvedValue(0);

      const mockAggregate = prisma.webhookDelivery.aggregate as ReturnType<typeof vi.fn>;
      mockAggregate.mockResolvedValue({ _avg: { durationMs: null } });

      const stats = await service.getDeliveryStats(WEBHOOK_ID, COMPANY_ID);

      expect(stats).toEqual({
        total: 0,
        success: 0,
        failed: 0,
        deadLetter: 0,
        pending: 0,
        avgDurationMs: 0,
      });
    });

    it("should throw when config not found (IDOR)", async () => {
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue(null);

      await expect(
        service.getDeliveryStats(WEBHOOK_ID, "other-company")
      ).rejects.toThrow("Webhook config not found");
    });

    it("should use custom period days", async () => {
      const mockConfigFindFirst = prisma.webhookConfig.findFirst as ReturnType<typeof vi.fn>;
      mockConfigFindFirst.mockResolvedValue({ id: WEBHOOK_ID });

      const mockDeliveryCount = prisma.webhookDelivery.count as ReturnType<typeof vi.fn>;
      mockDeliveryCount.mockResolvedValue(0);

      const mockAggregate = prisma.webhookDelivery.aggregate as ReturnType<typeof vi.fn>;
      mockAggregate.mockResolvedValue({ _avg: { durationMs: null } });

      await service.getDeliveryStats(WEBHOOK_ID, COMPANY_ID, 30);

      // Verify the date filter uses 30 days
      const countCalls = mockDeliveryCount.mock.calls;
      for (const call of countCalls) {
        const since = call[0].where.createdAt.gte as Date;
        const daysDiff = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBeCloseTo(30, 0);
      }
    });
  });

  // ==========================================================================
  // SIGNATURE VERIFICATION (end-to-end)
  // ==========================================================================

  describe("signature verification (end-to-end)", () => {
    it("consumer should be able to verify webhook signature", async () => {
      const secret = "whsec_my_production_secret_key_here";
      const config = createMockConfig({ secret });
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      let capturedHeaders: Record<string, string> = {};
      let capturedBody = "";

      globalThis.fetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        capturedHeaders = opts.headers as Record<string, string>;
        capturedBody = opts.body as string;
        return Promise.resolve({ status: 200, text: () => Promise.resolve("OK") });
      });

      await service.emit(COMPANY_ID, "order.created", { orderId: "ord-1", total: 99.90 });
      await new Promise((r) => setTimeout(r, 100));

      // Simulate consumer-side verification
      const timestamp = capturedHeaders["X-Webhook-Timestamp"];
      const signature = capturedHeaders["X-Webhook-Signature"];
      const signingInput = `${timestamp}.${capturedBody}`;

      expect(verifySignature(signingInput, secret, signature)).toBe(true);

      // Tampered body should fail
      expect(verifySignature(`${timestamp}.{"orderId":"TAMPERED"}`, secret, signature)).toBe(false);

      // Wrong secret should fail
      expect(verifySignature(signingInput, "wrong_secret", signature)).toBe(false);
    });
  });

  // ==========================================================================
  // HTTP STATUS CODE HANDLING
  // ==========================================================================

  describe("HTTP status code handling", () => {
    const setupForStatusTest = () => {
      const config = createMockConfig();
      const mockConfigFindMany = prisma.webhookConfig.findMany as ReturnType<typeof vi.fn>;
      mockConfigFindMany.mockResolvedValue([config]);

      const mockDeliveryFindUnique = prisma.webhookDelivery.findUnique as ReturnType<typeof vi.fn>;
      mockDeliveryFindUnique.mockResolvedValue({ attemptNumber: 1 });

      return config;
    };

    it("should treat 200 as success", async () => {
      setupForStatusTest();
      globalThis.fetch = mockFetchSuccess(200);

      await service.emit(COMPANY_ID, "order.created", {});
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "SUCCESS" }),
        }),
      );
    });

    it("should treat 201 as success", async () => {
      setupForStatusTest();
      globalThis.fetch = mockFetchSuccess(201);

      await service.emit(COMPANY_ID, "order.created", {});
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "SUCCESS" }),
        }),
      );
    });

    it("should treat 204 as success", async () => {
      setupForStatusTest();
      globalThis.fetch = mockFetchSuccess(204, "");

      await service.emit(COMPANY_ID, "order.created", {});
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "SUCCESS" }),
        }),
      );
    });

    it("should treat 301 as failure", async () => {
      setupForStatusTest();
      globalThis.fetch = mockFetchFailure(301, "Moved");

      await service.emit(COMPANY_ID, "order.created", {});
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED", errorMessage: "HTTP 301" }),
        }),
      );
    });

    it("should treat 401 as failure", async () => {
      setupForStatusTest();
      globalThis.fetch = mockFetchFailure(401, "Unauthorized");

      await service.emit(COMPANY_ID, "order.created", {});
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED", errorMessage: "HTTP 401" }),
        }),
      );
    });

    it("should treat 429 as failure", async () => {
      setupForStatusTest();
      globalThis.fetch = mockFetchFailure(429, "Too Many Requests");

      await service.emit(COMPANY_ID, "order.created", {});
      await new Promise((r) => setTimeout(r, 100));

      const mockDeliveryUpdate = prisma.webhookDelivery.update as ReturnType<typeof vi.fn>;
      expect(mockDeliveryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED", errorMessage: "HTTP 429" }),
        }),
      );
    });
  });
});
