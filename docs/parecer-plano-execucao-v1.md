# Parecer Técnico — Plano de Execução Schema v1

> **Data:** 2026-02-10
> **Base:** Análise cruzada do plano de execução contra o estado real do codebase (179 models, 76 enums, 81 routers, 74 test files, schema 5.538 linhas)

---

## Veredicto Geral

**O plano é sólido e executável.** Identifico 3 correções factuais, 4 riscos técnicos com mitigação, e 2 otimizações que reduzem trabalho. Nenhum bloqueio impeditivo.

---

## Correções Factuais

### CF-1: São 333 campos Float, não 320

```
grep -c "Float" prisma/schema.prisma → 333
```

O documento original lista 320 campos para migrar + 13 que mantêm Float = 333 total. O número bate. Mas o plano diz "320 campos" quando deveria dizer **"~320 campos a migrar"** (333 - 13 = 320). Isso é correto na intenção, mas vale explicitar.

Adicionalmente, já existem **86 campos Decimal** no schema (IssuedInvoice, Product, etc.). Esses campos **não precisam de migration** mas seus routers já deveriam usar `precision.ts` — e não usam. Isso amplia o escopo da Fase 1.

**Impacto:** Nenhum no plano. Apenas clarificação.

### CF-2: Fase 4 lista 9 models, não 10

O plano diz "10 models" mas lista apenas 9:

1. EmployeeDependent
2. LeaveRecord
3. IncomeTaxTable
4. INSSTable
5. Lot
6. LotMovement
7. TaxRegime
8. IntercompanyTransfer
9. IntercompanyTransferItem

**Falta o 10º model.** Revisando o documento original, o 10º seria **TaxRegimeCompany** (tabela de junção N:N entre TaxRegime e Company) — ou pode ser que o total correto seja 9 + enums.

**Recomendação:** Confirmar se são 9 models + enums, ou se há um 10º model. Se forem 9, corrigir o plano para "9 models".

### CF-3: companyId — números reais do schema

O schema hoje tem:
- **66 models** com `companyId String?` (nullable)
- **29 models** com `companyId String` (NOT NULL) — já incluindo relações inversas no Company
- O plano diz "54 models recebem NOT NULL" — isso significa 54 dos 66 nullable passam a NOT NULL, restando 12 nullable

Verificação: 66 - 54 = 12 ✅ — os números batem.

---

## Riscos Técnicos

### RT-1: superjson + Prisma.Decimal — Risco MÉDIO (mitigável)

**Descoberta:** Testei a serialização real:

```javascript
superjson.serialize(new Prisma.Decimal('123.45'))
// → { json: "123.45" }  (sem meta!)

superjson.deserialize(result)
// → Prisma.Decimal object (NÃO number, NÃO string)
```

O `superjson` v2 preserva `Prisma.Decimal` como instância Decimal no cliente. Isso significa:

- **`formatCurrency(value)` funciona** — aceita `number | null` e `Number(Decimal)` retorna number corretamente
- **Aritmética direta no frontend FUNCIONA** — `Decimal + 1` faz coerção via `.valueOf()`
- **`value > 0` funciona** — comparação faz coerção

**MAS** há 10+ páginas no frontend com cálculos `item.quantity * item.unitPrice` que hoje recebem `number` e passarão a receber `Decimal`. O operador `*` **NÃO funciona** com Decimal objects:

```javascript
new Prisma.Decimal(5) * new Prisma.Decimal(10) // → NaN
Number(new Prisma.Decimal(5)) * Number(new Prisma.Decimal(10)) // → 50 ✅
```

**Páginas afetadas no frontend (cálculos aritméticos com `*`):**

| Página | Padrão |
|---|---|
| `purchase-orders/new/page.tsx` | `item.quantity * item.unitPrice` |
| `quotes/new/page.tsx` | `item.quantity * item.unitPrice` |
| `quotes/[id]/page.tsx` | `item.quantity * item.unitPrice` |
| `sales/new/page.tsx` | `item.quantity * item.unitPrice * (1 - discount)` |
| `sales/quotes/new/page.tsx` | `item.quantity * item.unitPrice * (1 - discount)` |
| `billing/new/page.tsx` | `item.quantity * item.unitPrice` |
| `supplier-returns/new/page.tsx` | `item.quantity * item.unitPrice` |
| `purchase-orders/[id]/page.tsx` | `order.totalValue * (order.discountPercent / 100)` |

**Mitigação:** Duas opções:

**Opção A (recomendada):** Nos routers, converter Decimal→number antes de retornar ao frontend. Isso mantém o frontend intocado:
```typescript
// No router, após query:
return { ...order, totalValue: Number(order.totalValue) };
```

**Opção B:** Registrar Decimal no superjson para deserializar como number:
```typescript
superjson.registerCustom<Prisma.Decimal, string>(
  { isApplicable: (v) => Prisma.Decimal.isDecimal(v), serialize: (v) => v.toString(), deserialize: (v) => new Prisma.Decimal(v) },
  'Prisma.Decimal'
);
```

**Opção C:** Usar `Number()` no frontend em cada cálculo — mais trabalhoso e frágil.

**Recomendação:** Opção A. Manter o contrato da API como `number` para o frontend. Os cálculos de precisão acontecem no backend (routers) com `precision.ts`. O frontend é apenas exibição.

### RT-2: `tsc --noEmit` como gate — Risco ALTO (gerenciável)

O plano exige `npx tsc --noEmit` passando entre cada fase. Isso é correto, mas:

- Fase 1 altera **333 campos** de tipo. Cada campo Float que vira Decimal muda o tipo TypeScript de `number | null` para `Prisma.Decimal | null`
- **Todos os 35 routers** com cálculos aritméticos vão falhar no `tsc` imediatamente após a migration
- **Todos os 74 test files** que usam `number` para esses campos vão falhar

Isso significa que a Fase 1 **não pode ser feita incrementalmente** (migrar 50 campos, validar, migrar mais 50). É tudo-ou-nada: migrar os 320 campos + ajustar os 35 routers + ajustar os testes **na mesma fase**.

**Mitigação:** Aceitar que a Fase 1 é a maior e mais arriscada. Subdividi-la internamente:

1. **1a:** Migration SQL (ALTER COLUMN) — banco muda, schema Prisma ainda Float
2. **1b:** Schema Prisma Float→Decimal + `prisma generate`
3. **1c:** Ajustar routers (35 arquivos) para usar `precision.ts` ou `Number()`
4. **1d:** Ajustar testes (74 arquivos)
5. **1e:** `tsc --noEmit` — gate

O `tsc` só passa no final da 1e, não entre sub-fases. Isso é aceitável porque o banco pode ser limpo.

### RT-3: `precision.ts` usa `decimal.js`, Prisma usa `Prisma.Decimal` — Risco BAIXO

Existem duas bibliotecas de Decimal no projeto:
- `decimal.js` (via `src/lib/precision.ts`, VIO-831)
- `Prisma.Decimal` (que internamente usa `decimal.js` também)

Elas são **compatíveis** — `Prisma.Decimal` é um wrapper sobre `decimal.js`. Mas o plano diz "usar `precision.ts`" nos routers. Isso funciona, mas requer conversão:

```typescript
import { multiply, toMoney } from "@/lib/precision";

// Antes (Float):
const total = item.quantity * item.unitPrice;

// Depois (com precision.ts):
const total = multiply(item.quantity, item.unitPrice); // retorna Decimal
const totalNumber = toMoney(total).toNumber(); // para retornar ao frontend
```

**Alternativa mais simples:** Usar `Number()` direto nos routers e manter `precision.ts` apenas para cálculos fiscais complexos (ICMS, IPI, etc.):

```typescript
// Simples — para cálculos de total:
const total = Number(item.quantity) * Number(item.unitPrice);

// Complexo — para cálculos fiscais:
const icms = calculateICMS(Number(item.totalPrice), Number(item.icmsRate));
```

**Recomendação:** Usar `Number()` para cálculos simples (multiplicação de qty × price) e `precision.ts` para cálculos fiscais encadeados. Não forçar `precision.ts` em todos os 132 cálculos — seria over-engineering.

### RT-4: Fase 5 (Modularização) — `prismaSchemaFolder` requer Prisma 5.15+ — Risco BAIXO

O projeto usa Prisma **7.2.0**, que suporta `prismaSchemaFolder` nativamente (GA desde 5.15). Sem risco técnico.

Porém, a modularização de 5.538 linhas em 16 arquivos requer cuidado com:
- **Relations cross-file:** Prisma resolve automaticamente, mas cada model precisa estar em exatamente 1 arquivo
- **Enums:** Precisam estar no arquivo do domínio que os usa, ou em um `enums.prisma` compartilhado
- **Generator/datasource:** Devem estar em exatamente 1 arquivo (geralmente `base.prisma`)

**Recomendação:** Criar um `prisma/schema/base.prisma` com generator + datasource, e um `prisma/schema/enums.prisma` para enums compartilhados entre domínios.

---

## Otimizações

### OT-1: AuditLog já tem `ipAddress` e `userAgent`

O plano da Fase 7 diz "Adicionar campos `source`, `ipAddress`, `userAgent` no AuditLog". Verificação:

```prisma
model AuditLog {
  // ...
  ipAddress     String?     // ← JÁ EXISTE
  userAgent     String?     // ← JÁ EXISTE
  requestPath   String?     // ← JÁ EXISTE
  requestMethod String?     // ← JÁ EXISTE
}
```

Apenas `source` (AuditSource enum) precisa ser adicionado. Economia de ~1h.

### OT-2: `tenantFilter` já existe em `trpc.ts`

O plano da Fase 6 fala em integrar `createTenantPrisma` no `tenantProcedure`. Mas já existe um `tenantFilter()` helper em `src/server/trpc.ts` (linha 164-178) que faz algo similar:

```typescript
export function tenantFilter(companyId: string | null, includeShared = true) {
  if (!companyId) return {};
  if (includeShared) {
    return { OR: [{ companyId }, { companyId: null }, { isShared: true }] };
  }
  return { companyId };
}
```

A integração da Fase 6 deve **substituir** esse helper pelo `createTenantPrisma` automático, não coexistir. Caso contrário, teremos dois mecanismos de filtro de tenant.

**Recomendação:** Na Fase 6, deprecar `tenantFilter()` e migrar os routers que o usam para o Prisma Extension automático. Manter `tenantFilter` temporariamente com um `console.warn('deprecated')` para identificar usos remanescentes.

---

## Análise por Fase — Viabilidade

| Fase | Viabilidade | Complexidade | Risco | Estimativa |
|---|---|---|---|---|
| **0** | ✅ Trivial | Baixa | Nenhum | 1h |
| **1** | ✅ Viável, maior fase | **Alta** | RT-1, RT-2, RT-3 | 24-30h |
| **2** | ✅ Viável | Média | Baixo (banco pode ser limpo) | 8-12h |
| **3** | ✅ Viável | Média | Baixo | 6-8h |
| **4** | ✅ Viável | Baixa | Nenhum | 4-6h |
| **5** | ✅ Viável | Média | RT-4 | 6-8h |
| **6** | ✅ Viável | Média | Baixo | 4-6h |
| **7** | ✅ Viável (OT-1 reduz) | Média | Baixo | 3-5h |
| **Total** | | | | **56-76h** |

---

## Recomendações Finais

### 1. Subdividir Fase 1 internamente (1a→1e)
A Fase 1 é ~40% do trabalho total. Subdividir em sub-fases (SQL → Schema → Routers → Testes → Gate) permite progresso mensurável e rollback parcial.

### 2. Usar `Number()` no retorno dos routers (RT-1, Opção A)
Manter o contrato da API como `number` para o frontend. Cálculos de precisão ficam no backend. Isso elimina o impacto frontend quase completamente.

### 3. Não forçar `precision.ts` em todos os cálculos (RT-3)
Usar `Number()` para `qty * price` simples. Reservar `precision.ts` para cálculos fiscais encadeados onde a precisão importa (ICMS sobre IPI sobre base, etc.).

### 4. Corrigir contagem: 9 models na Fase 4 (CF-2)
Confirmar se são 9 ou 10 models. Se 9, corrigir o plano.

### 5. Deprecar `tenantFilter()` na Fase 6 (OT-2)
Substituir pelo Prisma Extension automático. Não manter dois mecanismos.

### 6. Considerar Fase 1 e 2 como "ponto de não retorno"
Após Fase 2, o schema é fundamentalmente diferente. As Fases 3-7 são incrementais e reversíveis. Sugiro um commit/tag especial após Fase 2 como checkpoint.

---

## Conclusão

**O plano está aprovado para execução** com as 3 correções factuais e 4 mitigações de risco incorporadas. A ordem de fases é correta, as dependências estão mapeadas, e a premissa de "banco pode ser limpo" elimina a maioria dos riscos de migration.

O maior risco é a Fase 1 (Float→Decimal) pelo volume de alterações TypeScript em cascata. A subdivisão interna (1a→1e) e a decisão de usar `Number()` no retorno dos routers (em vez de propagar Decimal para o frontend) são as mitigações mais importantes.

**Estimativa total: 56-76h (9-13 dias de trabalho IA).**
