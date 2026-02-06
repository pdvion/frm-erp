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
Verificar status do deploy na Vercel Dashboard ou via GitHub Actions.

Se deploy falhou, verificar logs no painel da Vercel.

### 4. Testar URLs em Produção
URLs protegidas por Vercel Auth retornam 401/403 - isso é esperado.

### 5. Verificar Logs de Erro
Se houver problemas em produção:
```
mcp7_get_logs com service: "api" ou "postgres"
```

## ⚠️ REGRA CRÍTICA: Analisar Logs Antes de Corrigir

**NUNCA assumir a causa de um erro de deploy sem analisar os logs primeiro.**

### Processo Obrigatório ao Falhar Deploy

1. **Obter os logs de build**:
   - Pedir ao usuário os logs da Vercel
   - Ou verificar no painel da Vercel

2. **Ler a mensagem de erro completa**:
   - Identificar o arquivo/linha específico
   - Entender o contexto do erro

3. **Só então propor correção** baseada no erro real

### Anti-Padrões a Evitar
- ❌ Assumir que é problema de memória sem ver os logs
- ❌ Assumir que é problema de plano/limite sem evidência
- ❌ Fazer múltiplas correções "tentativa e erro"
- ❌ Ignorar a mensagem de erro específica

## Erros Comuns de Deploy (referência, não suposição)

| Erro | Causa | Solução |
|------|-------|---------|
| `JavaScript heap out of memory` | Memória insuficiente | `NODE_OPTIONS='--max-old-space-size=4096'` |
| `@supabase/ssr: URL and API key required` | Prerender sem env vars | `export const dynamic = "force-dynamic"` no layout |
| `Module not found` | Dependência faltando | Verificar imports e package.json |
| `Type error` | Erro TypeScript | Corrigir tipo específico |
| `ENOENT` | Arquivo não encontrado | Verificar path do arquivo |

### Build falha por tipos
- Verificar `pnpm type-check` localmente
- Erros de tipo devem ser corrigidos antes do push

### Variáveis de ambiente
- Verificar se todas as env vars estão configuradas na Vercel
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`, `DIRECT_URL` para Supabase

### Prisma Client não gerado
- Adicionar `pnpm prisma generate` no build script se necessário
