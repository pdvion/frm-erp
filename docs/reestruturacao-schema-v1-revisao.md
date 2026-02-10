# Reestruturação Schema v1 — Respostas à Revisão Cruzada

> **Data:** 2026-02-10
> **Contexto:** Respostas ponto a ponto à revisão cruzada do `reestruturacao-schema-v1.md`, com dados reais extraídos do codebase e do Linear.

---

## 1. Float → Decimal — Impacto no TypeScript

### 1.1 O que VIO-832 já fez (e o que NÃO fez)

VIO-832 está marcada como **Done**, mas executou apenas a **Fase 1 (Validators Zod)**:

| Entregue | Arquivo | Conteúdo |
|---|---|---|
| ✅ Validators Zod | `src/lib/validators/decimal.ts` | `monetarySchema`, `quantitySchema`, `rateSchema`, `unitPriceSchema` |
| ✅ Helpers | `src/lib/validators/decimal.ts` | `decimalToNumber()`, `formatDecimal()` |
| ✅ Documentação | `FIELDS_TO_MIGRATE` (constante) | Lista parcial de campos a migrar |
| ❌ Migration SQL | — | **NÃO executada** |
| ❌ Alteração schema.prisma | — | **NÃO executada** (todos os campos ainda são `Float`) |
| ❌ Ajustes TypeScript nos routers | — | **NÃO executados** |

**Conclusão:** A Fase 1 do documento **NÃO gera migrations duplicadas**. VIO-832 criou a infraestrutura (validators + helpers), mas a migração real do schema é exatamente o que o documento propõe.

Adicionalmente, VIO-831 criou `src/lib/precision.ts` com `decimal.js` (funções `multiply`, `toMoney`, `toQuantity`, cálculos fiscais). Porém:

```
grep -r "precision\|multiply\|toMoney\|toQuantity" src/server/routers/ → 0 resultados
```

**Nenhum router adota `precision.ts` hoje.** As ferramentas existem mas não foram integradas.

### 1.2 Scan de impacto TypeScript — Dados reais

**Cálculos aritméticos diretos com campos Float (padrão `item.quantity * item.unitPrice`):**

| Métrica | Valor |
|---|---|
| Ocorrências de `* price/cost/value/quantity/rate` | **132 matches em 35 arquivos** |
| Ocorrências de `Number()` / `parseFloat()` em `src/server/` | **1.547 matches em 141 arquivos** |
| Routers com cálculos aritméticos diretos | **35 routers** (de 81) |

**Top 10 routers por impacto:**

| Router | Cálculos | Tipo |
|---|---|---|
| `dashboard.ts` | 25 | Raw SQL com `SUM(quantity * unitCost)` |
| `groups.ts` | 14 | Permissões (não monetário — falso positivo) |
| `impex.ts` | 6 | `quantity * unitPrice` |
| `productionCosts.ts` | 6 | Custos de produção |
| `payroll.ts` | 5 | Cálculos de folha |
| `salesOrders.ts` | 5 | `quantity * unitPrice * (1 - discount/100)` |
| `salesQuotes.ts` | 5 | Idem |
| `reports.ts` | 4 | Relatórios com somas |
| `supplierReturns.ts` | 4 | `quantity * unitPrice` |
| `billing.ts` | 2 | `qty * unitPrice * (1 - discount/100)` |

**Exemplos concretos que quebram com Decimal:**

```typescript
// salesOrders.ts:146 — QUEBRA com Prisma.Decimal
const itemTotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);

// dashboard.ts:147 — Raw SQL, NÃO quebra (cálculo no PostgreSQL)
SELECT COALESCE(SUM(i.quantity * i."unitCost"), 0) as total

// purchaseOrders.ts:224 — QUEBRA
totalPrice: item.unitPrice * item.quantity,
```

### 1.3 Resposta direta

> A estimativa de 2-3 dias contempla os ajustes de TypeScript?

**Não.** A estimativa original era só migration SQL + schema Prisma. O impacto real inclui:

1. **Migration SQL** — ~320 ALTER COLUMN (automático, ~2h)
2. **Schema Prisma** — ~320 campos Float→Decimal (automático, ~2h)
3. **TypeScript routers** — 132 cálculos aritméticos em 35 routers que precisam migrar para `precision.ts` ou `Decimal` nativo (~8-12h)
4. **TypeScript testes** — ~80 testes com valores Float que precisam adaptar (~4h)
5. **Frontend** — Serialização JSON de `Prisma.Decimal` retorna string, não number. Todos os componentes que exibem valores precisam de `decimalToNumber()` (~4-6h)
6. **Raw SQL queries** — 8+ queries no dashboard.ts com `::float` cast que precisam revisão (~2h)

**Estimativa revisada Fase 1: 4-5 dias (22-28h de trabalho IA)**

---

## 2. companyId NOT NULL — Correções

### 2.1 Resolução dos 7 models "AVALIAR"

| Model | Decisão | Justificativa |
|---|---|---|
| **Training** | **→ NOT NULL** | Treinamento é sempre pago por uma empresa. Não há cenário corporativo cross-empresa no Grupo FRM. |
| **TransportVoucher** | **→ NOT NULL** | VT é obrigação do empregador (CLT). Cada empresa paga o VT dos seus funcionários. |
| **WorkCenter** | **→ NOT NULL** | Cada planta FRM tem seus próprios centros de trabalho. Não há compartilhamento entre fábricas. |
| **WorkSchedule** | **→ NOT NULL** | Escalas são regidas por acordo coletivo por empresa/sindicato. |
| **TimeClockAdjustment** | **→ NOT NULL** | Para RLS funcionar, precisa de companyId direto na tabela. Herdar do Employee não é suficiente para filtro SQL. |
| **User** | MANTER NULL | Admin global sem empresa fixa. Correto. |
| **UserGroup** | MANTER NULL | Grupos cross-tenant para admin. Correto. |

**Resultado: +5 models → 51 NOT NULL**

### 2.2 Termination, ThirteenthSalary e Vacation — CONCORDO com a revisão

A revisão está **100% correta**. Evidências:

1. **VIO-768** (CRÍTICO): Vulnerabilidade multi-tenant em `vacations.ts` — mutations sem filtro de companyId
2. **VIO-769** (CRÍTICO): `getById` sem filtro de tenant em `vacations.ts` e `terminations.ts`

Ambas foram corrigidas adicionando `companyId: ctx.companyId` no WHERE, **confirmando que essas tabelas JÁ usam companyId para filtro**. Mas o campo ainda é `String?` (nullable) no schema:

```prisma
// schema.prisma — ATUAL
model Vacation {
  companyId  String?  @db.Uuid  // ← nullable, mas usado como filtro obrigatório
}
model ThirteenthSalary {
  companyId  String?  @db.Uuid  // ← idem
}
model Termination {
  companyId  String?  @db.Uuid  // ← idem
}
```

**Para RLS funcionar (seja via Prisma Extension ou PostgreSQL):**
- `WHERE company_id = X` com `company_id IS NULL` → registro **invisível** para todos
- Denormalizar companyId como NOT NULL é **obrigatório**, mesmo que pareça redundante com Employee

**Resultado: +3 models → 54 NOT NULL total**

### 2.3 Totais corrigidos

| Categoria | Qtd original | Qtd corrigida |
|---|---|---|
| → NOT NULL | 46 | **54** |
| MANTER NULL | 14 | **12** (removidos Vacation, Termination, ThirteenthSalary) |
| AVALIAR | 7 | **0** (todos resolvidos) |

---

## 3. Models Novos — Priorização Revisada

### 3.1 Models a ADIAR (concordo com a revisão)

| Model | Motivo para adiar | Quando criar |
|---|---|---|
| **CompanyGroup** | Nenhuma issue no Linear. `Company` já funciona. | Quando houver demanda de consolidação de grupo |
| **CompanyGroupMember** | Idem | Idem |
| **BillingPlan** | SaaS é roadmap futuro. Zero issues no Linear. | Quando iniciar monetização |
| **BillingSubscription** | Idem | Idem |
| **ProductionRouting** | Sem issue demandando. `ProductionOrderOperation` funciona. | Quando implementar roteiro padrão |
| **CfopTable / NcmTable** | Tabelas de referência estática. Mudar para FK impacta todas as telas fiscais. | Quando implementar cálculo tributário nativo |

**6 models adiados → 10 models novos (era 16)**

### 3.2 Models que ficam

| Model | Justificativa imediata |
|---|---|
| EmployeeDependent | eSocial S-2200 (20+ issues VIO-925 a VIO-946) |
| LeaveRecord | eSocial S-2230 |
| IncomeTaxTable | Cálculo de folha (hoje é hardcode) |
| INSSTable | Cálculo de folha (hoje é hardcode) |
| Lot | Rastreabilidade industrial — gap crítico identificado na análise |
| LotMovement | Complemento do Lot |
| TaxRegime | Regime tributário por empresa — necessário para cálculo correto |
| IntercompanyTransfer | Transferência entre as 7 empresas do grupo — operação real |
| IntercompanyTransferItem | Complemento |

**Nota:** `IntercompanyTransfer` referencia `sourceCompanyId` e `targetCompanyId` direto na tabela `Company`, sem necessidade de `CompanyGroup`.

### 3.3 eSocial — Staging/Importação

A revisão levanta um ponto válido. Os parsers de eSocial (S-1010, S-1200, S-2200, etc.) precisam de validação antes de persistir.

**Proposta:** Não criar models de staging separados. Usar o padrão:

1. Parser recebe XML → valida contra schema Zod
2. Se válido → persiste nos models definitivos
3. Se inválido → registra erro em `SystemLog` com payload original

Isso evita duplicação de models e é consistente com o padrão já usado na importação de NF-e (`ReceivedInvoice` com status `PENDING` → `VALIDATED` → `CONFIRMED`).

Se no futuro a complexidade exigir staging, criamos um model `ESocialEvent` genérico com `payload Json` e `status`.

---

## 4. Modularização — Ordem de Execução Revisada

**Concordo com a revisão.** Modularizar antes das Fases 1-2 cria problemas:

1. Alterar 320 campos espalhados em 16 arquivos `.prisma` é mais propenso a erro que em 1 arquivo
2. Conflitos de merge entre branch de modularização e branch de tipos
3. O Windsurf trabalha melhor com find/replace em arquivo único

**Nova ordem:**

| Fase | Antes | Depois |
|---|---|---|
| 0 | Modularização | **Backup + branch** (sem modularização) |
| 1 | Float → Decimal | Float → Decimal (no monólito) |
| 2 | companyId NOT NULL | companyId NOT NULL (no monólito) |
| 3 | Correções estruturais | Correções estruturais (no monólito) |
| 4 | Models novos | Models novos (no monólito) |
| **5** | **RLS** | **Modularização** (schema + routers) |
| 6 | Auditoria | Integração Prisma Extension RLS |
| 7 | — | Auditoria automática |

A modularização passa para **depois** de todas as alterações de schema, quando o monólito já está estável.

---

## 5. RLS — Revisão Completa

### 5.1 O que já existe (VIO-827/828)

Já existe uma implementação funcional em `src/lib/prisma-rls.ts`:

```typescript
// Prisma Extension (NÃO $use deprecated)
export function createTenantPrisma(prisma: PrismaClient, companyId: string | null) {
  return prisma.$extends({
    name: "tenant-rls",
    query: {
      $allModels: {
        async findMany({ model, args, query }) { /* filtra por companyId */ },
        async create({ model, args, query }) { /* injeta companyId */ },
        // ... todos os 12 métodos CRUD interceptados
      },
    },
  });
}
```

**Cobertura:** 36 models com filtro automático + 6 models com suporte a `isShared`.

**Problema:** A extensão é **opt-in** e **nenhum router a utiliza hoje:**

```
grep -r "createTenantPrisma" src/server/routers/ → 0 resultados
```

### 5.2 SET LOCAL + PgBouncer — Problema real

A revisão está correta. No Supabase com PgBouncer em modo `transaction`:

- `SET LOCAL` só persiste dentro de uma transaction explícita (`BEGIN...COMMIT`)
- Um `findMany` simples fora de `$transaction` **não mantém** a variável de sessão
- Envolver toda operação em transaction tem impacto de performance

**Conclusão: A proposta de SET LOCAL no documento está INCORRETA para o setup Supabase.**

### 5.3 Decisão: Adotar Prisma Extension, adiar PostgreSQL RLS

| Abordagem | Prós | Contras |
|---|---|---|
| **PostgreSQL RLS** (SET LOCAL) | Proteção no banco | Incompatível com PgBouncer transaction mode; complexo de testar |
| **Prisma Extension** (VIO-827) | Já implementado; funciona com PgBouncer; type-safe | Proteção na aplicação, não no banco |
| **tenantProcedure** (atual) | Simples; funciona | Manual; fácil esquecer |

**Decisão:**

1. **Agora:** Integrar `createTenantPrisma` no `tenantProcedure` automaticamente (não opt-in)
2. **Agora:** Expandir `TENANT_MODELS` de 36 para 54 models (alinhado com Seção 2)
3. **Adiar:** PostgreSQL RLS para quando/se migrar para connection pooling com suporte a session variables (Supavisor modo session)

Isso resolve o cenário de "desenvolvedor esquecendo de filtrar" sem a complexidade de RLS no banco.

### 5.4 Custo vs benefício — concordo parcialmente

Para 7 empresas, o `tenantProcedure` + Prisma Extension é suficiente. PostgreSQL RLS é over-engineering neste momento.

**Mas** a integração automática da Prisma Extension (que já existe!) no `tenantProcedure` é low-cost e high-value — elimina a classe inteira de bugs tipo VIO-768/769.

---

## 6. Auditoria — Prisma 7.2.0, $use() deprecated

### 6.1 Versão do Prisma

```json
// package.json
"prisma": "^7.2.0",
"@prisma/client": "^7.2.0"
```

**Prisma 7.2.0** — `$use()` está deprecated desde o Prisma 5.0. O código da Seção 7 do documento **precisa ser reescrito**.

### 6.2 Código corrigido

A auditoria deve usar `$extends` com hook `query`, exatamente como `prisma-rls.ts` já faz:

```typescript
// src/lib/prisma-audit.ts
export function createAuditPrisma(prisma: PrismaClient, context: AuditContext) {
  return prisma.$extends({
    name: "audit-middleware",
    query: {
      $allModels: {
        async create({ model, args, query }) {
          if (!AUDITED_MODELS.has(model)) return query(args);
          const result = await query(args);
          await logAudit("CREATE", model, null, result, context);
          return result;
        },
        async update({ model, args, query }) {
          if (!AUDITED_MODELS.has(model)) return query(args);
          // Capturar estado anterior
          const old = await prisma[model as any].findUnique({ where: args.where });
          const result = await query(args);
          await logAudit("UPDATE", model, old, result, context);
          return result;
        },
        async delete({ model, args, query }) {
          if (!AUDITED_MODELS.has(model)) return query(args);
          const old = await prisma[model as any].findUnique({ where: args.where });
          const result = await query(args);
          await logAudit("DELETE", model, old, null, context);
          return result;
        },
      },
    },
  });
}
```

### 6.3 Composição com RLS Extension

Prisma Extensions são composíveis:

```typescript
// No tenantProcedure:
const tenantPrisma = createTenantPrisma(prisma, companyId);
const auditedPrisma = createAuditPrisma(tenantPrisma, { userId, companyId });
// auditedPrisma tem RLS + auditoria automática
```

---

## 7. Dependências Cruzadas — Confirmação

### 7.1 Leitura corrigida

| Issue(s) | Bloqueio | Fase que desbloqueia | Status da issue |
|---|---|---|---|
| VIO-925 a VIO-946 (eSocial) | Faltam EmployeeDependent, LeaveRecord, tabelas IR/INSS | Fase 4 (Models novos) | Backlog |
| VIO-832 (Decimal types) | **Só Fase 1 (validators) foi feita.** Schema migration pendente | Fase 1 | Done (parcial) |
| VIO-831 (Robustez Industrial) | `precision.ts` criado mas **0 routers adotam**. WorkCenter String→FK pendente | Fase 1 (adoção) + Fase 3 (FK) | Done (parcial) |
| VIO-833 (Inventory locking) | **Já implementado** (optimistic locking com campo `version`). Triggers de Seção 4.4 são complementares | Fase 3 (complementar) | Done ✅ |
| VIO-999 (Índices FK) | **Já implementado** (5 FK indexes). Índices compostos da Seção 4.5 são **diferentes** (companyId + campo) | Fase 3 (complementar) | Done ✅ |

**Correção importante:** VIO-832 e VIO-831 estão marcadas como "Done" no Linear, mas a execução real foi parcial. A Fase 1 do documento completa o trabalho pendente dessas issues.

### 7.2 SEFAZ — Confirmado

VIO-956 (mTLS via Edge Function) está **Done**. A reestruturação do schema **não impacta nem desbloqueia** as issues de SEFAZ (VIO-958, VIO-923, VIO-596, VIO-376). Essas dependem de:
- Certificado digital A1 (dependência externa)
- Testes em homologação SEFAZ

### 7.3 Prisma Extension RLS (VIO-827)

VIO-827 está "Done" mas a extensão é **opt-in e não adotada**. A Fase 6 revisada (integração automática no `tenantProcedure`) completa essa issue.

---

## 8. Estimativas Revisadas

### Breakdown por fase (horas de trabalho IA/Windsurf)

| Fase | Escopo revisado | Horas | Detalhamento |
|---|---|---|---|
| **0** | Backup + branch (sem modularização) | **1h** | Backup DB + criar branch |
| **1** | Float → Decimal (320 campos) | **24-28h** | Migration SQL (2h) + Schema Prisma (2h) + **35 routers TypeScript (10h)** + **Testes (6h)** + **Frontend serialização (4h)** + Raw SQL casts (2h) |
| **2** | companyId NOT NULL (54 models) | **10-14h** | Script órfãos (1h) + UPDATE defaults (1h) + ALTER NOT NULL (2h) + Schema Prisma (1h) + **Ajustar routers sem companyId (4-6h)** + Testes (2h) |
| **3** | Correções estruturais | **8-10h** | workCenter FK (3h) + legacyId 28 models (2h) + soft delete 15 models (2h) + Triggers Inventory (1h) + Índices compostos (1h) |
| **4** | Models novos (10, não 16) | **4-6h** | Schema + migration + prisma generate |
| **5** | Modularização (schema + routers) | **6-8h** | Dividir schema em 16 arquivos (3h) + Reorganizar routers em pastas (3h) + Validar build (1h) |
| **6** | Integração Prisma Extension RLS | **4-6h** | Integrar createTenantPrisma no tenantProcedure (2h) + Expandir TENANT_MODELS para 54 (1h) + Testes isolamento (2h) |
| **7** | Auditoria automática ($extends) | **4-6h** | Reescrever com $extends (2h) + AsyncLocalStorage (1h) + Campos AuditLog (1h) + Testes (1h) |
| **Total** | | **61-79h** | |

### Conversão para dias calendário

Assumindo ~6h produtivas de trabalho IA por dia:

| Cenário | Dias |
|---|---|
| Otimista (61h) | **10 dias** |
| Realista (70h) | **12 dias** |
| Pessimista (79h) | **14 dias** |

### Comparação com estimativa original

| | Original | Revisado | Delta |
|---|---|---|---|
| Dias | 9-14 | 10-14 | +1 dia mínimo |
| Fases | 7 | 8 | +1 (modularização separada) |
| Models NOT NULL | 46 | 54 | +8 |
| Models novos | 16 | 10 | -6 (adiados) |
| RLS | PostgreSQL SET LOCAL | Prisma Extension | Simplificado |
| Auditoria | $use() deprecated | $extends() | Corrigido |

**O range total (10-14 dias) é similar, mas a composição mudou significativamente.** A Fase 1 (Float→Decimal) é a mais pesada por causa do impacto TypeScript, que não estava contabilizado.

---

## Resumo de Alterações no Documento

| Seção | Alteração necessária |
|---|---|
| 1 | Adicionar sub-seção de impacto TypeScript (35 routers, 132 cálculos) + mandatar adoção de `precision.ts` |
| 2 | Mover 5 "AVALIAR" + 3 "Vacation/Term/13th" para NOT NULL → **54 total** |
| 3 | Remover 6 models adiados. Adicionar nota sobre staging eSocial. **10 models** |
| 4 | Notar que VIO-833 (locking) e VIO-999 (FK indexes) já foram feitos. Seção 4.4/4.5 são complementares |
| 5 | **Mover para Fase 5** (após correções, antes de RLS) |
| 6 | **Substituir SET LOCAL por Prisma Extension** (VIO-827). Adiar PostgreSQL RLS |
| 7 | **Reescrever com `$extends`** em vez de `$use()`. Compor com RLS Extension |
| 8 | Reordenar fases. Atualizar estimativas |

> **Próximo passo:** Após sua aprovação destas respostas, atualizo o `reestruturacao-schema-v1.md` com todas as correções.
