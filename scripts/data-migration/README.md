# FRM Data Migration Toolkit

Ferramentas para validação e importação de dados de sistemas legados para o FRM ERP.

## Estrutura

```
data-migration/
├── README.md           # Esta documentação
├── validate.ts         # CLI unificado de validação
├── schemas/            # Schemas Zod por entidade
│   ├── customer.ts     # Schema de clientes
│   ├── material.ts     # Schema de materiais
│   ├── nfe.ts          # Schema de NFe
│   └── index.ts        # Exportações
├── parsers/            # Parsers por formato
│   ├── csv.ts          # Parser CSV genérico
│   ├── json.ts         # Parser JSON
│   ├── xml-nfe.ts      # Parser XML NFe
│   └── index.ts        # Exportações
└── importers/          # Importadores por entidade
    ├── nfe-batch.ts    # Importação em lote de NFe
    └── index.ts        # Exportações
```

## Uso

### Validar dados legados (CSV/JSON)

```bash
npx tsx scripts/data-migration/validate.ts --type legacy --file dados.csv
```

### Validar XMLs de NFe

```bash
npx tsx scripts/data-migration/validate.ts --type nfe --file nota.xml
npx tsx scripts/data-migration/validate.ts --type nfe --dir ./xmls/
```

### Importar NFe em lote

```bash
npx tsx scripts/data-migration/validate.ts --type nfe --dir ./xmls/ --import
```

## Formatos Suportados

### Dados Legados
- CSV com headers
- JSON array
- JSON lines

### NFe
- XML NFe 4.00
- XML NFe 3.10 (legado)
- XML nfeProc (com protocolo)

## Entidades Validadas

| Entidade | Campos Obrigatórios |
|----------|---------------------|
| Material | código, descrição, unidade |
| Cliente | razaoSocial, cnpj/cpf |
| Fornecedor | razaoSocial, cnpj |
| NFe | chaveAcesso, emitente, destinatário, itens |

## Relatório de Validação

O toolkit gera um relatório detalhado com:

- Total de registros processados
- Registros válidos
- Registros com erros (com detalhes)
- Registros duplicados
- Tempo de processamento

## Extensibilidade

Para adicionar suporte a novas entidades:

1. Criar schema em `schemas/nova-entidade.ts`
2. Criar parser em `parsers/` se necessário
3. Criar importador em `importers/` se necessário
4. Registrar no CLI `validate.ts`

## Migração de Sistemas Legados

Este toolkit foi projetado para migração de qualquer sistema legado, não apenas Delphi. Os schemas são baseados no modelo de dados do FRM ERP e validam a conformidade dos dados antes da importação.
