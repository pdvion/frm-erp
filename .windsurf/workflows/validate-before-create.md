---
description: Validar existência de código/feature antes de criar novos arquivos
---

# Workflow: Validar Antes de Criar

**OBRIGATÓRIO** antes de criar qualquer novo arquivo de código (router, lib, componente, página).

## Passos

### 1. Verificar se já existe arquivo similar

```bash
# Buscar por nome do módulo/feature
find src -iname "*<nome>*" -type f

# Buscar por padrão no nome
find src -iname "*parser*" -o -iname "*client*" -o -iname "*router*"
```

### 2. Buscar código relacionado no projeto

```bash
# Buscar por função/classe que pretende criar
grep -r "<NomeFuncao>" src/

# Buscar por imports relacionados
grep -r "import.*<modulo>" src/
```

### 3. Verificar routers existentes

```bash
# Listar todos os routers
ls -la src/server/routers/

# Verificar se router já está no index
grep "<nomeRouter>" src/server/routers/index.ts
```

### 4. Verificar libs existentes

```bash
# Listar libs
ls -la src/lib/

# Buscar por funcionalidade específica
grep -r "<funcionalidade>" src/lib/
```

### 5. Se encontrar código existente

- **LER** o arquivo existente antes de qualquer ação
- **AVALIAR** se atende à necessidade
- **ESTENDER** se precisar de funcionalidades adicionais
- **NÃO DUPLICAR** código existente

### 6. Se não encontrar

- Confirmar com busca adicional por termos relacionados
- Só então criar o novo arquivo

## Checklist Rápido

- [ ] Busquei por arquivos com nome similar?
- [ ] Busquei por funções/classes relacionadas?
- [ ] Verifiquei o index de routers?
- [ ] Li o conteúdo de arquivos encontrados?
- [ ] Confirmei que não existe código que atenda à necessidade?

## Exemplos de Erros a Evitar

❌ Criar `src/lib/nfe/parser.ts` quando já existe `src/lib/nfe-parser.ts`
❌ Criar novo router sem verificar se já está no index
❌ Duplicar lógica de parsing/validação
❌ Criar componente que já existe com nome diferente

## Comandos Úteis

```bash
# Buscar todos os arquivos TypeScript
find src -name "*.ts" -o -name "*.tsx" | head -50

# Buscar por padrão em todos os arquivos
grep -rl "parseNFe" src/

# Ver estrutura de diretórios
tree src/lib -L 2
tree src/server/routers -L 1
```
