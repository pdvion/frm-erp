# Estratégia de Autenticação - FRM ERP

## Resumo Executivo

Este documento define a estratégia de autenticação para o FRM ERP, priorizando **segurança**, **auditoria** e **experiência do usuário**.

## Decisão: Supabase Auth Nativo

### Por que Supabase Auth (e não Third-Party)?

| Critério | Supabase Auth | Third-Party (Auth0, Clerk) |
|----------|---------------|---------------------------|
| **Custo** | Incluído no plano | Custo adicional por usuário |
| **Integração** | Nativa com RLS | Requer configuração extra |
| **MFA** | ✅ TOTP + SMS | ✅ Varia por provider |
| **Audit Logs** | ✅ Nativo | ✅ Varia por provider |
| **Complexidade** | Baixa | Média-Alta |
| **Controle** | Total | Dependente do provider |

**Decisão**: Usar **Supabase Auth nativo** com todas as funcionalidades de segurança habilitadas.

### Justificativa

1. **Grupo FRM tem ~10 empresas** - Volume não justifica custo de Auth0/Clerk
2. **Multi-tenant já implementado** - Supabase RLS integra perfeitamente
3. **Controle total** - Sem dependência de terceiros
4. **Audit logs nativos** - Compliance sem custo extra

---

## Arquitetura de Autenticação

### Níveis de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                    NÍVEL 3 - CRÍTICO                        │
│  Operações financeiras, aprovações, configurações           │
│  → MFA obrigatório (TOTP) + Session timeout curto           │
├─────────────────────────────────────────────────────────────┤
│                    NÍVEL 2 - SENSÍVEL                       │
│  Cadastros, movimentações de estoque, NFe                   │
│  → MFA recomendado + Audit log detalhado                    │
├─────────────────────────────────────────────────────────────┤
│                    NÍVEL 1 - BÁSICO                         │
│  Consultas, relatórios, visualizações                       │
│  → Autenticação padrão + Audit log básico                   │
└─────────────────────────────────────────────────────────────┘
```

### Métodos de Autenticação

| Método | Uso | Prioridade |
|--------|-----|------------|
| **Email + Senha** | Login principal | P0 |
| **MFA TOTP** | Segundo fator (Google Authenticator, 1Password) | P0 |
| **Magic Link** | Recuperação e primeiro acesso | P1 |
| **OAuth Google** | Login corporativo (opcional) | P2 |
| **SSO SAML** | Grandes clientes (futuro) | P3 |

---

## Funcionalidades de Segurança

### 1. Multi-Factor Authentication (MFA)

**Implementação**: TOTP (Time-based One-Time Password)

```typescript
// Enrollment
const { data } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Meu Autenticador'
});

// Challenge
const { data: challenge } = await supabase.auth.mfa.challenge({
  factorId: 'xxx'
});

// Verify
const { data: verify } = await supabase.auth.mfa.verify({
  factorId: 'xxx',
  challengeId: challenge.id,
  code: '123456'
});
```

**Políticas de MFA**:

| Perfil | MFA |
|--------|-----|
| Administrador | Obrigatório |
| Financeiro | Obrigatório |
| Compras (aprovador) | Obrigatório |
| Operador | Recomendado |
| Consulta | Opcional |

### 2. Audit Logs

**Supabase Auth Audit Logs** (automático):
- Login/Logout
- Falhas de autenticação
- Mudanças de senha
- Enrollment/Unenroll MFA
- Refresh de tokens

**Audit Logs da Aplicação** (já implementado):
- CRUD de entidades
- Aprovações
- Movimentações de estoque
- Alterações de configuração

### 3. Session Management

```typescript
// Configurações recomendadas
{
  // Tempo de vida do JWT
  jwt_expiry: 3600, // 1 hora
  
  // Refresh token
  refresh_token_rotation_enabled: true,
  
  // Inatividade
  session_timeout: 1800, // 30 minutos
  
  // Dispositivos simultâneos
  max_sessions_per_user: 3
}
```

### 4. Rate Limiting

| Endpoint | Limite |
|----------|--------|
| Login | 5 tentativas / 15 min |
| Magic Link | 3 / hora |
| Password Reset | 3 / hora |
| MFA Verify | 5 / 5 min |

### 5. Password Policy

```typescript
{
  min_length: 8,
  require_uppercase: true,
  require_lowercase: true,
  require_number: true,
  require_special: false, // Opcional mas recomendado
  prevent_reuse: 5, // Últimas 5 senhas
  max_age_days: 90 // Expiração
}
```

---

## Fluxos de Autenticação

### Login Padrão

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Email  │────▶│  Senha  │────▶│   MFA   │────▶│  Home   │
│         │     │         │     │ (se ativo)│    │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                     │
                     ▼ (falha)
              ┌─────────────┐
              │ Rate Limit  │
              │ ou Bloqueio │
              └─────────────┘
```

### Primeiro Acesso

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Convite │────▶│  Magic  │────▶│  Criar  │────▶│  Setup  │
│  Email  │     │  Link   │     │  Senha  │     │   MFA   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

### Recuperação de Senha

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Esqueci │────▶│  Email  │────▶│  Nova   │────▶│  Login  │
│  Senha  │     │  Reset  │     │  Senha  │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

---

## Integração com Multi-Tenant

### RLS com AAL (Authenticator Assurance Level)

```sql
-- Política para operações críticas (requer MFA)
CREATE POLICY "Operações críticas requerem MFA"
  ON financial_operations
  AS RESTRICTIVE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'aal') = 'aal2'
  );

-- Política padrão (aceita aal1 ou aal2)
CREATE POLICY "Acesso padrão"
  ON materials
  TO authenticated
  USING (
    company_id = (SELECT auth.jwt()->>'company_id')::uuid
  );
```

### Contexto de Empresa no JWT

```typescript
// Custom claims no JWT
{
  "sub": "user-uuid",
  "email": "user@frm.com.br",
  "aal": "aal2",
  "app_metadata": {
    "company_id": "company-uuid",
    "companies": ["company-1", "company-2"],
    "role": "admin"
  }
}
```

---

## Componentes a Implementar

### Páginas

| Página | Rota | Descrição |
|--------|------|-----------|
| Login | `/login` | Email + senha |
| Registro | `/register` | Primeiro acesso via convite |
| Esqueci Senha | `/forgot-password` | Solicitar reset |
| Reset Senha | `/reset-password` | Definir nova senha |
| Setup MFA | `/mfa/setup` | Configurar TOTP |
| Verify MFA | `/mfa/verify` | Verificar código |
| Perfil | `/profile` | Dados e segurança |
| Sessões | `/profile/sessions` | Gerenciar dispositivos |

### Componentes

| Componente | Descrição |
|------------|-----------|
| `AuthProvider` | Context de autenticação |
| `ProtectedRoute` | HOC para rotas protegidas |
| `MFAGuard` | Verificar se MFA é necessário |
| `SessionTimeout` | Aviso de inatividade |
| `LoginForm` | Formulário de login |
| `MFASetup` | Wizard de configuração MFA |
| `MFAVerify` | Input de código TOTP |

### Hooks

| Hook | Descrição |
|------|-----------|
| `useAuth` | Estado de autenticação |
| `useUser` | Dados do usuário |
| `useMFA` | Estado e ações MFA |
| `useSession` | Gerenciamento de sessão |
| `useCompany` | Empresa ativa |

---

## Cronograma de Implementação

### Fase 1 - Fundação (Sprint 1)
- [ ] Configurar Supabase Auth
- [ ] Implementar login/logout
- [ ] Criar páginas de auth
- [ ] Integrar com multi-tenant

### Fase 2 - Segurança (Sprint 2)
- [ ] Implementar MFA TOTP
- [ ] Configurar políticas de senha
- [ ] Habilitar audit logs
- [ ] Rate limiting

### Fase 3 - UX (Sprint 3)
- [ ] Magic link
- [ ] Gerenciamento de sessões
- [ ] Timeout por inatividade
- [ ] Notificações de segurança

### Fase 4 - Avançado (Futuro)
- [ ] OAuth Google (opcional)
- [ ] SSO SAML (grandes clientes)
- [ ] Biometria mobile

---

## Referências

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase Audit Logs](https://supabase.com/docs/guides/auth/audit-logs)
- [NIST AAL Guidelines](https://pages.nist.gov/800-63-3-Implementation-Resources/63B/AAL/)
