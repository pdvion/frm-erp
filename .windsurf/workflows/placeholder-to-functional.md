---
description: Evoluir página placeholder para funcionalidade completa
---

# Workflow: Placeholder para Funcional

## Contexto

O projeto tem 55 páginas usando `PlaceholderPage` que precisam ser evoluídas.
Issue de tracking: VIO-714

## Passos

### 1. Identificar a Página
Verificar se a página usa `PlaceholderPage`:

```bash
grep -l "PlaceholderPage" src/app/**/page.tsx
```

### 2. Verificar Router tRPC Existente

**OBRIGATÓRIO**: Usar `/router-integration` antes de implementar!

```bash
ls src/server/routers/
grep -l "Router" src/server/routers/*.ts

# Ler o router para mapear procedures e estruturas de retorno
cat src/server/routers/<modulo>.ts | head -100
```

Ver workflow `/router-integration` para checklist completo de validação.

### 3. Estrutura da Nova Página

#### Página de Listagem
```tsx
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export default function ListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = trpc.modulo.list.useQuery({ search });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Título"
        icon={<Icon className="w-6 h-6" />}
        module="MODULO"
        breadcrumbs={[{ label: "Módulo", href: "/modulo" }, { label: "Lista" }]}
        actions={
          <Link href="/modulo/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Novo
          </Link>
        }
      />

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full max-w-md pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-theme-table-header border-b border-theme">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Campo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-table">
            {isLoading ? (
              <tr><td className="px-4 py-8 text-center text-theme-muted">Carregando...</td></tr>
            ) : data?.items?.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-theme-muted">Nenhum registro</td></tr>
            ) : (
              data?.items?.map((item) => (
                <tr key={item.id} className="hover:bg-theme-table-hover">
                  <td className="px-4 py-3 text-sm text-theme">{item.campo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

#### Página de Formulário (New/Edit)
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ campo: "" });

  const mutation = trpc.modulo.create.useMutation({
    onSuccess: () => router.push("/modulo"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo"
        icon={<Icon className="w-6 h-6" />}
        module="MODULO"
        breadcrumbs={[
          { label: "Módulo", href: "/modulo" },
          { label: "Novo" },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Campo</label>
            <input
              type="text"
              value={form.campo}
              onChange={(e) => setForm({ ...form, campo: e.target.value })}
              className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              required
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/modulo"
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### 4. Verificar CI
// turbo
```bash
pnpm type-check && pnpm lint
```

### 5. Testar Localmente
```bash
pnpm dev
# Acessar a página no browser
```

### 6. Commit
```bash
git add -A
git commit -m "feat([modulo]): implementar página [nome] VIO-714"
git push
```

### 7. Atualizar Linear
Marcar a página como implementada na descrição da VIO-714

## Páginas Prioritárias

### Alta Prioridade (Core Business)
- `/settings/users` - Gestão de usuários
- `/settings/users/new` - Convite de usuário
- `/payables/new` - Nova conta a pagar
- `/treasury/approvals/my-pending` - Aprovações pendentes

### Média Prioridade (Operacional)
- `/hr/timeclock/*` - Ponto eletrônico
- `/production/quality/new` - Qualidade
- `/picking/*` - WMS

### Baixa Prioridade (BI/Reports)
- `/bi/*` - Business Intelligence
- `/reports/*` - Relatórios
- `/budget/*` - Orçamento
