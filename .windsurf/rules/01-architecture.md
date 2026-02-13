---
trigger: always
description: Arquitetura do projeto FRM ERP — Service Layer, módulos, schema modularizado
---

# Arquitetura — FRM ERP

## Service Layer Obrigatório

Lógica de negócio **NUNCA** vai direto no router. Padrão:

```
Router (input/output + validação Zod) → Service (lógica de negócio) → Prisma (dados)
```

### Services existentes (`src/server/services/`):
- `inventory.ts` — movimentações, reservas, estoque
- `payroll.ts` — cálculos INSS/IRRF/DSR/adicionais
- `tax-calculation.ts` — NF-e parsing, regime fiscal
- `invoice.ts` — entrada estoque, preço médio, contas a pagar
- `asset.ts` — depreciação, movimentação de ativos
- `maintenance.ts` — MTBF/MTTR, ordens de serviço, KPIs
- `crm.ts` — pipeline, scoring, forecast
- `esocial.ts` — eventos, lotes, rubricas
- `admission-portal.ts` — token, validação, documentos
- `audit.ts` — auditCreate/auditUpdate/auditDelete

### Quando criar um service:
- Cálculos (impostos, folha, depreciação, KPIs)
- Orquestração de múltiplas entidades (estoque + movimentação + reserva)
- Validações complexas (regras fiscais, workflow de status)
- Lógica reutilizável entre routers

### Quando NÃO criar service:
- CRUD simples (list/byId/create/update/delete sem lógica)
- Queries de leitura pura

```typescript
// ✅ Router chama service
import { InventoryService } from "../services/inventory";

const svc = new InventoryService(ctx.prisma);
const result = await svc.createMovement(companyId, input);

// ❌ Lógica complexa direto no router
.mutation(async ({ ctx, input }) => {
  // 50 linhas de cálculos aqui... NÃO
});
```

## Módulos Não Se Importam Diretamente

Se `invoiceRouter` precisa de dados de estoque, **NÃO** importa de `inventoryRouter`. Usa service.

```typescript
// ❌ ERRADO — acoplamento entre routers
import { inventoryRouter } from "./inventory";

// ✅ CORRETO — via service
import { InventoryService } from "../services/inventory";
```

## Schema Modularizado

O schema está em `prisma/schema/*.prisma` (18 arquivos por domínio):
- `base.prisma` — Company, User, Group, Permission
- `hr.prisma` — Employee, Payroll, Benefits, Admission
- `finance.prisma` — AccountsPayable/Receivable, BankAccount
- `fiscal.prisma` — NFe, ESocial, TaxConfig
- `inventory.prisma` — Material, StockLocation, Movement
- `production.prisma` — ProductionOrder, WorkCenter
- `sales.prisma` — Quote, SalesOrder, Lead, Opportunity
- `purchasing.prisma` — PurchaseOrder, Supplier
- etc.

Ao criar novo model, colocar no arquivo do domínio correto.

## REST API / Webhooks

Quando necessário expor API pública (ex: portal do candidato), criar adaptadores sobre services:

```typescript
// src/app/api/admission/[token]/route.ts
// Usa funções de src/server/services/admission-portal.ts
// NÃO duplica lógica do router
```

## Modular Monolith

Manter monolith (Next.js + tRPC), mas com limites claros entre módulos. Cada módulo tem: schema, router, service (se complexo), páginas.
