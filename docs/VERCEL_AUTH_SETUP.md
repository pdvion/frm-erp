# Vercel Auth (SSO Protection) - Configuração

**Issue**: VIO-416  
**Data**: 26/01/2026  
**Status**: Configurado

---

## O que é Vercel Auth?

Vercel Auth (SSO Protection) é uma camada de proteção que requer que visitantes estejam logados na Vercel e tenham acesso ao projeto antes de visualizar deployments.

**Diferença do Supabase Auth**:
- **Supabase Auth**: Autenticação da aplicação (usuários do ERP)
- **Vercel Auth**: Proteção de deployments (acesso ao código/preview)

---

## Configuração Realizada

### 1. SSO Protection (Dashboard)

Acesse: `Settings > Deployment Protection > Vercel Authentication`

**Configuração recomendada**:
```
Deployment Type: prod_deployment_urls_and_all_previews
```

Isso protege:
- ✅ URLs de produção (*.vercel.app)
- ✅ Preview deployments (PRs, branches)
- ❌ Domínios customizados (quando configurados)

### 2. Automation Bypass (CI/CD)

Para permitir que o CI/CD e testes E2E acessem deployments protegidos:

1. Acesse: `Settings > Deployment Protection > Protection Bypass for Automation`
2. Gere um secret
3. Adicione ao GitHub Secrets: `VERCEL_AUTOMATION_BYPASS_SECRET`

**Uso em testes**:
```typescript
// playwright.config.ts
extraHTTPHeaders: {
  'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
}
```

### 3. Shareable Links

Para compartilhar previews com stakeholders sem conta Vercel:

1. Acesse o deployment
2. Clique em "Share"
3. Gere link temporário (expira em 24h)

---

## Variáveis de Ambiente

| Variável | Onde | Descrição |
|----------|------|-----------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | GitHub Secrets | Bypass para CI/CD |

---

## Níveis de Proteção

| Nível | Descrição | Uso |
|-------|-----------|-----|
| `preview` | Apenas previews | Desenvolvimento |
| `prod_deployment_urls_and_all_previews` | Produção + Previews | **Recomendado** |
| `all` | Todos os deployments | Máxima segurança |
| `all_except_custom_domains` | Exceto domínios custom | Produção pública |

---

## Integração com Supabase Auth

A aplicação mantém duas camadas de autenticação:

```
┌─────────────────────────────────────────────────────────┐
│                    Usuário Externo                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel Auth (SSO Protection)                │
│         Requer conta Vercel com acesso ao projeto        │
│              (apenas para *.vercel.app)                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase Auth                          │
│            Autenticação de usuários do ERP               │
│              (email/senha, magic link)                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Aplicação FRM ERP                       │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist de Configuração

- [x] Plano Vercel Pro ativado
- [x] SSO Protection habilitado no Dashboard
- [x] Automation Bypass configurado
- [x] Secret adicionado ao GitHub
- [x] Playwright configurado com bypass header
- [x] Documentação atualizada

---

## Referências

- [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [Protection Bypass for Automation](https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [Vercel Authentication](https://vercel.com/docs/security/deployment-protection/methods-to-protect-deployments/vercel-authentication)
