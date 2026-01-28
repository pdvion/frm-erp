---
description: Validar e mapear routers tRPC antes de implementar páginas
---

# Workflow: Integração com Routers tRPC

## Contexto

Antes de implementar qualquer página que consome dados via tRPC, é **OBRIGATÓRIO** mapear os routers disponíveis para evitar:
- Usar procedures que não existem
- Passar parâmetros incorretos
- Acessar campos inexistentes no retorno
- Criar código que falha no type-check

## Passos

### 1. Identificar o Router do Módulo

```bash
# Listar routers disponíveis
ls src/server/routers/

# Verificar se router está registrado no index
grep "nomeRouter" src/server/routers/index.ts
```

### 2. Mapear Procedures Disponíveis

**ANTES de escrever qualquer código**, ler o arquivo do router:

```bash
# Ver estrutura do router
cat src/server/routers/modulo.ts | head -100
```

Documentar as procedures encontradas:

| Procedure | Tipo | Input | Output |
|-----------|------|-------|--------|
| list | query | search?, page?, limit? | items, total, pages |
| create | mutation | campo1, campo2 | id, ... |
| update | mutation | id, campo1? | id, ... |

### 3. Verificar Estrutura de Retorno

**CRÍTICO**: Cada router pode retornar estruturas diferentes!

#### Padrões Comuns de Retorno

| Router | Procedure | Retorno |
|--------|-----------|---------|
| customers | list | customers, total, pages |
| materials | list | materials, pagination |
| sales | listQuotes | quotes, total, pages |
| sales | listOrders | orders, total, pages |
| bankAccounts | list | Array direto |

### 4. Verificar Campos do Model Prisma

Antes de usar campos, verificar se existem:

```bash
# Buscar modelo no schema
grep -A 50 "model Material {" prisma/schema.prisma
```

#### Campos Comuns que NÃO Existem

| Modelo | Campo Esperado | Campo Real |
|--------|----------------|------------|
| Material | salePrice | lastPurchasePrice |
| Material | name | description |
| Customer | name | companyName |

### 5. Verificar Fluxos de Negócio

Alguns módulos têm fluxos específicos:

#### Vendas (Sales)
- Cotação -> Pedido -> Fatura
- createQuote -> convertQuoteToOrder -> billing
- **NÃO existe** createSalesOrder direto

#### Compras (Purchases)
- Cotação -> Pedido -> Recebimento

### 6. Checklist de Validação

Antes de implementar a página:

- [ ] Li o arquivo do router
- [ ] Documentei as procedures disponíveis
- [ ] Verifiquei a estrutura de retorno
- [ ] Verifiquei os campos do modelo no schema.prisma
- [ ] Identifiquei o fluxo de negócio
- [ ] Usei os nomes corretos de campos

Antes de fazer commit:

- [ ] pnpm type-check passa sem erros
- [ ] pnpm lint passa sem warnings
- [ ] Testei a página localmente

## Erros Comuns e Soluções

### Property X does not exist on type

Causa: Acessando campo que não existe no retorno
Solução: Verificar estrutura real do retorno

### Argument of type X is not assignable to parameter of type Y

Causa: Passando objeto com campos diferentes do esperado
Solução: Ajustar tipo do parâmetro para campos reais

### Property X does not exist on type CreateTRPCReactBase

Causa: Procedure não existe no router
Solução: Verificar procedures disponíveis no arquivo do router

## Referência Rápida de Routers

| Router | Procedures Principais |
|--------|----------------------|
| customers | list, byId, create, update |
| materials | list, byId, create, update |
| sales | listLeads, listQuotes, listOrders, createQuote, convertQuoteToOrder |
| bankAccounts | list, byId, create, transfer |
| payables | list, byId, create, pay |
| receivables | list, byId, create, receive |
