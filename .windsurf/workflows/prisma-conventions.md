---
description: Convenções obrigatórias para schema Prisma - nomenclatura e padrões
---

# Convenções Prisma - FRM ERP

## Regra Principal: camelCase no Código, snake_case no Banco

**SEMPRE** usar camelCase nos campos do Prisma com `@map` para snake_case no banco.

### ✅ Padrão Correto
```prisma
model Example {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId       String    @map("company_id") @db.Uuid  // NOT NULL (padrão após Schema v1)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @default(now()) @updatedAt @map("updated_at")
  processNumber   String    @map("process_number")
  foreignValue    Decimal   @map("foreign_value") @db.Decimal(15, 2)  // Decimal para monetários
  
  // Relações também em camelCase
  importProcess   ImportProcess @relation(fields: [importProcessId], references: [id])
  
  @@index([companyId])
  @@map("examples")  // Tabela em snake_case
}
```

### ❌ Padrão Incorreto (NÃO USAR)
```prisma
model Example {
  company_id      String?   @db.Uuid           // ❌ snake_case direto
  created_at      DateTime  @default(now())    // ❌ snake_case direto
  process_number  String                       // ❌ snake_case direto
}
```

## Checklist Antes de Modificar Schema

1. **Verificar convenção existente**
   ```bash
   grep -E "^\s+\w+_\w+\s+" prisma/schema.prisma | head -20
   ```
   Se encontrar campos snake_case SEM `@map`, é um problema.

2. **Após criar novos modelos**
   - Todos os campos devem ser camelCase
   - Adicionar `@map("snake_case")` para cada campo
   - Adicionar `@@map("table_name")` para a tabela

3. **Após `prisma db pull`**
   - **NUNCA** fazer commit direto após db pull
   - Revisar TODAS as mudanças no schema
   - Converter campos snake_case para camelCase + @map
   - Verificar se modelos não foram removidos acidentalmente

## Validação Automática

// turbo
```bash
# Verificar campos snake_case sem @map (problema)
grep -E "^\s+[a-z]+_[a-z]+\s+\w+" prisma/schema.prisma | grep -v "@map" | head -20
```

Se o comando acima retornar resultados, há campos que precisam ser corrigidos.

## Campos Padrão (Copiar/Colar)

```prisma
// Campos obrigatórios
id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
companyId String    @map("company_id") @db.Uuid  // NOT NULL (padrão v1)
createdAt DateTime  @default(now()) @map("created_at")
updatedAt DateTime  @default(now()) @updatedAt @map("updated_at")

// Campos opcionais comuns
isShared  Boolean   @default(false) @map("is_shared")
isActive  Boolean   @default(true) @map("is_active")

// Soft delete (15 modelos prioritários já têm)
deletedAt DateTime? @map("deleted_at")
deletedBy String?   @map("deleted_by") @db.Uuid

// Legacy ID (para migração Delphi — 27 modelos já têm)
legacyId  Int?      @map("legacy_id")
// ⚠️ Usar @@unique([companyId, legacyId]) em vez de @unique

// Campos monetários — SEMPRE Decimal, NUNCA Float
totalValue Decimal  @map("total_value") @db.Decimal(15, 2)
unitCost   Decimal  @map("unit_cost") @db.Decimal(15, 4)
```

## ⚠️ Tipos Numéricos: Decimal vs Float

```prisma
// ❌ ERRADO — Float causa imprecisão em valores monetários
totalValue Float @map("total_value")

// ✅ CORRETO — Decimal com precisão explícita
totalValue Decimal @map("total_value") @db.Decimal(15, 2)  // monetário
quantity   Decimal @map("quantity") @db.Decimal(15, 4)     // quantidade
weight     Decimal @map("weight") @db.Decimal(15, 6)       // medida
```

**No TypeScript**, converter Decimal para Number:
```typescript
// Prisma retorna Decimal (objeto), não number
formatCurrency(Number(invoice.totalValue))  // ✅
formatCurrency(invoice.totalValue)          // ❌ Type error
```

## Índices e Uniqueness

```prisma
// ✅ Índice de tenant — obrigatório em TODOS os modelos com companyId
@@index([companyId])

// ✅ Índice composto — para queries frequentes
@@index([companyId, status])
@@index([companyId, code])
@@index([companyId, dueDate])

// ✅ legacyId multi-tenant — unique POR empresa, não global
legacyId  Int?  @map("legacy_id")
@@unique([companyId, legacyId])  // ✅ CORRETO
// legacyId Int? @unique           // ❌ ERRADO — conflito entre empresas

// ⚠️ Se @@unique já inclui companyId, o @@index([companyId]) é redundante
// O Prisma/Postgres usa o índice do unique para queries por companyId
```

## Relações

```prisma
// Relação simples
employeeId String   @map("employee_id") @db.Uuid
employee   Employee @relation(fields: [employeeId], references: [id])

// Relação com nome customizado
originPortId    String @map("origin_port_id") @db.Uuid
destinationPortId String @map("destination_port_id") @db.Uuid
originPort      Port   @relation("OriginPort", fields: [originPortId], references: [id])
destinationPort Port   @relation("DestinationPort", fields: [destinationPortId], references: [id])
```

## Enums

```prisma
enum ExampleStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED

  @@map("example_status")  // Mapear enum para snake_case
}
```

## Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `Property 'company_id' does not exist` | Campo snake_case no schema | Renomear para `companyId` + `@map("company_id")` |
| `Property 'createdAt' does not exist` | `prisma db pull` sobrescreveu | Restaurar camelCase + @map |
| Modelo sumiu após db pull | Tabela não existe no banco | Aplicar migration primeiro |

## Processo Seguro para Mudanças no Schema

1. **Criar migration primeiro** (via Supabase MCP)
2. **Aplicar migration** no banco
3. **Atualizar schema.prisma** manualmente com convenções corretas
4. **Executar** `pnpm prisma generate`
5. **Verificar** `pnpm type-check`
6. **Só então** fazer commit

## Referências
- Issue VIO-924: Documentação do problema de nomenclatura
- Workflow /pre-commit-check: Validação antes de commit
- Workflow /db-migration: Processo de migrations
