---
activation: always_on
description: Verificações obrigatórias antes de criar arquivos — buscar existente, ler router, verificar schema
trigger: always_on
---

# Antes de Escrever Código — Verificações Obrigatórias

## 1. SEMPRE Verificar Existência Antes de Criar

Antes de criar qualquer arquivo (router, lib, componente, página):

```bash
# Buscar por nome do módulo/feature
find src -iname "*nome*" -type f

# Buscar por função/classe que pretende criar
grep -r "NomeFuncao" src/
```

Se encontrar: **LER → AVALIAR → ESTENDER**. NÃO duplicar.

### Anti-patterns a evitar:
- Criar `src/lib/nfe/parser.ts` quando já existe `src/lib/nfe-parser.ts`
- Criar router sem verificar se já está no index
- Duplicar lógica de parsing/validação existente
- Criar componente que já existe com nome diferente

## 2. SEMPRE Ler o Router Antes de Implementar Página

Antes de escrever código frontend que consome tRPC, **ler o arquivo do router**:

```bash
cat src/server/routers/modulo.ts | head -100
```

Mapear: procedures disponíveis, input esperado, estrutura de retorno.

### Padrões de retorno variam entre routers:

| Router | Procedure | Retorno |
|---|---|---|
| customers | list | `{ customers, total, pages }` |
| materials | list | `{ materials, pagination }` |
| bankAccounts | list | Array direto |

**NUNCA assumir** — sempre verificar.

## 3. SEMPRE Verificar Campos do Model

```bash
# Buscar modelo no schema (agora modularizado em prisma/schema/*.prisma)
grep -A 50 "model NomeModelo {" prisma/schema/*.prisma
```

### Nomes frequentemente errados:

| Assumido | Correto (verificar) |
|---|---|
| `jobPosition` | `position` |
| `employeeId` | `userId` ou `workerId` |
| `categoryName` | `name` ou `title` |
| `createdDate` | `createdAt` |
| `name` (Material) | `description` |
| `name` (Customer) | `companyName` |

## 4. SEMPRE Verificar Branches/PRs Pendentes

```bash
# Ver branches locais com nome da feature
git branch -a | grep -i "feature"

# Ver se código já existe em main
git log --oneline -20
```

Antes de fazer merge de branches antigas:
1. Verificar se o código já foi integrado por outro caminho
2. Se houver conflitos, analisar se são por duplicação
3. Preferir NÃO fazer merge se funcionalidade já existe

## 5. SEMPRE Verificar Routers Registrados

```bash
# Listar routers
ls src/server/routers/

# Verificar se router está no index
grep "nomeRouter" src/server/routers/index.ts
```

## 6. SEMPRE Verificar Services Existentes

```bash
ls src/server/services/
```

Se a lógica que você precisa já existe em um service, **use-o** em vez de reimplementar.

## Checklist Rápido

- [ ] Busquei por arquivos com nome similar?
- [ ] Busquei por funções/classes relacionadas?
- [ ] Li o router antes de implementar a página?
- [ ] Verifiquei os campos do model no schema?
- [ ] Verifiquei branches/PRs pendentes?
- [ ] Verifiquei services existentes?
