# Arquitetura: Integração SEFAZ/eSocial com mTLS

## Visão Geral

Integração com webservices governamentais usando Supabase Edge Functions para mTLS.

## Arquitetura

```
Next.js App (tRPC) → Supabase Edge Function (Deno mTLS) → SEFAZ/eSocial
                            ↓
                     Supabase Vault (Certificado A1)
```

## Componentes

### 1. tRPC Router (`src/server/routers/sefaz.ts`)
- Recebe requisições do frontend
- Chama Supabase Edge Function via `fetch`
- Processa resposta e retorna ao cliente

### 2. Supabase Edge Function (`supabase/functions/sefaz-proxy`)
- Implementa mTLS com `Deno.connectTls()`
- Busca certificado do Supabase Vault
- Envia requisições SOAP para SEFAZ/eSocial
- Retorna resposta para o tRPC

### 3. Supabase Vault
- Armazena certificado PEM e chave privada
- Acesso seguro via variáveis de ambiente

## Fluxo de Dados

1. Frontend chama `trpc.sefaz.consultarNFeDestinadas`
2. Router tRPC faz `fetch` para Edge Function
3. Edge Function busca certificado do Vault
4. Edge Function conecta via mTLS com SEFAZ
5. Resposta retorna pelo mesmo caminho

## Segurança

- Certificado nunca sai do Supabase
- Comunicação interna via HTTPS
- Logs de acesso no Supabase

## Issues Relacionadas

- VIO-956: Implementação mTLS
- VIO-923: Bug SEFAZ (bloqueada)
- VIO-596: Epic Integração SEFAZ
- VIO-407: Epic eSocial
