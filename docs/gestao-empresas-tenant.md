# Gestão de Empresas (Multi-Tenant)

## Visão Geral

O FRM ERP suporta múltiplas empresas (tenants) com isolamento de dados. Cada empresa tem seus próprios:
- Materiais
- Fornecedores
- Estoque
- Pedidos de Compra
- Contas a Pagar
- Usuários e Permissões

## Como Adicionar uma Nova Empresa

### Via Interface (Recomendado)

1. Acesse **Configurações** → **Empresas** (`/settings/companies`)
2. Clique em **Nova Empresa**
3. Preencha os dados:
   - **Razão Social** (obrigatório)
   - **Nome Fantasia**
   - **CNPJ** (único)
   - **Inscrição Estadual**
   - **Endereço, Cidade, UF, CEP**
   - **Telefone, E-mail**
4. Clique em **Criar**

### Via API (tRPC)

```typescript
// Criar empresa
const result = await trpc.companies.create.mutate({
  name: "Nova Empresa Ltda",
  tradeName: "Nova Empresa",
  cnpj: "00.000.000/0000-00",
  ie: "123456789",
  address: "Rua Exemplo, 123",
  city: "São Paulo",
  state: "SP",
  zipCode: "01234-567",
  phone: "(11) 1234-5678",
  email: "contato@novaempresa.com.br",
});
```

### Via SQL (Supabase)

```sql
INSERT INTO companies (id, code, name, trade_name, cnpj, is_active)
VALUES (
  gen_random_uuid(),
  (SELECT COALESCE(MAX(code), 0) + 1 FROM companies),
  'Nova Empresa Ltda',
  'Nova Empresa',
  '00.000.000/0000-00',
  true
);
```

## Vincular Usuário a uma Empresa

### Via Interface

1. Acesse **Configurações** → **Empresas**
2. Clique no ícone de **Usuários** na empresa desejada
3. Clique em **Adicionar Usuário**
4. Selecione o usuário e defina as permissões

### Via API

```typescript
// Vincular usuário com permissões padrão (VIEW)
await trpc.companies.addUser.mutate({
  companyId: "uuid-da-empresa",
  userId: "uuid-do-usuario",
  isDefault: false,
});

// Vincular com permissões customizadas
await trpc.companies.addUser.mutate({
  companyId: "uuid-da-empresa",
  userId: "uuid-do-usuario",
  isDefault: true,
  permissions: [
    { module: "MATERIALS", permission: "FULL", canShare: true, canClone: true },
    { module: "SUPPLIERS", permission: "EDIT", canShare: false, canClone: false },
    { module: "INVENTORY", permission: "VIEW", canShare: false, canClone: false },
  ],
});
```

## Níveis de Permissão

| Nível | Descrição |
|-------|-----------|
| `NONE` | Sem acesso ao módulo |
| `VIEW` | Apenas visualizar |
| `EDIT` | Visualizar e editar |
| `FULL` | Acesso total (criar, editar, excluir) |

## Módulos do Sistema

| Módulo | Código | Descrição |
|--------|--------|-----------|
| `MATERIALS` | CP10 | Cadastro de Materiais |
| `SUPPLIERS` | CP11 | Cadastro de Fornecedores |
| `QUOTES` | CP12 | Orçamentos/Cotações |
| `RECEIVING` | CP14 | Entrada de Materiais |
| `MATERIAL_OUT` | CP15 | Saída de Materiais |
| `INVENTORY` | EST10 | Controle de Estoque |
| `REPORTS` | - | Relatórios |
| `SETTINGS` | - | Configurações |

## Permissões Especiais

- **canShare**: Permite compartilhar registros com outras empresas
- **canClone**: Permite clonar configurações para outras empresas

## Trocar Empresa Ativa

O usuário pode trocar a empresa ativa a qualquer momento usando o **CompanySwitcher** no header.

```typescript
// Via API
await trpc.tenant.switchCompany.mutate({ companyId: "uuid-da-empresa" });
```

## Dados Compartilhados

Registros com `isShared: true` são visíveis para todas as empresas do grupo:

```typescript
// Criar material compartilhado
await trpc.materials.create.mutate({
  description: "Material Padrão",
  isShared: true, // Visível para todas as empresas
});
```

## Fluxo de Auto-Provisionamento

Quando um novo usuário faz login via Supabase Auth:

1. O sistema verifica se o usuário existe no banco local
2. Se não existir, cria automaticamente:
   - Registro na tabela `users`
   - Vínculo com a empresa padrão (primeira empresa)
   - Permissões FULL em todos os módulos
3. O usuário pode então ser vinculado a outras empresas pelo admin

## Estrutura de Tabelas

```
companies
├── id (UUID)
├── code (Int, único)
├── name (String)
├── tradeName (String?)
├── cnpj (String?, único)
└── isActive (Boolean)

user_companies
├── userId (FK → users)
├── companyId (FK → companies)
├── isDefault (Boolean)
└── isActive (Boolean)

user_company_permissions
├── userId (FK → users)
├── companyId (FK → companies)
├── module (SystemModule)
├── permission (PermissionLevel)
├── canShare (Boolean)
└── canClone (Boolean)
```

## Endpoints Disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `companies.list` | Listar todas as empresas |
| `companies.getById` | Obter empresa por ID |
| `companies.create` | Criar nova empresa |
| `companies.update` | Atualizar empresa |
| `companies.addUser` | Vincular usuário |
| `companies.removeUser` | Desvincular usuário |
| `companies.listUsers` | Listar usuários da empresa |
| `companies.updateUserPermissions` | Atualizar permissões |
