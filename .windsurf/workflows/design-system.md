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

### Cores (Dark Mode)
```tsx
// Backgrounds
bg-white dark:bg-gray-800        // Card principal
bg-gray-50 dark:bg-gray-750      // Card secundário
bg-gray-100 dark:bg-gray-700     // Hover

// Bordas
border-gray-200 dark:border-gray-700

// Texto
text-gray-900 dark:text-gray-100  // Primário
text-gray-500 dark:text-gray-400  // Secundário

// Accent
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
// ✅ CORRETO: Select ou SelectWithAdd
<Select options={options} value={value} onChange={onChange} />

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

// ❌ Não usar cores hardcoded sem dark mode
<div className="bg-white">

// ❌ Não duplicar componentes existentes
// Verificar src/components/ui/ primeiro!

// ❌ Não usar min-h-screen (AppLayout já fornece)
<div className="min-h-screen bg-gray-50">
```

## ✅ FAZER

```tsx
// ✅ Usar Button do Design System
<Button variant="primary">Salvar</Button>

// ✅ Sempre incluir dark mode
<div className="bg-white dark:bg-gray-800">

// ✅ Usar componentes existentes
import { PageHeader, Button, Card } from "@/components/ui";

// ✅ Estrutura simples sem layout próprio
<div className="p-6 space-y-6">
```

## Checklist para Novas Páginas

- [ ] Usar `PageHeader` para título
- [ ] Usar `Button` do Design System
- [ ] Incluir classes dark mode
- [ ] Usar espaçamento consistente (p-6, space-y-6)
- [ ] Ícones do Lucide
- [ ] Não duplicar componentes existentes
- [ ] Verificar responsividade mobile
