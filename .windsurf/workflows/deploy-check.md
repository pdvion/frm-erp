---
description: Verifica o status do deploy na Vercel e testa a aplicação
---

# Workflow: Verificar Deploy

## Informações do Projeto
- **GitHub**: pdvion/frm-erp
- **Vercel**: frm-erp-vion-projects.vercel.app
- **Supabase ID**: jewutjydoyaimusaxvyg

## Passos

### 1. Verificar Build Local
// turbo
```bash
pnpm type-check
```

### 2. Commit e Push
```bash
git add -A
git commit -m "feat/fix/chore([modulo]): [descrição]"
git push origin main
```

### 3. Verificar Deploy Vercel
Usar MCP Vercel para verificar status:
```
mcp10_list_deployments com projectId e teamId
```

Se deploy falhou, verificar logs:
```
mcp10_get_deployment_build_logs
```

### 4. Testar URLs em Produção
URLs protegidas por Vercel Auth retornam 401/403 - isso é esperado.

Para acessar URLs protegidas:
```
mcp10_get_access_to_vercel_url ou mcp10_web_fetch_vercel_url
```

### 5. Verificar Logs de Erro
Se houver problemas em produção:
```
mcp9_get_logs com service: "api" ou "postgres"
```

## Erros Comuns de Deploy

### Build falha por tipos
- Verificar `pnpm type-check` localmente
- Erros de tipo devem ser corrigidos antes do push

### Variáveis de ambiente
- Verificar se todas as env vars estão configuradas na Vercel
- DATABASE_URL, DIRECT_URL para Supabase

### Prisma Client não gerado
- Adicionar `pnpm prisma generate` no build script se necessário
