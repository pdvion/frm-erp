---
description: Padrão de arquitetura para novas páginas
---

# Arquitetura de Páginas - FRM ERP

## Regra Principal

> **Páginas NÃO devem definir layout próprio.**
> O `AppLayout` já fornece Sidebar, Header e tema.

## Checklist para Nova Página

1. **NÃO usar** `min-h-screen` ou `bg-gray-*`
2. **NÃO criar** `<header>` próprio
3. **NÃO duplicar** `CompanySwitcher`
4. **USAR** componentes de `@/components/ui`:
   - `PageHeader` - título, ícone, badge, ações
   - `PageCard` - seções com título
   - `PageTable` - tabelas responsivas
   - `PageTimeline` - histórico de eventos
   - `PageInfoList` - lista chave-valor
   - `PageButton` - botões padronizados

## Estrutura Correta

```tsx
"use client";

import { PageHeader, PageCard, PageButton } from "@/components/ui";
import { Package } from "lucide-react";

export default function ExamplePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Título"
        icon={<Package className="w-6 h-6" />}
        backHref="/lista"
        actions={<PageButton>Ação</PageButton>}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PageCard title="Conteúdo Principal">
            {/* ... */}
          </PageCard>
        </div>
        <div>
          <PageCard title="Informações">
            {/* ... */}
          </PageCard>
        </div>
      </div>
    </div>
  );
}
```

## Tema de Cores (Dark)

| Elemento | Classe |
|----------|--------|
| Card | `bg-zinc-900 border-zinc-800` |
| Texto primário | `text-white` |
| Texto secundário | `text-zinc-400` |
| Hover | `hover:bg-zinc-800` |
| Accent | `text-blue-500` |

## Documentação Completa

Ver `docs/arquitetura-paginas.md`
