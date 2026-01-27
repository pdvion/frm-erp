---
description: Padrões de nomenclatura Prisma e erros comuns de TypeScript
---

# Workflow: Padrões Prisma e TypeScript

## ⚠️ OBRIGATÓRIO: Verificar Schema Antes de Usar Campos

**SEMPRE** antes de usar campos de um modelo Prisma em código:

```bash
# Ver definição do modelo
grep -A 50 "model NomeModelo {" prisma/schema.prisma
```

### Erros Comuns de Nomenclatura

| Assumido Errado | Correto (verificar schema) |
|-----------------|---------------------------|
| `jobPosition` | `position` |
| `employeeId` | `userId` ou `workerId` |
| `categoryName` | `name` ou `title` |
| `createdDate` | `createdAt` |

## Convenções de Nomenclatura Prisma

### Modelos
- PascalCase: `Employee`, `PurchaseOrder`, `AccountsPayable`

### Campos
- camelCase: `companyId`, `createdAt`, `totalValue`
- Relações: nome do modelo em camelCase: `company`, `supplier`, `items`

### Relações
```prisma
// Relação simples
department    Department?  @relation(fields: [departmentId], references: [id])
departmentId  String?      @db.Uuid

// Relação com nome customizado (quando há múltiplas relações para mesmo modelo)
manager       Employee?    @relation("EmployeeManager", fields: [managerId], references: [id])
subordinates  Employee[]   @relation("EmployeeManager")
```

## Erros Comuns de TypeScript

### 1. mode: "insensitive"
```typescript
// ❌ ERRADO
{ contains: search, mode: "insensitive" }

// ✅ CORRETO
{ contains: search, mode: "insensitive" as const }
// ou
import type { Prisma } from "@prisma/client";
{ contains: search, mode: "insensitive" as Prisma.QueryMode }
```

### 2. Campos JSON
```typescript
// ❌ ERRADO
data: { metadata: someObject }

// ✅ CORRETO
import type { Prisma } from "@prisma/client";
data: { metadata: someObject as Prisma.InputJsonValue }
```

### 3. null vs undefined
```typescript
// ❌ ERRADO - campo pode ser null mas tipo espera undefined
userId: ctx.tenant.userId,

// ✅ CORRETO
userId: ctx.tenant.userId ?? undefined,
```

### 4. Tipos de agregação
```typescript
// ❌ ERRADO
const count = result._count;  // pode ser objeto ou número

// ✅ CORRETO
const count = typeof result._count === 'number' ? result._count : result._count._all;
```

### 5. _sum pode ser undefined
```typescript
// ❌ ERRADO
const total = result._sum.valorFinal;

// ✅ CORRETO
const total = result._sum?.valorFinal || 0;
```

### 6. Filtros com tenantFilter
```typescript
// ❌ ERRADO - tenantFilter retorna tipo complexo
where: { id: input.id, ...tenantFilter(ctx.companyId) }

// ✅ CORRETO - usar tipo explícito
const where: Prisma.ModeloWhereInput = {
  id: input.id,
  companyId: ctx.companyId,
};
```

### 7. Upsert com índice parcial (system_settings)
```typescript
// ❌ ERRADO - upsert falha com índice parcial
await prisma.systemSetting.upsert({
  where: { key_companyId: { key, companyId } },
  create: { ... },
  update: { ... },
});

// ✅ CORRETO - usar findFirst + create/update
const existing = await prisma.systemSetting.findFirst({
  where: { key, companyId },
});

if (existing) {
  await prisma.systemSetting.update({
    where: { id: existing.id },
    data: { value, updatedBy },
  });
} else {
  await prisma.systemSetting.create({
    data: { key, value, companyId, updatedBy },
  });
}
```

## Checklist Antes de Usar Modelo Prisma

- [ ] Verifiquei a definição do modelo no schema.prisma?
- [ ] Usei os nomes EXATOS dos campos?
- [ ] Adicionei `as const` em strings literais de enum?
- [ ] Tratei campos opcionais com `?? undefined`?
- [ ] Usei tipos Prisma explícitos quando necessário?

## Comandos Úteis

```bash
# Ver todos os campos de um modelo
grep -A 100 "model Employee {" prisma/schema.prisma | head -50

# Buscar por campo específico
grep -n "position" prisma/schema.prisma

# Regenerar tipos após mudança no schema
pnpm prisma generate

# Verificar erros de tipo
pnpm type-check
```

## Imports Padrão para Prisma

```typescript
// Para tipos
import type { Prisma } from "@prisma/client";

// Para enums
import { StatusEnum, TipoEnum } from "@prisma/client";

// Para cliente
import { prisma } from "@/lib/prisma";
```
