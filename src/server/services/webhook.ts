import crypto from "crypto";
import type { PrismaClient, Prisma } from "@prisma/client";

// ============================================================
// CONSTANTS
// ============================================================

const MAX_RESPONSE_BODY_LENGTH = 4096;
const SIGNATURE_ALGORITHM = "sha256";
const SIGNATURE_HEADER = "X-Webhook-Signature";
const EVENT_TYPE_HEADER = "X-Webhook-Event";
const DELIVERY_ID_HEADER = "X-Webhook-Delivery";
const TIMESTAMP_HEADER = "X-Webhook-Timestamp";

/** Retry delays in ms: 10s, 60s, 300s */
const RETRY_DELAYS = [10_000, 60_000, 300_000];

// ============================================================
// EVENT TYPES REGISTRY
// ============================================================

export const WEBHOOK_EVENT_TYPES = {
  // Sales
  "order.created": "Pedido de venda criado",
  "order.updated": "Pedido de venda atualizado",
  "order.cancelled": "Pedido de venda cancelado",
  "quote.created": "Cotação criada",
  "quote.approved": "Cotação aprovada",

  // Fiscal
  "invoice.created": "NF-e criada",
  "invoice.authorized": "NF-e autorizada",
  "invoice.cancelled": "NF-e cancelada",

  // Inventory
  "stock.movement": "Movimentação de estoque",
  "stock.low": "Estoque abaixo do mínimo",

  // Purchasing
  "purchase_order.created": "Pedido de compra criado",
  "purchase_order.approved": "Pedido de compra aprovado",
  "purchase_order.received": "Pedido de compra recebido",

  // HR / Admission
  "admission.status_changed": "Status de admissão alterado",
  "admission.completed": "Admissão concluída",
  "employee.created": "Funcionário criado",

  // Finance
  "payable.created": "Conta a pagar criada",
  "payable.paid": "Conta a pagar quitada",
  "receivable.created": "Conta a receber criada",
  "receivable.received": "Conta a receber quitada",

  // CRM
  "lead.created": "Lead criado",
  "lead.converted": "Lead convertido",
  "opportunity.won": "Oportunidade ganha",
  "opportunity.lost": "Oportunidade perdida",

  // Production
  "production_order.created": "Ordem de produção criada",
  "production_order.completed": "Ordem de produção concluída",

  // Maintenance
  "maintenance_order.created": "Ordem de manutenção criada",
  "maintenance_order.completed": "Ordem de manutenção concluída",

  // System
  "webhook.test": "Evento de teste",
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENT_TYPES;

// ============================================================
// PURE FUNCTIONS
// ============================================================

/**
 * Generate HMAC-SHA256 signature for webhook payload.
 * Format: `sha256=<hex_digest>` (same as GitHub webhooks)
 */
export function signPayload(payload: string, secret: string): string {
  const hmac = crypto.createHmac(SIGNATURE_ALGORITHM, secret);
  hmac.update(payload, "utf8");
  return `${SIGNATURE_ALGORITHM}=${hmac.digest("hex")}`;
}

/**
 * Verify HMAC-SHA256 signature.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifySignature(
  payload: string,
  secret: string,
  signature: string
): boolean {
  const expected = signPayload(payload, secret);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

/**
 * Generate a cryptographically secure random secret.
 */
export function generateSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

/**
 * Calculate next retry delay using exponential backoff.
 * Returns null if max retries exceeded.
 */
export function getRetryDelay(
  attemptNumber: number,
  maxRetries: number
): number | null {
  if (attemptNumber >= maxRetries) return null;
  return RETRY_DELAYS[attemptNumber - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
}

/**
 * Truncate response body to avoid storing huge payloads.
 */
export function truncateResponseBody(body: string | null): string | null {
  if (body === null) return null;
  if (body.length <= MAX_RESPONSE_BODY_LENGTH) return body;
  return body.slice(0, MAX_RESPONSE_BODY_LENGTH) + "... [truncated]";
}

// ============================================================
// INTERFACES
// ============================================================

interface EmitOptions {
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

interface DeliveryConfig {
  id: string;
  url: string;
  secret: string;
  headers: Prisma.JsonValue;
  timeoutMs: number;
  maxRetries: number;
}

interface AttemptConfig {
  id: string;
  url: string;
  timeoutMs: number;
  maxRetries: number;
}

interface FailureConfig {
  id: string;
  maxRetries: number;
}

// ============================================================
// WEBHOOK SERVICE CLASS
// ============================================================

export class WebhookService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Emit a webhook event and dispatch to all matching configs.
   * This is the main entry point — call from any mutation.
   *
   * Non-blocking: catches errors to avoid breaking the caller.
   */
  async emit(
    companyId: string,
    eventType: WebhookEventType,
    payload: Record<string, unknown>,
    options?: EmitOptions
  ): Promise<void> {
    try {
      // 1. Find active webhooks subscribed to this event
      const configs = await this.prisma.webhookConfig.findMany({
        where: {
          companyId,
          status: "ACTIVE",
          events: { has: eventType },
        },
      });

      if (configs.length === 0) return;

      // 2. Create the event record
      const event = await this.prisma.webhookEvent.create({
        data: {
          companyId,
          eventType,
          entityType: options?.entityType,
          entityId: options?.entityId,
          payload: payload as Prisma.InputJsonValue,
          metadata: (options?.metadata as Prisma.InputJsonValue) ?? {},
        },
      });

      // 3. Dispatch to each webhook (fire-and-forget)
      for (const config of configs) {
        this.deliverToWebhook(config, event.id, eventType, payload).catch(
          (e: unknown) => {
            console.warn(
              `[webhook] Delivery failed for config ${config.id}:`,
              e instanceof Error ? e.message : String(e)
            );
          }
        );
      }
    } catch (e: unknown) {
      console.warn(
        `[webhook] Failed to emit ${eventType}:`,
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  /**
   * Deliver a single event to a single webhook config.
   * Handles retries with exponential backoff.
   */
  private async deliverToWebhook(
    config: DeliveryConfig,
    eventId: string,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = signPayload(`${timestamp}.${body}`, config.secret);

    const customHeaders =
      config.headers && typeof config.headers === "object" && !Array.isArray(config.headers)
        ? (config.headers as Record<string, string>)
        : {};

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      [SIGNATURE_HEADER]: signature,
      [EVENT_TYPE_HEADER]: eventType,
      [TIMESTAMP_HEADER]: timestamp,
      ...customHeaders,
    };

    // Create initial delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId: config.id,
        eventId,
        status: "PENDING",
        attemptNumber: 1,
        requestUrl: config.url,
        requestHeaders: headers as Prisma.InputJsonValue,
        requestBody: body,
      },
    });

    headers[DELIVERY_ID_HEADER] = delivery.id;

    await this.attemptDelivery(delivery.id, config, headers, body);
  }

  /**
   * Attempt to deliver a webhook. Updates the delivery record with results.
   */
  private async attemptDelivery(
    deliveryId: string,
    config: AttemptConfig,
    headers: Record<string, string>,
    body: string
  ): Promise<void> {
    const startTime = Date.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), config.timeoutMs);

      const response = await fetch(config.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      const durationMs = Date.now() - startTime;
      const responseBody = await response.text().catch(() => null);
      const isSuccess = response.status >= 200 && response.status < 300;

      if (isSuccess) {
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "SUCCESS",
            responseStatus: response.status,
            responseBody: truncateResponseBody(responseBody),
            durationMs,
          },
        });
      } else {
        await this.handleFailure(
          deliveryId,
          config,
          response.status,
          truncateResponseBody(responseBody),
          durationMs,
          `HTTP ${response.status}`
        );
      }
    } catch (e: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMessage = e instanceof Error ? e.message : String(e);

      await this.handleFailure(
        deliveryId,
        config,
        null,
        null,
        durationMs,
        errorMessage
      );
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  /**
   * Handle a failed delivery attempt. Schedule retry or mark as dead letter.
   */
  private async handleFailure(
    deliveryId: string,
    config: FailureConfig,
    responseStatus: number | null,
    responseBody: string | null,
    durationMs: number,
    errorMessage: string
  ): Promise<void> {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      select: { attemptNumber: true },
    });

    if (!delivery) return;

    const retryDelay = getRetryDelay(delivery.attemptNumber, config.maxRetries);

    if (retryDelay !== null) {
      // Schedule retry
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "FAILED",
          responseStatus,
          responseBody,
          durationMs,
          errorMessage,
          attemptNumber: delivery.attemptNumber + 1,
          nextRetryAt: new Date(Date.now() + retryDelay),
        },
      });
    } else {
      // Max retries exceeded → dead letter
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "DEAD_LETTER",
          responseStatus,
          responseBody,
          durationMs,
          errorMessage,
        },
      });

      // Suspend webhook after too many failures
      const recentFailures = await this.prisma.webhookDelivery.count({
        where: {
          webhookId: config.id,
          status: "DEAD_LETTER",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (recentFailures >= 10) {
        await this.prisma.webhookConfig.update({
          where: { id: config.id },
          data: { status: "SUSPENDED" },
        });
        console.warn(
          `[webhook] Config ${config.id} suspended after ${recentFailures} dead letters in 24h`
        );
      }
    }
  }

  /**
   * Process pending retries. Call this from a cron job or background worker.
   */
  async processRetries(limit = 50): Promise<number> {
    const pendingRetries = await this.prisma.webhookDelivery.findMany({
      where: {
        status: "FAILED",
        nextRetryAt: { lte: new Date() },
      },
      include: {
        webhook: {
          select: {
            id: true,
            url: true,
            secret: true,
            headers: true,
            timeoutMs: true,
            maxRetries: true,
            status: true,
          },
        },
      },
      take: limit,
      orderBy: { nextRetryAt: "asc" },
    });

    let processed = 0;

    for (const delivery of pendingRetries) {
      if (delivery.webhook.status !== "ACTIVE") continue;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        [DELIVERY_ID_HEADER]: delivery.id,
      };

      // Restore original event type header from stored request headers
      const storedHeaders =
        delivery.requestHeaders &&
        typeof delivery.requestHeaders === "object" &&
        !Array.isArray(delivery.requestHeaders)
          ? (delivery.requestHeaders as Record<string, string>)
          : {};
      if (storedHeaders[EVENT_TYPE_HEADER]) {
        headers[EVENT_TYPE_HEADER] = storedHeaders[EVENT_TYPE_HEADER];
      }

      if (delivery.requestBody) {
        const timestamp = Date.now().toString();
        headers[SIGNATURE_HEADER] = signPayload(
          `${timestamp}.${delivery.requestBody}`,
          delivery.webhook.secret
        );
        headers[TIMESTAMP_HEADER] = timestamp;
      }

      const customHeaders =
        delivery.webhook.headers &&
        typeof delivery.webhook.headers === "object" &&
        !Array.isArray(delivery.webhook.headers)
          ? (delivery.webhook.headers as Record<string, string>)
          : {};

      Object.assign(headers, customHeaders);

      await this.attemptDelivery(
        delivery.id,
        delivery.webhook,
        headers,
        delivery.requestBody ?? ""
      );

      processed++;
    }

    return processed;
  }

  /**
   * Send a test event to a webhook config.
   */
  async sendTestEvent(configId: string, companyId: string): Promise<string> {
    const config = await this.prisma.webhookConfig.findFirst({
      where: { id: configId, companyId },
    });

    if (!config) {
      throw new Error("Webhook config not found");
    }

    const testPayload = {
      event: "webhook.test" as const,
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test event from FRM ERP",
        webhookId: config.id,
        webhookName: config.name,
      },
    };

    const event = await this.prisma.webhookEvent.create({
      data: {
        companyId,
        eventType: "webhook.test",
        payload: testPayload as unknown as Prisma.InputJsonValue,
        metadata: { isTest: true } as Prisma.InputJsonValue,
      },
    });

    await this.deliverToWebhook(config, event.id, "webhook.test", testPayload);

    return event.id;
  }

  /**
   * Rotate the secret for a webhook config.
   * Returns the new secret.
   */
  async rotateSecret(configId: string, companyId: string): Promise<string> {
    const config = await this.prisma.webhookConfig.findFirst({
      where: { id: configId, companyId },
    });

    if (!config) {
      throw new Error("Webhook config not found");
    }

    const newSecret = generateSecret();

    await this.prisma.webhookConfig.update({
      where: { id: configId },
      data: { secret: newSecret },
    });

    return newSecret;
  }

  /**
   * Get delivery statistics for a webhook config.
   */
  async getDeliveryStats(
    configId: string,
    companyId: string,
    periodDays = 7
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    deadLetter: number;
    pending: number;
    avgDurationMs: number;
  }> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Verify ownership
    const config = await this.prisma.webhookConfig.findFirst({
      where: { id: configId, companyId },
      select: { id: true },
    });

    if (!config) {
      throw new Error("Webhook config not found");
    }

    const [total, success, failed, deadLetter, pending, avgResult] =
      await Promise.all([
        this.prisma.webhookDelivery.count({
          where: { webhookId: configId, createdAt: { gte: since } },
        }),
        this.prisma.webhookDelivery.count({
          where: { webhookId: configId, status: "SUCCESS", createdAt: { gte: since } },
        }),
        this.prisma.webhookDelivery.count({
          where: { webhookId: configId, status: "FAILED", createdAt: { gte: since } },
        }),
        this.prisma.webhookDelivery.count({
          where: { webhookId: configId, status: "DEAD_LETTER", createdAt: { gte: since } },
        }),
        this.prisma.webhookDelivery.count({
          where: { webhookId: configId, status: "PENDING", createdAt: { gte: since } },
        }),
        this.prisma.webhookDelivery.aggregate({
          where: {
            webhookId: configId,
            status: "SUCCESS",
            durationMs: { not: null },
            createdAt: { gte: since },
          },
          _avg: { durationMs: true },
        }),
      ]);

    return {
      total,
      success,
      failed,
      deadLetter,
      pending,
      avgDurationMs: Math.round(avgResult._avg.durationMs ?? 0),
    };
  }
}
