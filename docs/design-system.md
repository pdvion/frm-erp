# Design System FRM

## Visão Geral

O Design System FRM define os padrões visuais e componentes reutilizáveis do sistema ERP.

## Paleta de Cores

### Cores Primárias (extraídas da logo FRM)

| Nome | Variável CSS | Hex | Uso |
|------|--------------|-----|-----|
| **Primary** | `--frm-primary` | `#1a3a6e` | Headers, botões principais, logo |
| **Dark** | `--frm-dark` | `#0f2847` | Hover states, textos escuros |
| **Light** | `--frm-light` | `#2a5a9e` | Links, accents, focus rings |
| **Lighter** | `--frm-lighter` | `#3d6cb8` | Hover em links |

### Escala de Cores

| Nome | Variável CSS | Hex | Uso |
|------|--------------|-----|-----|
| **50** | `--frm-50` | `#e8eef6` | Backgrounds sutis |
| **100** | `--frm-100` | `#c5d4e8` | Gradientes, borders |
| **200** | `--frm-200` | `#9fb8d9` | Disabled states |
| **300** | `--frm-300` | `#789cca` | Placeholders |
| **400** | `--frm-400` | `#5a85be` | Secondary text |
| **500** | `--frm-500` | `#3d6eb2` | Icons |
| **600** | `--frm-600` | `#1a3a6e` | = Primary |
| **700** | `--frm-700` | `#152f5a` | Hover dark |
| **800** | `--frm-800` | `#0f2847` | = Dark |
| **900** | `--frm-900` | `#0a1c33` | Textos principais |

### Cores Semânticas

| Contexto | Cor | Uso |
|----------|-----|-----|
| **Success** | `green-600` | Confirmações, status ativo |
| **Warning** | `yellow-600` | Alertas, pendências |
| **Error** | `red-600` | Erros, exclusões |
| **Info** | `blue-600` | Informações |

## Tipografia

### Fonte Principal
- **Família**: Geist Sans (via Next.js)
- **Fallback**: Arial, Helvetica, sans-serif

### Escala Tipográfica

| Elemento | Classe | Tamanho | Peso |
|----------|--------|---------|------|
| H1 | `text-2xl font-bold` | 24px | 700 |
| H2 | `text-xl font-semibold` | 20px | 600 |
| H3 | `text-lg font-semibold` | 18px | 600 |
| Body | `text-base` | 16px | 400 |
| Small | `text-sm` | 14px | 400 |
| Caption | `text-xs` | 12px | 400 |

## Componentes

### Button

```tsx
// Variantes
<Button variant="primary">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost">Voltar</Button>
<Button variant="danger">Excluir</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>
```

### Input

```tsx
<Input 
  label="E-mail"
  placeholder="seu@email.com"
  error="Campo obrigatório"
  icon={<Mail />}
/>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

### Badge

```tsx
<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Cancelado</Badge>
<Badge variant="default">Rascunho</Badge>
```

## Ícones

Usamos **Lucide Icons** como biblioteca padrão.

### Ícones por Contexto

| Contexto | Ícone | Import |
|----------|-------|--------|
| Materiais | `Package` | `lucide-react` |
| Fornecedores | `Users` | `lucide-react` |
| Estoque | `Warehouse` | `lucide-react` |
| Pedidos | `ShoppingCart` | `lucide-react` |
| NFe | `FileInput` | `lucide-react` |
| Configurações | `Settings` | `lucide-react` |
| Perfil | `User` | `lucide-react` |
| Segurança | `Shield` | `lucide-react` |

## Espaçamento

Usamos a escala do TailwindCSS:

| Nome | Valor | Uso |
|------|-------|-----|
| `p-2` | 8px | Padding interno de ícones |
| `p-4` | 16px | Padding de cards |
| `p-6` | 24px | Padding de seções |
| `p-8` | 32px | Padding de páginas |
| `gap-2` | 8px | Gap entre ícone e texto |
| `gap-4` | 16px | Gap entre elementos |
| `gap-6` | 24px | Gap entre cards |

## Bordas e Sombras

### Border Radius

| Elemento | Classe |
|----------|--------|
| Botões | `rounded-lg` (8px) |
| Cards | `rounded-xl` (12px) |
| Modais | `rounded-2xl` (16px) |
| Avatares | `rounded-full` |

### Sombras

| Elemento | Classe |
|----------|--------|
| Cards | `shadow-sm` |
| Modais | `shadow-xl` |
| Dropdowns | `shadow-lg` |

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/styles/theme.ts` | Design tokens em TypeScript |
| `src/app/globals.css` | Variáveis CSS globais |
| `src/components/ui/` | Componentes base |

## Uso

### CSS Variables

```css
.meu-elemento {
  background: var(--frm-primary);
  color: white;
}

.meu-elemento:hover {
  background: var(--frm-dark);
}
```

### Tailwind Classes

```tsx
<div className="bg-[var(--frm-primary)] text-white hover:bg-[var(--frm-dark)]">
  Conteúdo
</div>
```

### Theme TypeScript

```tsx
import { frmColors } from "@/styles/theme";

const style = {
  backgroundColor: frmColors.primary,
};
```
