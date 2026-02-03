---
description: Cria um novo módulo CRUD completo com router tRPC e página Next.js
---

# Skill: Criar Módulo CRUD

## Parâmetros Necessários
- **nome**: Nome do módulo (ex: "quotes", "categories")
- **entidade**: Nome da entidade Prisma (ex: "Quote", "Category")
- **campos**: Lista de campos do formulário

## Arquivos Gerados

### 1. Router tRPC
`src/server/routers/[nome].ts`

### 2. Páginas Next.js
- `src/app/[nome]/page.tsx` - Listagem
- `src/app/[nome]/new/page.tsx` - Criação
- `src/app/[nome]/[id]/page.tsx` - Detalhe
- `src/app/[nome]/[id]/edit/page.tsx` - Edição

## Padrões Obrigatórios

### Router tRPC
```typescript
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";

// SEMPRE usar tenantProcedure para endpoints com dados
// SEMPRE usar tenantFilter(ctx.companyId) em queries
// SEMPRE auditar create, update, delete
// SEMPRE converter ctx.tenant.userId ?? undefined
```

### Páginas React
```typescript
"use client";  // OBRIGATÓRIO para páginas com hooks

// Imports padrão
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";

// Ícones do Lucide
import { ChevronLeft, Save, X, Loader2, Plus, Edit, Trash2, Eye } from "lucide-react";
```

### Formulários
```typescript
// Estado do formulário
const [formData, setFormData] = useState<FormData>({...});
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

// Handler genérico
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value, type } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: type === "checkbox" 
      ? (e.target as HTMLInputElement).checked 
      : type === "number" 
        ? parseFloat(value) || 0 
        : value,
  }));
};
```

### Tabelas com Paginação
```typescript
// Estado
const [page, setPage] = useState(1);
const [search, setSearch] = useState("");

// Query
const { data, isLoading, error } = trpc.[modulo].list.useQuery({
  search: search || undefined,
  page,
  limit: 20,
});

// Paginação
{pagination && pagination.totalPages > 1 && (
  <div className="flex items-center gap-2">
    <button onClick={() => setPage(page - 1)} disabled={page === 1}>
      <ChevronLeft />
    </button>
    <span>{pagination.page} / {pagination.totalPages}</span>
    <button onClick={() => setPage(page + 1)} disabled={page === pagination.totalPages}>
      <ChevronRight />
    </button>
  </div>
)}
```

## Checklist Pós-Criação

- [ ] Registrar router em `src/server/routers/index.ts`
- [ ] Verificar build: `pnpm type-check`
- [ ] Testar localmente: `pnpm dev`
- [ ] Commit com conventional commits
- [ ] Atualizar issue no Linear
