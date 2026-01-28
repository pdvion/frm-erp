---
description: Padrão de arquitetura para novas páginas
---

# Arquitetura de Páginas - FRM ERP

## Regra Principal

> **Páginas NÃO devem definir layout próprio.**
> O `AppLayout` já fornece Sidebar, Header global e tema.

## ⚠️ PROIBIDO: Headers Duplicados

O `AppLayout` (`src/components/AppLayout.tsx`) já fornece um header global com:
- **Breadcrumb** (módulo + navegação)
- **CompanySwitcher** (seletor de empresas)
- **NotificationBell** (notificações)
- **UserMenu** (perfil do usuário)

### ❌ NÃO FAZER (cria header duplicado):

```tsx
// ERRADO - Cria segundo header na página
export default function MyPage() {
  return (
    <div>
      <header className="...">  {/* ❌ PROIBIDO */}
        <CompanySwitcher />      {/* ❌ Já existe no AppLayout */}
        <NotificationBell />     {/* ❌ Já existe no AppLayout */}
      </header>
      <main>...</main>
    </div>
  );
}
```

### ✅ FAZER (usa layout global):

```tsx
// CORRETO - Apenas conteúdo, sem header próprio
export default function MyPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Minha Página" icon={<Icon />} />
      {/* Conteúdo da página */}
    </div>
  );
}
```

### Componentes que NÃO devem ser usados nas páginas:
- `<header>` - O header global já existe
- `<CompanySwitcher />` - Já está no header global
- `<NotificationBell />` - Já está no header global
- `<ThemeSwitcher />` - Agora está no sidebar
- `<UserMenu />` - Já está no header global

### Para títulos de página, usar:
- `<PageHeader />` - Componente de título com ícone e ações
- Ou um `<div>` simples com título e subtítulo

## Sistema de Temas

O sistema suporta 3 modos de tema:
- **Claro** - Tema light
- **Escuro** - Tema dark
- **Sistema** - Segue preferência do SO

O usuário pode alternar via `ThemeSwitcher` no rodapé do sidebar.

## ⛔ PROIBIDO: Cores Hardcoded

**NUNCA usar cores fixas que não respondem ao tema:**

| ❌ Proibido | ✅ Usar |
|-------------|---------|
| `bg-white` | `bg-theme-card` |
| `bg-gray-50` | `bg-theme-secondary` |
| `bg-gray-100` | `bg-theme-tertiary` |
| `bg-gray-800/900` | `bg-theme` ou `bg-theme-card` |
| `bg-zinc-*` | `bg-theme-*` |
| `text-gray-900` | `text-theme` |
| `text-gray-700` | `text-theme-secondary` |
| `text-gray-500/400` | `text-theme-muted` |
| `text-zinc-*` | `text-theme-*` |
| `border-gray-200/300` | `border-theme` |
| `border-zinc-*` | `border-theme` |

**Exceções permitidas:**
- Cores semânticas: `text-red-*`, `text-green-*`, `text-blue-*`, `text-yellow-*`
- Badges de status com cores específicas
- Botão primário: `bg-blue-600`

## Checklist para Nova Página

1. **NÃO usar** `min-h-screen` ou cores fixas (`bg-gray-*`, `bg-zinc-*`, `bg-white`)
2. **NÃO criar** `<header>` próprio
3. **NÃO duplicar** `CompanySwitcher`
4. **USAR** classes de tema: `bg-theme-*`, `text-theme-*`, `border-theme-*`
5. **USAR** componentes de `@/components/ui`:
   - `PageHeader` - título, ícone, badge, ações
   - `PageCard` - seções com título
   - `PageTable` - tabelas responsivas
   - `PageTimeline` - histórico de eventos
   - `PageInfoList` - lista chave-valor
   - `PageButton` - botões padronizados
   - `ExportButtons` - exportação Excel/PDF
   - `AdvancedFilters` - filtros com salvamento
   - `MaskedInput` - inputs com máscara (CNPJ, CPF, etc)
   - `Toaster` - notificações toast (já no layout)

## Classes de Tema (CSS Variables)

| Elemento | Classe |
|----------|--------|
| Background principal | `bg-theme` |
| Background secundário | `bg-theme-secondary` |
| Background terciário | `bg-theme-tertiary` |
| Card | `bg-theme-card` |
| Input | `bg-theme-input` |
| Header tabela | `bg-theme-table-header` |
| Texto primário | `text-theme` |
| Texto secundário | `text-theme-secondary` |
| Texto muted | `text-theme-muted` |
| Borda padrão | `border-theme` |
| Borda input | `border-theme-input` |
| Borda tabela | `border-theme-table` |
| Hover | `hover:bg-theme-hover` |
| Hover tabela | `hover:bg-theme-table-hover` |

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

## Inputs e Forms

```tsx
<input
  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
/>

<select
  className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500"
>
```

## Tabelas

```tsx
<table className="w-full">
  <thead className="bg-theme-table-header border-b border-theme">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
        Coluna
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-theme-table">
    <tr className="hover:bg-theme-table-hover transition-colors">
      <td className="px-4 py-3 text-sm text-theme">Valor</td>
    </tr>
  </tbody>
</table>
```

## Documentação Completa

Ver `docs/arquitetura-paginas.md`
