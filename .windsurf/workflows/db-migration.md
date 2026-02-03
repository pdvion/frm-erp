---
description: Cria e aplica migrations no banco Supabase
---

# Workflow: Database Migration

## Pré-requisitos
- Project ID Supabase: `jewutjydoyaimusaxvyg`
- Usar MCP `mcp7_apply_migration` (NUNCA usar `prisma migrate`)

## Passos

### 1. Atualizar schema.prisma
Adicionar/modificar modelo no arquivo `prisma/schema.prisma`

**IMPORTANTE - Tipos UUID:**
```prisma
// SEMPRE usar @db.Uuid para campos que referenciam outras tabelas
model NovaTabela {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String?  @db.Uuid  // FK para users
  companyId String?  @db.Uuid  // FK para companies
  // ... outros campos
}
```

### 2. Aplicar migration via Supabase MCP
// turbo
```
Usar mcp7_apply_migration com:
- project_id: jewutjydoyaimusaxvyg
- name: nome_descritivo_snake_case
- query: SQL da migration
```

**⚠️ OBRIGATÓRIO - RLS em TODAS as tabelas:**
```sql
-- SEMPRE incluir no final da migration:
ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessidade):
CREATE POLICY "nova_tabela_select_policy" ON nova_tabela
  FOR SELECT USING (true);

CREATE POLICY "nova_tabela_insert_policy" ON nova_tabela
  FOR INSERT WITH CHECK (true);

CREATE POLICY "nova_tabela_update_policy" ON nova_tabela
  FOR UPDATE USING (true);

CREATE POLICY "nova_tabela_delete_policy" ON nova_tabela
  FOR DELETE USING (true);
```

**IMPORTANTE - Tipos SQL:**
```sql
-- IDs e FKs SEMPRE como UUID
"id" UUID NOT NULL DEFAULT gen_random_uuid(),
"userId" UUID,
"companyId" UUID,

-- Arrays com default
"changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],

-- JSON como JSONB
"oldValues" JSONB,
"newValues" JSONB,

-- Timestamps
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
```

### 3. Regenerar Prisma Client
// turbo
```bash
pnpm prisma generate
```

### 4. Verificar tipos
// turbo
```bash
pnpm type-check
```

## Erros Comuns e Soluções

### Erro: "foreign key constraint cannot be implemented - incompatible types: text and uuid"
**Causa:** Campo FK definido como TEXT mas tabela referenciada usa UUID
**Solução:** Usar UUID para o campo FK:
```sql
-- ERRADO
"userId" TEXT,

-- CORRETO
"userId" UUID,
```

### Erro: "Type 'Record<string, unknown>' is not assignable to type 'InputJsonValue'"
**Causa:** Prisma espera tipo específico para campos JSON
**Solução:** Fazer cast para `Prisma.InputJsonValue`:
```typescript
// ERRADO
oldValues: oldValues ?? undefined,

// CORRETO
import { Prisma } from "@prisma/client";
oldValues: oldValues as Prisma.InputJsonValue ?? undefined,
```

### Erro: "Type 'null' is not assignable to type 'string | undefined'"
**Causa:** Campo pode ser null mas tipo espera undefined
**Solução:** Converter null para undefined:
```typescript
// ERRADO
userId: ctx.tenant.userId,

// CORRETO
userId: ctx.tenant.userId ?? undefined,
```

### Erro: "Module has no exported member 'X'" após mudança no schema
**Causa:** Prisma Client desatualizado
**Solução:** Regenerar o client:
```bash
pnpm prisma generate
```

## Convenções

### Nomes de Tabelas
- Usar snake_case no banco: `audit_logs`, `user_companies`
- Usar `@@map("nome_tabela")` no Prisma

### Nomes de Campos
- camelCase no Prisma: `companyId`, `createdAt`
- O Prisma mapeia automaticamente para snake_case no banco

### Índices
- Sempre criar índices para FKs frequentemente consultadas
- Criar índices compostos para queries comuns:
```sql
CREATE INDEX "tabela_campo1_campo2_idx" ON "tabela"("campo1", "campo2");
```
