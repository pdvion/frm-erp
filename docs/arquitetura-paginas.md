# Arquitetura Padrão de Páginas - FRM ERP

## Princípio Fundamental

> **Páginas NÃO devem definir seu próprio layout.**
> O `AppLayout` global já fornece Sidebar, Header e tema consistente.

## Estrutura Correta

```tsx
"use client";

import { PageHeader, PageCard, PageButton } from "@/components/ui";

export default function ExamplePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Título da Página"
        subtitle="Descrição opcional"
        backHref="/lista"
        actions={<PageButton>Ação</PageButton>}
      />
      
      <PageCard title="Seção">
        {/* Conteúdo */}
      </PageCard>
    </div>
  );
}
```

## ❌ O que NÃO fazer

```tsx
// ERRADO - Define layout próprio
export default function WrongPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        {/* Header duplicado */}
      </header>
      <main>...</main>
    </div>
  );
}
```

## Componentes Disponíveis

### PageHeader
Header de página com título, ícone, badge de status e ações.

```tsx
<PageHeader
  title="Requisição #123"
  icon={<Package className="w-6 h-6" />}
  backHref="/requisitions"
  badge={{ label: "Aprovada", color: "text-green-800", bgColor: "bg-green-100" }}
  actions={
    <>
      <PageButton variant="danger" icon={<Ban />}>Cancelar</PageButton>
      <PageButton variant="success" icon={<Check />}>Aprovar</PageButton>
    </>
  }
/>
```

### PageCard
Card com título opcional e conteúdo.

```tsx
<PageCard title="Informações" subtitle="Detalhes do registro">
  <PageInfoList items={[
    { label: "Status", value: "Ativo" },
    { label: "Criado em", value: "20/01/2026" },
  ]} />
</PageCard>
```

### PageTable
Tabela responsiva com colunas tipadas.

```tsx
<PageTable
  columns={[
    { key: "name", header: "Nome" },
    { key: "status", header: "Status", align: "center" },
    { key: "value", header: "Valor", align: "right" },
  ]}
  data={items}
  keyExtractor={(item) => item.id}
  rowClassName={(item) => item.isActive ? "bg-green-900/20" : ""}
/>
```

### PageTimeline
Timeline de eventos/histórico.

```tsx
<PageTimeline events={[
  {
    id: "1",
    title: "Criada",
    timestamp: "20/01/2026 14:30",
    user: "João Silva",
    icon: <Clock className="w-4 h-4 text-zinc-500" />,
    iconBgColor: "bg-zinc-800",
  },
  {
    id: "2",
    title: "Aprovada",
    timestamp: "20/01/2026 15:00",
    icon: <Check className="w-4 h-4 text-green-500" />,
    iconBgColor: "bg-green-900/50",
  },
]} />
```

### PageInfoList
Lista de informações chave-valor.

```tsx
<PageInfoList items={[
  { label: "Tipo", value: "Produção" },
  { label: "Prioridade", value: <Badge color="red">Urgente</Badge> },
]} />
```

### PageButton
Botão padronizado com variantes.

```tsx
<PageButton variant="primary" icon={<Plus />}>Novo</PageButton>
<PageButton variant="danger" icon={<Trash />} isLoading={deleting}>Excluir</PageButton>
<PageButton variant="ghost" size="sm">Cancelar</PageButton>
```

**Variantes:** `primary`, `secondary`, `danger`, `success`, `warning`, `ghost`
**Tamanhos:** `sm`, `md`, `lg`

## Sistema de Temas

O sistema suporta **3 modos de tema**:
- **Claro** - Tema light
- **Escuro** - Tema dark  
- **Sistema** - Segue preferência do SO

O usuário pode alternar via `ThemeSwitcher` no header.

### Classes de Tema (CSS Variables)

Use classes de tema em vez de cores hardcoded para garantir compatibilidade:

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

### Exemplo de Input com Tema

```tsx
<input
  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500"
/>
```

### Exemplo de Tabela com Tema

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

## Responsividade

Todos os componentes são responsivos por padrão:
- Mobile: Stack vertical, padding reduzido
- Desktop: Layout horizontal, mais espaço

Use classes Tailwind para ajustes específicos:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">Conteúdo principal</div>
  <div>Sidebar</div>
</div>
```

## Checklist de Nova Página

- [ ] Não usar `min-h-screen` ou cores fixas (`bg-gray-*`, `bg-zinc-*`)
- [ ] Não criar `<header>` próprio
- [ ] Não duplicar `CompanySwitcher`
- [ ] Usar `PageHeader` para título e ações
- [ ] Usar `PageCard` para seções
- [ ] Usar classes de tema (`bg-theme-*`, `text-theme-*`, `border-theme-*`)
- [ ] Testar em mobile
- [ ] Testar alternância de tema (Light/Dark)
