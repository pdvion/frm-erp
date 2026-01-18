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
import { groupsRouter } from "./groups";
import { settingsRouter } from "./settings";
import { storageRouter } from "./storage";
import { nfeRouter } from "./nfe";
import { payablesRouter } from "./payables";
import { requisitionsRouter } from "./requisitions";
import { productionRouter } from "./production";
import { costCentersRouter } from "./costCenters";
import { bankAccountsRouter } from "./bankAccounts";
import { customersRouter } from "./customers";
import { receivablesRouter } from "./receivables";

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
  groups: groupsRouter,
  settings: settingsRouter,
  storage: storageRouter,
  nfe: nfeRouter,
  payables: payablesRouter,
  requisitions: requisitionsRouter,
  production: productionRouter,
  costCenters: costCentersRouter,
  bankAccounts: bankAccountsRouter,
  customers: customersRouter,
  receivables: receivablesRouter,
});

export type AppRouter = typeof appRouter;
