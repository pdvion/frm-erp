# Análise de Evolução: CP14 - Entrada de Materiais/NFe

## 1. Visão Geral

- **Código**: CP14
- **Nome**: Entrada de Materiais / Recebimento de NFe
- **Objetivo Original**: Registrar entrada de materiais no estoque a partir de notas fiscais recebidas

---

## 2. Funcionalidades Originais (Delphi)

### Arquivos Identificados
| Arquivo | Função |
|---------|--------|
| `UntCP14ValidarNFe.pas` | Validação de NFe recebida |
| `UntCP14ValidarNFeItem.pas` | Validação item a item |
| `UntCP14AddMatNF.pas` | Adicionar material da NFe |
| `UntCP14AddNFiscalManual.pas` | Entrada manual (sem XML) |
| `UntCP14ConfRecebEst.pas` | Confirmação de recebimento |
| `UntCP14CertificadosMateriais.pas` | Certificados técnicos |
| `UntCP14AgruparItensNF.pas` | Agrupar itens similares |
| `UntCP14ChgFisicaMat.pas` | Alteração física do material |
| `UntCP13SelEntregaOC.pas` | Vincular com Ordem de Compra |

### Fluxo Original
1. Receber XML por email ou upload manual
2. Validar dados da NFe
3. Vincular itens com Ordem de Compra (manual)
4. Conferir quantidades e preços (manual)
5. Verificar necessidade de inspeção de qualidade
6. Registrar certificados de materiais
7. Lançar no estoque
8. Gerar conta a pagar (em módulo separado)

### Campos Processados
- Chave NFe (44 dígitos)
- Número, série, data emissão
- CNPJ/Razão social fornecedor
- Itens: código, descrição, quantidade, unidade, preço
- Impostos: ICMS, IPI, PIS, COFINS
- Centro de custo, conta financeira

---

## 3. Aplicando as 5 Perguntas

### 1. Por que existe?
> **Problema**: Controlar entrada de materiais no estoque com rastreabilidade fiscal.
> 
> **Quem usa**: Almoxarifado, Compras, Fiscal
> 
> **Frequência**: Diária (várias vezes ao dia)
> 
> ✅ **Faz sentido**: Sim, é operação crítica do negócio.

### 2. Ainda faz sentido?
> **Contexto mudou?** Sim, hoje existem APIs da SEFAZ para consulta automática.
> 
> **Alternativa melhor?** Parcialmente - a consulta pode ser automática, mas o processo de conferência ainda é necessário.
> 
> ✅ **Manter**: Sim, mas modernizar a obtenção de dados.

### 3. Pode ser simplificado?
> **Passos atuais**: 8 passos manuais
> 
> **Campos desnecessários?** Vários campos são preenchidos manualmente quando poderiam vir do XML.
> 
> ✅ **Simplificar**:
> - Extração automática de todos os dados do XML
> - Vinculação automática com OC por código do material
> - Highlight apenas de divergências (não conferir tudo)

### 4. Pode ser automatizado?
> **Manual → Automático**:
> - ❌ Upload de XML → ✅ Busca automática na SEFAZ (manifestação)
> - ❌ Digitar dados → ✅ Parser de XML
> - ❌ Vincular item a item → ✅ Match automático por código
> - ❌ Calcular impostos → ✅ Já vem no XML
> - ❌ Lançar estoque manualmente → ✅ Entrada automática ao aprovar
> - ❌ Criar conta a pagar → ✅ Geração automática

### 5. Pode ser integrado?
> **Integrações possíveis**:
> - **SEFAZ**: Consulta e download de NFe (DF-e)
> - **Estoque**: Entrada automática
> - **Financeiro**: Conta a pagar automática
> - **Qualidade**: Notificação para inspeção
> - **Email**: Notificação de recebimento

---

## 4. Proposta de Evolução

| Delphi (Original) | Evolução Proposta | Benefício |
|-------------------|-------------------|-----------|
| Upload manual de XML | Upload + Busca SEFAZ | Menos trabalho manual |
| Digitar dados da nota | Extração automática do XML | Zero digitação |
| Vincular OC manualmente | Sugestão automática por código | 90% automático |
| Conferir todos os itens | Mostrar apenas divergências | Foco no problema |
| Calcular impostos | Usar valores do XML | Sem erros de cálculo |
| Lançar estoque em tela separada | Entrada automática ao aprovar | 1 clique |
| Criar conta a pagar separado | Geração automática | Integração total |
| Imprimir etiquetas manual | Impressão automática | Agilidade |
| Certificados em tela separada | Upload junto com recebimento | Centralizado |

---

## 5. Novo Fluxo Proposto

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRADA DE NFe                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. OBTER NFe                                               │
│     ├─ Upload de XML                                        │
│     ├─ Colar chave (busca SEFAZ)                           │
│     └─ Busca automática (manifestação)                      │
│                        ↓                                    │
│  2. PARSER AUTOMÁTICO                                       │
│     ├─ Extrair dados do fornecedor                         │
│     ├─ Extrair itens (código, qtd, preço)                  │
│     └─ Extrair impostos                                     │
│                        ↓                                    │
│  3. VINCULAÇÃO INTELIGENTE                                  │
│     ├─ Match automático com Pedidos de Compra              │
│     ├─ Sugestão por código do material                     │
│     └─ Highlight de itens sem match                        │
│                        ↓                                    │
│  4. CONFERÊNCIA SIMPLIFICADA                                │
│     ├─ Mostrar apenas DIVERGÊNCIAS                         │
│     │   ├─ Quantidade diferente                            │
│     │   ├─ Preço diferente (tolerância 5%)                 │
│     │   └─ Material não encontrado                         │
│     └─ Aprovar itens OK em lote                            │
│                        ↓                                    │
│  5. APROVAÇÃO (1 clique)                                    │
│     ├─ ✅ Entrada no estoque (automático)                  │
│     ├─ ✅ Conta a pagar (automático)                       │
│     ├─ ✅ Atualiza preço do material                       │
│     ├─ ✅ Notifica qualidade (se necessário)               │
│     └─ ✅ Gera etiquetas (opcional)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Decisões

### ✅ Manter
- Vinculação com Pedido de Compra (rastreabilidade)
- Conferência de quantidades (controle)
- Certificados de materiais (qualidade)
- Centro de custo (contabilidade)

### ❌ Eliminar
- Digitação manual de dados (vem do XML)
- Cálculo manual de impostos (vem do XML)
- Telas separadas para cada ação (unificar)
- Processo de "validação" em múltiplas etapas

### 🤖 Automatizar
- Extração de dados do XML (parser)
- Vinculação com OC por código do material
- Entrada no estoque ao aprovar
- Geração de conta a pagar
- Atualização de preço do material
- Notificação para inspeção de qualidade

### 🔗 Integrar
- SEFAZ (consulta de NFe por chave)
- Módulo de Estoque (entrada automática)
- Módulo Financeiro (conta a pagar)
- Módulo de Qualidade (inspeção)

---

## 7. Modelo de Dados Proposto

### Tabela: `received_invoices` (NFe Recebidas)
```prisma
model ReceivedInvoice {
  id                String   @id @default(uuid())
  accessKey         String   @unique // Chave 44 dígitos
  invoiceNumber     Int
  series            Int
  issueDate         DateTime
  
  // Fornecedor
  supplierId        String?
  supplier          Supplier? @relation(...)
  supplierCnpj      String
  supplierName      String
  
  // Valores
  totalProducts     Float
  totalInvoice      Float
  freightValue      Float    @default(0)
  discountValue     Float    @default(0)
  
  // Impostos
  icmsBase          Float    @default(0)
  icmsValue         Float    @default(0)
  ipiValue          Float    @default(0)
  pisValue          Float    @default(0)
  cofinsValue       Float    @default(0)
  
  // Status
  status            InvoiceStatus @default(PENDING)
  // PENDING, VALIDATED, APPROVED, REJECTED, CANCELLED
  
  // Relacionamentos
  items             ReceivedInvoiceItem[]
  purchaseOrderId   String?
  purchaseOrder     PurchaseOrder? @relation(...)
  
  // Auditoria
  receivedAt        DateTime?
  receivedBy        String?
  approvedAt        DateTime?
  approvedBy        String?
  
  // Multi-tenant
  companyId         String?
  company           Company? @relation(...)
  
  // XML original
  xmlContent        String?  @db.Text
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model ReceivedInvoiceItem {
  id                String   @id @default(uuid())
  invoiceId         String
  invoice           ReceivedInvoice @relation(...)
  
  // Dados do XML
  itemNumber        Int
  productCode       String   // Código do fornecedor
  productName       String
  ncm               String?
  cfop              Int
  quantity          Float
  unit              String
  unitPrice         Float
  totalPrice        Float
  
  // Impostos do item
  icmsRate          Float    @default(0)
  icmsValue         Float    @default(0)
  ipiRate           Float    @default(0)
  ipiValue          Float    @default(0)
  
  // Vinculação
  materialId        String?
  material          Material? @relation(...)
  purchaseOrderItemId String?
  purchaseOrderItem PurchaseOrderItem? @relation(...)
  
  // Conferência
  matchStatus       MatchStatus @default(PENDING)
  // PENDING, MATCHED, DIVERGENT, NOT_FOUND
  divergenceType    String?  // QTY, PRICE, BOTH
  divergenceNote    String?
  
  // Recebimento
  receivedQty       Float    @default(0)
  
  createdAt         DateTime @default(now())
}
```

---

## 8. Endpoints tRPC Propostos

```typescript
receivedInvoices: {
  // Upload e processamento
  uploadXml: mutation      // Upload de arquivo XML
  parseXml: mutation       // Extrair dados do XML
  fetchFromSefaz: mutation // Buscar por chave na SEFAZ
  
  // Listagem
  list: query              // Listar NFe com filtros
  byId: query              // Detalhe da NFe
  pending: query           // NFe pendentes de aprovação
  
  // Vinculação
  autoMatch: mutation      // Match automático com OC
  linkItem: mutation       // Vincular item manualmente
  unlinkItem: mutation     // Desvincular item
  
  // Conferência
  getDivergences: query    // Listar divergências
  resolveDivergence: mutation // Resolver divergência
  
  // Aprovação
  approve: mutation        // Aprovar NFe (entrada + financeiro)
  reject: mutation         // Rejeitar NFe
  
  // Relatórios
  stats: query             // Estatísticas
}
```

---

## 9. Próximos Passos de Implementação

1. **Migration**: Criar tabelas `received_invoices` e `received_invoice_items`
2. **Parser XML**: Implementar extração de dados de NFe
3. **Router**: Criar `receivedInvoicesRouter` com CRUD
4. **Auto-match**: Algoritmo de vinculação automática
5. **Página de listagem**: `/invoices`
6. **Página de conferência**: `/invoices/[id]`
7. **Integração estoque**: Entrada automática ao aprovar
8. **Integração financeiro**: Conta a pagar automática
