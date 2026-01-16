# Mapeamento MySQL Original → PostgreSQL Novo

## Resumo

| Métrica | Valor |
|---------|-------|
| **Tabelas MySQL Original** | ~419 |
| **Tabelas PostgreSQL Novo** | 15 |
| **Módulos Migrados** | 6 (MVP 1) |
| **Status** | POC - Módulos Base |

---

## Tabelas Migradas (PostgreSQL)

### 1. Tabelas Base (A00)

| PostgreSQL | MySQL Original | Descrição |
|------------|----------------|-----------|
| `companies` | `A00_EMPRESA` | Cadastro de empresas |
| `users` | `A00_USUARIO` | Cadastro de usuários |
| `categories` | `A00_CATEGORIA` | Categorias de materiais |

### 2. Módulo CP10 - Materiais

| PostgreSQL | MySQL Original | Descrição |
|------------|----------------|-----------|
| `materials` | `CP10_MATERIAL` | Cadastro de materiais |

**Mapeamento de Campos:**

| PostgreSQL (EN) | MySQL (PT) | Tipo | Observação |
|-----------------|------------|------|------------|
| `id` | `codMaterial` | UUID | Novo formato |
| `code` | `codMaterial` | INT | Código legado |
| `description` | `desMaterial` | TEXT | |
| `internalCode` | `codInterno` | TEXT | |
| `categoryId` | `codCategoria` | UUID/FK | |
| `unit` | `unidade` | TEXT | |
| `location` | `localizacao` | TEXT | |
| `minQuantity` | `qtdMinima` | FLOAT | |
| `maxQuantity` | `qtdMaxima` | FLOAT | |
| `monthlyAverage` | `mediaConsumo` | FLOAT | |
| `lastPurchasePrice` | `precoUltCompra` | FLOAT | |
| `lastPurchaseDate` | `dataUltCompra` | TIMESTAMP | |
| `ncm` | `ncm` | TEXT | |
| `status` | `status` | ENUM | ACTIVE/INACTIVE/BLOCKED |
| `requiresQualityCheck` | `exigeInspecao` | BOOL | |
| `companyId` | `codEmpresa` | UUID/FK | Multi-tenant |
| `isShared` | - | BOOL | **Novo** - Compartilhamento |

### 3. Módulo CP11 - Fornecedores

| PostgreSQL | MySQL Original | Descrição |
|------------|----------------|-----------|
| `suppliers` | `CP11_FORNECEDOR` | Cadastro de fornecedores |
| `supplier_materials` | `CP11_FORNEC_MATERIAL` | Materiais por fornecedor |

**Mapeamento de Campos (suppliers):**

| PostgreSQL (EN) | MySQL (PT) | Tipo | Observação |
|-----------------|------------|------|------------|
| `id` | `codFornecedor` | UUID | Novo formato |
| `code` | `codFornecedor` | INT | Código legado |
| `companyName` | `razaoSocial` | TEXT | |
| `tradeName` | `nomeFantasia` | TEXT | |
| `cnpj` | `cnpj` | TEXT | |
| `cpf` | `cpf` | TEXT | |
| `ie` | `inscEstadual` | TEXT | |
| `im` | `inscMunicipal` | TEXT | |
| `address` | `endereco` | TEXT | |
| `number` | `numero` | TEXT | |
| `complement` | `complemento` | TEXT | |
| `neighborhood` | `bairro` | TEXT | |
| `city` | `cidade` | TEXT | |
| `state` | `uf` | TEXT | |
| `zipCode` | `cep` | TEXT | |
| `phone` | `telefone` | TEXT | |
| `mobile` | `celular` | TEXT | |
| `email` | `email` | TEXT | |
| `website` | `site` | TEXT | |
| `contactName` | `contato` | TEXT | |
| `paymentTerms` | `condPagamento` | TEXT | |
| `notes` | `observacoes` | TEXT | |
| `status` | `status` | ENUM | |
| `qualityIndex` | `indiceQualidade` | FLOAT | |
| `companyId` | `codEmpresa` | UUID/FK | Multi-tenant |
| `isShared` | - | BOOL | **Novo** |

### 4. Módulo CP12 - Orçamentos

| PostgreSQL | MySQL Original | Descrição |
|------------|----------------|-----------|
| `quotes` | `CP12_COTACAO` | Cotações de compra |
| `quote_items` | `CP12_COTACAO_ITEM` | Itens da cotação |

### 5. Módulo EST10 - Estoque

| PostgreSQL | MySQL Original | Descrição |
|------------|----------------|-----------|
| `inventory` | `EST10_ESTOQUE` | Saldo de estoque |
| `inventory_movements` | `EST10_MOVIMENTO` | Movimentações |

**Mapeamento de Campos (inventory):**

| PostgreSQL (EN) | MySQL (PT) | Tipo | Observação |
|-----------------|------------|------|------------|
| `id` | `codEstoque` | UUID | |
| `materialId` | `codMaterial` | UUID/FK | |
| `companyId` | `codEmpresa` | UUID/FK | |
| `inventoryType` | `tipoEstoque` | ENUM | RAW_MATERIAL, FINISHED, etc |
| `quantity` | `quantidade` | FLOAT | |
| `reservedQty` | `qtdReservada` | FLOAT | |
| `availableQty` | `qtdDisponivel` | FLOAT | |
| `unitCost` | `custoUnitario` | FLOAT | |
| `totalCost` | `custoTotal` | FLOAT | |
| `lastMovementAt` | `dataUltMov` | TIMESTAMP | |

### 6. Tabelas de Controle (Multi-Tenant)

| PostgreSQL | MySQL Original | Descrição |
|------------|----------------|-----------|
| `user_companies` | - | **Nova** - Acesso multi-empresa |
| `user_company_permissions` | - | **Nova** - Permissões granulares |
| `clone_logs` | - | **Nova** - Log de clonagem |
| `audit_logs` | - | **Nova** - Auditoria de ações |

---

## Módulos NÃO Migrados (Fase 2+)

### CP14 - Recebimento NFe
- `CP14_NFE_ENTRADA`
- `CP14_NFE_ITEM`
- `CP14_NFE_XML`
- **Motivo**: Requer integração SEFAZ

### CP15 - Saída de Materiais
- `CP15_REQUISICAO`
- `CP15_REQUISICAO_ITEM`
- **Motivo**: Depende de módulo de produção

### Módulos Financeiros
- `FIN_*` - Contas a pagar/receber
- **Motivo**: Integração ContaAzul planejada

### Módulos de Produção
- `PRD_*` - Ordens de produção
- **Motivo**: Fase 3

### Módulos de Vendas
- `VND_*` - Pedidos, NFe saída
- **Motivo**: Fase 3

---

## Decisões de Arquitetura

### 1. IDs UUID vs INT
- **MySQL**: IDs sequenciais (INT)
- **PostgreSQL**: UUIDs
- **Motivo**: Melhor para sistemas distribuídos e multi-tenant
- **Compatibilidade**: Campo `code` mantém ID legado

### 2. Nomenclatura PT → EN
- **MySQL**: Campos em português (`desMaterial`, `razaoSocial`)
- **PostgreSQL**: Campos em inglês (`description`, `companyName`)
- **Motivo**: Padrão internacional, melhor integração com ORMs

### 3. Multi-Tenant
- **MySQL**: Filtro por `codEmpresa` em queries
- **PostgreSQL**: `companyId` + `isShared` + RLS
- **Motivo**: Isolamento de dados + compartilhamento controlado

### 4. Enums Tipados
- **MySQL**: Campos VARCHAR com valores fixos
- **PostgreSQL**: ENUMs nativos do PostgreSQL
- **Motivo**: Validação em nível de banco

### 5. Auditoria
- **MySQL**: Triggers ou logs manuais
- **PostgreSQL**: Tabela `audit_logs` com JSON para valores
- **Motivo**: Rastreabilidade completa para governança

---

## Campos Críticos Identificados

### Campos Obrigatórios para Operação
1. `materials.code` - Código do material (legado)
2. `materials.description` - Descrição
3. `suppliers.code` - Código do fornecedor
4. `suppliers.companyName` - Razão social
5. `inventory.quantity` - Saldo atual
6. `inventory_movements.movementType` - Tipo de movimento

### Campos para Integração SEFAZ (Futuro)
1. `materials.ncm` - NCM para NFe
2. `suppliers.cnpj` - CNPJ para NFe
3. `suppliers.ie` - Inscrição Estadual

### Campos para Relatórios
1. `materials.monthlyAverage` - Média de consumo
2. `materials.lastPurchasePrice` - Último preço
3. `suppliers.qualityIndex` - Índice de qualidade

---

## Próximos Passos

1. **Fase 2**: Migrar CP14 (Recebimento NFe) com integração SEFAZ
2. **Fase 2**: Migrar CP15 (Saída de Materiais)
3. **Fase 3**: Módulos de Produção e Vendas
4. **Contínuo**: Sincronização de dados legados via ETL
