# Reestruturação Completa do Schema — Escopo Fechado v1

> **Data:** 09/02/2026
> **Contexto:** Sistema fora de produção, banco pode ser limpo. Janela única para reestruturação profunda.
> **Base:** schema.prisma — 5.539 linhas, 173 models, 76 enums, 81 routers

---

## 1. Float → Decimal — Mapeamento Completo (333 campos)

### Legenda de tipos destino

| Código | Uso | Precisão |
|---|---|---|
| `D(15,2)` | Valores monetários (R$, USD) | 15 dígitos, 2 decimais |
| `D(15,4)` | Preços unitários, quantidades fracionárias | 15 dígitos, 4 decimais |
| `D(5,4)` | Alíquotas e percentuais (0.1200 = 12%) | 5 dígitos, 4 decimais |
| `D(10,2)` | Horas, tempos, pesos, dimensões | 10 dígitos, 2 decimais |
| **MANTER Float** | Coordenadas GPS, posições UI, scores, eficiência | IEEE 754 aceitável |

### Contagem por decisão

| Decisão | Qtd campos |
|---|---|
| Float → Decimal | **320** |
| Manter Float | **13** |
| **Total** | **333** |

---

### 1.1 Material (15 campos → Decimal)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| minQuantity | D(15,4) | Quantidade |
| maxQuantity | D(15,4) | Quantidade |
| monthlyAverage | D(15,4) | Quantidade |
| lastPurchasePrice | D(15,4) | Preço unitário |
| unitConversionFactor | D(10,4) | Fator conversão |
| ipiRate | D(5,4) | Alíquota fiscal |
| icmsRate | D(5,4) | Alíquota fiscal |
| avgDeliveryDays | D(10,2) | Dias |
| calculatedMinQuantity | D(15,4) | Quantidade |
| maxMonthlyConsumption | D(15,4) | Quantidade |
| reservedQuantity | D(15,4) | Quantidade |
| peak12Months | D(15,4) | Quantidade |
| lastPurchasePriceAvg | D(15,4) | Preço unitário |
| lastPurchaseQuantity | D(15,4) | Quantidade |
| weight | D(10,4) | Peso |

### 1.2 Supplier (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| qualityIndex | D(5,4) | Percentual |
| overallQualityPercent | D(5,4) | Percentual |
| iqfPercent | D(5,4) | Percentual |

### 1.3 SupplierMaterial (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| lastPrice | D(15,4) | Preço unitário |
| minOrderQty | D(15,4) | Quantidade |

### 1.4 Inventory (13 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| reservedQty | D(15,4) | Quantidade |
| availableQty | D(15,4) | Quantidade |
| unitCost | D(15,4) | Custo unitário |
| totalCost | D(15,2) | Valor monetário |
| quantitySemiFinished | D(15,4) | Quantidade |
| quantityFinished | D(15,4) | Quantidade |
| quantityCritical | D(15,4) | Quantidade |
| quantityScrap | D(15,4) | Quantidade |
| quantityDead | D(15,4) | Quantidade |
| quantityAccountingInd | D(15,4) | Quantidade |
| quantityAccountingResale | D(15,4) | Quantidade |
| quantityOnOrder | D(15,4) | Quantidade |

### 1.5 InventoryMovement (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| unitCost | D(15,4) | Custo unitário |
| totalCost | D(15,2) | Valor monetário |
| balanceAfter | D(15,4) | Quantidade |

### 1.6 StockReservation (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| consumedQty | D(15,4) | Quantidade |

### 1.7 Quote (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| freightValue | D(15,2) | Valor monetário |
| discountPercent | D(5,4) | Percentual |
| totalValue | D(15,2) | Valor monetário |

### 1.8 QuoteItem (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| unitPrice | D(15,4) | Preço unitário |
| totalPrice | D(15,2) | Valor monetário |

### 1.9 PurchaseOrder (5 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| freightValue | D(15,2) | Valor monetário |
| discountPercent | D(5,4) | Percentual |
| totalValue | D(15,2) | Valor monetário |
| fobFreightValue | D(15,2) | Valor monetário |
| pickupKm | D(10,2) | Distância |
| pickupValue | D(15,2) | Valor monetário |

### 1.10 PurchaseOrderItem (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| unitPrice | D(15,4) | Preço unitário |
| totalPrice | D(15,2) | Valor monetário |
| receivedQty | D(15,4) | Quantidade |

### 1.11 ReceivedInvoice (15 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| totalProducts | D(15,2) | Valor monetário |
| totalInvoice | D(15,2) | Valor monetário |
| freightValue | D(15,2) | Valor monetário |
| discountValue | D(15,2) | Valor monetário |
| icmsBase | D(15,2) | Base fiscal |
| icmsValue | D(15,2) | Valor fiscal |
| ipiValue | D(15,2) | Valor fiscal |
| pisValue | D(15,2) | Valor fiscal |
| cofinsValue | D(15,2) | Valor fiscal |
| icms_st_base | D(15,2) | Base fiscal |
| icms_st_value | D(15,2) | Valor fiscal |
| insurance_value | D(15,2) | Valor monetário |
| other_expenses | D(15,2) | Valor monetário |
| icms_credit | D(15,2) | Crédito fiscal |
| icms_st_credit | D(15,2) | Crédito fiscal |
| icms_sn_credit | D(15,2) | Crédito fiscal |
| ipi_credit | D(15,2) | Crédito fiscal |
| pis_credit | D(15,2) | Crédito fiscal |
| cofins_credit | D(15,2) | Crédito fiscal |

### 1.12 ReceivedInvoiceItem (9 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| unitPrice | D(15,4) | Preço unitário |
| totalPrice | D(15,2) | Valor monetário |
| icmsRate | D(5,4) | Alíquota fiscal |
| icmsValue | D(15,2) | Valor fiscal |
| ipiRate | D(5,4) | Alíquota fiscal |
| ipiValue | D(15,2) | Valor fiscal |
| receivedQty | D(15,4) | Quantidade |

### 1.13 AccountsPayable (12 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| originalValue | D(15,2) | Valor monetário |
| discountValue | D(15,2) | Valor monetário |
| interestValue | D(15,2) | Valor monetário |
| fineValue | D(15,2) | Valor monetário |
| paidValue | D(15,2) | Valor monetário |
| netValue | D(15,2) | Valor monetário |
| withholdingIr | D(15,2) | Retenção fiscal |
| withholdingIss | D(15,2) | Retenção fiscal |
| withholdingInss | D(15,2) | Retenção fiscal |
| withholdingPis | D(15,2) | Retenção fiscal |
| withholdingCofins | D(15,2) | Retenção fiscal |
| withholdingCsll | D(15,2) | Retenção fiscal |

### 1.14 PayablePayment (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| value | D(15,2) | Valor monetário |
| discountValue | D(15,2) | Valor monetário |
| interestValue | D(15,2) | Valor monetário |
| fineValue | D(15,2) | Valor monetário |

### 1.15 MaterialRequisitionItem (5 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| requestedQty | D(15,4) | Quantidade |
| approvedQty | D(15,4) | Quantidade |
| separatedQty | D(15,4) | Quantidade |
| unitCost | D(15,4) | Custo unitário |
| totalCost | D(15,2) | Valor monetário |

### 1.16 ProductionOrder (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| producedQty | D(15,4) | Quantidade |

### 1.17 ProductionOrderMaterial (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| requiredQty | D(15,4) | Quantidade |
| consumedQty | D(15,4) | Quantidade |
| unitCost | D(15,4) | Custo unitário |
| totalCost | D(15,2) | Valor monetário |

### 1.18 ProductionOrderOperation (7 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| setupTime | D(10,2) | Horas |
| runTime | D(10,2) | Horas |
| actualSetupTime | D(10,2) | Horas |
| actualRunTime | D(10,2) | Horas |
| plannedQty | D(15,4) | Quantidade |
| completedQty | D(15,4) | Quantidade |
| scrapQty | D(15,4) | Quantidade |

### 1.19 CostCenter (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| budget | D(15,2) | Valor monetário |

### 1.20 BankAccount (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| initialBalance | D(15,2) | Valor monetário |
| currentBalance | D(15,2) | Valor monetário |
| creditLimit | D(15,2) | Valor monetário |

### 1.21 BankTransaction (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| value | D(15,2) | Valor monetário |
| balanceAfter | D(15,2) | Valor monetário |

### 1.22 PixTransaction (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| value | D(15,2) | Valor monetário |
| fee | D(15,2) | Valor monetário |

### 1.23 Customer (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| creditLimit | D(15,2) | Valor monetário |
| minInvoiceValue | D(15,2) | Valor monetário |

### 1.24 AccountsReceivable (6 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| originalValue | D(15,2) | Valor monetário |
| discountValue | D(15,2) | Valor monetário |
| interestValue | D(15,2) | Valor monetário |
| fineValue | D(15,2) | Valor monetário |
| paidValue | D(15,2) | Valor monetário |
| netValue | D(15,2) | Valor monetário |

### 1.25 ReceivablePayment (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| value | D(15,2) | Valor monetário |
| discountValue | D(15,2) | Valor monetário |
| interestValue | D(15,2) | Valor monetário |
| fineValue | D(15,2) | Valor monetário |

### 1.26 PayableCostAllocation (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| percentage | D(5,4) | Percentual |
| value | D(15,2) | Valor monetário |

### 1.27 ApprovalThreshold (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| minValue | D(15,2) | Valor monetário |
| maxValue | D(15,2) | Valor monetário |

### 1.28 BomItem (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| scrapPercentage | D(5,4) | Percentual |

### 1.29 MrpParameter (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| minLotSize | D(15,4) | Quantidade |
| lotMultiple | D(15,4) | Quantidade |
| safetyStock | D(15,4) | Quantidade |

### 1.30 MrpSuggestion (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |

### 1.31 WorkCenter (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| capacityPerHour | D(10,2) | Capacidade |
| hoursPerDay | D(10,2) | Horas |
| efficiencyTarget | **MANTER Float** | Score/meta (0.0-1.0) |
| costPerHour | D(15,4) | Custo unitário |

### 1.32 ProductionLog (7 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| plannedQuantity | D(15,4) | Quantidade |
| producedQuantity | D(15,4) | Quantidade |
| goodQuantity | D(15,4) | Quantidade |
| scrapQuantity | D(15,4) | Quantidade |
| reworkQuantity | D(15,4) | Quantidade |
| cycleTimeSeconds | D(10,2) | Tempo |
| idealCycleTimeSeconds | D(10,2) | Tempo |

### 1.33 OeeTarget (4 campos — MANTER Float)

| Campo | Tipo Destino | Justificativa |
|---|---|---|
| availabilityTarget | **MANTER Float** | Meta OEE (0.0-1.0), não financeiro |
| performanceTarget | **MANTER Float** | Meta OEE (0.0-1.0), não financeiro |
| qualityTarget | **MANTER Float** | Meta OEE (0.0-1.0), não financeiro |
| oeeTarget | **MANTER Float** | Meta OEE (0.0-1.0), não financeiro |

### 1.34 Lead (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| estimatedValue | D(15,2) | Valor monetário |

### 1.35 SalesQuote (6 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| subtotal | D(15,2) | Valor monetário |
| discountPercent | D(5,4) | Percentual |
| discountValue | D(15,2) | Valor monetário |
| shippingValue | D(15,2) | Valor monetário |
| taxValue | D(15,2) | Valor fiscal |
| totalValue | D(15,2) | Valor monetário |

### 1.36 SalesQuoteItem (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| unitPrice | D(15,4) | Preço unitário |
| discountPercent | D(5,4) | Percentual |
| totalPrice | D(15,2) | Valor monetário |

### 1.37 SalesOrder (6 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| subtotal | D(15,2) | Valor monetário |
| discountPercent | D(5,4) | Percentual |
| discountValue | D(15,2) | Valor monetário |
| shippingValue | D(15,2) | Valor monetário |
| taxValue | D(15,2) | Valor fiscal |
| totalValue | D(15,2) | Valor monetário |

### 1.38 SalesOrderItem (5 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| deliveredQty | D(15,4) | Quantidade |
| unitPrice | D(15,4) | Preço unitário |
| discountPercent | D(5,4) | Percentual |
| totalPrice | D(15,2) | Valor monetário |

### 1.39 LocationInventory (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| reservedQty | D(15,4) | Quantidade |
| minQuantity | D(15,4) | Quantidade |
| maxQuantity | D(15,4) | Quantidade |

### 1.40 StockTransferItem (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| requestedQty | D(15,4) | Quantidade |
| shippedQty | D(15,4) | Quantidade |
| receivedQty | D(15,4) | Quantidade |

### 1.41 InventoryCount (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| systemQty | D(15,4) | Quantidade |
| countedQty | D(15,4) | Quantidade |
| difference | D(15,4) | Quantidade |

### 1.42 JobPosition (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| baseSalary | D(15,2) | Valor monetário |

### 1.43 Employee (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| salary | D(15,2) | Valor monetário |
| workHoursPerDay | D(10,2) | Horas |

### 1.44 TimeClockEntry (2 campos — MANTER Float)

| Campo | Tipo Destino | Justificativa |
|---|---|---|
| latitude | **MANTER Float** | Coordenada GPS |
| longitude | **MANTER Float** | Coordenada GPS |

### 1.45 TimesheetDay (7 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| scheduledHours | D(10,2) | Horas |
| workedHours | D(10,2) | Horas |
| overtimeHours | D(10,2) | Horas |
| nightHours | D(10,2) | Horas |
| absenceHours | D(10,2) | Horas |
| overtime50 | D(10,2) | Horas |
| overtime100 | D(10,2) | Horas |

### 1.46 WorkSchedule (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| weeklyHours | D(10,2) | Horas |
| dailyHours | D(10,2) | Horas |

### 1.47 HoursBank (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| hours | D(10,2) | Horas |
| balance | D(10,2) | Horas |

### 1.48 Payroll (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| totalGross | D(15,2) | Valor monetário |
| totalDeductions | D(15,2) | Valor monetário |
| totalNet | D(15,2) | Valor monetário |

### 1.49 PayrollItem (10 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| baseSalary | D(15,2) | Valor monetário |
| workedHours | D(10,2) | Horas |
| overtimeHours | D(10,2) | Horas |
| nightHours | D(10,2) | Horas |
| grossSalary | D(15,2) | Valor monetário |
| totalDeductions | D(15,2) | Valor monetário |
| netSalary | D(15,2) | Valor monetário |
| inss | D(15,2) | Valor monetário |
| irrf | D(15,2) | Valor monetário |
| fgts | D(15,2) | Valor monetário |

### 1.50 PayrollEvent (2 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| reference | D(15,4) | Referência numérica |
| value | D(15,2) | Valor monetário |

### 1.51 Vacation (9 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| baseSalary | D(15,2) | Valor monetário |
| vacationPay | D(15,2) | Valor monetário |
| oneThirdBonus | D(15,2) | Valor monetário |
| soldDaysValue | D(15,2) | Valor monetário |
| totalGross | D(15,2) | Valor monetário |
| inssDeduction | D(15,2) | Valor monetário |
| irrfDeduction | D(15,2) | Valor monetário |
| otherDeductions | D(15,2) | Valor monetário |
| totalNet | D(15,2) | Valor monetário |

### 1.52 ThirteenthSalary (7 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| baseSalary | D(15,2) | Valor monetário |
| averageVariable | D(15,2) | Valor monetário |
| grossValue | D(15,2) | Valor monetário |
| inssDeduction | D(15,2) | Valor monetário |
| irrfDeduction | D(15,2) | Valor monetário |
| otherDeductions | D(15,2) | Valor monetário |
| netValue | D(15,2) | Valor monetário |

### 1.53 Termination (16 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| baseSalary | D(15,2) | Valor monetário |
| salaryBalance | D(15,2) | Valor monetário |
| noticePeriodValue | D(15,2) | Valor monetário |
| vacationBalance | D(15,2) | Valor monetário |
| vacationProportional | D(15,2) | Valor monetário |
| vacationOneThird | D(15,2) | Valor monetário |
| thirteenthProportional | D(15,2) | Valor monetário |
| fgtsBalance | D(15,2) | Valor monetário |
| fgtsFine | D(15,2) | Valor monetário |
| otherEarnings | D(15,2) | Valor monetário |
| totalGross | D(15,2) | Valor monetário |
| inssDeduction | D(15,2) | Valor monetário |
| irrfDeduction | D(15,2) | Valor monetário |
| advanceDeduction | D(15,2) | Valor monetário |
| otherDeductions | D(15,2) | Valor monetário |
| totalDeductions | D(15,2) | Valor monetário |
| totalNet | D(15,2) | Valor monetário |

### 1.54 MaterialReceiving (5 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| totalValue | D(15,2) | Valor monetário |
| freightValue | D(15,2) | Valor monetário |
| insuranceValue | D(15,2) | Valor monetário |
| discountValue | D(15,2) | Valor monetário |
| otherExpenses | D(15,2) | Valor monetário |

### 1.55 MaterialReceivingItem (10 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| nfeQuantity | D(15,4) | Quantidade |
| receivedQuantity | D(15,4) | Quantidade |
| approvedQuantity | D(15,4) | Quantidade |
| rejectedQuantity | D(15,4) | Quantidade |
| unitPrice | D(15,4) | Preço unitário |
| totalPrice | D(15,2) | Valor monetário |
| icmsBase | D(15,2) | Base fiscal |
| icmsValue | D(15,2) | Valor fiscal |
| ipiBase | D(15,2) | Base fiscal |
| ipiValue | D(15,2) | Valor fiscal |

### 1.56 WorkflowStep (4 campos — MANTER Float)

| Campo | Tipo Destino | Justificativa |
|---|---|---|
| positionX | **MANTER Float** | Posição UI canvas |
| positionY | **MANTER Float** | Posição UI canvas |
| width | **MANTER Float** | Dimensão UI canvas |
| height | **MANTER Float** | Dimensão UI canvas |

### 1.57 WorkflowTransition (1 campo — MANTER Float)

| Campo | Tipo Destino | Justificativa |
|---|---|---|
| labelPosition | **MANTER Float** | Posição UI (0.0-1.0) |

### 1.58 SupplierReturn (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| totalValue | D(15,2) | Valor monetário |

### 1.59 SupplierReturnItem (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| unitPrice | D(15,4) | Preço unitário |
| totalPrice | D(15,2) | Valor monetário |

### 1.60 QualityInspection (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |
| approvedQty | D(15,4) | Quantidade |
| rejectedQty | D(15,4) | Quantidade |

### 1.61 QualityInspectionItem (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| toleranceMin | D(15,4) | Medição |
| toleranceMax | D(15,4) | Medição |
| measuredValue | D(15,4) | Medição |

### 1.62 NonConformity (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantity | D(15,4) | Quantidade |

### 1.63 ProductionCost (17 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| materialCost | D(15,2) | Valor monetário |
| materialCostStd | D(15,2) | Valor monetário |
| materialVariance | D(15,2) | Valor monetário |
| laborCost | D(15,2) | Valor monetário |
| laborCostStd | D(15,2) | Valor monetário |
| laborVariance | D(15,2) | Valor monetário |
| laborHours | D(10,2) | Horas |
| laborHoursStd | D(10,2) | Horas |
| overheadCost | D(15,2) | Valor monetário |
| overheadCostStd | D(15,2) | Valor monetário |
| overheadVariance | D(15,2) | Valor monetário |
| totalCost | D(15,2) | Valor monetário |
| totalCostStd | D(15,2) | Valor monetário |
| totalVariance | D(15,2) | Valor monetário |
| unitCost | D(15,4) | Custo unitário |
| unitCostStd | D(15,4) | Custo unitário |
| quantityProduced | D(15,4) | Quantidade |

### 1.64 ProductionCostMaterial (6 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| quantityStd | D(15,4) | Quantidade |
| quantityActual | D(15,4) | Quantidade |
| unitCost | D(15,4) | Custo unitário |
| totalCostStd | D(15,2) | Valor monetário |
| totalCostActual | D(15,2) | Valor monetário |
| variance | D(15,2) | Valor monetário |

### 1.65 ProductionCostLabor (6 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| hoursStd | D(10,2) | Horas |
| hoursActual | D(10,2) | Horas |
| hourlyRate | D(15,4) | Custo unitário |
| totalCostStd | D(15,2) | Valor monetário |
| totalCostActual | D(15,2) | Valor monetário |
| variance | D(15,2) | Valor monetário |

### 1.66 MaterialStandardCost (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| materialCost | D(15,2) | Valor monetário |
| laborCost | D(15,2) | Valor monetário |
| overheadCost | D(15,2) | Valor monetário |
| totalCost | D(15,2) | Valor monetário |

### 1.67 BenefitType (3 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| defaultValue | D(15,2) | Valor monetário |
| defaultPercentage | D(5,4) | Percentual |
| employeeDiscountPercent | D(5,4) | Percentual |

### 1.68 EmployeeBenefit (4 campos)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| value | D(15,2) | Valor monetário |
| employeeDiscount | D(15,2) | Valor monetário |
| companyContribution | D(15,2) | Valor monetário |
| quantity | D(15,4) | Quantidade |

### 1.69 TransportVoucher (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| fareValue | D(15,2) | Valor monetário |

### 1.70 Training (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| cost | D(15,2) | Valor monetário |

### 1.71 EmployeeTraining (1 campo — MANTER Float)

| Campo | Tipo Destino | Justificativa |
|---|---|---|
| score | **MANTER Float** | Nota/score (0.0-10.0), não financeiro |

### 1.72 AdmissionProcess (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| proposedSalary | D(15,2) | Valor monetário |

### 1.73 AiUsageLog (1 campo)

| Campo | Tipo Destino | Categoria |
|---|---|---|
| estimatedCost | D(15,4) | Custo unitário (centavos USD) |

### Resumo dos campos que MANTÊM Float (13 campos)

| Model | Campo | Justificativa |
|---|---|---|
| TimeClockEntry | latitude | Coordenada GPS |
| TimeClockEntry | longitude | Coordenada GPS |
| WorkflowStep | positionX | Posição UI canvas |
| WorkflowStep | positionY | Posição UI canvas |
| WorkflowStep | width | Dimensão UI canvas |
| WorkflowStep | height | Dimensão UI canvas |
| WorkflowTransition | labelPosition | Posição UI (0.0-1.0) |
| WorkCenter | efficiencyTarget | Meta eficiência (0.0-1.0) |
| OeeTarget | availabilityTarget | Meta OEE (0.0-1.0) |
| OeeTarget | performanceTarget | Meta OEE (0.0-1.0) |
| OeeTarget | qualityTarget | Meta OEE (0.0-1.0) |
| OeeTarget | oeeTarget | Meta OEE (0.0-1.0) |
| EmployeeTraining | score | Nota (0.0-10.0) |

---

## 2. companyId — Auditoria de Obrigatoriedade (66 models nullable)

### Situação atual

| Categoria | Qtd |
|---|---|
| `companyId String?` (nullable) | **66** |
| `companyId String` (required) | **29** |
| Sem companyId (junção, config global) | **78** |
| **Total models** | **173** |

### Classificação

- **→ NOT NULL** — Model transacional que SEMPRE pertence a uma empresa
- **MANTER NULL** — Model que pode ser global/compartilhado (isShared) ou log cross-tenant
- **AVALIAR** — Depende de decisão de negócio

### 2.1 Models que devem mudar para NOT NULL (46 models)

| # | Model | Justificativa |
|---|---|---|
| 1 | AccountsPayable | Título a pagar — sempre de uma empresa |
| 2 | AccountsReceivable | Título a receber — sempre de uma empresa |
| 3 | AdmissionProcess | Processo admissional — sempre de uma empresa |
| 4 | ApprovalThreshold | Alçada de aprovação — por empresa |
| 5 | BankAccount | Conta bancária — sempre de uma empresa |
| 6 | BenefitType | Tipo de benefício — por empresa |
| 7 | CollectionRule | Regra de cobrança — por empresa |
| 8 | CostCenter | Centro de custo — por empresa |
| 9 | Customer | Cliente — sempre de uma empresa |
| 10 | CustomsBroker | Despachante — por empresa |
| 11 | Department | Departamento — por empresa |
| 12 | Employee | Funcionário — sempre de uma empresa |
| 13 | EmployeeBenefit | Benefício do funcionário — por empresa |
| 14 | EmployeeTraining | Treinamento do funcionário — por empresa |
| 15 | GedCategory | Categoria GED — por empresa |
| 16 | GedDocument | Documento GED — por empresa |
| 17 | Holiday | Feriado — por empresa (feriados locais) |
| 18 | HoursBank | Banco de horas — por empresa |
| 19 | ImportProcess | Processo de importação — por empresa |
| 20 | Inventory | Estoque — sempre de uma empresa |
| 21 | IssuedInvoice | NF-e emitida — sempre de uma empresa |
| 22 | JobPosition | Cargo — por empresa |
| 23 | Lead | Lead comercial — por empresa |
| 24 | MaterialReceiving | Recebimento — sempre de uma empresa |
| 25 | MaterialRequisition | Requisição — sempre de uma empresa |
| 26 | MaterialStandardCost | Custo padrão — por empresa |
| 27 | MrpRun | Execução MRP — por empresa |
| 28 | NonConformity | Não conformidade — por empresa |
| 29 | Notification | Notificação — por empresa |
| 30 | NotificationGroup | Grupo de notificação — por empresa |
| 31 | OeeTarget | Meta OEE — por empresa |
| 32 | Payroll | Folha de pagamento — sempre de uma empresa |
| 33 | PhysicalInventory | Inventário físico — por empresa |
| 34 | PixTransaction | Transação Pix — por empresa |
| 35 | Port | Porto — por empresa |
| 36 | ProductionCost | Custo de produção — por empresa |
| 37 | ProductionOrder | Ordem de produção — sempre de uma empresa |
| 38 | PurchaseOrder | Pedido de compra — sempre de uma empresa |
| 39 | QualityInspection | Inspeção de qualidade — por empresa |
| 40 | ReceivedInvoice | NF-e recebida — sempre de uma empresa |
| 41 | SalesOrder | Pedido de venda — sempre de uma empresa |
| 42 | SalesQuote | Orçamento de venda — por empresa |
| 43 | SkillMatrix | Matriz de habilidades — por empresa |
| 44 | StockReservation | Reserva de estoque — por empresa |
| 45 | StockTransfer | Transferência de estoque — por empresa |
| 46 | SupplierReturn | Devolução a fornecedor — por empresa |

### 2.2 Models que devem MANTER nullable (14 models)

| # | Model | Justificativa |
|---|---|---|
| 1 | AuditLog | Log cross-tenant — admin vê tudo |
| 2 | Category | Pode ser compartilhada (isShared=true) |
| 3 | Material | Pode ser compartilhado (isShared=true) |
| 4 | Product | Pode ser compartilhado (isShared=true) |
| 5 | ProductCategory | Pode ser compartilhada (isShared=true) |
| 6 | Quote | billingCompanyId já é nullable separado |
| 7 | StockLocation | Pode ser compartilhado entre empresas |
| 8 | Supplier | Pode ser compartilhado (isShared=true) |
| 9 | SystemLog | Log de sistema — cross-tenant |
| 10 | SystemSetting | Configuração pode ser global |
| 11 | Task | Tarefas podem ser cross-tenant |
| 12 | Termination | Herda empresa do Employee |
| 13 | ThirteenthSalary | Herda empresa do Employee |
| 14 | Vacation | Herda empresa do Employee |

### 2.3 Models com companyId nullable que precisam de AVALIAÇÃO (6 models)

| # | Model | Questão |
|---|---|---|
| 1 | Training | Treinamento pode ser corporativo (multi-empresa)? |
| 2 | TransportVoucher | VT pode ser centralizado no grupo? |
| 3 | TimeClockAdjustment | Ajuste de ponto — deveria herdar do Employee? |
| 4 | User | companyId no User é a empresa "padrão" — manter null para admin global |
| 5 | UserGroup | Grupo pode ser global (admin) ou por empresa |
| 6 | WorkCenter | Centro de trabalho pode ser compartilhado entre empresas do grupo? |
| 7 | WorkSchedule | Escala pode ser compartilhada entre empresas? |

### 2.4 Estratégia de migração

```sql
-- Para cada model da lista 2.1, executar em sequência:
-- 1. Verificar registros órfãos
SELECT id FROM tabela WHERE company_id IS NULL;

-- 2. Se houver registros órfãos, atribuir à empresa padrão
UPDATE tabela SET company_id = '<DEFAULT_COMPANY_UUID>' WHERE company_id IS NULL;

-- 3. Aplicar constraint NOT NULL
ALTER TABLE tabela ALTER COLUMN company_id SET NOT NULL;

-- 4. Adicionar índice composto se não existir
CREATE INDEX IF NOT EXISTS idx_tabela_company ON tabela(company_id);
```

### 2.5 Impacto no código

- Todos os `create` desses 46 models precisam receber `companyId` obrigatório
- Queries `where` devem sempre incluir `companyId` (preparação para RLS)
- Relação Prisma muda de `Company?` para `Company`

---

## 3. Models Novos — RH/DP, Industrial, Fiscal, Escala Multi-Tenant

### 3.1 RH/DP — eSocial e Complementos

#### 3.1.1 EmployeeDependent (Dependentes para eSocial/IR)

```prisma
model EmployeeDependent {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId     String    @db.Uuid
  companyId      String    @db.Uuid
  name           String
  cpf            String?   @db.VarChar(14)
  birthDate      DateTime  @db.Date
  relationship   DependentRelationship
  isIRDependent  Boolean   @default(false)
  isSalarioFamiliaDependent Boolean @default(false)
  isDisabled     Boolean   @default(false)
  startDate      DateTime  @db.Date
  endDate        DateTime? @db.Date
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @default(now()) @updatedAt
  employee       Employee  @relation(fields: [employeeId], references: [id])
  company        Company   @relation(fields: [companyId], references: [id])

  @@index([employeeId])
  @@index([companyId])
  @@map("employee_dependents")
}

enum DependentRelationship {
  SPOUSE
  CHILD
  STEPCHILD
  PARENT
  GUARDIAN
  OTHER
  @@map("dependent_relationship")
}
```

#### 3.1.2 LeaveRecord (Afastamentos — eSocial S-2230)

```prisma
model LeaveRecord {
  id             String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId     String      @db.Uuid
  companyId      String      @db.Uuid
  type           LeaveType
  startDate      DateTime    @db.Date
  endDate        DateTime?   @db.Date
  reason         String?
  cid            String?     @db.VarChar(10)  // CID-10 para atestados
  inssProtocol   String?     // Protocolo INSS para auxílio-doença
  eSocialEventId String?     // ID do evento S-2230
  status         LeaveStatus @default(ACTIVE)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @default(now()) @updatedAt
  employee       Employee    @relation(fields: [employeeId], references: [id])
  company        Company     @relation(fields: [companyId], references: [id])

  @@index([employeeId])
  @@index([companyId])
  @@map("leave_records")
}

enum LeaveType {
  MEDICAL          // Atestado médico
  MATERNITY        // Licença maternidade
  PATERNITY        // Licença paternidade
  WORK_ACCIDENT    // Acidente de trabalho
  INSS_BENEFIT     // Auxílio-doença
  MILITARY_SERVICE // Serviço militar
  UNPAID_LEAVE     // Licença sem remuneração
  OTHER
  @@map("leave_type")
}

enum LeaveStatus {
  ACTIVE
  ENDED
  CANCELLED
  @@map("leave_status")
}
```

#### 3.1.3 IncomeTaxTable (Tabela progressiva IR — substituir hardcode)

```prisma
model IncomeTaxTable {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId     String   @db.Uuid
  validFrom     DateTime @db.Date
  validTo       DateTime? @db.Date
  bracket       Int      // Faixa (1, 2, 3, 4, 5)
  minValue      Decimal  @db.Decimal(15, 2)
  maxValue      Decimal? @db.Decimal(15, 2)
  rate          Decimal  @db.Decimal(5, 4)   // Alíquota
  deduction     Decimal  @db.Decimal(15, 2)  // Parcela a deduzir
  createdAt     DateTime @default(now())
  company       Company  @relation(fields: [companyId], references: [id])

  @@index([companyId, validFrom])
  @@map("income_tax_tables")
}
```

#### 3.1.4 INSSTable (Tabela INSS progressiva)

```prisma
model INSSTable {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  validFrom     DateTime @db.Date
  validTo       DateTime? @db.Date
  bracket       Int
  minValue      Decimal  @db.Decimal(15, 2)
  maxValue      Decimal? @db.Decimal(15, 2)
  rate          Decimal  @db.Decimal(5, 4)
  createdAt     DateTime @default(now())

  @@index([validFrom])
  @@map("inss_tables")
}
```

### 3.2 Industrial — Rastreabilidade de Lotes

#### 3.2.1 Lot (Lote de material)

```prisma
model Lot {
  id             String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code           String
  materialId     String      @db.Uuid
  companyId      String      @db.Uuid
  supplierId     String?     @db.Uuid
  manufacturingDate DateTime? @db.Date
  expirationDate DateTime?   @db.Date
  receivedDate   DateTime    @db.Date
  invoiceNumber  String?
  quantity       Decimal     @db.Decimal(15, 4)
  currentQty     Decimal     @db.Decimal(15, 4)
  unitCost       Decimal?    @db.Decimal(15, 4)
  status         LotStatus   @default(AVAILABLE)
  qualityCertificate String? // URL do certificado
  notes          String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @default(now()) @updatedAt
  material       Material    @relation(fields: [materialId], references: [id])
  company        Company     @relation(fields: [companyId], references: [id])
  supplier       Supplier?   @relation(fields: [supplierId], references: [id])
  movements      LotMovement[]

  @@unique([code, companyId])
  @@index([materialId])
  @@index([companyId])
  @@index([expirationDate])
  @@map("lots")
}

enum LotStatus {
  AVAILABLE
  QUARANTINE
  BLOCKED
  EXPIRED
  CONSUMED
  @@map("lot_status")
}
```

#### 3.2.2 LotMovement (Rastreabilidade de movimentação por lote)

```prisma
model LotMovement {
  id              String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  lotId           String       @db.Uuid
  companyId       String       @db.Uuid
  movementType    MovementType
  quantity        Decimal      @db.Decimal(15, 4)
  referenceType   String?      // "ProductionOrder", "ReceivedInvoice", etc.
  referenceId     String?      @db.Uuid
  notes           String?
  createdBy       String?      @db.Uuid
  createdAt       DateTime     @default(now())
  lot             Lot          @relation(fields: [lotId], references: [id])
  company         Company      @relation(fields: [companyId], references: [id])

  @@index([lotId])
  @@index([companyId])
  @@map("lot_movements")
}
```

#### 3.2.3 ProductionRouting (Roteiro padrão de produção)

```prisma
model ProductionRouting {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  materialId     String    @db.Uuid
  companyId      String    @db.Uuid
  sequence       Int
  workCenterId   String    @db.Uuid
  operationName  String
  setupTime      Decimal   @db.Decimal(10, 2)  // Horas
  runTime        Decimal   @db.Decimal(10, 2)  // Horas por unidade
  description    String?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @default(now()) @updatedAt
  material       Material  @relation(fields: [materialId], references: [id])
  company        Company   @relation(fields: [companyId], references: [id])
  workCenter     WorkCenter @relation(fields: [workCenterId], references: [id])

  @@unique([materialId, companyId, sequence])
  @@index([companyId])
  @@map("production_routings")
}
```

### 3.3 Fiscal — Estrutura Tributária

#### 3.3.1 TaxRegime (Regime tributário por empresa)

```prisma
model TaxRegime {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId      String    @db.Uuid
  regime         TaxRegimeType
  validFrom      DateTime  @db.Date
  validTo        DateTime? @db.Date
  simpleNacionalRate Decimal? @db.Decimal(5, 4) // Alíquota SN se aplicável
  notes          String?
  createdAt      DateTime  @default(now())
  company        Company   @relation(fields: [companyId], references: [id])

  @@index([companyId])
  @@map("tax_regimes")
}

enum TaxRegimeType {
  SIMPLES_NACIONAL
  LUCRO_PRESUMIDO
  LUCRO_REAL
  MEI
  @@map("tax_regime_type")
}
```

#### 3.3.2 CfopTable (Tabela CFOP estruturada)

```prisma
model CfopTable {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code           String   @unique @db.VarChar(4)  // "5102", "6101", etc.
  description    String
  type           CfopType
  isInterstate   Boolean  @default(false)
  isExport       Boolean  @default(false)
  notes          String?
  createdAt      DateTime @default(now())

  @@index([code])
  @@map("cfop_table")
}

enum CfopType {
  ENTRY   // Entrada
  EXIT    // Saída
  @@map("cfop_type")
}
```

#### 3.3.3 NcmTable (Tabela NCM/TIPI)

```prisma
model NcmTable {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code           String   @unique @db.VarChar(10)  // "8482.10.10"
  description    String
  ipiRate        Decimal? @db.Decimal(5, 4)
  importTaxRate  Decimal? @db.Decimal(5, 4)
  unit           String?  @db.VarChar(10)
  createdAt      DateTime @default(now())

  @@index([code])
  @@map("ncm_table")
}
```

#### 3.3.4 IntercompanyTransfer (Transferência intercompany)

```prisma
model IntercompanyTransfer {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sourceCompanyId  String    @db.Uuid
  targetCompanyId  String    @db.Uuid
  transferDate     DateTime  @db.Date
  invoiceNumber    String?
  totalValue       Decimal   @db.Decimal(15, 2)
  status           IntercompanyStatus @default(PENDING)
  notes            String?
  createdBy        String?   @db.Uuid
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @default(now()) @updatedAt
  sourceCompany    Company   @relation("IntercompanySource", fields: [sourceCompanyId], references: [id])
  targetCompany    Company   @relation("IntercompanyTarget", fields: [targetCompanyId], references: [id])
  items            IntercompanyTransferItem[]

  @@index([sourceCompanyId])
  @@index([targetCompanyId])
  @@map("intercompany_transfers")
}

model IntercompanyTransferItem {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  transferId   String   @db.Uuid
  materialId   String   @db.Uuid
  quantity     Decimal  @db.Decimal(15, 4)
  unitPrice    Decimal  @db.Decimal(15, 4)
  totalPrice   Decimal  @db.Decimal(15, 2)
  cfop         String?  @db.VarChar(4)
  transfer     IntercompanyTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  material     Material @relation(fields: [materialId], references: [id])

  @@index([transferId])
  @@map("intercompany_transfer_items")
}

enum IntercompanyStatus {
  PENDING
  IN_TRANSIT
  RECEIVED
  CANCELLED
  @@map("intercompany_status")
}
```

### 3.4 Escala Multi-Tenant

#### 3.4.1 CompanyGroup (Agrupamento de empresas)

```prisma
model CompanyGroup {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  cnpj        String?   @db.VarChar(18)  // CNPJ da holding
  description String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt
  companies   CompanyGroupMember[]

  @@map("company_groups")
}

model CompanyGroupMember {
  id          String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  groupId     String       @db.Uuid
  companyId   String       @db.Uuid
  role        GroupRole    @default(MEMBER)
  joinedAt    DateTime     @default(now())
  group       CompanyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  company     Company      @relation(fields: [companyId], references: [id])

  @@unique([groupId, companyId])
  @@map("company_group_members")
}

enum GroupRole {
  HOLDING
  MEMBER
  @@map("group_role")
}
```

#### 3.4.2 BillingPlan (Plano de cobrança SaaS)

```prisma
model BillingPlan {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String
  maxCompanies    Int       @default(1)
  maxUsers        Int       @default(5)
  maxStorageGb    Int       @default(5)
  monthlyPrice    Decimal   @db.Decimal(15, 2)
  yearlyPrice     Decimal?  @db.Decimal(15, 2)
  features        Json      @default("[]")
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @default(now()) @updatedAt
  subscriptions   BillingSubscription[]

  @@map("billing_plans")
}

model BillingSubscription {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId       String    @db.Uuid
  planId          String    @db.Uuid
  status          SubscriptionStatus @default(ACTIVE)
  startDate       DateTime  @db.Date
  endDate         DateTime? @db.Date
  billingCycle    BillingCycle @default(MONTHLY)
  nextBillingDate DateTime? @db.Date
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @default(now()) @updatedAt
  company         Company   @relation(fields: [companyId], references: [id])
  plan            BillingPlan @relation(fields: [planId], references: [id])

  @@index([companyId])
  @@map("billing_subscriptions")
}

enum SubscriptionStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
  TRIAL
  @@map("subscription_status")
}

enum BillingCycle {
  MONTHLY
  YEARLY
  @@map("billing_cycle")
}
```

### 3.5 Resumo de models novos

| Domínio | Model | Prioridade |
|---|---|---|
| RH/DP | EmployeeDependent | Alta (eSocial) |
| RH/DP | LeaveRecord | Alta (eSocial S-2230) |
| RH/DP | IncomeTaxTable | Alta (cálculo folha) |
| RH/DP | INSSTable | Alta (cálculo folha) |
| Industrial | Lot | Alta (rastreabilidade) |
| Industrial | LotMovement | Alta (rastreabilidade) |
| Industrial | ProductionRouting | Média (roteiro padrão) |
| Fiscal | TaxRegime | Alta (regime tributário) |
| Fiscal | CfopTable | Média (tabela referência) |
| Fiscal | NcmTable | Média (tabela referência) |
| Fiscal | IntercompanyTransfer | Alta (grupo empresarial) |
| Fiscal | IntercompanyTransferItem | Alta (grupo empresarial) |
| Escala | CompanyGroup | Média (SaaS) |
| Escala | CompanyGroupMember | Média (SaaS) |
| Escala | BillingPlan | Baixa (SaaS futuro) |
| Escala | BillingSubscription | Baixa (SaaS futuro) |
| **Total** | **16 models novos** | |

---

## 4. Correções Estruturais no Schema Existente

### 4.1 ProductionOrderOperation.workCenter — String → FK

**Problema:** O campo `workCenter` é `String` (texto livre) em vez de FK para `WorkCenter`.

**Atual:**
```prisma
model ProductionOrderOperation {
  workCenter      String          // ← texto livre, sem integridade
}
```

**Proposta:**
```prisma
model ProductionOrderOperation {
  workCenterId    String          @db.Uuid
  workCenter      WorkCenter      @relation(fields: [workCenterId], references: [id])
}
```

**Migração:**
```sql
-- 1. Criar coluna FK
ALTER TABLE production_order_operations ADD COLUMN work_center_id UUID;

-- 2. Popular a partir do nome (match pelo nome do WorkCenter)
UPDATE production_order_operations poo
SET work_center_id = wc.id
FROM work_centers wc
WHERE poo.work_center = wc.name;

-- 3. Registros sem match → atribuir a um WorkCenter "INDEFINIDO"
INSERT INTO work_centers (id, name, company_id, is_active)
VALUES (gen_random_uuid(), 'INDEFINIDO', '<DEFAULT_COMPANY>', true)
ON CONFLICT DO NOTHING;

UPDATE production_order_operations
SET work_center_id = (SELECT id FROM work_centers WHERE name = 'INDEFINIDO' LIMIT 1)
WHERE work_center_id IS NULL;

-- 4. Aplicar NOT NULL e FK
ALTER TABLE production_order_operations
  ALTER COLUMN work_center_id SET NOT NULL,
  ADD CONSTRAINT fk_poo_work_center FOREIGN KEY (work_center_id) REFERENCES work_centers(id);

-- 5. Remover coluna texto antiga
ALTER TABLE production_order_operations DROP COLUMN work_center;
```

### 4.2 legacyId — Campo para migração Delphi

**Problema:** Não há campo padronizado para mapear IDs do sistema Delphi, dificultando reconciliação e importação incremental.

**Proposta:** Adicionar `legacyId` nos models que serão migrados do Delphi.

```prisma
// Adicionar em cada model migrado:
legacyId  String?  @map("legacy_id") @db.VarChar(50)

// Com índice para busca rápida:
@@index([legacyId], map: "idx_<tabela>_legacy")
```

**Models que recebem legacyId (28 models):**

| # | Model | Tabela Delphi correspondente |
|---|---|---|
| 1 | Customer | CLIENTES |
| 2 | Supplier | FORNECEDORES |
| 3 | Material | MATERIAIS |
| 4 | Category | CATEGORIAS |
| 5 | Inventory | ESTOQUE |
| 6 | PurchaseOrder | PEDIDOS_COMPRA |
| 7 | PurchaseOrderItem | ITENS_PEDIDO_COMPRA |
| 8 | ReceivedInvoice | NF_ENTRADA |
| 9 | ReceivedInvoiceItem | ITENS_NF_ENTRADA |
| 10 | IssuedInvoice | NF_SAIDA |
| 11 | AccountsPayable | CONTAS_PAGAR |
| 12 | AccountsReceivable | CONTAS_RECEBER |
| 13 | BankAccount | CONTAS_BANCARIAS |
| 14 | Employee | FUNCIONARIOS |
| 15 | Department | DEPARTAMENTOS |
| 16 | CostCenter | CENTROS_CUSTO |
| 17 | ProductionOrder | ORDENS_PRODUCAO |
| 18 | BomItem | ESTRUTURA_PRODUTO |
| 19 | WorkCenter | CENTROS_TRABALHO |
| 20 | JobPosition | CARGOS |
| 21 | MaterialRequisition | REQUISICOES |
| 22 | SalesOrder | PEDIDOS_VENDA |
| 23 | SalesQuote | ORCAMENTOS |
| 24 | Lead | PROSPECTS |
| 25 | QualityInspection | INSPECOES |
| 26 | NonConformity | NAO_CONFORMIDADES |
| 27 | StockLocation | LOCAIS_ESTOQUE |
| 28 | BenefitType | BENEFICIOS |

### 4.3 Soft Delete — Padronização

**Problema:** Não há padrão uniforme de soft delete. Alguns models usam `isActive`, outros `status`, outros nada.

**Proposta:** Adicionar campos padronizados nos models transacionais:

```prisma
// Padrão soft delete:
deletedAt   DateTime?  @map("deleted_at")
deletedBy   String?    @map("deleted_by") @db.Uuid
```

**Regra:**
- Models com `status` enum que inclui `CANCELLED`/`INACTIVE` → usar o status existente
- Models sem mecanismo de exclusão → adicionar `deletedAt` + `deletedBy`
- Queries devem incluir `WHERE deleted_at IS NULL` por padrão (middleware Prisma)

**Models que recebem soft delete (15 models prioritários):**

| # | Model | Mecanismo atual | Ação |
|---|---|---|---|
| 1 | Customer | status ACTIVE/INACTIVE | Manter status |
| 2 | Supplier | status ACTIVE/INACTIVE | Manter status |
| 3 | Material | status ACTIVE/INACTIVE | Manter status |
| 4 | Employee | status ACTIVE/INACTIVE/TERMINATED | Manter status |
| 5 | BankAccount | isActive | Adicionar deletedAt |
| 6 | CostCenter | isActive | Adicionar deletedAt |
| 7 | Department | isActive | Adicionar deletedAt |
| 8 | WorkCenter | isActive | Adicionar deletedAt |
| 9 | JobPosition | isActive | Adicionar deletedAt |
| 10 | GedDocument | Nenhum | Adicionar deletedAt |
| 11 | GedCategory | Nenhum | Adicionar deletedAt |
| 12 | BomItem | Nenhum | Adicionar deletedAt |
| 13 | StockLocation | isActive | Adicionar deletedAt |
| 14 | Training | Nenhum | Adicionar deletedAt |
| 15 | BenefitType | isActive | Adicionar deletedAt |

### 4.4 Inventory — Saldos Paralelos (Risco de Dessincronização)

**Problema:** O model `Inventory` mantém 13 campos de saldo paralelos (`quantity`, `reservedQty`, `availableQty`, `quantitySemiFinished`, `quantityFinished`, etc.) que podem dessincronizar.

**Proposta (duas fases):**

**Fase 1 (imediata):** Manter estrutura atual, mas adicionar:
- Trigger PostgreSQL para recalcular `availableQty = quantity - reservedQty` automaticamente
- Constraint CHECK: `availableQty >= 0`
- Constraint CHECK: `quantity >= 0`

```sql
-- Trigger para manter availableQty sincronizado
CREATE OR REPLACE FUNCTION sync_available_qty()
RETURNS TRIGGER AS $$
BEGIN
  NEW.available_qty := NEW.quantity - NEW.reserved_qty;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_available_qty
  BEFORE INSERT OR UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION sync_available_qty();

-- Constraints de integridade
ALTER TABLE inventory ADD CONSTRAINT chk_qty_positive CHECK (quantity >= 0);
ALTER TABLE inventory ADD CONSTRAINT chk_available_positive CHECK (available_qty >= 0);
```

**Fase 2 (futura):** Migrar para modelo de saldo calculado a partir de `InventoryMovement`, eliminando campos redundantes.

### 4.5 Índices Compostos Faltantes

**Problema:** Vários models transacionais não têm índice composto `(companyId, campo_busca)`, forçando full table scan em queries multi-tenant.

**Proposta:** Adicionar índices compostos prioritários:

| Model | Índice | Justificativa |
|---|---|---|
| AccountsPayable | `(companyId, dueDate)` | Listagem por vencimento |
| AccountsPayable | `(companyId, status)` | Filtro por status |
| AccountsReceivable | `(companyId, dueDate)` | Listagem por vencimento |
| AccountsReceivable | `(companyId, status)` | Filtro por status |
| Inventory | `(companyId, materialId)` | Busca de saldo |
| ProductionOrder | `(companyId, status)` | Filtro por status |
| PurchaseOrder | `(companyId, status)` | Filtro por status |
| ReceivedInvoice | `(companyId, status)` | Filtro por status |
| IssuedInvoice | `(companyId, status)` | Filtro por status |
| Employee | `(companyId, status)` | Filtro por status |
| Material | `(companyId, code)` | Busca por código |
| Customer | `(companyId, code)` | Busca por código |

---

## 5. Modularização do Monólito — Schema + Routers

### 5.1 Prisma Schema Folder (prismaSchemaFolder)

**Situação atual:** 1 arquivo `schema.prisma` com 5.538 linhas, 173 models, 76 enums.

**Proposta:** Usar `prismaSchemaFolder` (Prisma 5.15+) para dividir em módulos por domínio.

**Estrutura proposta:**

```
prisma/
  schema/
    _base.prisma          # datasource + generator + Company + User + enums globais
    auth.prisma           # UserCompany, UserGroup, UserGroupMember, UserCompanyPermission
    catalog.prisma        # Material, Category, Product, ProductCategory, ProductImage, etc.
    purchasing.prisma     # Quote, QuoteItem, PurchaseOrder, PurchaseOrderItem, Supplier, SupplierMaterial
    inventory.prisma      # Inventory, InventoryMovement, StockReservation, StockLocation, LocationInventory, StockTransfer, Lot, LotMovement
    fiscal.prisma         # ReceivedInvoice, ReceivedInvoiceItem, IssuedInvoice, Sefaz*, TaxRegime, CfopTable, NcmTable
    finance.prisma        # AccountsPayable, AccountsReceivable, PayablePayment, ReceivablePayment, BankAccount, BankTransaction, PixTransaction, CostCenter, Budget*
    production.prisma     # ProductionOrder, ProductionOrderMaterial, ProductionOrderOperation, BomItem, MrpParameter, MrpSuggestion, WorkCenter, ProductionCost*, ProductionRouting, OeeTarget, ProductionLog
    hr.prisma             # Employee, Department, JobPosition, Payroll, PayrollItem, PayrollEvent, Vacation, ThirteenthSalary, Termination, TimeClock*, WorkSchedule, HoursBank, EmployeeDependent, LeaveRecord, IncomeTaxTable, INSSTable
    sales.prisma          # Customer, Lead, SalesQuote, SalesQuoteItem, SalesOrder, SalesOrderItem, CollectionRule
    quality.prisma        # QualityInspection, QualityInspectionItem, NonConformity, SkillMatrix
    receiving.prisma      # MaterialReceiving, MaterialReceivingItem, MaterialRequisition, MaterialRequisitionItem
    workflow.prisma       # WorkflowDefinition, WorkflowInstance, WorkflowStep, WorkflowTransition, Task, ApprovalThreshold, ApprovalLevel
    documents.prisma      # GedDocument, GedCategory
    system.prisma         # SystemSetting, SystemLog, AuditLog, Notification, NotificationGroup, AiUsageLog, Embedding, CloneLog, Dashboard
    impex.prisma          # ImportProcess, CustomsBroker, Port, ExchangeContract
    scale.prisma          # CompanyGroup, CompanyGroupMember, BillingPlan, BillingSubscription, IntercompanyTransfer, IntercompanyTransferItem
```

**Configuração no `schema/_base.prisma`:**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["prismaSchemaFolder"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Regras de divisão:**
- Cada arquivo pode referenciar models de outros arquivos (Prisma resolve cross-file)
- Enums usados por múltiplos domínios ficam em `_base.prisma`
- Enums específicos de domínio ficam no arquivo do domínio
- O model `Company` fica em `_base.prisma` pois é referenciado por todos

### 5.2 Routers — Agrupamento por Domínio

**Situação atual:** 81 routers flat em `src/server/routers/`, todos importados em `index.ts`.

**Proposta:** Agrupar em sub-routers por domínio, mantendo compatibilidade com o frontend.

**Estrutura proposta:**

```
src/server/routers/
  index.ts                    # appRouter com merge dos domain routers
  auth/
    index.ts                  # authRouter = merge(tenant, groups, users, settings, authLogs)
    tenant.ts
    groups.ts
    users.ts
    settings.ts
    authLogs.ts
  catalog/
    index.ts                  # catalogRouter = merge(materials, productCatalog, productMedia, embeddings)
    materials.ts
    productCatalog.ts
    productMedia.ts
    embeddings.ts
  purchasing/
    index.ts                  # purchasingRouter = merge(quotes, purchaseOrders, suppliers, supplierReturns)
    quotes.ts
    purchaseOrders.ts
    suppliers.ts
    supplierReturns.ts
  inventory/
    index.ts                  # inventoryRouter = merge(inventory, stockLocations, transfers, picking, receiving, requisitions)
    inventory.ts
    stockLocations.ts
    transfers.ts
    picking.ts
    receiving.ts
    requisitions.ts
  fiscal/
    index.ts                  # fiscalRouter = merge(receivedInvoices, issuedInvoices, nfe, nfeQueue, nfeBatchImport, sefaz, sped, dda)
    receivedInvoices.ts
    issuedInvoices.ts
    nfe.ts
    nfeQueue.ts
    nfeBatchImport.ts
    sefaz.ts
    sped.ts
    dda.ts
  finance/
    index.ts                  # financeRouter = merge(payables, receivables, bankAccounts, billing, cnab, collectionRules, costCenters, budget)
    payables.ts
    receivables.ts
    bankAccounts.ts
    billing.ts
    cnab.ts
    collectionRules.ts
    costCenters.ts
    budget.ts
  production/
    index.ts                  # productionRouter = merge(production, bom, mrp, oee, mes, productionCosts)
    production.ts
    bom.ts
    mrp.ts
    oee.ts
    mes.ts
    productionCosts.ts
  hr/
    index.ts                  # hrRouter = merge(hr, payroll, vacations, thirteenth, terminations, timeclock, benefits, admission, employeePortal)
    hr.ts
    payroll.ts
    vacations.ts
    thirteenth.ts
    terminations.ts
    timeclock.ts
    benefits.ts
    admission.ts
    employeePortal.ts
  sales/
    index.ts                  # salesRouter = merge(sales, salesOrders, salesQuotes, leads, customers)
    sales.ts
    salesOrders.ts
    salesQuotes.ts
    leads.ts
    customers.ts
  quality/
    index.ts                  # qualityRouter = merge(quality)
    quality.ts
  system/
    index.ts                  # systemRouter = merge(audit, systemLogs, notifications, dashboard, tasks, reports, savedReports, tutorials, storage, onboarding, aiConfig, aiClassifier, aiUsage, chartBuilder, deployAgent, emailIntegration, workflow, approvals, companies, delphiImport, impex, documents)
    ...arquivos individuais
```

**Migração gradual:**
1. Criar pastas e mover arquivos sem alterar nomes de procedures
2. Atualizar imports no `index.ts`
3. Frontend não precisa mudar (nomes de procedures permanecem iguais)

---

## 6. RLS (Row Level Security) no Supabase

### 6.1 Estratégia

**Objetivo:** Garantir isolamento de dados por empresa no nível do banco, independente do código da aplicação.

**Abordagem:** Usar `app.current_company_id` como variável de sessão PostgreSQL, setada a cada request pelo middleware tRPC.

### 6.2 Implementação

#### Passo 1: Variável de sessão

```sql
-- Setar no início de cada request (middleware tRPC)
SET LOCAL app.current_company_id = '<company_uuid>';
```

**No código (middleware tRPC):**
```typescript
// src/server/trpc.ts — dentro do tenantProcedure
const companyId = ctx.companyId;
if (companyId) {
  await ctx.prisma.$executeRawUnsafe(
    `SET LOCAL app.current_company_id = '${companyId}'`
  );
}
```

#### Passo 2: Habilitar RLS nas tabelas

```sql
-- Script para habilitar RLS em todas as tabelas com company_id
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'company_id'
    AND table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;
```

#### Passo 3: Policies padrão

```sql
-- Template de policy para cada tabela com company_id NOT NULL
CREATE POLICY tenant_isolation ON <tabela>
  USING (company_id = current_setting('app.current_company_id')::uuid);

-- Template para tabelas com company_id nullable (isShared)
CREATE POLICY tenant_isolation_shared ON <tabela>
  USING (
    company_id = current_setting('app.current_company_id')::uuid
    OR company_id IS NULL
  );
```

#### Passo 4: Bypass para admin/service role

```sql
-- Service role (Prisma) bypassa RLS por padrão no Supabase
-- Para admin explícito:
CREATE POLICY admin_bypass ON <tabela>
  USING (
    current_setting('app.is_admin', true)::boolean = true
  );
```

### 6.3 Abrangência

| Grupo | Tabelas | Policy |
|---|---|---|
| Transacionais NOT NULL (46) | accounts_payable, inventory, production_orders, etc. | `tenant_isolation` (strict) |
| Compartilháveis (14) | materials, suppliers, categories, etc. | `tenant_isolation_shared` (permite NULL) |
| Sem companyId (78) | user_companies, clone_logs, etc. | Sem RLS (controlado por lógica) |
| Logs (2) | audit_logs, system_logs | RLS com policy especial (admin vê tudo) |

### 6.4 Ordem de ativação

1. **Primeiro:** Tabelas transacionais com companyId NOT NULL (após migração da Seção 2)
2. **Segundo:** Tabelas compartilháveis com policy `_shared`
3. **Terceiro:** Tabelas de log com policy admin
4. **Validação:** Testes automatizados para cada policy

### 6.5 Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Prisma não seta variável de sessão | Middleware obrigatório em `tenantProcedure` |
| Queries raw sem RLS | Usar `$executeRaw` com SET LOCAL antes |
| Performance com RLS | Índices compostos (companyId, ...) — Seção 4.5 |
| Bypass acidental | `FORCE ROW LEVEL SECURITY` impede bypass |

---

## 7. Auditoria Automática via Prisma Middleware

### 7.1 Situação atual

O sistema já possui `AuditLog` e funções `auditCreate`, `auditUpdate`, `auditDelete` em `src/server/services/audit.ts`. Porém, a auditoria é **manual** — cada router precisa chamar explicitamente.

**Problema:** Fácil esquecer de auditar. Novos routers podem não incluir auditoria.

### 7.2 Proposta: Prisma Middleware automático

```typescript
// src/server/middleware/auditMiddleware.ts

import { Prisma } from "@prisma/client";

const AUDITED_MODELS = [
  "AccountsPayable", "AccountsReceivable", "BankAccount", "BankTransaction",
  "Customer", "Employee", "Inventory", "InventoryMovement", "IssuedInvoice",
  "Material", "MaterialReceiving", "MaterialRequisition", "Payroll",
  "ProductionOrder", "PurchaseOrder", "ReceivedInvoice", "SalesOrder",
  "Supplier", "Vacation", "Termination", "ThirteenthSalary",
];

const IGNORED_ACTIONS: Prisma.PrismaAction[] = ["findMany", "findFirst", "findUnique", "count", "aggregate", "groupBy"];

export function auditMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    if (!params.model || IGNORED_ACTIONS.includes(params.action)) {
      return next(params);
    }

    if (!AUDITED_MODELS.includes(params.model)) {
      return next(params);
    }

    // Capturar estado anterior para update/delete
    let oldData = null;
    if (params.action === "update" || params.action === "delete") {
      oldData = await prisma[params.model].findUnique({
        where: params.args.where,
      });
    }

    const result = await next(params);

    // Registrar no AuditLog (fire-and-forget)
    try {
      const action = params.action === "create" ? "CREATE"
        : params.action === "update" ? "UPDATE"
        : params.action === "delete" ? "DELETE"
        : null;

      if (action) {
        await prisma.auditLog.create({
          data: {
            action,
            entityType: params.model,
            entityId: result?.id || params.args?.where?.id,
            oldValues: oldData ? JSON.stringify(oldData) : null,
            newValues: result ? JSON.stringify(result) : null,
            // userId e companyId via AsyncLocalStorage (ver 7.3)
          },
        });
      }
    } catch (e) {
      console.warn("[Audit] Falha ao registrar auditoria:", e);
    }

    return result;
  };
}
```

### 7.3 Contexto via AsyncLocalStorage

Para capturar `userId` e `companyId` no middleware sem passá-los explicitamente:

```typescript
// src/server/context/auditContext.ts
import { AsyncLocalStorage } from "node:async_hooks";

interface AuditContext {
  userId?: string;
  companyId?: string;
  userEmail?: string;
}

export const auditStorage = new AsyncLocalStorage<AuditContext>();

// No middleware tRPC (tenantProcedure):
auditStorage.run({ userId, companyId, userEmail }, async () => {
  return next({ ctx });
});

// No auditMiddleware:
const ctx = auditStorage.getStore();
```

### 7.4 Coexistência com auditoria manual

- Middleware automático cobre **todas** as operações CRUD nos models auditados
- Auditoria manual existente pode ser mantida para logs com contexto extra (ex: motivo de cancelamento)
- Middleware não duplica se detectar que já existe log recente para a mesma operação

### 7.5 Campos adicionais no AuditLog

```prisma
model AuditLog {
  // Campos existentes mantidos...
  // Adicionar:
  source      AuditSource  @default(MANUAL)  // MANUAL ou MIDDLEWARE
  ipAddress   String?      @map("ip_address")
  userAgent   String?      @map("user_agent")
}

enum AuditSource {
  MANUAL
  MIDDLEWARE
  SYSTEM
  @@map("audit_source")
}
```

---

## 8. Ordem de Execução

### Fase 0 — Preparação (sem downtime)

| # | Ação | Dependência | Risco |
|---|---|---|---|
| 0.1 | Backup completo do banco | — | Nenhum |
| 0.2 | Criar branch `refactor/schema-v1` | — | Nenhum |
| 0.3 | Ativar `prismaSchemaFolder` e dividir schema | — | Baixo |
| 0.4 | Reorganizar routers em pastas | 0.3 | Baixo |
| 0.5 | Validar build + type-check + testes | 0.3, 0.4 | Nenhum |

### Fase 1 — Float → Decimal (320 campos)

| # | Ação | Dependência | Risco |
|---|---|---|---|
| 1.1 | Gerar migration com ALTER COLUMN para cada campo | 0.5 | Médio |
| 1.2 | Atualizar schema.prisma (Float → Decimal com precisão) | 1.1 | Baixo |
| 1.3 | `prisma generate` + ajustar TypeScript (Decimal vs number) | 1.2 | Médio |
| 1.4 | Atualizar testes que usam Float | 1.3 | Baixo |
| 1.5 | Validar build + type-check + testes | 1.4 | Nenhum |

### Fase 2 — companyId NOT NULL (46 models)

| # | Ação | Dependência | Risco |
|---|---|---|---|
| 2.1 | Script para identificar registros com companyId NULL | 1.5 | Nenhum |
| 2.2 | Atribuir empresa padrão aos órfãos | 2.1 | Baixo |
| 2.3 | ALTER COLUMN SET NOT NULL em cada tabela | 2.2 | Médio |
| 2.4 | Atualizar schema.prisma (String? → String) | 2.3 | Baixo |
| 2.5 | Ajustar routers que não passam companyId | 2.4 | Médio |
| 2.6 | Validar build + type-check + testes | 2.5 | Nenhum |

### Fase 3 — Correções Estruturais

| # | Ação | Dependência | Risco |
|---|---|---|---|
| 3.1 | workCenter String → workCenterId FK | 2.6 | Médio |
| 3.2 | Adicionar legacyId nos 28 models | 2.6 | Baixo |
| 3.3 | Adicionar soft delete nos 15 models | 2.6 | Baixo |
| 3.4 | Triggers de integridade no Inventory | 2.6 | Baixo |
| 3.5 | Adicionar índices compostos | 2.6 | Nenhum |
| 3.6 | Validar build + type-check + testes | 3.1-3.5 | Nenhum |

### Fase 4 — Models Novos

| # | Ação | Dependência | Risco |
|---|---|---|---|
| 4.1 | Criar models RH/DP (EmployeeDependent, LeaveRecord, IncomeTaxTable, INSSTable) | 3.6 | Baixo |
| 4.2 | Criar models Industrial (Lot, LotMovement, ProductionRouting) | 3.6 | Baixo |
| 4.3 | Criar models Fiscal (TaxRegime, CfopTable, NcmTable, IntercompanyTransfer) | 3.6 | Baixo |
| 4.4 | Criar models Escala (CompanyGroup, BillingPlan) | 3.6 | Baixo |
| 4.5 | Migrations + prisma generate | 4.1-4.4 | Baixo |
| 4.6 | Validar build + type-check + testes | 4.5 | Nenhum |

### Fase 5 — RLS

| # | Ação | Dependência | Risco |
|---|---|---|---|
| 5.1 | Implementar SET LOCAL no middleware tRPC | 4.6 | Baixo |
| 5.2 | Habilitar RLS nas 46 tabelas NOT NULL | 5.1 | **Alto** |
| 5.3 | Criar policies tenant_isolation | 5.2 | Médio |
| 5.4 | Habilitar RLS nas 14 tabelas compartilháveis | 5.3 | Médio |
| 5.5 | Testes de isolamento (empresa A não vê empresa B) | 5.4 | Nenhum |
| 5.6 | Validar build + type-check + testes | 5.5 | Nenhum |

### Fase 6 — Auditoria Automática

| # | Ação | Dependência | Risco |
|---|---|---|---|
| 6.1 | Implementar AsyncLocalStorage no middleware tRPC | 5.6 | Baixo |
| 6.2 | Implementar Prisma middleware de auditoria | 6.1 | Baixo |
| 6.3 | Adicionar campos source, ipAddress, userAgent no AuditLog | 6.2 | Baixo |
| 6.4 | Testes de auditoria automática | 6.3 | Nenhum |
| 6.5 | Validar build + type-check + testes | 6.4 | Nenhum |

### Resumo de fases

| Fase | Escopo | Estimativa | Risco |
|---|---|---|---|
| 0 | Preparação + modularização | 1-2 dias | Baixo |
| 1 | Float → Decimal | 2-3 dias | Médio |
| 2 | companyId NOT NULL | 1-2 dias | Médio |
| 3 | Correções estruturais | 1-2 dias | Baixo |
| 4 | Models novos | 1 dia | Baixo |
| 5 | RLS | 2-3 dias | **Alto** |
| 6 | Auditoria automática | 1 dia | Baixo |
| **Total** | | **9-14 dias** | |

---

## Aprovação

> **⚠️ NENHUMA alteração de código ou banco será executada antes da aprovação deste documento.**

- [ ] Seção 1 aprovada — Float → Decimal
- [ ] Seção 2 aprovada — companyId NOT NULL
- [ ] Seção 3 aprovada — Models novos
- [ ] Seção 4 aprovada — Correções estruturais
- [ ] Seção 5 aprovada — Modularização
- [ ] Seção 6 aprovada — RLS
- [ ] Seção 7 aprovada — Auditoria automática
- [ ] Seção 8 aprovada — Ordem de execução
- [ ] **Documento aprovado para execução**
