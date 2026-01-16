import { createTRPCRouter } from "../trpc";
import { materialsRouter } from "./materials";
import { suppliersRouter } from "./suppliers";
import { inventoryRouter } from "./inventory";
import { quotesRouter } from "./quotes";
import { tenantRouter } from "./tenant";
import { auditRouter } from "./audit";

export const appRouter = createTRPCRouter({
  tenant: tenantRouter,
  materials: materialsRouter,
  suppliers: suppliersRouter,
  inventory: inventoryRouter,
  quotes: quotesRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
