# SPEC: Arquitetura do Catálogo de Produtos FRM

> Documento de especificação para implementação no FRM-ERP.
> Contexto: higienização do cadastro + estrutura avançada de catálogo seguindo padrões SKF/NTN/Timken.

---

## 1. Decisão Arquitetural: Reconciliação Material ↔ Product

### Situação Atual
Existem duas entidades paralelas: `Material` (operacional, ~50 campos, ligada a compras/estoque/produção) e `Product` (comercial/catálogo, com `specifications Json?`, imagens, vídeos, anexos). O `Product` aponta para `Material` via `materialId` opcional.

### Decisão
**NÃO unificar as tabelas.** Manter a separação Material (operacional) × Product (catálogo), mas tornar a relação obrigatória e bidirecional:

- Todo `Product` DEVE ter um `materialId` (remover a opcionalidade).
- O `Material` é a entidade-mestre para compras, estoque, fiscal.
- O `Product` é a camada de enriquecimento: especificações técnicas estruturadas, mídia, conteúdo, SEO, cross-reference.
- Campos duplicados entre Material e Product (como `description`) devem ter uma fonte de verdade definida: Material é fonte para dados operacionais, Product é fonte para dados voltados ao cliente/catálogo.

### Migração
- Popular `materialId` em todos os `Product` existentes que ainda não têm.
- Criar `Product` para cada `Material` ativo que ainda não tem um Product correspondente, com status `DRAFT`.
- Validar que a relação é 1:1 (um Material = um Product).

---

## 2. Taxonomia Estruturada (4 Níveis)

### Alterações no model `ProductCategory`

Adicionar os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `level` | Enum `CategoryLevel` | DOMAIN, CATEGORY, SUBFAMILY, SERIES |
| `normReference` | String? | Norma aplicável: DIN, ASTM, JIS, ABNT |
| `technicalCode` | String? | Código técnico da categoria (ex: "RE" para Rolamento de Esferas) |
| `icon` | String? | Ícone para UI |

### Enum `CategoryLevel`
```
DOMAIN      // Nível 1: Grande Família (ex: Transmissão de Potência, Vedação)
CATEGORY    // Nível 2: Tipo (ex: Rolamentos, Mancais, Buchas, Polias, Cardans)
SUBFAMILY   // Nível 3: Aplicação/Carga (ex: Leve, Normal, Médio, Pesado)
SERIES      // Nível 4: Série (ex: 6200, SNL 500, UCP)
```

### Regra de Integridade
- Um `DOMAIN` só pode ser pai de `CATEGORY`.
- Um `CATEGORY` só pode ser pai de `SUBFAMILY`.
- Um `SUBFAMILY` só pode ser pai de `SERIES`.
- Um `Product` só pode ser vinculado a uma categoria de nível `SERIES` ou `SUBFAMILY`.

### Seed Inicial (exemplos)
```
Transmissão de Potência (DOMAIN)
├── Rolamentos (CATEGORY)
│   ├── Carga Leve (SUBFAMILY)
│   │   ├── Série 6000 (SERIES)
│   │   ├── Série 6200 (SERIES)
│   │   └── Série 6300 (SERIES)
│   ├── Carga Média (SUBFAMILY)
│   └── Carga Pesada (SUBFAMILY)
├── Mancais (CATEGORY)
│   ├── Plummer Block (SUBFAMILY)
│   │   ├── Série SNL 500 (SERIES)
│   │   └── Série SNL 200 (SERIES)
│   └── Pillow Block (SUBFAMILY)
│       ├── Série UCP (SERIES)
│       └── Série UCF (SERIES)
├── Polias (CATEGORY)
├── Cardans / Cruzetas (CATEGORY)
└── Buchas (CATEGORY)

Vedação (DOMAIN)
├── Retentores (CATEGORY)
└── O-Rings (CATEGORY)

Lubrificação (DOMAIN)
├── Graxas (CATEGORY)
└── Óleos (CATEGORY)
```

---

## 3. Templates de Atributos Técnicos por Classe

### Novos Models

**`AttributeDefinition`** — Define um atributo técnico reutilizável.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `name` | String | Nome do atributo (ex: "Diâmetro Interno") |
| `key` | String, unique | Chave técnica snake_case (ex: "bore_diameter") |
| `dataType` | Enum `AttributeDataType` | FLOAT, INTEGER, STRING, BOOLEAN, ENUM |
| `unit` | String? | Unidade SI padrão (ex: "mm", "kN", "kg") |
| `enumOptions` | String[]? | Opções válidas quando dataType = ENUM (ex: ["C2","CN","C3","C4"]) |
| `validationRegex` | String? | Regex de validação (ex: para part numbers) |
| `description` | String? | Descrição para tooltip na UI |
| `isActive` | Boolean | default true |

**`CategoryAttribute`** — Liga um template de atributos a uma categoria.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `categoryId` | UUID | FK → ProductCategory |
| `attributeId` | UUID | FK → AttributeDefinition |
| `isRequired` | Boolean | Obrigatório no cadastro? |
| `displayOrder` | Int | Ordem de exibição na UI |
| `defaultValue` | String? | Valor padrão |

**Constraint:** `@@unique([categoryId, attributeId])`

**Herança de atributos:** Uma `SERIES` herda os atributos obrigatórios de sua `SUBFAMILY` pai, que herda de `CATEGORY`, que herda de `DOMAIN`. A validação no tRPC deve resolver a cadeia completa.

### Enum `AttributeDataType`
```
FLOAT
INTEGER
STRING
BOOLEAN
ENUM
```

### Validação do `specifications` JSON
O campo `specifications Json?` do `Product` passa a ser validado no tRPC:
- Ao salvar, buscar todos os `CategoryAttribute` da categoria do produto (incluindo herdados).
- Validar que todos os atributos `isRequired = true` estão presentes no JSON.
- Validar tipos e unidades conforme `AttributeDefinition`.
- Rejeitar chaves não definidas no template (modo strict).

### Templates Iniciais (exemplos)

**Categoria: Rolamentos (CATEGORY)**
| Atributo | Key | Tipo | Unidade | Obrigatório |
|----------|-----|------|---------|-------------|
| Diâmetro Interno | bore_diameter | FLOAT | mm | Sim |
| Diâmetro Externo | outside_diameter | FLOAT | mm | Sim |
| Largura | width | FLOAT | mm | Sim |
| Carga Dinâmica | dynamic_load_rating | FLOAT | kN | Não |
| Carga Estática | static_load_rating | FLOAT | kN | Não |
| Folga Interna | internal_clearance | ENUM (C2,CN,C3,C4,C5) | - | Não |
| Vedação | sealing_type | ENUM (OPEN,ZZ,2RS,2RS1) | - | Não |
| RPM Limite Graxa | speed_limit_grease | INTEGER | rpm | Não |
| Peso | weight | FLOAT | kg | Não |

**Categoria: Mancais (CATEGORY)**
| Atributo | Key | Tipo | Unidade | Obrigatório |
|----------|-----|------|---------|-------------|
| Diâmetro do Eixo | shaft_diameter | FLOAT | mm | Sim |
| Altura do Centro | center_height | FLOAT | mm | Sim |
| Tipo de Fixação | fixing_type | ENUM (BOLT,ADAPTER_SLEEVE,LOCK_NUT) | - | Sim |
| Tipo de Rolamento Interno | bearing_type | STRING | - | Não |
| Tipo de Vedação | seal_type | STRING | - | Não |

**Categoria: Polias (CATEGORY)**
| Atributo | Key | Tipo | Unidade | Obrigatório |
|----------|-----|------|---------|-------------|
| Número de Canais | groove_count | INTEGER | - | Sim |
| Perfil da Correia | belt_profile | ENUM (A,B,C,SPA,SPB,SPC) | - | Sim |
| Diâmetro Primitivo | pitch_diameter | FLOAT | mm | Sim |
| Diâmetro do Furo | bore_diameter | FLOAT | mm | Sim |
| Tipo de Bucha | bushing_type | STRING | - | Não |

---

## 4. Cross-Reference / Intercambialidade

### Novo Model `ProductCrossReference`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `productId` | UUID | FK → Product |
| `brand` | String | Marca externa (ex: "SKF", "NTN", "TIMKEN", "FAG", "NSK") |
| `externalCode` | String | Código do fabricante externo |
| `matchType` | Enum `CrossRefMatchType` | EXACT, EQUIVALENT, SIMILAR, SUPERSEDED |
| `notes` | String? | Observações sobre a equivalência |
| `confidence` | Enum `CrossRefConfidence` | CONFIRMED, PROBABLE, UNVERIFIED |
| `verifiedBy` | String? | Quem verificou (userId ou "SYSTEM") |
| `verifiedAt` | DateTime? | Data da verificação |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Constraints:**
- `@@unique([productId, brand, externalCode])`
- Índice em `[brand, externalCode]` para busca reversa (buscar por código SKF → encontrar Product FRM)

### Enums
```
CrossRefMatchType: EXACT, EQUIVALENT, SIMILAR, SUPERSEDED
CrossRefConfidence: CONFIRMED, PROBABLE, UNVERIFIED
```

### Regra de Negócio
- A busca por cross-reference deve funcionar nos dois sentidos: dado um código externo, encontrar o produto FRM; dado um produto FRM, listar todos os equivalentes.
- O campo `externalCode` deve ser normalizado (uppercase, sem espaços extras).

---

## 5. Padrão Descritivo de Materiais (PDM)

### Novo campo no `Product`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `pdmDescription` | String? | Descrição padronizada gerada automaticamente |

### Regra de Geração
A descrição PDM é gerada automaticamente no backend (tRPC mutation de save/update do Product) a partir de:

```
[TIPO], [SUBTIPO], [ATRIBUTOS DIMENSIONAIS], [CÓDIGO], [MARCA]
```

Exemplos:
- `ROLAMENTO, ESFERA, RADIAL, 25MM X 52MM X 15MM, 6205-2RS, SKF`
- `MANCAL, PILLOW BLOCK, UCP205, EIXO 25MM, FIXAÇÃO PARAFUSO`
- `POLIA, CANAL V, 2 CANAIS, PERFIL A, DP 100MM`

### Dicionário de Sinônimos
Criar uma tabela `SynonymDictionary` ou config JSON para normalizar termos:

| Termo Encontrado | Termo Padrão |
|-----------------|--------------|
| Rolam., Rolt, Rlm | ROLAMENTO |
| Mancal, Mnc | MANCAL |
| Pol., Polia | POLIA |
| Ret., Retentor | RETENTOR |

---

## 6. Expansão de Mídia e Conteúdo (PIM + DAM)

### Alterações nos models existentes

**`ProductImage`** — Adicionar:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `context` | Enum `ImageContext` | PRODUCT_PHOTO, TECHNICAL_DRAWING, APPLICATION, PACKAGING, DIMENSION_DIAGRAM |

**`ProductVideo`** — Adicionar ao enum `ProductVideoType`:

| Valor | Descrição |
|-------|-----------|
| MAINTENANCE | Manutenção preventiva |
| FAILURE_ANALYSIS | Análise de falhas |

**`ProductAttachment`** — Adicionar ao enum `ProductAttachmentType`:

| Valor | Descrição |
|-------|-----------|
| QUALITY_CERTIFICATE | Certificado de qualidade |
| CATALOG_PAGE | Página do catálogo do fabricante |
| APPLICATION_GUIDE | Guia de aplicação |

### Novo Model `ProductContent`

Conteúdo textual rico associado ao produto (tutoriais, guias, FAQs).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `productId` | UUID | FK → Product |
| `contentType` | Enum `ProductContentType` | INSTALLATION_GUIDE, MAINTENANCE_GUIDE, FAQ, APPLICATION_NOTE, FAILURE_ANALYSIS |
| `title` | String | Título do conteúdo |
| `body` | String | Corpo em Markdown |
| `targetAudience` | Enum `TargetAudience` | MECHANIC, BUYER, ENGINEER, SALES |
| `order` | Int | Ordem de exibição |
| `isPublished` | Boolean | default false |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### Novo Model `ProductRelation`

Relações entre produtos (acessórios, kits, substitutos).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `productIdA` | UUID | FK → Product |
| `productIdB` | UUID | FK → Product |
| `relationType` | Enum `ProductRelationType` | ACCESSORY, KIT_COMPONENT, REPLACEMENT, SIMILAR, COMPLEMENTARY |
| `notes` | String? | |
| `order` | Int | default 0 |
| `createdAt` | DateTime | |

**Constraint:** `@@unique([productIdA, productIdB, relationType])`

---

## 7. Embalagem e Logística

### Novo Model `ProductPackaging`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `productId` | UUID, unique | FK → Product (1:1) |
| `grossWeight` | Float? | Peso bruto (kg) |
| `netWeight` | Float? | Peso líquido (kg) |
| `length` | Float? | Comprimento (mm) |
| `width` | Float? | Largura (mm) |
| `height` | Float? | Altura (mm) |
| `maxStacking` | Int? | Empilhamento máximo |
| `eanCode` | String? | Código EAN/GTIN |
| `unitsPerBox` | Int? | Unidades por caixa |
| `boxesPerPallet` | Int? | Caixas por pallet |

---

## 8. Embeddings / Busca Semântica

### Alteração no model `Embedding` existente

O model atual já está adequado com `entityType`/`entityId` polimórfico. A mudança é no **conteúdo que alimenta o embedding**.

### Regra de Geração de Conteúdo para Embedding de Product

Ao criar/atualizar um Product, gerar o campo `content` do Embedding concatenando:

```
{pdmDescription}
Categoria: {category hierarchy completa}
Especificações: {todos os atributos técnicos em formato "nome: valor unidade"}
Cross-reference: {todas as equivalências "marca código"}
Aplicações: {conteúdo de ProductContent do tipo APPLICATION_NOTE}
Tags: {product.tags}
```

Isso garante que a busca semântica "rolamento para alta temperatura carga pesada 50mm" encontre produtos cujos atributos e contexto correspondam, mesmo sem match textual exato.

### Modelo de Embedding
Atualizar o `model` default de `text-embedding-3-small` para o modelo Gemini em uso. Manter o campo flexível para suportar múltiplos providers.

---

## 9. Fluxo de Higienização dos Dados Existentes

### Etapa 1: Criação da Taxonomia
1. Criar as `ProductCategory` dos 4 níveis conforme seed da seção 2.
2. Definir os `AttributeDefinition` e `CategoryAttribute` para cada categoria conforme seção 3.

### Etapa 2: Reconciliação Material → Product
1. Para cada `Material` ativo que não tem `Product`, criar um `Product` com status `DRAFT`.
2. Copiar `description` para `name`, `ncm` e campos relevantes.
3. Vincular à `ProductCategory` mais adequada baseado na `Category` do Material.

### Etapa 3: Normalização
1. Normalizar unidades para SI (mm, kN, kg) no `specifications` JSON.
2. Normalizar `manufacturer` e `manufacturerCode` do Material para popular `ProductCrossReference`.
3. Aplicar dicionário de sinônimos nas descrições.

### Etapa 4: Enriquecimento
1. Cruzar códigos de série com tabelas técnicas públicas de SKF/NTN para popular atributos faltantes no `specifications`.
2. Gerar `pdmDescription` automaticamente para todos os Products.
3. Gerar embeddings para todos os Products.

### Etapa 5: Validação
1. Executar validação de atributos obrigatórios por categoria.
2. Identificar Products com `specifications` incompletas → gerar relatório.
3. Identificar duplicidades por "fingerprint dimensional" (mesmas dimensões críticas = possível duplicata).

---

## 10. Enums Completos (Referência)

```
CategoryLevel: DOMAIN, CATEGORY, SUBFAMILY, SERIES
AttributeDataType: FLOAT, INTEGER, STRING, BOOLEAN, ENUM
CrossRefMatchType: EXACT, EQUIVALENT, SIMILAR, SUPERSEDED
CrossRefConfidence: CONFIRMED, PROBABLE, UNVERIFIED
ImageContext: PRODUCT_PHOTO, TECHNICAL_DRAWING, APPLICATION, PACKAGING, DIMENSION_DIAGRAM
ProductContentType: INSTALLATION_GUIDE, MAINTENANCE_GUIDE, FAQ, APPLICATION_NOTE, FAILURE_ANALYSIS
TargetAudience: MECHANIC, BUYER, ENGINEER, SALES
ProductRelationType: ACCESSORY, KIT_COMPONENT, REPLACEMENT, SIMILAR, COMPLEMENTARY
```

Adicionar aos enums existentes:
```
ProductVideoType: + MAINTENANCE, FAILURE_ANALYSIS
ProductAttachmentType: + QUALITY_CERTIFICATE, CATALOG_PAGE, APPLICATION_GUIDE
```
