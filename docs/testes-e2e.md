# Testes E2E - FRM ERP

## Visão Geral

Os testes E2E (End-to-End) do FRM ERP utilizam **Playwright** para validar fluxos completos da aplicação, incluindo navegação, CRUD, responsividade e multi-tenant.

## Estrutura de Arquivos

```
tests/e2e/
├── auth.spec.ts          # Autenticação e login
├── dashboard.spec.ts     # Dashboard e métricas
├── materials.spec.ts     # CRUD de materiais
├── suppliers.spec.ts     # CRUD de fornecedores
├── inventory.spec.ts     # Gestão de estoque
├── receiving.spec.ts     # Recebimento de materiais
├── payables.spec.ts      # Contas a pagar
├── sefaz.spec.ts         # Integração SEFAZ/NFe
├── theme.spec.ts         # Alternância de tema (light/dark)
├── multi-tenant.spec.ts  # Isolamento de dados por empresa
├── crud.spec.ts          # CRUD completo (materiais, fornecedores, cotações, pedidos)
├── navigation.spec.ts    # Navegação entre páginas
└── mobile.spec.ts        # Responsividade e UX mobile
```

## Configuração

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
    { name: 'tablet', use: { ...devices['iPad Pro 11'] } },
  ],
});
```

## Comandos

```bash
# Executar todos os testes
pnpm test:e2e

# Executar testes específicos
pnpm test:e2e tests/e2e/materials.spec.ts

# Executar apenas em chromium
pnpm test:e2e --project=chromium

# Executar apenas testes mobile
pnpm test:e2e --project=mobile-chrome --project=mobile-safari

# Executar com UI interativa
pnpm test:e2e --ui

# Gerar relatório HTML
pnpm test:e2e --reporter=html

# Debug mode
pnpm test:e2e --debug
```

## Categorias de Testes

### 1. Autenticação (`auth.spec.ts`)
- Login com credenciais válidas
- Login com credenciais inválidas
- Logout
- Redirecionamento para login quando não autenticado
- Persistência de sessão

### 2. Tema (`theme.spec.ts`)
- Alternância entre light/dark mode
- Persistência do tema após refresh
- Aplicação correta de CSS variables
- Contraste adequado em ambos os temas

### 3. Multi-Tenant (`multi-tenant.spec.ts`)
- Seletor de empresa visível
- Troca de empresa atualiza dados
- Dados compartilhados (isShared)
- Contexto mantido entre páginas
- Isolamento de dados por empresa
- Permissões por empresa

### 4. CRUD (`crud.spec.ts`)
- **Create**: Criar registros, validar campos obrigatórios
- **Read**: Listar, filtrar, paginar, ver detalhes
- **Update**: Editar registros, cancelar edição
- **Delete**: Confirmar antes de excluir

### 5. Navegação (`navigation.spec.ts`)
- Navegação via sidebar
- Listagem → Detalhes → Voltar
- Detalhes → Edição
- Breadcrumbs
- Filtros na URL
- Busca
- Paginação
- Menu expansível
- Navegação por teclado

### 6. Mobile (`mobile.spec.ts`)
- Menu hamburger
- Tabelas responsivas
- Cards em coluna única
- Tamanho de botões para touch (mín. 44x44)
- Tamanho de inputs para touch
- Scroll suave
- Formulários em layout vertical
- Swipe em listas
- Modais em tela cheia
- Espaçamento entre elementos
- Acessibilidade (labels, contraste, foco)

## Boas Práticas

### 1. Aguardar Carregamento
```typescript
// ❌ Evitar
await page.waitForTimeout(1000);

// ✅ Preferir
await page.waitForLoadState('networkidle');
await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
```

### 2. Seletores Resilientes
```typescript
// ❌ Evitar seletores frágeis
await page.locator('.btn-primary').click();

// ✅ Preferir seletores semânticos
await page.getByRole('button', { name: /salvar/i }).click();
await page.getByLabel(/descrição/i).fill('texto');
```

### 3. Verificações Flexíveis
```typescript
// ✅ Verificar múltiplas possibilidades
const successMessage = page.getByText(/sucesso|criado|cadastrado/i);
const newItem = page.getByText(`Item ${timestamp}`);
await expect(successMessage.or(newItem)).toBeVisible({ timeout: 5000 });
```

### 4. Tratamento de Elementos Opcionais
```typescript
// ✅ Verificar se elemento existe antes de interagir
const editLink = page.locator('a[title="Editar"]').first();
if (await editLink.isVisible({ timeout: 3000 }).catch(() => false)) {
  await editLink.click();
}
```

### 5. Dados de Teste Únicos
```typescript
// ✅ Usar timestamp para dados únicos
const timestamp = Date.now();
await page.getByLabel(/código/i).fill(`${timestamp}`);
await page.getByLabel(/descrição/i).fill(`Material Teste E2E ${timestamp}`);
```

## Viewports de Teste

| Dispositivo | Largura | Altura | Projeto |
|-------------|---------|--------|---------|
| Desktop Chrome | 1280 | 720 | chromium |
| Desktop Firefox | 1280 | 720 | firefox |
| Pixel 5 | 393 | 851 | mobile-chrome |
| iPhone 13 | 390 | 844 | mobile-safari |
| iPad Pro 11 | 834 | 1194 | tablet |

## Checklist para Novos Testes

- [ ] Usar `test.describe` para agrupar testes relacionados
- [ ] Usar `test.beforeEach` para setup comum (login)
- [ ] Usar seletores semânticos (getByRole, getByLabel, getByText)
- [ ] Aguardar carregamento com `waitForLoadState` ou `expect().toBeVisible()`
- [ ] Tratar elementos opcionais com `.catch(() => false)`
- [ ] Usar dados únicos com timestamp
- [ ] Verificar em múltiplos viewports quando relevante
- [ ] Documentar o que o teste valida

## Troubleshooting

### Teste falha intermitentemente
- Aumentar timeout: `{ timeout: 10000 }`
- Usar `waitForLoadState('networkidle')`
- Verificar se há race conditions

### Elemento não encontrado
- Verificar se o seletor está correto
- Usar `page.pause()` para debug interativo
- Verificar se o elemento está visível no viewport

### Teste passa localmente mas falha no CI
- Verificar variáveis de ambiente
- Aumentar retries no CI
- Verificar se o servidor está pronto antes dos testes

## Integração com CI

Os testes E2E são executados automaticamente no GitHub Actions:

```yaml
- name: Run E2E tests
  run: pnpm test:e2e --project=chromium
  env:
    BASE_URL: http://localhost:3000
```

## Métricas de Cobertura

| Área | Testes | Status |
|------|--------|--------|
| Autenticação | 5 | ✅ |
| Dashboard | 4 | ✅ |
| Materiais | 6 | ✅ |
| Fornecedores | 4 | ✅ |
| Cotações | 3 | ✅ |
| Pedidos de Compra | 3 | ✅ |
| Tema | 5 | ✅ |
| Multi-tenant | 6 | ✅ |
| CRUD Completo | 15 | ✅ |
| Navegação | 12 | ✅ |
| Mobile | 15 | ✅ |

**Total: ~78 testes**
