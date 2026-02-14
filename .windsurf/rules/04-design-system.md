---
activation: always_on
description: Design System FRM ERP — componentes obrigatórios, theme tokens, zero hardcode
trigger: always_on
---

# Design System — Zero Hardcode

## Regra Absoluta

**NADA hardcoded nas páginas.** Todo elemento visual vem do DS (`src/components/ui/`).

> Se o componente não existe, **CRIE-O PRIMEIRO** no DS, depois use na página.

## Componentes Disponíveis

### Layout
| Componente | Uso |
|---|---|
| `PageHeader` | Título de página com ícone, badge e ações |
| `PageCard` | Card com título e conteúdo |
| `Modal` / `ModalFooter` | Dialog modal |
| `Drawer` | Painel lateral |
| `Tabs` | Abas de navegação |

### Formulários
| Componente | Uso |
|---|---|
| `Button` | Botão com variantes (`primary`, `outline`, `danger`, `ghost`) e `isLoading` |
| `Input` | Campo de texto |
| `Textarea` | Campo multilinha |
| `Select` | Select com prop `options` (sem children) — **NativeSelect é DEPRECATED** |
| `MaskedInput` | Input com máscara (CPF, CNPJ, etc.) |

### Feedback
| Componente | Uso |
|---|---|
| `Badge` | 13 variantes + outline. SEMPRE para status |
| `StatusBadge` | Mapeia status string automaticamente |
| `Alert` | Alertas e mensagens (info, success, warning, error) |
| `EmptyState` | Estado vazio |
| `Skeleton` | Loading skeleton |

## Theme Tokens — NUNCA Cores Hardcoded

| ❌ Proibido | ✅ Usar |
|---|---|
| `bg-white` | `bg-theme-card` |
| `bg-gray-50` | `bg-theme-secondary` |
| `bg-gray-100` | `bg-theme-tertiary` |
| `bg-gray-800/900` | `bg-theme` ou `bg-theme-card` |
| `text-gray-900` | `text-theme` |
| `text-gray-700` | `text-theme-secondary` |
| `text-gray-500/400` | `text-theme-muted` |
| `border-gray-200/300` | `border-theme` |

**Exceções permitidas:** cores semânticas (`text-red-*`, `bg-green-100`), botão primário (`bg-blue-600`).

## Badges de Status

```tsx
// ✅ CORRETO — componente do DS
import { Badge } from "@/components/ui/Badge";
<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Cancelado</Badge>

// ✅ StatusBadge — mapeia automaticamente
<StatusBadge status="ACTIVE" />

// ❌ PROIBIDO — span com classes inline
<span className="bg-green-100 text-green-800 ...">Ativo</span>
```

## Alertas e Feedback

```tsx
// ✅ CORRETO
<Alert variant="error" title="Erro ao salvar">{error.message}</Alert>

// ❌ PROIBIDO
<div className="bg-red-50 border border-red-200 ...">Erro</div>
```

## Botões e Inputs

```tsx
// ✅ CORRETO
<Button variant="primary" isLoading={isPending}>Salvar</Button>
<Input value={value} onChange={onChange} />
<Select options={options} value={value} onChange={onChange} />

// ❌ PROIBIDO — elementos HTML nativos com classes
<button className="px-4 py-2 bg-blue-600...">Salvar</button>
<input className="border rounded..." />
<select className="...">
```

## AppLayout Já Fornece Header Global

**NÃO criar** `<header>` nas páginas. **NÃO importar** CompanySwitcher, NotificationBell, UserMenu, ThemeSwitcher.

Usar `<PageHeader>` para título da página.

## Estrutura de Página Padrão

```tsx
"use client";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Package } from "lucide-react";

export default function MinhaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Título"
        icon={<Package className="w-6 h-6" />}
        backHref="/lista"
        actions={<Button>Ação</Button>}
      />
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        {/* conteúdo */}
      </div>
    </div>
  );
}
```

## Ícones — Sempre Lucide

```tsx
import { Package, Plus, Trash2 } from "lucide-react";
// Tamanhos: w-4 h-4 (inline/botão), w-5 h-5 (médio), w-6 h-6 (header)
```

## Tabelas

```tsx
<table className="w-full">
  <thead className="bg-theme-table-header border-b border-theme">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Coluna</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-theme-table">
    <tr className="hover:bg-theme-table-hover transition-colors">
      <td className="px-4 py-3 text-sm text-theme">Valor</td>
    </tr>
  </tbody>
</table>
```

## Checklist para Novas Páginas

- Zero hardcode (nenhuma classe de cor/badge/alerta inline)
- `PageHeader` para título
- `Button` do DS com `variant` explícito
- `Badge`/`StatusBadge` para status
- `Alert` para erros/feedback
- Theme tokens para backgrounds e bordas
- Espaçamento consistente (`space-y-6`, `gap-4`)
- Ícones Lucide
- Responsividade mobile
- Testar tema claro E escuro
