---
description: Padrões do Design System para componentes de front-end
---

# Workflow: Design System FRM ERP

## 🚨 REGRA ABSOLUTA: ZERO HARDCODE

**NADA deve ser hardcoded nas páginas.** Todo elemento visual DEVE vir de um componente do Design System.

> Se o componente não existe no DS, **CRIE-O PRIMEIRO** em `src/components/ui/` e depois use-o na página.
> NUNCA escrever classes CSS de cor, borda, badge ou alerta diretamente nas páginas.

### Antes de qualquer código de UI:
```bash
ls src/components/ui/
```

### Fluxo obrigatório:
1. **Precisa de um elemento visual?** → Buscar em `src/components/ui/`
2. **Existe componente?** → Usar o componente
3. **Não existe?** → **Criar o componente no DS primeiro**, depois usar
4. **NUNCA** pular o passo 3 e colocar classes inline na página

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

### 🚫 PROIBIDO: Qualquer cor hardcoded nas páginas

```tsx
// ❌ PROIBIDO: classes de cor inline em páginas
<span className="bg-green-100 text-green-800 ...">Ativo</span>
<div className="bg-red-50 border border-red-200 ...">Erro</div>
<span className="text-orange-400">Aviso</span>

// ✅ CORRETO: usar componentes do DS
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

<Badge variant="success">Ativo</Badge>
<Alert variant="error">{error.message}</Alert>
```

### Badges de Status → Componente `Badge`
```tsx
import { Badge } from "@/components/ui/Badge";

// Variantes disponíveis: default | success | warning | error | info
<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="info">Aprovado</Badge>
<Badge variant="error">Cancelado</Badge>
<Badge variant="default">Inativo</Badge>

// Para statusConfig, mapear status → variant do Badge:
const statusVariant: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  PENDING: "warning",
  APPROVED: "info",
  CANCELLED: "error",
  INACTIVE: "default",
};

// Na renderização:
<Badge variant={statusVariant[item.status]}>{statusLabel[item.status]}</Badge>
```

### Mensagens de Erro/Feedback → Componente `Alert`
```tsx
import { Alert } from "@/components/ui/Alert";

// Variantes: info | success | warning | error
<Alert variant="error" title="Erro ao salvar">
  {error.message}
</Alert>

<Alert variant="success">
  Registro salvo com sucesso!
</Alert>

<Alert variant="warning" title="Atenção">
  Existem campos não preenchidos.
</Alert>
```

### Se precisar de nova variante de cor
> **NÃO** adicione classes inline. Adicione a variante ao componente do DS.
> Exemplo: se precisar de um Badge roxo, adicione `purple` ao `Badge.tsx`, não escreva `bg-purple-100 text-purple-800` na página.

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

## 🚫 PROIBIDO - Hardcode de qualquer tipo

### Elementos HTML nativos
```tsx
// ❌ <button>, <input>, <select>, <textarea> inline
<button className="px-4 py-2 bg-blue-600...">Salvar</button>
// ✅ Componente do DS
<Button variant="primary">Salvar</Button>
<Input value={value} onChange={onChange} />
<Select options={options} value={value} onChange={onChange} />
<Textarea value={value} onChange={onChange} rows={4} />
```

### Cores e estilos inline
```tsx
// ❌ Classes de cor/borda/bg diretamente em páginas
<span className="bg-green-100 text-green-800 ...">Ativo</span>
<div className="bg-red-50 border border-red-200 ...">Erro</div>
<div className="bg-white dark:bg-gray-800">Card</div>

// ✅ Componentes do DS + theme tokens
<Badge variant="success">Ativo</Badge>
<Alert variant="error">{error.message}</Alert>
<div className="bg-theme-card">Card</div>
```

### Regra de Ouro
> **Se existe em `src/components/ui/`, USE-O.**
> **Se não existe, CRIE-O no DS primeiro, depois use.**
> **NUNCA pule essa etapa e coloque estilos inline.**

## Checklist para Novas Páginas

- [ ] **ZERO HARDCODE**: nenhuma classe de cor/badge/alerta inline
- [ ] Usar `PageHeader` para título
- [ ] Usar `Button` do DS (com `variant` explícito)
- [ ] Usar `Badge` do DS para status (NUNCA `<span>` com classes)
- [ ] Usar `Alert` do DS para erros/feedback (NUNCA `<div>` com classes)
- [ ] Usar **theme tokens** para backgrounds e bordas de layout
- [ ] Se precisar de variante nova → adicionar ao componente do DS
- [ ] Usar espaçamento consistente (p-6, space-y-6)
- [ ] Ícones do Lucide
- [ ] Não duplicar componentes existentes
- [ ] Verificar responsividade mobile
- [ ] Testar no tema claro E escuro
