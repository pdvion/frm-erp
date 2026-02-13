# Code Review Inventory — PRs #44–54

## Legenda de Severidade
- 🔴 Critical — Bugs de segurança, perda de dados, IDOR
- 🟠 Major — Race conditions, falta de transação, bugs lógicos
- 🟡 Minor — Código morto, índices duplicados, nitpicks
- 🔵 Info — Sugestões de refactor, documentação

---

## PR #44 — WorkCenter FK + Inventory triggers (VIO-1046)

### 🟠 Major
1. **ProductionOrderOperation sem companyId** — Enfraquece isolamento multi-tenant. WorkCenter de outra empresa pode ser referenciado.
   - Arquivo: `prisma/schema.prisma` (ProductionOrderOperation)
   - Fix: Adicionar companyId + FK composta com WorkCenter
   - **DECISÃO: DEFER** — Requer migration, será tratado em VIO-1066 RLS

### 🟡 Minor
2. **availableQty explícito sobrescrito pelo trigger** — Código morto em production.ts
   - Arquivo: `src/server/routers/production.ts` linhas 468-476, 563-571
   - Fix: Remover increment/decrement de availableQty, adicionar comentário sobre trigger

---

## PR #45 — RLS + Audit (VIO-1066)

### 🔴 Critical
3. **Bug: OR do usuário sobrescrito pelo filtro de tenant** — `{ ...args.where, ...filter }` sobrescreve chave OR existente
   - Arquivo: `src/lib/prisma-rls.ts` linhas 176-182
   - Fix: Usar AND para compor filtros: `{ AND: [args.where || {}, filter] }`
   - Afeta: findMany, findFirst, count, aggregate, groupBy, update, updateMany, delete, deleteMany, upsert

### 🟠 Major
4. **Operações de escrita permitem mutação de registros com companyId: null**
   - Arquivo: `src/lib/prisma-rls.ts` linhas 132-151
   - Fix: Filtro separado para escrita que exclua `{ companyId: null }`

5. **$transaction não carrega extensões RLS/Audit** — salesQuotes.ts createFromLead
   - Fix: Adicionar companyId explícito em WHERE dentro de transações

6. **ipAddress/requestPath handling** — x-forwarded-for pode ter lista, x-trpc-source não é path
   - Arquivo: `src/server/trpc.ts` linhas 199-201

### 🟡 Minor
7. **Feature flag case-insensitive** — `process.env.ENABLE_PRISMA_RLS !== "false"` não trata capitalização
   - Fix: `.toLowerCase() !== "false"`

8. **Hardcoded 10ms timeout em testes de audit** — Pode causar flaky tests
   - Arquivo: `src/lib/prisma-audit.test.ts` linha 123

9. **tenantFilter() redundante com RLS** — Double filtering em production.ts
   - Nota: Esperado ser limpo em VIO-1072

10. **findUnique post-query vazamento em includes** — Registro já lido antes da verificação
    - Documentar que proteção primária deve ser RLS do Supabase

11. **Código morto unitCost fallback** — production.ts linha 444-446
    - Fix: Simplificar para `totalMaterialCost / newProducedQty`

---

## PR #46 — Schema Modularization (VIO-1065)

### 🔴 Critical
12. **IDOR em onboarding.ts** — Usa input.companyId ao invés de ctx.companyId
    - Fix: Trocar para ctx.companyId em getStatus, start, updateStep, complete

13. **authLogs.ts sem controle de acesso** — Qualquer usuário pode ver todos os logs de auth
    - Fix: Adicionar verificação de permissão SETTINGS.FULL + filtrar por tenant

### 🟠 Major
14. **Bug: filtros startDate/endDate se sobrescrevem** — supplierReturns.ts, systemLogs.ts
    - Fix: Combinar em objeto único `{ gte, lte }`

15. **TOCTOU em supplierReturns.ts** — Validação de estoque fora da transação
    - Fix: Mover validação para dentro da transação

16. **Race condition nextCode** — supplierReturns.ts, issuedInvoices.ts
    - Fix: Usar sequence do banco ou transação serializable

17. **productionCosts.ts delete+create sem transação** — Risco de perda de dados
    - Fix: Envolver em $transaction

18. **issuedInvoices.ts parcelas sem transação** — Promise.all sem $transaction
    - Fix: Usar ctx.prisma.$transaction([...])

19. **issuedInvoices.ts authorize sem transação** — NF + pedido atualizados separadamente

20. **importBatch não vincula materiais** — nfe.ts, diferente do import single

### 🟡 Minor
21. **Índices duplicados** — Múltiplos arquivos schema:
    - lead_activities: leadId duplicado
    - leads: assignedTo duplicado
    - TimesheetDay: employeeId duplicado
    - TimeClockEntry: employeeId duplicado
    - MaterialReceivingItem: receivingId, materialId duplicados
    - MaterialReceiving: supplierId duplicado
    - JobPosition: departmentId duplicado

22. **updatedAt sem @updatedAt** — quality.prisma QualityInspection e NonConformity

23. **PII em AuditLog** — userEmail, userName, ipAddress, userAgent
    - Nota: Risco LGPD, considerar anonimização

24. **SystemSetting.key sem unique por empresa**
    - Fix: Adicionar @@unique([key, companyId])

25. **Embedding sem @relation com Company e sem coluna vetorial**

26. **Uso de `any` em productionCosts.ts** — Substituir por tipo inferido

---

## PR #47 — InventoryService (VIO-1073)
(Mesmos issues do PR #46 repetidos pelo CodeRabbit — já catalogados acima)

---

## PR #48 — PayrollService (VIO-1073)

### 🟠 Major
27. **Cast inseguro insalubrityDegree** — payroll.ts linha 397-402
    - Fix: Validar contra array de valores válidos antes do cast

28. **Certificado digital em plaintext** — NfseConfig password/token
    - Nota: Risco de segurança, considerar criptografia

### 🟡 Minor
29. **Divisão por zero mascarada** — productionCosts.ts `|| 1`

---

## PR #49 — TaxCalculationService (VIO-1073)

### 🟡 Minor
30. **Double parsing de XMLs** — deploy-agent.ts analyzeXmlBatch
    - Fix: Retornar parsedNfes do analyzeXmlBatch

31. **`limit: 0` tratado como falsy** — tax-calculation.ts `|| 100` → `?? 100`

32. **TaxCalculationService instanciado em cada endpoint** — Criar uma vez no escopo do módulo

33. **Teste safeParseNFeXmls sem XML válido** — Adicionar fixture

34. **applyConfiguration ainda tem fetch+parse inline** — Refatorar para usar service

---

## PR #50 — InvoiceService (VIO-1073)

### 🟡 Minor
35. **getNextIssuedInvoiceCode sem suporte a transaction client**
36. **Comentários de tenant isolation** — Adicionar em queries com companyId

---

## PR #51 — Contabilidade (VIO-1074)

### 🟠 Major
37. **AccountingEntryItem sem companyId** — Cross-tenant possível
38. **reversalOf/reversedBy sem FK relations** — Sem integridade referencial
39. **seedDefaultChartOfAccounts sem transação** — 40+ creates individuais
40. **postEntry sem transação atômica** — Verificação + update separados
41. **reverseEntry sem transação** — Create reversal + update original separados
42. **updateAccount aceita input vazio** — Prisma error em update sem dados

### 🟡 Minor
43. **z.number() para amount** — Perda de precisão, usar z.string() ou Decimal
44. **ctx.tenant.userId! non-null assertion** — Validar antes
45. **Usar enums Prisma para type/nature** — Strings permitem valores inválidos
46. **Acumulação float em validateDoubleEntry** — Usar Decimal.js
47. **Teste: falta caso estorno inexistente**
48. **Mock com `as never`** — Usar `as unknown as PrismaClient`

---

## PR #52 — Patrimônio (VIO-1075)

### 🟠 Major
49. **TOCTOU em disposeAsset/transferAsset** — Router verifica, service não filtra por tenant
    - Fix: Passar companyId ao service, filtrar lá
50. **createAsset sem transação** — fixedAsset.create + assetMovement.create separados
51. **processMonthlyDepreciation N+1 + sem transação** — Múltiplas queries por ativo
52. **Race condition nextCode** — fixedAsset código sequencial
53. **transferAsset retorna dados stale** — Retorna pre-update asset

### 🟡 Minor
54. **transferAsset sem validação de mudança** — toLocation e toCostCenterId ambos opcionais
55. **getMovements sem paginação** — take: 200 sem cursor
56. **Mock com number ao invés de Decimal** — Não exercita conversão
57. **getSummary carrega todos na memória** — Usar groupBy/aggregate

---

## PR #53 — CRM (VIO-1076)

### 🟠 Major
58. **Cross-tenant em moveOpportunity/winOpportunity/loseOpportunity** — Só passa opportunityId
    - Fix: Passar companyId e filtrar no service
59. **Race condition nextCode** — Opportunity código sequencial
60. **updateScoringRule aceita qualquer string para operator** — Deveria usar z.enum
61. **getForecast aceita strings não validadas como datas**
62. **leadId sem FK relation no schema** — Opportunity.leadId

### 🟡 Minor
63. **Record<string, unknown> perde type safety** — Usar Prisma.OpportunityWhereInput
64. **CrmService instanciado a cada chamada**
65. **Teste getSalesPerformance não valida targetAchievement**
66. **Scoring hardcoded a 7 campos**

---

## PR #54 — Fiscal (VIO-1077)

### 🟠 Major
67. **NfseConfig password/token em plaintext** — Mesmo issue #28
68. **addApurationItem sem verificação de tenant** — Aceita apurationId de outro tenant
69. **cancelNfse sem transação** — Race condition em cancelamentos simultâneos
70. **BlocoKRecord sem FK relations** — materialId e productionOrderId sem @relation

### 🟡 Minor
71. **N+1 em generateObligations** — Uma query por definição
    - Fix: Usar findMany + createMany
72. **generateBlocoKRecords sem transação nem batching** — deleteMany + creates sequenciais
73. **icmsOrigemRate não utilizado em calculateDifal**
74. **NORTH_NORTHEAST_STATES nome impreciso** — Inclui Centro-Oeste e ES
75. **Teste propagação de crédito não cobre cenário null**

---

## RESUMO POR SEVERIDADE

| Severidade | Count | PRs |
|-----------|-------|-----|
| 🔴 Critical | 3 | #45, #46 |
| 🟠 Major | ~30 | #44-54 |
| 🟡 Minor | ~42 | #44-54 |

## PLANO DE ATAQUE

### Fase 1: Critical (3 items)
- #3: RLS OR bug
- #12: IDOR onboarding
- #13: authLogs sem ACL

### Fase 2: Major — Segurança/IDOR (items 4, 5, 58, 68)
### Fase 3: Major — Transações (items 17-19, 39-41, 50-51, 69, 72)
### Fase 4: Major — Race conditions (items 16, 52, 59)
### Fase 5: Major — Bugs lógicos (items 14, 15, 27, 42, 53, 60-61)
### Fase 6: Minor — Schema (items 21-22, 24-25, 37-38, 62, 70)
### Fase 7: Minor — Code quality (restante)
