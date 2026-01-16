---
description: Cria e aplica uma migration no banco Supabase via MCP
---

# Skill: Aplicar Migration Supabase

## Informações do Projeto
- **Project ID**: `jewutjydoyaimusaxvyg`
- **Região**: sa-east-1 (São Paulo)

## IMPORTANTE: NUNCA usar `prisma migrate`
Sempre usar o MCP `mcp9_apply_migration`

## Padrões de Tipos SQL

### IDs e Foreign Keys
```sql
-- SEMPRE usar UUID para IDs
"id" UUID NOT NULL DEFAULT gen_random_uuid(),

-- SEMPRE usar UUID para FKs que referenciam outras tabelas
"userId" UUID,
"companyId" UUID,
"materialId" UUID,

-- Constraint de PK
CONSTRAINT "tabela_pkey" PRIMARY KEY ("id")

-- Foreign Keys
ALTER TABLE "tabela" ADD CONSTRAINT "tabela_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Campos Comuns
```sql
-- Texto
"nome" TEXT NOT NULL,
"descricao" TEXT,

-- Números
"quantidade" FLOAT NOT NULL DEFAULT 0,
"codigo" INTEGER NOT NULL,
"valor" DECIMAL(10,2),

-- Booleanos
"ativo" BOOLEAN NOT NULL DEFAULT true,
"isShared" BOOLEAN NOT NULL DEFAULT false,

-- Datas
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"dataVencimento" DATE,

-- JSON
"dados" JSONB,
"oldValues" JSONB,
"newValues" JSONB,

-- Arrays
"tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
"changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
```

### Enums
```sql
-- Criar enum
CREATE TYPE "StatusType" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- Usar em coluna
"status" "StatusType" NOT NULL DEFAULT 'ACTIVE',
```

### Índices
```sql
-- Índice simples
CREATE INDEX "tabela_campo_idx" ON "tabela"("campo");

-- Índice composto
CREATE INDEX "tabela_campo1_campo2_idx" ON "tabela"("campo1", "campo2");

-- Índice único
CREATE UNIQUE INDEX "tabela_campo_key" ON "tabela"("campo");
```

## Template de Migration

```sql
-- Criar tabela
CREATE TABLE "nome_tabela" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID,
    "campo1" TEXT NOT NULL,
    "campo2" INTEGER,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nome_tabela_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE INDEX "nome_tabela_companyId_idx" ON "nome_tabela"("companyId");

-- Foreign Keys (se necessário)
ALTER TABLE "nome_tabela" ADD CONSTRAINT "nome_tabela_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## Uso do MCP

```typescript
mcp9_apply_migration({
  project_id: "jewutjydoyaimusaxvyg",
  name: "nome_descritivo_snake_case",
  query: "SQL da migration"
})
```

## Após Aplicar Migration

1. Atualizar `prisma/schema.prisma` com o modelo correspondente
2. Executar `pnpm prisma generate`
3. Verificar tipos: `pnpm type-check`

## Erros Comuns

### "incompatible types: text and uuid"
- Usar UUID para campos que referenciam tabelas com ID UUID

### "relation already exists"
- A tabela já existe, verificar se migration já foi aplicada

### "type does not exist"
- Criar o enum antes de usar na tabela
