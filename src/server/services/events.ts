import { notifications, notificationService } from "./notifications";
import { prisma } from "@/lib/prisma";
import { WebhookService, type WebhookEventType } from "./webhook";

/**
 * Serviço de Eventos do Sistema
 * Centraliza a emissão de eventos e integração com notificações
 */

export type EventType =
  | "nfe.received"
  | "nfe.approved"
  | "nfe.rejected"
  | "quote.created"
  | "quote.sent"
  | "quote.approved"
  | "quote.rejected"
  | "purchaseOrder.created"
  | "purchaseOrder.approved"
  | "purchaseOrder.sent"
  | "purchaseOrder.submittedForApproval"
  | "requisition.submittedForApproval"
  | "workflow.started"
  | "workflow.completed"
  | "workflow.rejected"
  | "requisition.created"
  | "requisition.approved"
  | "requisition.rejected"
  | "inventory.lowStock"
  | "inventory.criticalStock"
  | "payable.created"
  | "payable.dueSoon"
  | "payable.overdue"
  | "payable.paid"
  | "receivable.created"
  | "receivable.dueSoon"
  | "receivable.overdue"
  | "receivable.received"
  | "invoice.created"
  | "invoice.authorized"
  | "invoice.cancelled"
  | "user.created"
  | "user.invited"
  | "system.error";

interface EventContext {
  userId?: string;
  companyId?: string;
  metadata?: Record<string, unknown>;
}

interface EventPayload {
  type: EventType;
  context: EventContext;
  data: Record<string, unknown>;
}

/**
 * Extracts the entity ID from event data based on known field naming conventions.
 */
function extractEntityId(data: Record<string, unknown>): string {
  const idFields = ["entityId", "orderId", "quoteId", "payableId", "receivableId", "invoiceId", "materialId"] as const;
  for (const field of idFields) {
    if (data[field]) return String(data[field]);
  }
  return "";
}

/**
 * Maps internal EventType → WebhookEventType for automatic webhook dispatch.
 * Only events with a matching webhook type are forwarded.
 */
const EVENT_TO_WEBHOOK: Partial<Record<EventType, WebhookEventType>> = {
  "quote.created": "quote.created",
  "quote.approved": "quote.approved",
  "purchaseOrder.created": "purchase_order.created",
  "purchaseOrder.approved": "purchase_order.approved",
  "inventory.lowStock": "stock.low",
  "inventory.criticalStock": "stock.low",
  "payable.created": "payable.created",
  "payable.paid": "payable.paid",
  "receivable.created": "receivable.created",
  "receivable.received": "receivable.received",
  "invoice.created": "invoice.created",
  "invoice.authorized": "invoice.authorized",
  "invoice.cancelled": "invoice.cancelled",
};

class EventService {
  private webhookService = new WebhookService(prisma);

  /**
   * Emitir um evento do sistema
   */
  async emit(payload: EventPayload): Promise<void> {
    const { type, context, data } = payload;

    try {
      switch (type) {
        // NFe Events
        case "nfe.received":
          await this.handleNfeReceived(context, data);
          break;
        case "nfe.approved":
          await this.handleNfeApproved(context, data);
          break;
        case "nfe.rejected":
          await this.handleNfeRejected(context, data);
          break;

        // Quote Events
        case "quote.created":
          await this.handleQuoteCreated(context, data);
          break;
        case "quote.sent":
          await this.handleQuoteSent(context, data);
          break;
        case "quote.approved":
          await this.handleQuoteApproved(context, data);
          break;
        case "quote.rejected":
          await this.handleQuoteRejected(context, data);
          break;

        // Purchase Order Events
        case "purchaseOrder.created":
          await this.handlePurchaseOrderCreated(context, data);
          break;
        case "purchaseOrder.approved":
          await this.handlePurchaseOrderApproved(context, data);
          break;
        case "purchaseOrder.sent":
          await this.handlePurchaseOrderSent(context, data);
          break;

        // Requisition Events
        case "requisition.created":
          await this.handleRequisitionCreated(context, data);
          break;
        case "requisition.approved":
          await this.handleRequisitionApproved(context, data);
          break;
        case "requisition.rejected":
          await this.handleRequisitionRejected(context, data);
          break;

        // Inventory Events
        case "inventory.lowStock":
          await this.handleLowStock(context, data);
          break;
        case "inventory.criticalStock":
          await this.handleCriticalStock(context, data);
          break;

        // Payable Events
        case "payable.created":
          await this.handlePayableCreated(context, data);
          break;
        case "payable.dueSoon":
          await this.handlePayableDueSoon(context, data);
          break;
        case "payable.overdue":
          await this.handlePayableOverdue(context, data);
          break;
        case "payable.paid":
          await this.handlePayablePaid(context, data);
          break;

        // Receivable Events
        case "receivable.created":
          await this.handleReceivableCreated(context, data);
          break;
        case "receivable.dueSoon":
          await this.handleReceivableDueSoon(context, data);
          break;
        case "receivable.overdue":
          await this.handleReceivableOverdue(context, data);
          break;
        case "receivable.received":
          await this.handleReceivableReceived(context, data);
          break;

        // User Events
        case "user.created":
          await this.handleUserCreated(context, data);
          break;
        case "user.invited":
          await this.handleUserInvited(context, data);
          break;

        // System Events
        case "system.error":
          await this.handleSystemError(context, data);
          break;

        default:
          console.warn(`Unknown event type: ${type}`);
      }

      // Dispatch to external webhooks (non-blocking)
      const webhookEventType = EVENT_TO_WEBHOOK[type];
      if (webhookEventType && context.companyId) {
        const entityId = extractEntityId(data);
        const emitOptions: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> } = {};
        if (data.entityType) emitOptions.entityType = String(data.entityType);
        if (entityId) emitOptions.entityId = entityId;
        if (context.metadata) emitOptions.metadata = context.metadata;

        this.webhookService
          .emit(context.companyId, webhookEventType, data, emitOptions)
          .catch((e: unknown) =>
            console.warn(`[webhook] Failed to dispatch ${webhookEventType}:`, e instanceof Error ? e.message : String(e))
          );
      }
    } catch (error) {
      console.error(`Error handling event ${type}:`, error);
    }
  }

  // NFe Handlers
  private async handleNfeReceived(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.userId) return;
    await notifications.nfeReceived(
      ctx.userId,
      String(data.nfeNumber),
      String(data.supplierName)
    );
  }

  private async handleNfeApproved(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "success",
      category: "business",
      title: "NFe Aprovada",
      message: `NFe ${data.nfeNumber} de ${data.supplierName} foi aprovada e deu entrada no estoque.`,
      link: `/invoices/${data.invoiceId}`,
    });
  }

  private async handleNfeRejected(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "warning",
      category: "business",
      title: "NFe Rejeitada",
      message: `NFe ${data.nfeNumber} de ${data.supplierName} foi rejeitada. Motivo: ${data.reason || "Não informado"}`,
      link: `/invoices/${data.invoiceId}`,
    });
  }

  // Quote Handlers
  private async handleQuoteCreated(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "info",
      category: "business",
      title: "Nova Cotação Criada",
      message: `Cotação #${data.code} para ${data.supplierName} foi criada.`,
      link: `/quotes/${data.quoteId}`,
    });
  }

  private async handleQuoteSent(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "info",
      category: "business",
      title: "Cotação Enviada",
      message: `Cotação #${data.code} foi enviada para ${data.supplierName}.`,
      link: `/quotes/${data.quoteId}`,
    });
  }

  private async handleQuoteApproved(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "success",
      category: "business",
      title: "Cotação Aprovada",
      message: `Cotação #${data.code} de ${data.supplierName} foi aprovada. Valor: R$ ${Number(data.totalValue).toFixed(2)}`,
      link: `/quotes/${data.quoteId}`,
    });
  }

  private async handleQuoteRejected(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "warning",
      category: "business",
      title: "Cotação Rejeitada",
      message: `Cotação #${data.code} de ${data.supplierName} foi rejeitada.`,
      link: `/quotes/${data.quoteId}`,
    });
  }

  // Purchase Order Handlers
  private async handlePurchaseOrderCreated(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "info",
      category: "business",
      title: "Pedido de Compra Criado",
      message: `Pedido #${data.code} para ${data.supplierName} foi criado. Valor: R$ ${Number(data.totalValue).toFixed(2)}`,
      link: `/purchase-orders/${data.orderId}`,
    });
  }

  private async handlePurchaseOrderApproved(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "success",
      category: "business",
      title: "Pedido de Compra Aprovado",
      message: `Pedido #${data.code} foi aprovado e está pronto para envio.`,
      link: `/purchase-orders/${data.orderId}`,
    });
  }

  private async handlePurchaseOrderSent(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "success",
      category: "business",
      title: "Pedido de Compra Enviado",
      message: `Pedido #${data.code} foi enviado para ${data.supplierName}.`,
      link: `/purchase-orders/${data.orderId}`,
    });
  }

  // Requisition Handlers
  private async handleRequisitionCreated(ctx: EventContext, data: Record<string, unknown>) {
    // Notificar aprovadores
    const approvers = await this.getApprovers(ctx.companyId);
    for (const approver of approvers) {
      await notifications.requisitionPending(
        approver.userId,
        Number(data.code),
        String(data.requesterName)
      );
    }
  }

  private async handleRequisitionApproved(ctx: EventContext, data: Record<string, unknown>) {
    if (!data.requesterId) return;
    await notificationService.notifyUser({
      userId: String(data.requesterId),
      type: "success",
      category: "business",
      title: "Requisição Aprovada",
      message: `Sua requisição #${data.code} foi aprovada.`,
      link: `/requisitions/${data.requisitionId}`,
    });
  }

  private async handleRequisitionRejected(ctx: EventContext, data: Record<string, unknown>) {
    if (!data.requesterId) return;
    await notificationService.notifyUser({
      userId: String(data.requesterId),
      type: "warning",
      category: "business",
      title: "Requisição Rejeitada",
      message: `Sua requisição #${data.code} foi rejeitada. Motivo: ${data.reason || "Não informado"}`,
      link: `/requisitions/${data.requisitionId}`,
    });
  }

  // Inventory Handlers
  private async handleLowStock(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notifications.lowStock(
      ctx.companyId,
      String(data.materialName),
      Number(data.currentQty),
      Number(data.minQty)
    );
  }

  private async handleCriticalStock(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "error",
      category: "business",
      title: "Estoque Crítico!",
      message: `${data.materialName}: ${data.currentQty} unidades (mínimo: ${data.minQty}). Ação urgente necessária!`,
      link: "/inventory",
    });
  }

  // Payable Handlers
  private async handlePayableCreated(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "info",
      category: "business",
      title: "Novo Título a Pagar",
      message: `${data.supplierName}: R$ ${Number(data.value).toFixed(2)} - Vencimento: ${new Date(String(data.dueDate)).toLocaleDateString("pt-BR")}`,
      link: `/payables/${data.payableId}`,
    });
  }

  private async handlePayableDueSoon(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.userId) return;
    await notifications.payableDue(
      ctx.userId,
      String(data.supplierName),
      Number(data.value),
      new Date(String(data.dueDate))
    );
  }

  private async handlePayableOverdue(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "error",
      category: "business",
      title: "Título Vencido!",
      message: `${data.supplierName}: R$ ${Number(data.value).toFixed(2)} venceu em ${new Date(String(data.dueDate)).toLocaleDateString("pt-BR")}`,
      link: `/payables/${data.payableId}`,
    });
  }

  private async handlePayablePaid(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "success",
      category: "business",
      title: "Título Pago",
      message: `Pagamento de R$ ${Number(data.value).toFixed(2)} para ${data.supplierName} realizado.`,
      link: `/payables/${data.payableId}`,
    });
  }

  // Receivable Handlers
  private async handleReceivableCreated(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "info",
      category: "business",
      title: "Novo Título a Receber",
      message: `${data.customerName}: R$ ${Number(data.value).toFixed(2)} - Vencimento: ${new Date(String(data.dueDate)).toLocaleDateString("pt-BR")}`,
      link: `/receivables/${data.receivableId}`,
    });
  }

  private async handleReceivableDueSoon(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "warning",
      category: "business",
      title: "Título a Receber Vencendo",
      message: `${data.customerName}: R$ ${Number(data.value).toFixed(2)} vence em ${new Date(String(data.dueDate)).toLocaleDateString("pt-BR")}`,
      link: `/receivables/${data.receivableId}`,
    });
  }

  private async handleReceivableOverdue(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "error",
      category: "business",
      title: "Título a Receber Vencido!",
      message: `${data.customerName}: R$ ${Number(data.value).toFixed(2)} venceu em ${new Date(String(data.dueDate)).toLocaleDateString("pt-BR")}. Iniciar cobrança.`,
      link: `/receivables/${data.receivableId}`,
    });
  }

  private async handleReceivableReceived(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "success",
      category: "business",
      title: "Pagamento Recebido",
      message: `Recebimento de R$ ${Number(data.value).toFixed(2)} de ${data.customerName} confirmado.`,
      link: `/receivables/${data.receivableId}`,
    });
  }

  // User Handlers
  private async handleUserCreated(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notifications.newUser(ctx.companyId, String(data.userName));
  }

  private async handleUserInvited(ctx: EventContext, data: Record<string, unknown>) {
    if (!ctx.companyId) return;
    await notificationService.notifyCompany({
      companyId: ctx.companyId,
      type: "info",
      category: "system",
      title: "Convite Enviado",
      message: `Um convite foi enviado para ${data.email}.`,
      link: "/settings/companies",
    });
  }

  // System Handlers
  private async handleSystemError(ctx: EventContext, data: Record<string, unknown>) {
    await notifications.systemError(
      String(data.title),
      String(data.message),
      data.errorCode ? String(data.errorCode) : undefined
    );
  }

  // Helper: Get approvers for a company
  private async getApprovers(companyId?: string): Promise<{ userId: string }[]> {
    if (!companyId) return [];

    // Buscar usuários ativos da empresa (simplificado - todos usuários ativos)
    // TODO: Implementar filtro por permissões quando tabela UserCompanyPermission estiver disponível
    const approvers = await prisma.userCompany.findMany({
      where: {
        companyId,
        isActive: true,
      },
      select: { userId: true },
    });

    return approvers;
  }
}

// Singleton
export const eventService = new EventService();

// Função de conveniência
export const emitEvent = (
  type: EventType,
  context: EventContext,
  data: Record<string, unknown>
) => eventService.emit({ type, context, data });
