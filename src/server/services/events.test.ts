import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    userCompany: {
      findMany: vi.fn().mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ]),
    },
  },
}));

// Mock notification service
vi.mock("./notifications", () => ({
  notificationService: {
    notifyUser: vi.fn().mockResolvedValue({ id: "notif-1" }),
    notifyCompany: vi.fn().mockResolvedValue([{ id: "notif-1" }]),
    broadcast: vi.fn().mockResolvedValue({ id: "notif-1" }),
  },
  notifications: {
    nfeReceived: vi.fn().mockResolvedValue({ id: "notif-1" }),
    lowStock: vi.fn().mockResolvedValue([{ id: "notif-1" }]),
    payableDue: vi.fn().mockResolvedValue({ id: "notif-1" }),
    requisitionPending: vi.fn().mockResolvedValue({ id: "notif-1" }),
    systemError: vi.fn().mockResolvedValue({ id: "notif-1" }),
    newUser: vi.fn().mockResolvedValue([{ id: "notif-1" }]),
  },
}));

import { eventService, emitEvent } from "./events";
import { notificationService, notifications } from "./notifications";

describe("EventService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("emit", () => {
    describe("NFe events", () => {
      it("should handle nfe.received event", async () => {
        await eventService.emit({
          type: "nfe.received",
          context: { userId: "user-1", companyId: "company-1" },
          data: { nfeNumber: "12345", supplierName: "Fornecedor ABC" },
        });

        expect(notifications.nfeReceived).toHaveBeenCalledWith(
          "user-1",
          "12345",
          "Fornecedor ABC"
        );
      });

      it("should handle nfe.approved event", async () => {
        await eventService.emit({
          type: "nfe.approved",
          context: { companyId: "company-1" },
          data: {
            nfeNumber: "12345",
            supplierName: "Fornecedor ABC",
            invoiceId: "inv-1",
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            companyId: "company-1",
            type: "success",
            title: "NFe Aprovada",
          })
        );
      });

      it("should handle nfe.rejected event", async () => {
        await eventService.emit({
          type: "nfe.rejected",
          context: { companyId: "company-1" },
          data: {
            nfeNumber: "12345",
            supplierName: "Fornecedor ABC",
            invoiceId: "inv-1",
            reason: "Dados inválidos",
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "warning",
            title: "NFe Rejeitada",
          })
        );
      });
    });

    describe("Quote events", () => {
      it("should handle quote.created event", async () => {
        await eventService.emit({
          type: "quote.created",
          context: { companyId: "company-1" },
          data: {
            code: "COT001",
            supplierName: "Fornecedor ABC",
            quoteId: "quote-1",
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "info",
            title: "Nova Cotação Criada",
          })
        );
      });

      it("should handle quote.approved event", async () => {
        await eventService.emit({
          type: "quote.approved",
          context: { companyId: "company-1" },
          data: {
            code: "COT001",
            supplierName: "Fornecedor ABC",
            quoteId: "quote-1",
            totalValue: 1500.5,
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "success",
            title: "Cotação Aprovada",
          })
        );
      });
    });

    describe("Purchase Order events", () => {
      it("should handle purchaseOrder.created event", async () => {
        await eventService.emit({
          type: "purchaseOrder.created",
          context: { companyId: "company-1" },
          data: {
            code: "PC001",
            supplierName: "Fornecedor ABC",
            orderId: "order-1",
            totalValue: 5000,
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "info",
            title: "Pedido de Compra Criado",
          })
        );
      });

      it("should handle purchaseOrder.approved event", async () => {
        await eventService.emit({
          type: "purchaseOrder.approved",
          context: { companyId: "company-1" },
          data: { code: "PC001", orderId: "order-1" },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "success",
            title: "Pedido de Compra Aprovado",
          })
        );
      });
    });

    describe("Requisition events", () => {
      it("should handle requisition.created event", async () => {
        await eventService.emit({
          type: "requisition.created",
          context: { companyId: "company-1" },
          data: { code: 123, requesterName: "João Silva" },
        });

        expect(notifications.requisitionPending).toHaveBeenCalled();
      });

      it("should handle requisition.approved event", async () => {
        await eventService.emit({
          type: "requisition.approved",
          context: { companyId: "company-1" },
          data: {
            code: 123,
            requesterId: "user-1",
            requisitionId: "req-1",
          },
        });

        expect(notificationService.notifyUser).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: "user-1",
            type: "success",
            title: "Requisição Aprovada",
          })
        );
      });

      it("should handle requisition.rejected event", async () => {
        await eventService.emit({
          type: "requisition.rejected",
          context: { companyId: "company-1" },
          data: {
            code: 123,
            requesterId: "user-1",
            requisitionId: "req-1",
            reason: "Sem orçamento",
          },
        });

        expect(notificationService.notifyUser).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "warning",
            title: "Requisição Rejeitada",
          })
        );
      });
    });

    describe("Inventory events", () => {
      it("should handle inventory.lowStock event", async () => {
        await eventService.emit({
          type: "inventory.lowStock",
          context: { companyId: "company-1" },
          data: {
            materialName: "Parafuso M6",
            currentQty: 50,
            minQty: 100,
          },
        });

        expect(notifications.lowStock).toHaveBeenCalledWith(
          "company-1",
          "Parafuso M6",
          50,
          100
        );
      });

      it("should handle inventory.criticalStock event", async () => {
        await eventService.emit({
          type: "inventory.criticalStock",
          context: { companyId: "company-1" },
          data: {
            materialName: "Parafuso M6",
            currentQty: 10,
            minQty: 100,
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            title: "Estoque Crítico!",
          })
        );
      });
    });

    describe("Payable events", () => {
      it("should handle payable.created event", async () => {
        await eventService.emit({
          type: "payable.created",
          context: { companyId: "company-1" },
          data: {
            supplierName: "Fornecedor ABC",
            value: 1500,
            dueDate: "2026-02-01",
            payableId: "pay-1",
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "info",
            title: "Novo Título a Pagar",
          })
        );
      });

      it("should handle payable.dueSoon event", async () => {
        await eventService.emit({
          type: "payable.dueSoon",
          context: { userId: "user-1" },
          data: {
            supplierName: "Fornecedor ABC",
            value: 1500,
            dueDate: "2026-02-01",
          },
        });

        expect(notifications.payableDue).toHaveBeenCalled();
      });

      it("should handle payable.overdue event", async () => {
        await eventService.emit({
          type: "payable.overdue",
          context: { companyId: "company-1" },
          data: {
            supplierName: "Fornecedor ABC",
            value: 1500,
            dueDate: "2026-01-20",
            payableId: "pay-1",
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            title: "Título Vencido!",
          })
        );
      });

      it("should handle payable.paid event", async () => {
        await eventService.emit({
          type: "payable.paid",
          context: { companyId: "company-1" },
          data: {
            supplierName: "Fornecedor ABC",
            value: 1500,
            payableId: "pay-1",
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "success",
            title: "Título Pago",
          })
        );
      });
    });

    describe("Receivable events", () => {
      it("should handle receivable.created event", async () => {
        await eventService.emit({
          type: "receivable.created",
          context: { companyId: "company-1" },
          data: {
            customerName: "Cliente XYZ",
            value: 2000,
            dueDate: "2026-02-15",
            receivableId: "rec-1",
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "info",
            title: "Novo Título a Receber",
          })
        );
      });

      it("should handle receivable.received event", async () => {
        await eventService.emit({
          type: "receivable.received",
          context: { companyId: "company-1" },
          data: {
            customerName: "Cliente XYZ",
            value: 2000,
            receivableId: "rec-1",
          },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "success",
            title: "Pagamento Recebido",
          })
        );
      });
    });

    describe("User events", () => {
      it("should handle user.created event", async () => {
        await eventService.emit({
          type: "user.created",
          context: { companyId: "company-1" },
          data: { userName: "Maria Santos" },
        });

        expect(notifications.newUser).toHaveBeenCalledWith(
          "company-1",
          "Maria Santos"
        );
      });

      it("should handle user.invited event", async () => {
        await eventService.emit({
          type: "user.invited",
          context: { companyId: "company-1" },
          data: { email: "novo@empresa.com" },
        });

        expect(notificationService.notifyCompany).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "info",
            title: "Convite Enviado",
          })
        );
      });
    });

    describe("System events", () => {
      it("should handle system.error event", async () => {
        await eventService.emit({
          type: "system.error",
          context: {},
          data: {
            title: "Erro Crítico",
            message: "Falha na conexão",
            errorCode: "ERR500",
          },
        });

        expect(notifications.systemError).toHaveBeenCalledWith(
          "Erro Crítico",
          "Falha na conexão",
          "ERR500"
        );
      });
    });

    describe("Edge cases", () => {
      it("should not throw on missing userId for nfe.received", async () => {
        await expect(
          eventService.emit({
            type: "nfe.received",
            context: { companyId: "company-1" },
            data: { nfeNumber: "12345", supplierName: "Fornecedor ABC" },
          })
        ).resolves.not.toThrow();

        expect(notifications.nfeReceived).not.toHaveBeenCalled();
      });

      it("should not throw on missing companyId for company events", async () => {
        await expect(
          eventService.emit({
            type: "nfe.approved",
            context: { userId: "user-1" },
            data: { nfeNumber: "12345", supplierName: "Fornecedor ABC" },
          })
        ).resolves.not.toThrow();

        expect(notificationService.notifyCompany).not.toHaveBeenCalled();
      });

      it("should handle unknown event type gracefully", async () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        await expect(
          eventService.emit({
            type: "unknown.event" as never,
            context: {},
            data: {},
          })
        ).resolves.not.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Unknown event type")
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe("emitEvent convenience function", () => {
    it("should call eventService.emit", async () => {
      await emitEvent(
        "user.created",
        { companyId: "company-1" },
        { userName: "Test User" }
      );

      expect(notifications.newUser).toHaveBeenCalled();
    });
  });
});
