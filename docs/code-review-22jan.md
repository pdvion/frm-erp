# Code Review - 22/01/2026

## Arquivos Analisados
- `src/lib/sefaz/nfe-emitter.ts`
- `tests/e2e/theme.spec.ts`
- `tests/e2e/multi-tenant.spec.ts`
- `tests/e2e/crud.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `tests/e2e/mobile.spec.ts`

---

## 🔴 Crítico (Critical)

### CR-001: Variáveis não utilizadas no NFeEmitter
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Linha:** 490-491, 617-620
**Descrição:** A propriedade `config` e `wsUrls` são armazenadas mas nunca utilizadas nos métodos.
**Impacto:** Código morto que aumenta complexidade e pode causar confusão.
**Correção:** Remover ou implementar uso real das propriedades.

### CR-002: Falta de validação de entrada no gerarChaveAcesso
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Linha:** 248-271
**Descrição:** A função não valida se os parâmetros são válidos (CNPJ com 14 dígitos, UF válida, etc).
**Impacto:** Pode gerar chaves de acesso inválidas silenciosamente.
**Correção:** Adicionar validações de entrada.

### CR-003: Parâmetros não utilizados em inutilizar()
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Linha:** 617-620
**Descrição:** Os parâmetros `serie`, `numeroInicial` e `numeroFinal` não são utilizados.
**Impacto:** Lint warning e código incompleto.
**Correção:** Adicionar eslint-disable ou implementar uso.

---

## 🟠 Alto (High)

### CR-004: Credenciais hardcoded nos testes E2E
**Arquivo:** Todos os arquivos `tests/e2e/*.spec.ts`
**Linha:** Múltiplas (beforeEach)
**Descrição:** Email e senha estão hardcoded em todos os testes.
**Impacto:** Risco de segurança se o repositório for público; dificulta manutenção.
**Correção:** Usar variáveis de ambiente ou arquivo de configuração.

### CR-005: Timeout hardcoded sem constante
**Arquivo:** Todos os arquivos `tests/e2e/*.spec.ts`
**Descrição:** Valores de timeout (5000, 10000, 3000) estão espalhados pelo código.
**Impacto:** Dificulta ajustes e manutenção.
**Correção:** Criar constantes para timeouts.

### CR-006: Falta de tratamento para UFs não mapeadas
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Linha:** 194-217
**Descrição:** Apenas SP está mapeado nos URLs dos Web Services.
**Impacto:** Falha silenciosa para outras UFs (usa SP como fallback).
**Correção:** Adicionar todas as UFs ou lançar erro para UF não suportada.

---

## 🟡 Médio (Medium)

### CR-007: Magic numbers no cálculo do dígito verificador
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Linha:** 229-243
**Descrição:** Números mágicos (2, 3, 4, 5, 6, 7, 8, 9, 11) sem explicação.
**Impacto:** Dificulta entendimento do algoritmo.
**Correção:** Adicionar comentários explicativos ou constantes nomeadas.

### CR-008: Duplicação de código nos beforeEach dos testes
**Arquivo:** Todos os arquivos `tests/e2e/*.spec.ts`
**Descrição:** O código de login é repetido em cada arquivo de teste.
**Impacto:** Violação do DRY; dificulta manutenção.
**Correção:** Criar fixture ou helper de autenticação.

### CR-009: Uso de waitForTimeout em vez de waitFor
**Arquivo:** `tests/e2e/navigation.spec.ts`, `tests/e2e/mobile.spec.ts`
**Linha:** Múltiplas
**Descrição:** `waitForTimeout(500)` é usado em vez de aguardar condição específica.
**Impacto:** Testes flaky e mais lentos.
**Correção:** Usar `waitFor` com condição específica.

### CR-010: Falta de tipagem explícita em algumas funções
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Linha:** 222, 276, 291
**Descrição:** Funções internas sem tipagem de retorno explícita.
**Impacto:** Menor clareza do código.
**Correção:** Adicionar tipos de retorno explícitos.

---

## 🔵 Baixo (Low)

### CR-011: Comentários TODO sem issue vinculada
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Linha:** 518, 522, 547, 558, 581, 605, 633
**Descrição:** Múltiplos TODOs sem referência a issue do Linear.
**Impacto:** TODOs podem ser esquecidos.
**Correção:** Criar issues no Linear e referenciar.

### CR-012: Falta de JSDoc em interfaces públicas
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Descrição:** Interfaces exportadas não têm documentação JSDoc.
**Impacto:** Menor usabilidade da API.
**Correção:** Adicionar JSDoc com descrição e exemplos.

### CR-013: Inconsistência no uso de aspas
**Arquivo:** `tests/e2e/*.spec.ts`
**Descrição:** Mistura de aspas simples e duplas em regex.
**Impacto:** Inconsistência de estilo.
**Correção:** Padronizar uso de aspas.

---

## 📝 Nitpick

### CR-014: Ordem dos imports
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Descrição:** Apenas um import, mas quando houver mais, organizar por tipo.
**Correção:** Manter imports externos primeiro, depois internos.

### CR-015: Espaçamento em objetos grandes
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Linha:** 305-481
**Descrição:** Objeto NFe muito grande em uma única função.
**Correção:** Considerar extrair para funções auxiliares.

### CR-016: Nomes de variáveis em português/inglês misturados
**Arquivo:** `src/lib/sefaz/nfe-emitter.ts`
**Descrição:** Mistura de `chaveAcesso`, `dataEmissao` com `success`, `error`.
**Correção:** Padronizar idioma (preferir português para domínio fiscal brasileiro).

---

## Resumo

| Severidade | Quantidade |
|------------|------------|
| 🔴 Crítico | 3 |
| 🟠 Alto | 3 |
| 🟡 Médio | 4 |
| 🔵 Baixo | 3 |
| 📝 Nitpick | 3 |
| **Total** | **16** |

## Próximos Passos
1. Criar issues no Linear para cada item
2. Corrigir itens críticos e altos primeiro
3. Corrigir médios e baixos
4. Aplicar nitpicks se tempo permitir
