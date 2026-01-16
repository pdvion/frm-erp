# FRM ERP

Sistema ERP industrial FRM - Migração do sistema Delphi para stack moderna.

[![CI](https://github.com/pdvion/frm-erp/actions/workflows/ci.yml/badge.svg)](https://github.com/pdvion/frm-erp/actions/workflows/ci.yml)
[![Deploy](https://github.com/pdvion/frm-erp/actions/workflows/deploy.yml/badge.svg)](https://github.com/pdvion/frm-erp/actions/workflows/deploy.yml)

## 🚀 Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: TailwindCSS + Lucide Icons
- **Backend**: tRPC + Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel

## 📦 Módulos

| Código | Módulo | Status |
|--------|--------|--------|
| CP10 | Materiais | ✅ MVP |
| CP11 | Fornecedores | 🔄 Em desenvolvimento |
| CP12 | Orçamentos | ⏳ Pendente |
| CP14 | Recebimento NFe | ⏳ Pendente |
| CP15 | Saída de Materiais | ⏳ Pendente |
| EST10 | Estoque | 🔄 Em desenvolvimento |

## 🏗️ Arquitetura Multi-Tenant

O sistema suporta múltiplas empresas do grupo FRM com:
- Isolamento de dados por empresa
- Compartilhamento de dados com permissões
- Clonagem de configurações entre empresas
- Permissões granulares por módulo

## 🛠️ Setup Local

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Conta no Supabase

### Instalação

```bash
# Clone o repositório
git clone https://github.com/pdvion/frm-erp.git
cd frm-erp

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Gere o Prisma Client
pnpm prisma generate

# Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
frm-erp/
├── src/
│   ├── app/              # App Router (Next.js)
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários e configurações
│   └── server/           # Backend (tRPC + Prisma)
│       ├── routers/      # Routers tRPC
│       ├── context.ts    # Contexto Multi-Tenant
│       └── trpc.ts       # Configuração tRPC
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
└── .github/
    └── workflows/        # GitHub Actions
```

## 🔄 Ambientes

| Ambiente | Branch | URL | Banco |
|----------|--------|-----|-------|
| Produção | `main` | frm-erp.vercel.app | Supabase Prod |
| Staging | `develop` | frm-erp-staging.vercel.app | Supabase Branch |
| Preview | `feature/*` | frm-erp-*.vercel.app | Supabase Branch |

## 🧪 Testes

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Testes unitários
pnpm test

# Testes E2E
pnpm test:e2e
```

## 📝 Convenções

### Commits (Conventional Commits)

```
feat: adiciona CRUD de materiais
fix: corrige filtro de tenant
docs: atualiza README
chore: atualiza dependências
refactor: simplifica middleware
test: adiciona testes de permissões
```

### Branches

- `main` - Produção (protegida)
- `develop` - Integração contínua
- `feature/*` - Novas funcionalidades
- `fix/*` - Correções de bugs
- `hotfix/*` - Correções urgentes

## 📚 Documentação

- [DeepWiki - Documentação Completa](https://deepwiki.com/pdvion/frm-erp)
- [Linear - Gestão de Tarefas](https://linear.app/vion/project/poc-delphi-frm-migracao-erp-bd2c2d103f58)

## 📄 Licença

Proprietário - FRM Indústria e Comércio Ltda
