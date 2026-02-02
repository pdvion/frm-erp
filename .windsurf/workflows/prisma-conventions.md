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
  companyId       String?   @map("company_id") @db.Uuid
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @default(now()) @map("updated_at")
  processNumber   String    @map("process_number")
  foreignValue    Decimal   @map("foreign_value") @db.Decimal(15, 2)
  
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
// Campos de auditoria padrão
id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
companyId String?   @map("company_id") @db.Uuid
createdAt DateTime  @default(now()) @map("created_at")
updatedAt DateTime  @default(now()) @updatedAt @map("updated_at")
isShared  Boolean   @default(false) @map("is_shared")
isActive  Boolean   @default(true) @map("is_active")
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
