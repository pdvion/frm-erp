---
name: Criar Página CRUD FRM
description: Cria uma página CRUD completa com listagem, criação, edição e exclusão
---

# Skill: Criar Página CRUD Completa

## Pré-requisitos

Antes de criar a página, verificar:

1. **Router tRPC existe** em `src/server/routers/<modulo>.ts`
2. **Modelo Prisma existe** em `prisma/schema.prisma`
3. **Router está registrado** em `src/server/routers/index.ts`

## Estrutura de Arquivos

```
src/app/<modulo>/
├── page.tsx           # Listagem
├── new/
│   └── page.tsx       # Criação
└── [id]/
    ├── page.tsx       # Detalhes
    └── edit/
        └── page.tsx   # Edição
```

## Template: Página de Listagem

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Loader2, Trash2, Edit } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";

export default function <Modulo>Page() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.<modulo>.list.useQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const deleteMutation = trpc.<modulo>.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const items = data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="<Título>"
        subtitle="<Descrição>"
        icon={<Icon size={24} />}
        actions={
          <Link href="/<modulo>/new">
            <Button leftIcon={<Plus size={18} />}>Novo</Button>
          </Link>
        }
      />

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          />
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhum registro encontrado
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <Link href={`/<modulo>/${item.id}`} className="text-blue-600 hover:underline">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/<modulo>/${item.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Excluir este registro?")) {
                            deleteMutation.mutate({ id: item.id });
                          }
                        }}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
```

## Template: Página de Criação

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";

export default function New<Modulo>Page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    // outros campos
  });

  const createMutation = trpc.<modulo>.create.useMutation({
    onSuccess: (result) => {
      router.push(`/<modulo>/${result.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Novo <Item>"
        backHref="/<modulo>"
        backLabel="Voltar"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              required
            />
          </div>
          {/* Adicionar mais campos conforme necessário */}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            isLoading={createMutation.isPending}
            leftIcon={<Save size={18} />}
          >
            Salvar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
```

## Checklist

- [ ] Verificar router tRPC existe
- [ ] Criar página de listagem
- [ ] Criar página de criação
- [ ] Criar página de detalhes
- [ ] Criar página de edição
- [ ] Registrar rotas em `src/lib/routes/registry.ts`
- [ ] Usar componentes do Design System (Button, PageHeader, etc)
- [ ] Componentes inexistentes no Design System devem ser criados no Design System e depois usados na criação das páginas
- [ ] Incluir classes dark mode
- [ ] Executar `pnpm type-check && pnpm lint`
