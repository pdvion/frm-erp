# Guia de Contribuição - FRM ERP

Este documento define as práticas de desenvolvimento, padrões de código e fluxo de trabalho para o projeto FRM ERP.

## 📋 Índice

- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
- [Convenções de Código](#convenções-de-código)
- [Commits e Branches](#commits-e-branches)
- [Code Review](#code-review)
- [Ambientes](#ambientes)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [Acessibilidade](#acessibilidade)
- [Segurança](#segurança)

---

## 🚀 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | Next.js | 15.x |
| **UI** | React | 19.x |
| **Linguagem** | TypeScript | 5.x |
| **Estilização** | TailwindCSS | 4.x |
| **Ícones** | Lucide React | 0.5x |
| **API** | tRPC | 11.x |
| **ORM** | Prisma | 7.x |
| **Banco de Dados** | PostgreSQL (Supabase) | 17.x |
| **Deploy** | Vercel | - |

---

## 📁 Estrutura do Projeto

```
frm-erp/
├── .github/
│   └── workflows/          # GitHub Actions (CI/CD)
├── prisma/
│   └── schema.prisma       # Schema do banco de dados
├── src/
│   ├── app/                # App Router (Next.js)
│   │   ├── api/            # API Routes
│   │   ├── materials/      # Páginas de Materiais
│   │   └── ...
│   ├── components/         # Componentes React reutilizáveis
│   ├── lib/                # Utilitários e configurações
│   │   ├── prisma.ts       # Cliente Prisma
│   │   ├── supabase.ts     # Cliente Supabase
│   │   └── trpc.ts         # Cliente tRPC
│   └── server/             # Backend
│       ├── routers/        # Routers tRPC por domínio
│       ├── context.ts      # Contexto Multi-Tenant
│       └── trpc.ts         # Configuração tRPC
├── .env.example            # Template de variáveis de ambiente
├── package.json
└── README.md
```

---

## 🔄 Fluxo de Desenvolvimento

### Branches

| Branch | Propósito | Deploy |
|--------|-----------|--------|
| `main` | Produção (protegida) | Automático |
| `develop` | Integração contínua | Preview |
| `feature/*` | Novas funcionalidades | Preview |
| `fix/*` | Correções de bugs | Preview |
| `hotfix/*` | Correções urgentes | - |

### Fluxo Git

```bash
# 1. Criar branch a partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/vio-XXX-descricao

# 2. Desenvolver e commitar
git add .
git commit -m "feat: descrição da feature"

# 3. Push e criar PR
git push origin feature/vio-XXX-descricao
# Criar PR para develop via GitHub
```

### Pull Requests

1. **Título**: Seguir Conventional Commits
2. **Descrição**: Incluir contexto e screenshots se aplicável
3. **Reviewers**: Mínimo 1 aprovação
4. **Checks**: CI deve passar (lint, type-check, build)
5. **Merge**: Squash and merge para develop

---

## 📝 Convenções de Código

### TypeScript

- **Strict mode** habilitado
- Evitar `any` - usar tipos explícitos
- Preferir `interface` para objetos, `type` para unions
- Usar `const` por padrão, `let` quando necessário

```typescript
// ✅ Bom
interface Material {
  id: string;
  description: string;
  status: MaterialStatus;
}

// ❌ Evitar
const material: any = { ... };
```

### React

- Componentes funcionais com hooks
- Props tipadas com interface
- Usar `"use client"` apenas quando necessário

```tsx
// ✅ Bom
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Estilização (TailwindCSS)

- Classes utilitárias inline
- Componentes complexos: extrair para componente
- Cores do tema: usar variáveis do Tailwind

```tsx
// ✅ Bom
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Salvar
</button>
```

---

## 💬 Commits e Branches

### Conventional Commits

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (não afeta código) |
| `refactor` | Refatoração |
| `test` | Testes |
| `chore` | Manutenção |

**Exemplos:**

```bash
feat(materials): adiciona filtro por categoria
fix(tenant): corrige seleção de empresa padrão
docs: atualiza README com instruções de deploy
chore: atualiza dependências do Prisma
```

### Nomenclatura de Branches

```
<tipo>/vio-<numero>-<descricao-curta>
```

**Exemplos:**

```
feature/vio-355-crud-materiais
fix/vio-360-filtro-tenant
hotfix/vio-999-corrige-login
```

---

## 👀 Code Review

### Checklist do Reviewer

- [ ] Código segue os padrões do projeto
- [ ] Tipos TypeScript corretos
- [ ] Sem `console.log` ou código de debug
- [ ] Testes adicionados/atualizados (quando aplicável)
- [ ] Sem vulnerabilidades de segurança
- [ ] Performance adequada
- [ ] Acessibilidade considerada

### Boas Práticas

1. **Seja construtivo** - Sugira melhorias, não apenas critique
2. **Explique o porquê** - Contextualize suas sugestões
3. **Priorize** - Diferencie bloqueadores de nice-to-haves
4. **Responda rápido** - Reviews em até 24h úteis

---

## 🌍 Ambientes

| Ambiente | Branch | URL | Banco |
|----------|--------|-----|-------|
| **Produção** | `main` | frm-erp-vion-projects.vercel.app | Supabase Prod |
| **Staging** | `develop` | frm-erp-staging.vercel.app | Supabase Branch |
| **Preview** | `feature/*` | frm-erp-*.vercel.app | Supabase Branch |
| **Local** | - | localhost:3000 | Supabase Dev |

### Variáveis de Ambiente

```bash
# Supabase
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

---

## 🗄️ Banco de Dados

### Prisma

- Schema em `prisma/schema.prisma`
- Migrations via Supabase MCP (não usar `prisma migrate`)
- Gerar cliente: `pnpm prisma generate`

### Multi-Tenant

O sistema usa arquitetura multi-tenant com:

- `companyId` em cada registro
- `isShared` para dados compartilhados
- Middleware tRPC filtra automaticamente

```typescript
// Filtro automático no tRPC
const where = {
  ...tenantFilter(ctx.companyId),
  // outros filtros
};
```

### Permissões

| Nível | Descrição |
|-------|-----------|
| `NONE` | Sem acesso |
| `VIEW` | Apenas visualizar |
| `EDIT` | Visualizar e editar |
| `FULL` | Acesso total (CRUD) |

---

## 🧪 Testes

### Comandos

```bash
pnpm lint          # ESLint
pnpm type-check    # TypeScript
pnpm test          # Testes unitários (futuro)
pnpm test:e2e      # Testes E2E (futuro)
```

### Estratégia

1. **Unitários**: Funções utilitárias e hooks
2. **Integração**: Routers tRPC
3. **E2E**: Fluxos críticos (login, CRUD)

---

## ♿ Acessibilidade

### Requisitos

- WCAG 2.1 nível AA
- Navegação por teclado
- Leitores de tela compatíveis
- Contraste de cores adequado

### Práticas

```tsx
// ✅ Bom - labels e ARIA
<button aria-label="Fechar modal" onClick={onClose}>
  <X className="w-5 h-5" />
</button>

// ✅ Bom - inputs com labels
<label htmlFor="description">Descrição</label>
<input id="description" type="text" />
```

---

## 🔒 Segurança

### Práticas Obrigatórias

1. **Nunca commitar secrets** - Usar variáveis de ambiente
2. **Validar inputs** - Usar Zod em todos os endpoints
3. **Sanitizar outputs** - Evitar XSS
4. **RLS no Supabase** - Row Level Security ativo
5. **Dependabot** - Manter dependências atualizadas

### Checklist de Segurança

- [ ] Secrets em variáveis de ambiente
- [ ] Inputs validados com Zod
- [ ] Permissões verificadas no backend
- [ ] Sem dados sensíveis em logs
- [ ] HTTPS em produção

---

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [tRPC Docs](https://trpc.io/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Linear - Gestão de Tarefas](https://linear.app/vion)

---

## 📞 Suporte

- **Issues**: GitHub Issues
- **Discussões**: GitHub Discussions
- **Urgente**: Slack #frm-erp
