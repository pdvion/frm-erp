# Fluxo de Desenvolvimento e Code Review

## Visão Geral

Este documento define o fluxo de desenvolvimento, code review e publicação do projeto FRM ERP.

## Branches

| Branch | Propósito | Proteção |
|--------|-----------|----------|
| `main` | Produção | ✅ Protegida |
| `develop` | Integração | ✅ Protegida |
| `feature/vio-XXX-desc` | Features | - |
| `fix/vio-XXX-desc` | Correções | - |
| `hotfix/vio-XXX-desc` | Hotfixes | - |

## Fluxo de Trabalho

### 1. Criar Feature Branch

```bash
# A partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/vio-123-nova-funcionalidade
```

### 2. Desenvolver

- Fazer commits seguindo Conventional Commits
- Referenciar issue do Linear no commit

```bash
git commit -m "feat(module): VIO-123 descrição da mudança"
```

### 3. Push e Pull Request

```bash
git push origin feature/vio-123-nova-funcionalidade
```

Criar PR no GitHub:
- **Base**: `develop`
- **Compare**: `feature/vio-123-nova-funcionalidade`
- **Título**: `feat(module): VIO-123 Descrição`
- **Descrição**: Template abaixo

### 4. Code Review

#### Reviewers
- **Automático**: CodeRabbit AI (configurado via `.github/coderabbit.yaml`)
- **Manual**: Membros da equipe quando necessário

#### Checklist de Review

- [ ] Código segue padrões do projeto
- [ ] TypeScript strict (sem `any`)
- [ ] Testes passando (se aplicável)
- [ ] Sem console.log ou código de debug
- [ ] Commits seguem Conventional Commits
- [ ] Issue do Linear referenciada
- [ ] Documentação atualizada (se necessário)

### 5. Merge

Após aprovação:
1. Squash and merge para `develop`
2. Deletar branch de feature
3. Atualizar issue no Linear para "Done"

### 6. Deploy para Produção

```bash
# Merge develop -> main
git checkout main
git pull origin main
git merge develop
git push origin main
```

Deploy automático via Vercel.

## Conventional Commits

### Tipos

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (sem mudança de código) |
| `refactor` | Refatoração |
| `test` | Testes |
| `chore` | Manutenção |

### Formato

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Exemplos

```bash
feat(auth): VIO-367 implementar login com Supabase
fix(materials): VIO-380 corrigir filtro por categoria
docs: atualizar README com instruções de setup
chore: atualizar dependências
```

## Template de Pull Request

```markdown
## Descrição

Breve descrição das mudanças.

## Issue

Closes VIO-XXX

## Tipo de Mudança

- [ ] Nova feature
- [ ] Bug fix
- [ ] Refatoração
- [ ] Documentação
- [ ] Outro: ___

## Checklist

- [ ] Código segue padrões do projeto
- [ ] Testei localmente
- [ ] Atualizei documentação (se necessário)
- [ ] Não há console.log ou código de debug

## Screenshots (se aplicável)

[Adicionar screenshots]
```

## CodeRabbit AI

### Configuração

O CodeRabbit está configurado para revisar automaticamente PRs. Configuração em `.github/coderabbit.yaml`.

### Comandos

| Comando | Descrição |
|---------|-----------|
| `@coderabbitai review` | Solicitar review |
| `@coderabbitai summary` | Resumo das mudanças |
| `@coderabbitai resolve` | Marcar comentário como resolvido |

## CI/CD

### GitHub Actions

1. **Build**: Verifica se o projeto compila
2. **Type Check**: `pnpm type-check`
3. **Lint**: `pnpm lint` (se configurado)
4. **Tests**: `pnpm test` (se configurado)

### Vercel

- Deploy automático em push para `main`
- Preview deploys para PRs
- URL: https://frm-erp-vion-projects.vercel.app

## Ambientes

| Ambiente | Branch | URL |
|----------|--------|-----|
| Produção | `main` | frm-erp-vion-projects.vercel.app |
| Preview | PRs | *.vercel.app |
| Local | - | localhost:3000 |

## Supabase

- **Projeto**: POC Delphi FRM
- **ID**: jewutjydoyaimusaxvyg
- **Região**: sa-east-1

### Migrations

```bash
# NUNCA usar prisma migrate diretamente
# Usar Supabase MCP ou Dashboard
```

## Contatos

- **Projeto Linear**: POC Delphi FRM - Migração ERP
- **Equipe**: Vion
- **Repositório**: github.com/pdvion/frm-erp
