# Análise de Campos - Sistema Delphi vs POC FRM ERP

## Resumo
- **Total de tabelas no Delphi**: 419
- **Total de modelos no Prisma**: 127
- **Data da análise inicial**: 23/01/2026
- **Última atualização**: 24/01/2026

## Status de Implementação

| Módulo | Campos Implementados | Campos Pendentes | Status |
|--------|---------------------|------------------|--------|
| Fornecedores (CP11) | 22/22 | 0 | ✅ Completo |
| Ordens de Compra (CP13) | 18/20 | 2 | 🟡 90% |
| Notas Fiscais (CP14) | 20/22 | 2 | 🟡 90% |
| Financeiro (FN10) | 25/30 | 5 | 🟡 83% |
| Estoque (EST10) | 10/12 | 2 | 🟡 83% |
| Produção (OP10) | 15/17 | 2 | 🟡 88% |
| Clientes (VD) | 12/15 | 3 | 🟡 80% |
| Orçamentos (CP12) | 18/20 | 2 | 🟡 90% |
| Materiais (CP10) | 8/10 | 2 | 🟡 80% |

---

## 1. MÓDULO COMPRAS (CP10-CP15)

### 1.1 Materiais (cp10_materiais → Material)

#### Campos já implementados ✅
- codMaterial → code
- material → description
- unidade → unit
- unidadeEstoque → unit
- fatorConvUnid → unitConversionFactor
- codFamilia → categoryId
- codSubFamilia → subCategoryId
- matEPI → isEpi
- matEscritorio → isOfficeSupply
- obs → notes
- percIPI → ipiRate
- perICMS → icmsRate
- tpMedEntrega → avgDeliveryDays
- qdeMinima → minQuantity
- qdeMinimaCalculada → calculatedMinQuantity
- calculaQdeMinima → minQuantityCalcType
- dtAlarmeQdeMinima → minQuantityAlarmDate
- dtCalcQdeMinima → minQuantityCalcDate
- ajustarConsMaxManual → adjustMaxConsumptionManual
- qdeMaxConsMensal → maxMonthlyConsumption
- qdeReserva → reservedQuantity
- qdeMediaMensal → monthlyAverage
- qdePico12Meses → peak12Months
- vlrUnitUltCompra → lastPurchasePrice
- dtUltCompra → lastPurchaseDate
- qdeUltCompra → lastPurchaseQuantity
- codFornUltCompra → lastSupplierId
- ativo → status
- contaCCFRM → costCenterFrm
- contaCCFND → costCenterFnd
- contaFinanceira → financialAccount
- local → location
- marcaObrg → requiredBrand
- motivoObrig → requiredBrandReason
- codEstoque → stockLocationId
- necesInspQualidade → requiresQualityInspection
- necesCertifMaterial → requiresMaterialCertificate
- requerIQF → requiresQualityCheck
- requerContrFichas → requiresControlSheets
- requerDevolucao → requiresReturn
- requerEntradaFiscal → requiresFiscalEntry
- codPDProdPai → parentProductId
- codAtivo → assetId

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| codCA | Código CA (se EPI) | Média |
| qdeEstoqueAtual | Qtd atual estoque (calculado) | Alta |
| vlrUnitAgrUltCompra | Valor agregado última compra | Média |
| codOrcamentoUltCompra | Código orçamento última compra | Baixa |
| codOrdCompraUltCompra | Código OC última compra | Baixa |
| usuLiberacao | Usuário que liberou criação | Baixa |
| dtLiberacao | Data de liberação | Baixa |
| validadoFinanceiro | Validado pelo financeiro | Média |
| validadoCCFinanceiro | CC validado pelo financeiro | Média |
| handleBenner | Handle integração Benner | Baixa |

---

### 1.2 Fornecedores (cp11_fornecedores → Supplier)

#### Campos já implementados ✅
- codFornecedor → code
- codAlfaForn → internalCode
- fornecedor → companyName
- cnpj → cnpj
- isentoIE → isIeExempt
- IE → ie
- endereco → address
- nro → addressNumber
- cep → zipCode
- cidade → city
- uf → state
- contato → contactName
- email1 → email
- email2 → email2
- tel1 → phone
- tel2 → phone2
- obs → notes
- optanteSimpleNacional → isSimples
- ativo → status

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| cat01Embalagens | Categoria: Embalagens | Média |
| cat02Tintas | Categoria: Tintas | Média |
| cat03OleosGraxas | Categoria: Óleos/Graxas | Média |
| cat04Dispositivos | Categoria: Dispositivos | Média |
| cat05Acessorios | Categoria: Acessórios | Média |
| cat06Manutencao | Categoria: Manutenção | Média |
| cat07Servicos | Categoria: Serviços | Média |
| cat08Escritorio | Categoria: Escritório | Média |
| eAtacadista | É atacadista (IPI) | Média |
| eVaregista | É varejista (IPI) | Média |
| eInd_Equip | É indústria/equipamentos | Média |
| eServico | É serviço | Média |
| codTipoAtividade | Tipo de atividade | Média |
| CNAE | Código CNAE | Alta |
| tipoCertificado | Tipo certificado (ISO/RBS) | Alta |
| dtValidadeCertificado | Validade certificado | Alta |
| nomeArqCertificado | Arquivo certificado | Média |
| percQualidadeGeral | % Qualidade geral | Alta |
| percIQF | % IQF | Alta |
| dtCalcPercQualidade | Data cálculo qualidade | Média |
| iqfFornecedor | Status IQF (-1=Novo, 1=Aprovado, 2=Reprovado) | Alta |
| regimeApuracao | Regime de apuração | Média |
| dtConsultaSEFAZ | Data consulta SEFAZ | Média |
| contratoFinanceiroPresumido | Contrato financeiro presumido | Média |
| handleBenner | Handle integração Benner | Baixa |

---

### 1.3 Orçamentos (cp12_orcamentos → Quote)

#### Campos já implementados ✅
- codOrcamento → code
- orcamento → description
- codEmpresa → companyId
- dtOrcamento → createdAt
- usuResponsavel → createdById
- statusGeral/numStatusGeral → status
- obs → notes
- dtModificacao → updatedAt

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| revisao | Número da revisão | Alta |
| usuPreAprovador | Usuário pré-aprovador | Média |
| dtPreAprovacao | Data pré-aprovação | Média |
| usuAprovador | Usuário aprovador | Média |
| dtAprovacao | Data aprovação | Média |
| usuModListaMat | Usuário modificou lista materiais | Baixa |
| dtModListaMat | Data modificação lista materiais | Baixa |
| usuModListaForn | Usuário modificou lista fornecedores | Baixa |
| dtModListaForn | Data modificação lista fornecedores | Baixa |
| cotacaoPDF | Nome arquivo PDF cotação | Média |
| dtImprCotacao | Data impressão cotação | Baixa |
| exeAnalise | Análise executada | Média |
| histConversaTXT | Histórico conversa | Média |
| anexo1, anexo2, anexo3 | Anexos | Média |
| codEmpresaCC | Empresa dona do orçamento | Média |
| grupoCC | Grupo centro de custo | Média |
| codSolOrcamento | Código solicitação orçamento | Alta |
| solicitante | Nome solicitante | Média |
| aprovador | Nome aprovador | Média |
| percGestaoConclusao | % conclusão gestão | Média |

---

### 1.4 Ordens de Compra (cp13_ord_compra → PurchaseOrder)

#### Campos já implementados ✅
- codOrdCompra → code
- codOrcamento → quoteId
- codFornecedor → supplierId
- numStatusGeral → status
- dtCriacao → createdAt
- vlrTotalOrdCompra → totalValue
- obsGerais → notes
- dtModificacao → updatedAt

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| aplicacao | Aplicação da compra | Média |
| codOrcFornecedor | Código orçamento fornecedor | Média |
| faturarPor | Faturar por (FRM/FND/AVBC) | Alta |
| grupoCcustoNF | Grupo CC para NF | Alta |
| trasnportadora | Transportadora | Média |
| endEntrega | Endereço entrega | Alta |
| telEntrega | Telefone entrega | Média |
| natOperacao | Natureza operação | Alta |
| codCondPgto | Condição pagamento | Alta |
| condPgto | Descrição condição pagamento | Média |
| tipoFrete | Tipo frete (CIF/FOB/Retira) | Alta |
| valorFreteFOB | Valor frete FOB | Alta |
| kmFRMRetira | KM se FRM retira | Média |
| vlrFRMRetira | Valor se FRM retira | Média |
| motivoSeCancelado | Motivo cancelamento | Média |
| aprovadoFinanceiro | Aprovado pelo financeiro | Alta |
| usuAprovFinanceiro | Usuário aprovação financeira | Média |
| dtAprovFinanceiro | Data aprovação financeira | Média |
| usuAprovAnalise | Usuário aprovação análise | Média |
| dtAprovAnalise | Data aprovação análise | Média |

---

### 1.5 Notas Fiscais Entrada (cp14_nf → ReceivedInvoice)

#### Campos já implementados ✅
- codNF → code
- codFornecedor → supplierId
- codEmpresa → companyId
- codOrdCompra → purchaseOrderId
- numNF → invoiceNumber
- dtEmissaoNF → issueDate
- vlrTotalNF → totalValue
- numStatusGeral → status
- obs → notes

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| grupoCcustoNF | Grupo CC da NF | Alta |
| usuConfGrupoCC | Usuário confirmou grupo CC | Média |
| codCondPgto | Condição pagamento | Alta |
| parcelasCalculadas | Parcelas calculadas | Média |
| dtPgtoNF | Data pagamento NF | Alta |
| vlrTotalIPINF | Total IPI | Alta |
| vlrTotalICMSNF | Total ICMS | Alta |
| vlrTotalSTNF | Total ST | Alta |
| vlrFreteNF | Valor frete | Alta |
| codFornXML | Código fornecedor XML | Média |
| vlrBaseCalICMSNF | Base cálculo ICMS | Alta |
| vlrBaseCalICMSSTNF | Base cálculo ICMS ST | Alta |
| vlrTotalProdNF | Total produtos | Alta |
| vlrSeguroNF | Valor seguro | Média |
| vlrDescontoNF | Valor desconto | Alta |
| vlrOutrDespAssNF | Outras despesas | Média |
| infAdicionais | Informações adicionais | Média |
| vlrCredICMS | Crédito ICMS | Alta |
| vlrCredICMSST | Crédito ICMS ST | Alta |
| vlrCredICMSSN | Crédito ICMS SN | Alta |
| vlrCredIPI | Crédito IPI | Alta |
| vlrCredPIS | Crédito PIS | Alta |
| vlrCredCOFINS | Crédito COFINS | Alta |

---

## 2. MÓDULO FINANCEIRO (FN10)

### 2.1 Ordens de Pagamento (fn10_ordens_pgto → AccountsPayable)

#### Campos já implementados ✅
- codOrdPgto → code
- codFornecedor → supplierId
- codEmpresa → companyId
- numNF → invoiceNumber
- dtEmissaoNF → issueDate
- vlrTotalNF → originalValue
- vlrLiquidoNF → netValue
- numStatusGeral → status
- dtCriacao → createdAt

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| codFornXML | Código fornecedor XML | Média |
| tipoDcto | Tipo documento (NFe/CTe/Contrato) | Alta |
| nomeArquivoPDF | Nome arquivo PDF | Média |
| codNF | Código NF | Alta |
| grupoCcustoNF | Grupo CC | Alta |
| imp_RetidoFonte | Imposto retido fonte | Alta |
| imp_IR | IR retido | Alta |
| imp_ISS | ISS retido | Alta |
| imp_INSS | INSS retido | Alta |
| imp_PIS | PIS retido | Alta |
| imp_Cofins | COFINS retido | Alta |
| imp_CSLL | CSLL retido | Alta |
| codAlfaForn | Código alfa fornecedor | Média |
| razaoSocial | Razão social | Média |
| CNPJ | CNPJ | Média |
| IE | IE | Média |
| codUF | Código UF | Média |
| EmpresaCC | Empresa CC | Média |
| ccustoNF | Centro custo NF | Alta |
| obsCCustoNF | Obs centro custo | Média |
| tipoContrato | Tipo contrato | Alta |
| tipoContratoRecusado | Tipo contrato recusado | Média |
| dtConfirmacaoSetor | Data confirmação setor | Média |
| usuConfirmacaoSetor | Usuário confirmação setor | Média |
| dtEntregaFisica | Data entrega física | Média |
| usuEntregaFisica | Usuário entrega física | Média |
| dtLiberacaoPgto | Data liberação pagamento | Alta |
| usuLiberacaoPgto | Usuário liberação pagamento | Alta |
| codBcoPgto | Banco pagamento | Alta |
| infAdicionaisNF | Informações adicionais | Média |

---

## 3. MÓDULO ESTOQUE (EST10)

### 3.1 Estoque (est10_estoque → Inventory)

#### Campos já implementados ✅
- codProdEstoque → id
- codBaixa → materialId (via relação)
- codEstoque → stockLocationId
- qde_MatPrima → quantity (parcial)
- ativo → status

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| codVd30ProdutoBaixa | Código produto baixa VD30 | Média |
| qde_SemiAcab | Qtd semi-acabado | Alta |
| qde_Pronto | Qtd pronto | Alta |
| qde_Critico | Qtd crítico | Alta |
| qde_Refugo | Qtd refugo | Alta |
| qde_Morto | Qtd morto | Média |
| qde_Ind_Contabil | Qtd industrializado contábil | Média |
| qde_Rev_Contabil | Qtd revenda contábil | Média |
| baixaViaFormula | Baixa via fórmula | Média |
| qdePedCompra | Qtd pedido compra | Alta |
| dtRecebPedCompra | Data recebimento pedido | Média |
| codRegraBx | Código regra baixa | Média |

---

## 4. MÓDULO PRODUÇÃO (OP10-OP30)

### 4.1 Ordens de Produção (op10_ordem_producao → ProductionOrder)

#### Campos já implementados ✅
- codOrdemProducao → code
- dtCriacao → createdAt
- codUsuCriador → createdById
- codBaixa → materialId
- qtdeSolicitada → quantity
- qtdeProducao → producedQuantity
- descServico → description
- obsServico → notes
- numStatusGeral → status

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| tipoSolicitacao | Tipo (Vendas/Estoque/Export/Normal/Retrabalho) | Alta |
| codCliente | Código cliente | Alta |
| dataEntrega | Data entrega | Alta |
| codColaborador | Colaborador responsável | Alta |
| tipoExecucao | Tipo execução (Fabricar/Alterar) | Alta |
| qtdeProdutoPronto | Qtd produto pronto | Alta |
| tipoEntrega | Tipo entrega (Montado/Avulso) | Média |
| origemMatPrima | Origem matéria prima | Alta |
| codExport | Código exportação | Média |
| codOrdProdAgrupada | OP agrupada | Média |
| tipoSolAntesUrgEmerg | Tipo antes urgência/emergência | Média |
| dataEntregaAntesUrgEmerg | Data antes urgência/emergência | Média |
| codUsuarioEntrega | Usuário entrega | Média |
| qtdePintadas | Qtd pintadas | Média |
| impresso | Impresso | Baixa |
| dtEntregaSugerida | Data entrega sugerida | Média |
| alteracaoDtEntrega | Flag alteração data entrega | Média |

---

## 5. MÓDULO VENDAS (VD/PV)

### 5.1 Clientes (cliente → Customer)

#### Campos já implementados ✅
- codCliente → code
- cliente → name
- bairro → neighborhood
- logradouro → address
- complemento → addressComplement
- numero → addressNumber
- cep → zipCode
- codCNPJ → cnpj
- cidade → city
- uf → state
- pais → country
- ativo → status

#### Campos faltantes ❌
| Campo Delphi | Descrição | Prioridade |
|--------------|-----------|------------|
| codGrupoCliente | Grupo cliente | Média |
| ultimaVisita | Última visita | Média |
| dataInicio | Data início relacionamento | Média |
| periodicidadeVisita | Periodicidade visita | Média |
| geraVisitaPeriodica | Gera visita periódica | Média |
| codTipoCliente | Tipo cliente | Alta |
| codVendedor | Vendedor | Alta |
| codContato | Contato principal | Alta |
| codigoAlfa | Código alfa | Média |
| codVendedorExt | Vendedor externo | Média |
| valorMinEmissaoNF | Valor mínimo emissão NF | Média |
| mensagem | Mensagem padrão | Média |
| condPagamento | Condição pagamento padrão | Alta |
| aplicarST | Aplicar ST | Alta |
| obsPadraoPV | Obs padrão pedido venda | Média |

---

## 6. TABELAS AUXILIARES IMPORTANTES

### 6.1 Tabelas não mapeadas que precisam ser criadas

| Tabela Delphi | Descrição | Prioridade |
|---------------|-----------|------------|
| cp06_familias | Famílias de materiais | Alta |
| cp06_subfamilia | Subfamílias de materiais | Alta |
| cp07_cond_pgto | Condições de pagamento | Alta |
| cp08_colaboradores | Colaboradores (compras) | Alta |
| cp08_colaboradores_tipo | Tipos de colaboradores | Média |
| cp09_centro_custos | Centros de custo | Alta |
| cp09_grupos_centro_custos | Grupos de CC | Alta |
| cp10_mat_forn | Materiais x Fornecedores | Alta |
| cp10_mat_ncm | NCM dos materiais | Média |
| cp10_mat_unidades | Unidades de medida | Média |
| cp11_forn_nfe | NFe dos fornecedores | Alta |
| cp11_forn_nfe_itens | Itens NFe fornecedores | Alta |
| cp11_forn_cte | CTe dos fornecedores | Média |
| cp12_orc_itens | Itens do orçamento | Alta |
| cp12_orc_fornecedores | Fornecedores do orçamento | Alta |
| cp12_orc_forn_cotacoes | Cotações dos fornecedores | Alta |
| cp13_ord_cpr_entregas | Entregas da OC | Alta |
| cp14_nf_itens | Itens da NF | Alta |
| cp14_nf_pgtos | Pagamentos da NF | Alta |
| cp15_saidas | Saídas de material | Alta |
| cp15_saidas_itens | Itens saída material | Alta |
| fn10_movimento_caixa | Movimento de caixa | Alta |
| fn10_adiantamentos_forn | Adiantamentos fornecedor | Média |
| est01_estoques | Locais de estoque | Alta |
| est06_regras_baixa | Regras de baixa | Média |
| op10_op_operacoes | Operações da OP | Alta |
| op10_op_lancamentos | Lançamentos da OP | Alta |
| op20_op_producao | Produção da OP | Alta |
| op30_operadores | Operadores | Alta |
| vd30produto_baixas | Produtos (estrutura) | Alta |
| vd30produto_chamadas | Chamadas de produto | Média |
| pedidovendas | Pedidos de venda | Alta |
| pedidosvendas_itens | Itens pedido venda | Alta |
| tarefas | Tarefas | Média |
| usuarios | Usuários | Alta |

---

## 7. RESUMO DE PRIORIDADES

### Alta Prioridade (Implementar primeiro)
1. Campos fiscais em ReceivedInvoice (IPI, ICMS, ST, créditos)
2. Campos de qualidade em Supplier (IQF, certificados)
3. Campos de frete e condição pagamento em PurchaseOrder
4. Campos de retenção de impostos em AccountsPayable
5. Tipos de estoque em Inventory (semi-acabado, pronto, refugo)
6. Campos de produção em ProductionOrder (tipo, cliente, entrega)
7. Campos de vendas em Customer (vendedor, condição pagamento)

### Média Prioridade
1. Categorias de fornecedor (embalagens, tintas, etc.)
2. Campos de aprovação em Quote
3. Campos de histórico e auditoria
4. Campos de integração (Benner)

### Baixa Prioridade
1. Campos de controle interno
2. Campos de impressão
3. Campos legados

---

## 8. ESTIMATIVA DE ESFORÇO

| Módulo | Campos Faltantes | Esforço Estimado |
|--------|------------------|------------------|
| Materiais | 10 | 2h |
| Fornecedores | 22 | 4h |
| Orçamentos | 20 | 4h |
| Ordens de Compra | 20 | 4h |
| Notas Fiscais | 22 | 4h |
| Financeiro | 30 | 6h |
| Estoque | 12 | 3h |
| Produção | 17 | 4h |
| Clientes | 15 | 3h |
| **TOTAL** | **168** | **34h** |

---

*Documento gerado automaticamente em 23/01/2026*
