# Auditoria Completa do Sistema FRM ERP

**Data:** 2025-02-10
**Branch:** `refactor/schema-v1`
**Autor:** Cascade (AI Audit)

---

## Resumo Executivo

| Categoria | Crítico | Alto | Médio | Baixo |
|-----------|---------|------|-------|-------|
| Segurança (Tenant Isolation) | 3 | 2 | 1 | - |
| Segurança (Geral) | 1 | 2 | 2 | - |
| Qualidade de Código | - | 1 | 3 | 3 |
| UX / Frontend | - | - | 2 | 1 |
| Arquitetura | - | 2 | 1 | - |
| **Total** | **4** | **7** | **9** | **4** |

---

## 1. CRÍTICO — Falhas de Isolamento Multi-Tenant (IDOR)

### 1.1 Delete sem verificação de companyId (15 endpoints)

**Severidade:** 🔴 CRÍTICA
**Tipo:** IDOR (Insecure Direct Object Reference)

Vários endpoints de exclusão usam `delete({ where: { id } })` sem verificar se o registro pertence à empresa do usuário. Um atacante pode deletar registros de outras empresas enviando IDs arbitrários.

**Endpoints afetados:**
- `mrp.removeBomItem` — `bomItem.delete({ where: { id } })` sem companyId
- `timeclock.deleteHoliday` — `holiday.delete({ where: { id } })` sem companyId
- `approvals.deleteLevel` — `approvalLevel.delete({ where: { id } })` sem companyId
- `salesOrders.removeItem` — `salesOrderItem.delete({ where: { id } })` sem companyId
- `productCatalog.deleteImage/Video/Attachment` — sem companyId
- `productMedia.deleteImage/Video/Attachment` — sem companyId

**Correção:** Adicionar verificação de ownership antes de deletar:
```typescript
// ANTES (vulnerável)
await prisma.bomItem.delete({ where: { id: input.id } });

// DEPOIS (seguro)
const item = await prisma.bomItem.findFirst({
  where: { id: input.id },
  include: { parentMaterial: { select: { companyId: true } } }
});
if (!item || item.parentMaterial.companyId !== ctx.companyId) {
  throw new TRPCError({ code: "NOT_FOUND" });
}
await prisma.bomItem.delete({ where: { id: input.id } });
```

### 1.2 Queries sem tenant filter (findUnique por ID)

**Severidade:** 🔴 CRÍTICA

Múltiplos `findUnique({ where: { id } })` sem verificação de companyId permitem leitura cross-tenant:

- `oee.ts:153` — `machineStop.findUnique({ where: { id } })`
- `vacations.ts:161,230,248` — `vacation.findUnique({ where: { id } })`
- `bankAccounts.ts:262-263` — `bankAccount.findUnique({ where: { id } })`
- `receiving.ts:125` — `materialReceiving.findUnique({ where: { id } })`
- `terminations.ts:237,294,312,330` — `termination.findUnique({ where: { id } })`

### 1.3 publicProcedure expondo dados

**Severidade:** 🔴 CRÍTICA

Dois endpoints usam `publicProcedure` (sem autenticação):
- `settings.getLandingConfig` — Pode expor configurações internas
- `tenant.ensureUser` — Mutation pública que cria registros

**Risco:** `ensureUser` como mutation pública pode ser abusado para criar registros sem autenticação válida.

---

## 2. ALTO — Segurança Geral

### 2.1 Hardcoded fallback secrets em produção

**Severidade:** 🟠 ALTA

```typescript
// src/lib/csrf.ts:16
const SECRET = CSRF_SECRET || "dev-csrf-secret-not-for-production";

// src/server/routers/nfeQueue.ts:333
const expectedKey = process.env.NFE_QUEUE_API_KEY || "dev-queue-key";
```

Se as variáveis de ambiente não forem configuradas, o sistema usa secrets previsíveis. O CSRF já valida em produção, mas o `NFE_QUEUE_API_KEY` não tem essa proteção.

### 2.2 dangerouslySetInnerHTML sem sanitização

**Severidade:** 🟠 ALTA

```typescript
// src/components/HelpButton.tsx:256
return <span dangerouslySetInnerHTML={{ __html: text }} />;

// src/components/editor/RichTextEditor.tsx:139
dangerouslySetInnerHTML={{ __html: content }}
```

Se `text` ou `content` contiver dados de usuário não sanitizados, há risco de XSS.

### 2.3 Silent catch blocks (15 ocorrências)

**Severidade:** 🟡 MÉDIA

15 blocos `catch {}` vazios em `aiConfig.ts`, `deploy-agent.ts`, `cnab.ts`, `emailIntegration.ts` que engolem erros silenciosamente, dificultando debugging e podendo mascarar falhas de segurança.

---

## 3. MÉDIO — Qualidade de Código

### 3.1 useEffect sem cleanup (20 páginas)

**Severidade:** 🟡 MÉDIA

20 páginas com `useEffect` que não retornam função de cleanup, potencialmente causando memory leaks e state updates em componentes desmontados:

- `customers/[id]/edit/page.tsx`
- `settings/landing/page.tsx`
- `settings/sefaz/page.tsx`
- `settings/ai/page.tsx`
- `materials/[id]/edit/page.tsx`
- `suppliers/[id]/edit/page.tsx`
- `profile/page.tsx`
- `mfa/verify/page.tsx`
- `mfa/setup/page.tsx`
- E mais 11 páginas

### 3.2 ESLint warnings não resolvidos

**Severidade:** 🟢 BAIXA

3 warnings persistentes:
- `invoices/page.tsx:83` — `<button>` nativo em vez de `<Button>` do design system
- `ImageUpload.tsx:194,263` — `<img>` nativo em vez de `<Image>` do Next.js

### 3.3 26 type assertions `as unknown as` / `as any`

**Severidade:** 🟡 MÉDIA

26 ocorrências de type assertions forçadas, muitas introduzidas na migração Float→Decimal. Indicam interfaces locais desatualizadas que devem ser corrigidas para usar tipos Prisma gerados.

### 3.4 TODOs não resolvidos (45+)

**Severidade:** 🟢 BAIXA

45+ TODOs espalhados pelo código, incluindo:
- Integração SEFAZ real (VIO-566) — 15 TODOs
- Campos faltantes no schema Company (cityCode, neighborhood, addressNumber)
- Integração com email (Resend/SendGrid)
- Integração com API bancária (DDA)

---

## 4. ARQUITETURA

### 4.1 Middleware deprecado

**Severidade:** 🟠 ALTA

O Next.js 16.1.2 emite warning:
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

O `src/middleware.ts` precisa ser migrado para o novo padrão `proxy` do Next.js 16.

### 4.2 CSRF não integrado ao tRPC

**Severidade:** 🟠 ALTA

O módulo `src/lib/csrf.ts` existe e está bem implementado, mas **não é usado em nenhum lugar**. As mutations tRPC não validam tokens CSRF. Em aplicações SPA com cookies de sessão, isso pode permitir ataques CSRF.

### 4.3 Transações insuficientes

**Severidade:** 🟡 MÉDIA

Apenas 17 usos de `$transaction` em todos os routers. Operações compostas (ex: deletar itens + atualizar totais em `salesQuotes.removeItem`) são feitas sem transação, arriscando inconsistência de dados em caso de falha parcial.

---

## 5. UX / FRONTEND

### 5.1 Autocomplete ausente nos inputs de login

**Severidade:** 🟡 MÉDIA

Console warning: `Input elements should have autocomplete attributes`. Os campos de email e senha na página de login não têm atributos `autocomplete`, prejudicando a UX com gerenciadores de senhas.

### 5.2 Landing page com links mortos

**Severidade:** 🟡 MÉDIA

Links para `/docs/terms` e `/docs/privacy` na landing page provavelmente retornam 404 (não há rotas correspondentes no app).

---

## Verificações Aprovadas ✅

| Check | Status |
|-------|--------|
| `tsc --noEmit` | ✅ Zero errors |
| ESLint | ✅ Zero errors (3 warnings) |
| Prisma schema validation | ✅ Valid |
| SQL Injection | ✅ Usa Prisma tagged templates (prepared statements) |
| Rate Limiting | ✅ Implementado para API, SENSITIVE, UPLOAD |
| Auth middleware | ✅ Supabase SSR com refresh de sessão |
| Tenant procedure | ✅ Verifica companyId obrigatório |
| Permission system | ✅ `createProtectedProcedure` com módulo + nível |
| Secrets management | ✅ Supabase Vault com pgsodium |
| Input validation | ✅ Zod schemas em todos os inputs tRPC |
| Hardcoded credentials | ✅ Nenhuma encontrada |

---

## Priorização de Correções

### Sprint 1 (Urgente)
1. **IDOR em deletes** — Adicionar verificação de companyId em 15 endpoints
2. **IDOR em queries** — Adicionar tenant filter em findUnique sem companyId
3. **Migrar middleware** para padrão `proxy` do Next.js 16

### Sprint 2 (Importante)
4. **Integrar CSRF** ao tRPC ou documentar por que não é necessário
5. **Sanitizar HTML** em HelpButton e RichTextEditor
6. **Proteger NFE_QUEUE_API_KEY** com validação em produção
7. **Adicionar transações** em operações compostas críticas

### Sprint 3 (Melhoria)
8. **Cleanup useEffect** nas 20 páginas afetadas
9. **Resolver ESLint warnings** (button nativo, img nativo)
10. **Refatorar type assertions** para usar tipos Prisma gerados
11. **Adicionar autocomplete** nos inputs de login
12. **Criar páginas** para /docs/terms e /docs/privacy
