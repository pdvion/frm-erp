import { createTRPCRouter } from "../trpc";
import { materialsRouter } from "./materials";
import { suppliersRouter } from "./suppliers";
import { inventoryRouter } from "./inventory";
import { quotesRouter } from "./quotes";
import { purchaseOrdersRouter } from "./purchaseOrders";
import { receivedInvoicesRouter } from "./receivedInvoices";
import { tenantRouter } from "./tenant";
import { auditRouter } from "./audit";
import { authLogsRouter } from "./authLogs";

export const appRouter = createTRPCRouter({
  tenant: tenantRouter,
  materials: materialsRouter,
  suppliers: suppliersRouter,
  inventory: inventoryRouter,
  quotes: quotesRouter,
  purchaseOrders: purchaseOrdersRouter,
  receivedInvoices: receivedInvoicesRouter,
  audit: auditRouter,
  authLogs: authLogsRouter,
});

export type AppRouter = typeof appRouter;
