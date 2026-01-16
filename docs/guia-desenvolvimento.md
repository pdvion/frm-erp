# Guia de Desenvolvimento - FRM ERP

## Links Importantes

| Recurso | URL |
|---------|-----|
| **DeepWiki** | https://deepwiki.com/pdvion/frm-erp |
| **GitHub** | https://github.com/pdvion/frm-erp |
| **Vercel** | https://frm-erp-vion-projects.vercel.app |
| **Supabase** | https://supabase.com/dashboard/project/jewutjydoyaimusaxvyg |
| **Linear** | https://linear.app/vion/project/poc-delphi-frm-migracao-erp |

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
  project_id: "jewutjydoyaimusaxvyg",
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

---

## Contato

- **Projeto Linear**: POC Delphi FRM - Migração ERP
- **Equipe**: Vion
