# Code Review - 23/01/2026

## PR: feat(reports): VIO-595 - Relatórios Salvos por Usuário

### Arquivos Analisados
- `src/server/routers/savedReports.ts`
- `src/server/routers/reports.ts`
- `src/app/treasury/dda/page.tsx`
- `prisma/schema.prisma`
- `.windsurf/workflows/*.md`

---

## 🔴 CRÍTICO

### 1. [SECURITY] Validação de UUID ausente em savedReports.ts
**Arquivo:** `src/server/routers/savedReports.ts:39,50,72,100,110,119`
**Problema:** O campo `id` aceita qualquer string, mas deveria validar UUID.
**Correção:** Usar `z.string().uuid()` em vez de `z.string()`.

### 2. [SECURITY] Race condition em operações de default
**Arquivo:** `src/server/routers/savedReports.ts:56-60,80-84`
**Problema:** A operação de remover default e criar/atualizar não é atômica.
**Correção:** Usar transação Prisma `$transaction`.

---

## 🟠 IMPORTANTE

### 3. [PERFORMANCE] N+1 Query potencial em reports.ts
**Arquivo:** `src/server/routers/reports.ts:337-340`
**Problema:** `purchasesBySupplier` carrega todos os pedidos e depois agrupa em memória.
**Correção:** Usar `groupBy` do Prisma ou agregação no banco.

### 4. [TYPE] Tipo genérico em reports.ts
**Arquivo:** `src/server/routers/reports.ts:333`
**Problema:** `Record<string, unknown>` é muito genérico para `where`.
**Correção:** Usar `Prisma.PurchaseOrderWhereInput`.

### 5. [UX] Botão "Sincronizar" sem funcionalidade em dda/page.tsx
**Arquivo:** `src/app/treasury/dda/page.tsx:111-114`
**Problema:** Botão não tem onClick handler.
**Correção:** Implementar handler ou remover botão.

### 6. [A11Y] Botão "Ver Detalhes" sem funcionalidade
**Arquivo:** `src/app/treasury/dda/page.tsx:325-330`
**Problema:** Botão não faz nada ao clicar.
**Correção:** Implementar navegação ou modal de detalhes.

---

## 🟡 SUGESTÃO

### 7. [STYLE] Linhas muito longas em savedReports.ts
**Arquivo:** `src/server/routers/savedReports.ts:16,31-34,51-52,73-74`
**Problema:** Linhas excedem 120 caracteres, dificultando leitura.
**Correção:** Quebrar em múltiplas linhas.

### 8. [DRY] Código repetido para verificar existência
**Arquivo:** `src/server/routers/savedReports.ts:78,103,113`
**Problema:** Mesmo padrão de findFirst + throw repetido 3 vezes.
**Correção:** Extrair para função helper.

### 9. [TYPE] Cast desnecessário em reports.ts
**Arquivo:** `src/server/routers/reports.ts:335`
**Problema:** Cast `as Record<string, unknown>` pode ser evitado.
**Correção:** Usar spread condicional corretamente.

---

## 🔵 NITPICK

### 10. [NAMING] Nome de variável inconsistente
**Arquivo:** `src/server/routers/reports.ts:342`
**Problema:** `bySupplier` poderia ser `supplierAggregation`.

### 11. [COMMENT] Falta JSDoc nos routers
**Arquivo:** `src/server/routers/savedReports.ts`
**Problema:** Funções públicas sem documentação.

### 12. [IMPORT] Import não utilizado em dda/page.tsx
**Arquivo:** `src/app/treasury/dda/page.tsx:21`
**Problema:** `Plus` é importado mas usado apenas condicionalmente.
**Status:** Aceitável (usado condicionalmente).

---

## Resumo

| Severidade | Quantidade |
|------------|------------|
| 🔴 Crítico | 2 |
| 🟠 Importante | 4 |
| 🟡 Sugestão | 3 |
| 🔵 Nitpick | 3 |

---

## Ações Necessárias

1. ✅ Corrigir validação UUID
2. ✅ Adicionar transações para operações de default
3. ✅ Corrigir tipo genérico em reports.ts
4. ✅ Implementar botão Sincronizar (placeholder)
5. ✅ Implementar botão Ver Detalhes (placeholder)
6. ⏭️ Refatorar código repetido (baixa prioridade)
7. ⏭️ Adicionar JSDoc (baixa prioridade)
