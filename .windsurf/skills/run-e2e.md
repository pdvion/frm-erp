# Skill: Rodar Testes E2E

## Descrição
Como rodar testes E2E específicos com Playwright para validar alterações de frontend.

## Pré-requisitos
- Playwright instalado: `pnpm add -D @playwright/test`
- Browsers instalados: `npx playwright install`

## Comandos

### Rodar teste específico
```bash
npx playwright test tests/e2e/<nome>.spec.ts
```

### Rodar todos os testes E2E
```bash
npx playwright test
```

### Rodar com UI (debug)
```bash
npx playwright test --ui
```

### Rodar em modo headed (ver browser)
```bash
npx playwright test --headed
```

### Rodar teste específico em modo debug
```bash
npx playwright test tests/e2e/<nome>.spec.ts --debug
```

## Testes Disponíveis

### Autenticação
```bash
npx playwright test tests/e2e/auth.spec.ts
```
- Login/logout
- Forgot password
- MFA setup/verify

### Navegação
```bash
npx playwright test tests/e2e/navigation.spec.ts
```
- Menu lateral
- Breadcrumbs
- Rotas protegidas

## Quando Rodar

- **Alterações em auth**: Rodar `auth.spec.ts`
- **Alterações em navegação/layout**: Rodar `navigation.spec.ts`
- **Antes de PR**: Rodar todos os testes E2E
