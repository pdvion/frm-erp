# Guia de Desenvolvimento - FRM ERP

## Links Importantes

| Recurso | URL |
|---------|-----|
| **DeepWiki** | https://deepwiki.com/pdvion/frm-erp |
| **GitHub** | https://github.com/pdvion/frm-erp |
| **Vercel** | https://frm-erp-vion-projects.vercel.app |
| **Supabase** | https://supabase.com/dashboard/project/<PROJECT_ID> |
| **Linear** | https://linear.app/vion/project/poc-delphi-frm-migracao-erp |

---

## Sistema Original (Delphi)

### Código Fonte
- **Localização**: `<diretório_local>/FRM SUITE/` (configurar localmente)
- **Arquivos**: 682 .pas + 616 .dfm
- **Módulos**: 57 módulos organizados por área
- **Análise**: Ver documentação interna

### Módulos por Área

#### COMPRAS (CP) - 14 módulos
| Código | Nome | Status Migração |
|--------|------|-----------------|
| CP10 | Materiais | ✅ Migrado |
| CP11 | Fornecedores | ✅ Migrado |
| CP11 | Preview XML NFe | 🔴 Pendente |
| CP12 | Cotações | ✅ Migrado |
| CP13 | Pedidos de Compra | ✅ Migrado |
| CP14 | Entrada NFe | ✅ Migrado |
| CP15 | Saída Materiais | 🔴 Pendente |
| CP16 | Ativos | 🟡 Baixa prioridade |

#### ESTOQUE (EST)
| Código | Nome | Status Migração |
|--------|------|-----------------|
| EST10 | Estoque Produtos | ✅ Migrado |

#### PRODUÇÃO (OP) - 10 módulos
| Código | Nome | Status Migração |
|--------|------|-----------------|
| OP10 | Ordens Produção | 🔴 Pendente |
| OP15-50 | Apontamento/Gestão | 🔴 Pendente |

#### VENDAS (PV/VD) - 4 módulos
| Código | Nome | Status Migração |
|--------|------|-----------------|
| PV10 | Pedido Vendas | 🔴 Pendente |
| VD10 | Orçamentos Venda | 🔴 Pendente |

#### FINANCEIRO (FN)
| Código | Nome | Status Migração |
|--------|------|-----------------|
| FN10 | Contas a Pagar | ✅ Migrado |
| FN11 | Boletos | ✅ Migrado |
| FN12 | PIX | ✅ Migrado |
| FN13 | Fluxo de Caixa | ✅ Migrado |

#### RH/DP - 8 módulos
| Código | Nome | Status Migração |
|--------|------|-----------------|
| DP00-04 | Departamentos | ✅ Migrado |
| DP05 | Funcionários | ✅ Migrado |
| FP41 | Folha Ponto | ✅ Migrado |
| FP42 | Folha Pagamento | ✅ Migrado |

### Tecnologias Originais
- **Linguagem**: Delphi (Object Pascal)
- **Banco**: MySQL via Zeos (ZConnection)
- **UI**: TMS AdvGrid, JVCL
- **NFe/CTe**: ACBr
- **REST**: RESTRequest4D
- **Email**: Indy (IdSMTP)

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | Next.js | 16.1.2 |
| **UI** | React | 19.2.3 |
| **Linguagem** | TypeScript | 5.x (strict) |
| **Estilo** | TailwindCSS | 4.x |
| **Ícones** | Lucide React | 0.562.0 |
| **API** | tRPC | 11.8.1 |
| **ORM** | Prisma | 7.2.0 |
| **Banco** | PostgreSQL | 17.x (Supabase) |
| **Auth** | Supabase Auth | SSR |
| **Deploy** | Vercel | - |

---

## Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── api/trpc/          # API tRPC endpoint
│   ├── auth/              # Rotas de autenticação
│   ├── login/             # Página de login
│   ├── materials/         # Módulo CP10
│   ├── suppliers/         # Módulo CP11
│   ├── inventory/         # Módulo EST10
│   ├── audit/             # Logs de auditoria
│   └── page.tsx           # Dashboard
├── components/            # Componentes React
│   ├── CompanySwitcher.tsx
│   └── UserMenu.tsx
├── lib/                   # Utilitários
│   ├── prisma.ts          # Cliente Prisma
│   ├── trpc.ts            # Cliente tRPC
│   └── supabase/          # Clientes Supabase
├── server/                # Backend
│   ├── trpc.ts            # Configuração tRPC
│   ├── context.ts         # Contexto multi-tenant
│   ├── routers/           # Routers tRPC
│   └── services/          # Serviços (auditoria)
└── middleware.ts          # Middleware de auth

prisma/
├── schema.prisma          # Schema do banco
└── prisma.config.ts       # Configuração Prisma

.windsurf/
├── workflows/             # Workflows de desenvolvimento
└── skills/                # Skills reutilizáveis

docs/
├── mapeamento-mysql-postgresql.md
└── guia-desenvolvimento.md
```

---

## Padrões de Código

### TypeScript
```typescript
// NUNCA usar `any` - sempre tipos explícitos
interface MaterialFormData {
  code: number;
  description: string;
}

// Preferir `interface` para objetos
interface Props {
  material: Material;
}

// Usar `type` para unions
type Status = "ACTIVE" | "INACTIVE" | "BLOCKED";
```

### React
```typescript
"use client"; // Apenas quando necessário

// Componentes funcionais com hooks
export function MaterialCard({ material }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return <div>...</div>;
}
```

### tRPC Router
```typescript
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate } from "../services/audit";

export const materialRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.material.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          ...(input?.search && {
            description: { contains: input.search, mode: "insensitive" as const },
          }),
        },
      });
    }),

  create: tenantProcedure
    .input(z.object({ description: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const material = await ctx.prisma.material.create({
        data: { ...input, companyId: ctx.companyId },
      });

      await auditCreate("Material", material, String(material.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return material;
    }),
});
```

---

## Multi-Tenant

### Regras Obrigatórias

1. **Usar `tenantProcedure`** para endpoints com dados
2. **Aplicar `tenantFilter(ctx.companyId)`** em queries
3. **Incluir `companyId: ctx.companyId`** ao criar registros
4. **Usar `isShared: true`** para dados compartilhados

### Exemplo
```typescript
// Query com filtro de tenant
const materials = await ctx.prisma.material.findMany({
  where: tenantFilter(ctx.companyId),
});

// Criação com companyId
const material = await ctx.prisma.material.create({
  data: {
    ...input,
    companyId: ctx.companyId,
  },
});
```

---

## Banco de Dados

### Migrations
```bash
# NUNCA usar prisma migrate diretamente
# Usar Supabase MCP:
mcp9_apply_migration({
  project_id: process.env.SUPABASE_PROJECT_ID,
  name: "nome_descritivo",
  query: "SQL da migration"
})

# Após mudanças no schema:
pnpm prisma generate
```

### Tipos SQL
```sql
-- IDs e FKs como UUID
"id" UUID NOT NULL DEFAULT gen_random_uuid(),
"userId" UUID,
"companyId" UUID,

-- Arrays
"changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],

-- JSON
"oldValues" JSONB,

-- Timestamps
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
```

---

## Git e Deploy

### Branches
| Branch | Ambiente | Descrição |
|--------|----------|-----------|
| `main` | Produção | Branch protegida |
| `develop` | Staging | Integração |
| `feature/vio-XXX-desc` | Preview | Features |
| `fix/vio-XXX-desc` | Preview | Correções |

### Commits (Conventional Commits)
```bash
feat(materials): adicionar filtro por categoria VIO-XXX
fix(inventory): corrigir cálculo de saldo VIO-XXX
docs: atualizar README
chore: atualizar dependências
```

### Deploy
- **Automático** via GitHub Actions
- **Vercel** para hosting
- **Supabase** para banco de dados

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Iniciar servidor local
pnpm type-check       # Verificar tipos
pnpm lint             # Verificar lint
pnpm build            # Build de produção

# Prisma
pnpm prisma generate  # Gerar cliente
pnpm prisma studio    # Interface visual do banco

# Git
git add -A && git commit -m "feat(module): descrição"
git push origin main
```

---

## Workflows Disponíveis

| Comando | Descrição |
|---------|-----------|
| `/db-migration` | Criar e aplicar migrations |
| `/new-feature` | Criar nova feature completa |
| `/deploy-check` | Verificar status do deploy |

---

## Erros Comuns

| Erro | Solução |
|------|---------|
| `incompatible types: text and uuid` | Usar UUID para FKs |
| `Type 'Record<string, unknown>' is not assignable to 'InputJsonValue'` | Cast para `Prisma.InputJsonValue` |
| `Type 'null' is not assignable to 'string \| undefined'` | Usar `?? undefined` |
| `mode 'insensitive'` lint error | Usar `as const` |
| `Module has no exported member` | `pnpm prisma generate` |
| Tipos de status incompatíveis | Cast explícito: `as "PENDING" \| "APPROVED" \| undefined` |
| Props de componentes com ícones | Usar JSX: `icon={<FileText />}` não `icon={FileText}` |
| Nomes de métodos tRPC incorretos | Verificar router: `grep -n "getById" src/server/routers/` |
| Campos nullable sem verificação | Adicionar `if (!value) continue;` antes de usar |
| Dependências faltando | `pnpm add <pacote>` |

### Checklist Antes de Commit

```bash
# 1. Verificar lint
pnpm lint

# 2. Verificar build completo
pnpm build

# 3. Verificar imports não utilizados
# (lint já cobre isso)

# 4. Verificar tipos de props em componentes
# (build já cobre isso)
```

---

## Testes E2E

### Fluxo de Testes em Produção

```bash
# 1. Verificar Supabase Advisors
mcp9_get_advisors({ project_id: "...", type: "security" })
mcp9_get_advisors({ project_id: "...", type: "performance" })

# 2. Testar páginas via Playwright
mcp4_browser_navigate({ url: "https://frm-erp.vercel.app/..." })
mcp4_browser_wait_for({ time: 3 })
mcp4_browser_console_messages({ level: "error" })
mcp4_browser_snapshot()

# 3. Testar responsividade
mcp4_browser_resize({ width: 375, height: 812 })  # Mobile
mcp4_browser_resize({ width: 768, height: 1024 }) # Tablet
mcp4_browser_resize({ width: 1440, height: 900 }) # Desktop
```

### Checklist de Testes

- [ ] Supabase Security Advisor: 0 erros
- [ ] Supabase Performance Advisor: 0 warnings
- [ ] Console sem erros 500
- [ ] Páginas carregam em < 3s
- [ ] Responsividade OK em mobile/tablet/desktop

### Relatórios

Relatórios de testes são salvos em `docs/test-report-*.md`

---

## Contato

- **Projeto Linear**: POC Delphi FRM - Migração ERP
- **Equipe**: Vion
