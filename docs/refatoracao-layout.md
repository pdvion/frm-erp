# Refatoração de Layout - FRM ERP

## Problema Identificado

O sistema possui **101 páginas** que definem seu próprio layout em vez de usar o `AppLayout` global. Isso causa:

1. **Headers duplicados** - Cada página tem seu próprio header com `CompanySwitcher`
2. **Sidebar não visível** - O sidebar existe mas fica escondido atrás do conteúdo
3. **Inconsistência visual** - Algumas páginas usam `bg-gray-50`, outras `bg-zinc-950`
4. **Navegação quebrada** - Usuário não consegue navegar entre módulos

## Arquitetura Atual

```
layout.tsx
└── AppLayout.tsx (tem Sidebar + Header global)
    └── page.tsx (define OUTRO layout com header próprio)
        └── Conteúdo sobrepõe o AppLayout
```

## Arquitetura Desejada

```
layout.tsx
└── AppLayout.tsx (Sidebar + Header global)
    └── page.tsx (apenas conteúdo, sem layout próprio)
```

## Páginas Afetadas

Todas as páginas que contêm:
- `min-h-screen bg-gray-50`
- `<header>` próprio
- `CompanySwitcher` duplicado

### Lista de Arquivos (101 páginas)

```bash
grep -r "min-h-screen bg-gray-50" src/app --include="*.tsx" -l
```

## Plano de Refatoração

### Fase 1: Padronizar Cores (Baixo Risco)
- Trocar `bg-gray-50` por `bg-transparent` ou remover
- Manter estrutura atual funcionando

### Fase 2: Remover Headers Duplicados (Médio Risco)
- Remover `<header>` das páginas
- Remover `CompanySwitcher` duplicado
- Ajustar padding/margin do conteúdo

### Fase 3: Ajustar Responsividade (Alto Risco)
- Testar todas as páginas em mobile
- Ajustar breakpoints
- Garantir que sidebar funciona

## Script de Migração

```bash
# Identificar páginas afetadas
grep -r "min-h-screen bg-gray-50" src/app --include="*.tsx" -l > pages-to-fix.txt

# Para cada página, aplicar transformação:
# 1. Remover wrapper min-h-screen
# 2. Remover header próprio
# 3. Ajustar classes do conteúdo
```

## Padrão de Página Correta

```tsx
"use client";

import { trpc } from "@/lib/trpc";
// ... outros imports

export default function ExamplePage() {
  // ... hooks e lógica

  return (
    <div className="space-y-6">
      {/* Título da página */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Título</h1>
        <button>Ação</button>
      </div>

      {/* Conteúdo */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        {/* ... */}
      </div>
    </div>
  );
}
```

## Prioridade de Migração

1. **Alta** - Páginas mais usadas (Dashboard, Requisições, Materiais)
2. **Média** - Módulos completos (Compras, Estoque, Financeiro)
3. **Baixa** - Páginas de configuração e relatórios

## Estimativa

- **Tempo**: 2-3 dias de trabalho
- **Risco**: Médio (pode quebrar funcionalidades)
- **Teste**: Requer teste manual de todas as páginas

## Decisão Pendente

Antes de iniciar, decidir:
1. Manter tema dark (`bg-zinc-*`) ou light (`bg-gray-*`)?
2. Migrar todas as páginas de uma vez ou incrementalmente?
3. Criar componentes reutilizáveis para headers de página?
