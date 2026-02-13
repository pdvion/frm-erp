---
trigger: always
description: Qualidade de código — pre-commit, TypeScript strict, conventional commits, error handling
---

# Code Quality — Regras Obrigatórias

## Pre-Commit Obrigatório

**NUNCA fazer push sem executar e todos passarem:**

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit && pnpm lint && npx vitest run && pnpm build
```

Se qualquer um falhar, **NÃO commitar**. Corrigir primeiro.

### Após Mudança no Schema Prisma

```bash
pnpm prisma generate    # Regenerar cliente
pnpm type-check         # Verificar TODO o projeto (não apenas arquivos alterados)
```

Mudanças no schema podem quebrar código em arquivos NÃO modificados. Testes unitários usam mocks e NÃO detectam erros de tipo do Prisma.

## Credential Redaction

**NUNCA** retornar password/token em responses:

```typescript
// ✅ CORRETO — redactar campos sensíveis
return {
  ...config,
  password: config.password ? "••••••••" : null,
  token: config.token ? "••••••••" : null,
};

// ❌ ERRADO — retorna plaintext
return ctx.prisma.nfseConfig.findUnique({ where: { companyId } });
```

Nunca logar senhas, tokens ou PIIs. Variáveis de ambiente para secrets.

## Conventional Commits

```bash
git commit -m "tipo(escopo): VIO-XXX descrição"
```

Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`.

## Mutations com onError — OBRIGATÓRIO no Frontend

```typescript
const createMutation = trpc.modulo.create.useMutation({
  onSuccess: (data) => {
    router.push(`/modulo/${data.id}`);
  },
  onError: (error) => {
    toast.error(`Erro ao criar: ${error.message}`);
  },
});
```

## Queries — Tratar 3 Estados

Sempre tratar `isLoading`, `isError` e empty state:

```tsx
if (isLoading) return <Skeleton />;
if (isError) return <Alert variant="error">{error.message}</Alert>;
if (!data?.items?.length) return <EmptyState />;
```

## TypeScript Strict

```typescript
// ❌ NUNCA
any                          // usar unknown
catch (e) { e.message }     // usar catch (e: unknown)

// ✅ SEMPRE
as const                     // para literais
?? undefined                 // para converter null
import type { X }            // quando possível
```

## Imports

- Sempre no topo do arquivo
- Remover não-utilizados
- Usar `@/` para absolutos
- `import type` quando possível

## Erros Comuns e Soluções

| Erro | Solução |
|---|---|
| `mode: "insensitive"` type error | `mode: "insensitive" as const` |
| `null not assignable to undefined` | `value ?? undefined` |
| `Decimal not assignable to number` | `Number(value)` |
| `InputJsonValue` type error | `data as Prisma.InputJsonValue` |
| `boolean \| null` not assignable | `value ?? false` |
| Module has no exported member | `pnpm prisma generate` |
