---
description: Padrões do Design System para componentes de front-end
---

# Workflow: Design System FRM ERP

## ⚠️ OBRIGATÓRIO: Usar Componentes do Design System

**SEMPRE** antes de criar componentes de UI, verificar se já existe no Design System:

```bash
ls src/components/ui/
```

## Componentes Disponíveis

### Layout e Estrutura
| Componente | Uso |
|------------|-----|
| `PageHeader` | Cabeçalho de página com título, ícone e ações |
| `PageCard` | Card com título e conteúdo |
| `Card` | Card genérico com variantes |
| `Modal` | Modal/Dialog |
| `Drawer` | Painel lateral |
| `Tabs` | Abas de navegação |
| `Wizard` | Wizard multi-step |

### Formulários
| Componente | Uso |
|------------|-----|
| `Button` | Botão com variantes e loading |
| `Input` | Campo de texto |
| `Textarea` | Campo de texto multilinha |
| `Select` | Select com prop `options` (sem children) |
| `NativeSelect` | Select com children `<option>` (drop-in para `<select>`) |
| `FormField` | Campo com label e erro |
| `FormGrid` | Grid responsivo para formulários |
| `SelectWithAdd` | Select com opção de adicionar novo |
| `MaskedInput` | Input com máscara |

### Tabelas e Dados
| Componente | Uso |
|------------|-----|
| `PageTable` | Tabela responsiva tipada |
| `ServerDataTable` | Tabela com paginação server-side |
| `AccessibleTable` | Tabela acessível |
| `AdvancedFilters` | Filtros avançados |
| `ExportButtons` | Botões de exportação |

### Feedback
| Componente | Uso |
|------------|-----|
| `Alert` | Alertas e mensagens |
| `Badge` | Badges e tags |
| `EmptyState` | Estado vazio |
| `Skeleton` | Loading skeleton |
| `Toaster` | Notificações toast |

### Navegação
| Componente | Uso |
|------------|-----|
| `Breadcrumbs` | Breadcrumbs |
| `LinkButton` | Link estilizado como botão |

## Padrões de Estilo

### ⚠️ OBRIGATÓRIO: Usar Theme Tokens (NÃO hardcoded)

O projeto usa **design tokens** via CSS custom properties. NUNCA usar cores hardcoded como `bg-white dark:bg-gray-800`.

### Tabela de Tokens de Cor
| Token | Uso | Exemplo |
|-------|-----|---------|
| `bg-theme-card` | Background de cards | `<div className="bg-theme-card">` |
| `bg-theme-secondary` | Background secundário | Table headers, seções |
| `bg-theme-tertiary` | Background terciário | Nested cards |
| `bg-theme-hover` | Hover state | `hover:bg-theme-hover` |
| `bg-theme-table-header` | Header de tabelas | `<thead className="bg-theme-table-header">` |
| `bg-theme-table-hover` | Hover em linhas | `hover:bg-theme-table-hover` |
| `border-theme` | Bordas padrão | `border border-theme` |
| `border-theme-input` | Bordas de inputs | `border-theme-input` |
| `divide-theme-table` | Divisores de tabela | `divide-y divide-theme-table` |
| `text-theme` | Texto primário | `<h1 className="text-theme">` |
| `text-theme-secondary` | Texto secundário | Labels, subtítulos |
| `text-theme-muted` | Texto muted | Placeholders, hints |

### 🚫 PROIBIDO: Cores Dark-Only

**NUNCA** usar cores que só funcionam no dark mode sem par light:

```tsx
// ❌ PROIBIDO: dark-only (invisível no tema claro)
"bg-green-900/50 text-green-400"
"bg-red-900/20 border-red-800 text-red-400"
"text-orange-400"

// ✅ CORRETO: sempre pares light + dark
"bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
"bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400"
"text-orange-600 dark:text-orange-400"
```

### Padrão de Badges de Status
```tsx
// Template para statusConfig com cores light+dark
const statusConfig = {
  ACTIVE:    { label: "Ativo",     color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400" },
  PENDING:   { label: "Pendente",  color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  APPROVED:  { label: "Aprovado",  color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  INACTIVE:  { label: "Inativo",   color: "bg-theme-secondary text-theme-secondary" },
};
```

### Padrão de Mensagens de Erro
```tsx
// ✅ Correto: com pares light+dark
<div className="p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
  {error.message}
</div>
```

### Cores Semânticas (accent)
```tsx
// Accent — estes já são visíveis em ambos os temas
text-blue-600 dark:text-blue-400
bg-blue-600 hover:bg-blue-700
```

### Espaçamento
```tsx
// Página
<div className="p-6 space-y-6">

// Cards
<div className="p-4 space-y-4">

// Gaps
gap-2  // Pequeno (8px)
gap-4  // Médio (16px)
gap-6  // Grande (24px)
```

### Botões
```tsx
// Usar componente Button
import { Button } from "@/components/ui/Button";

<Button variant="primary" isLoading={isPending}>
  Salvar
</Button>

<Button variant="outline" onClick={handleCancel}>
  Cancelar
</Button>

<Button variant="danger" onClick={handleDelete}>
  Excluir
</Button>
```

### Ícones
```tsx
// Sempre usar Lucide
import { Package, Plus, Trash2 } from "lucide-react";

// Tamanhos padrão
<Icon size={16} />  // Inline
<Icon size={20} />  // Botão
<Icon size={24} />  // Header
```

## Estrutura de Página Padrão

```tsx
"use client";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Package } from "lucide-react";

export default function MinhaPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Título da Página"
        subtitle="Descrição opcional"
        icon={<Package size={24} />}
        actions={
          <Button variant="primary">
            Ação Principal
          </Button>
        }
      />

      {/* Conteúdo */}
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        {/* ... */}
      </div>
    </div>
  );
}
```

## 🚫 PROIBIDO - Elementos HTML Nativos

### NUNCA usar elementos HTML nativos para UI:

```tsx
// ❌ PROIBIDO: <button> inline
<button className="px-4 py-2 bg-blue-600...">Salvar</button>
// ✅ CORRETO: Button do Design System
<Button>Salvar</Button>

// ❌ PROIBIDO: <input> inline
<input type="text" className="w-full px-3 py-2 border..." />
// ✅ CORRETO: Input ou FormField
<Input value={value} onChange={onChange} />
<FormField label="Nome"><Input /></FormField>

// ❌ PROIBIDO: <select> inline
<select className="w-full px-3 py-2 border...">
// ✅ CORRETO: Select (com prop options) ou NativeSelect (com children)
<Select options={options} value={value} onChange={onChange} />
<NativeSelect value={value} onChange={onChange}>
  <option value="a">A</option>
</NativeSelect>

// ❌ PROIBIDO: <textarea> inline
<textarea className="w-full px-3 py-2 border..." rows={4} />
// ✅ CORRETO: Textarea do Design System
<Textarea value={value} onChange={onChange} rows={4} />
```

### Regra de Ouro
> **Se existe no `src/components/ui/`, USE-O. Se não existe, CRIE-O primeiro.**

## ❌ NÃO FAZER

```tsx
// ❌ Não criar botões inline
<button className="px-4 py-2 bg-blue-600...">

// ❌ Não usar cores hardcoded (nem com dark mode manual)
<div className="bg-white dark:bg-gray-800">  // Use bg-theme-card

// ❌ Não duplicar componentes existentes
// Verificar src/components/ui/ primeiro!

// ❌ Não usar min-h-screen (AppLayout já fornece)
<div className="min-h-screen bg-gray-50">
```

## ✅ FAZER

```tsx
// ✅ Usar Button do Design System
<Button variant="primary">Salvar</Button>

// ✅ Usar theme tokens (suporta light+dark automaticamente)
<div className="bg-theme-card">

// ✅ Usar componentes existentes
import { PageHeader, Button, Card } from "@/components/ui";

// ✅ Estrutura simples sem layout próprio
<div className="p-6 space-y-6">
```

## Checklist para Novas Páginas

- [ ] Usar `PageHeader` para título
- [ ] Usar `Button` do Design System (com variant explícito)
- [ ] Usar **theme tokens** para cores (NUNCA hardcoded)
- [ ] Badges de status com pares light+dark
- [ ] Mensagens de erro com pares light+dark
- [ ] Usar espaçamento consistente (p-6, space-y-6)
- [ ] Ícones do Lucide
- [ ] Não duplicar componentes existentes
- [ ] Verificar responsividade mobile
- [ ] Testar no tema claro E escuro
