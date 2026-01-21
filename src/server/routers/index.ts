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
import { mrpRouter } from "./mrp";
import { oeeRouter } from "./oee";
import { salesRouter } from "./sales";
import { stockLocationsRouter } from "./stockLocations";
import { transfersRouter } from "./transfers";
import { hrRouter } from "./hr";
import { receivingRouter } from "./receiving";
import { emailIntegrationRouter } from "./emailIntegration";
import { companiesRouter } from "./companies";
import { tutorialsRouter } from "./tutorials";
import { notificationsRouter } from "./notifications";
import { systemLogsRouter } from "./systemLogs";
import { tasksRouter } from "./tasks";
import { dashboardRouter } from "./dashboard";
import { sefazRouter } from "./sefaz";
import { billingRouter } from "./billing";
import { bomRouter } from "./bom";
import { cnabRouter } from "./cnab";
import { mesRouter } from "./mes";
import { biRouter } from "./bi";
import { gpdRouter } from "./gpd";
import { budgetRouter } from "./budget";
import { workflowRouter } from "./workflow";
import { pickingRouter } from "./picking";
import { approvalsRouter } from "./approvals";
import { reportsRouter } from "./reports";
import { vacationsRouter } from "./vacations";
import { thirteenthRouter } from "./thirteenth";
import { terminationsRouter } from "./terminations";
import { timeclockRouter } from "./timeclock";

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
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
  mrp: mrpRouter,
  oee: oeeRouter,
  sales: salesRouter,
  stockLocations: stockLocationsRouter,
  transfers: transfersRouter,
  hr: hrRouter,
  receiving: receivingRouter,
  emailIntegration: emailIntegrationRouter,
  companies: companiesRouter,
  tutorials: tutorialsRouter,
  notifications: notificationsRouter,
  systemLogs: systemLogsRouter,
  tasks: tasksRouter,
  sefaz: sefazRouter,
  billing: billingRouter,
  bom: bomRouter,
  cnab: cnabRouter,
  mes: mesRouter,
  bi: biRouter,
  gpd: gpdRouter,
  budget: budgetRouter,
  workflow: workflowRouter,
  picking: pickingRouter,
  approvals: approvalsRouter,
  reports: reportsRouter,
  vacations: vacationsRouter,
  thirteenth: thirteenthRouter,
  terminations: terminationsRouter,
  timeclock: timeclockRouter,
});

export type AppRouter = typeof appRouter;
