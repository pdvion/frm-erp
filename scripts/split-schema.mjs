#!/usr/bin/env node
/**
 * Split monolithic schema.prisma into domain-based files
 * Usage: node scripts/split-schema.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SCHEMA_PATH = "prisma/schema.prisma";
const OUTPUT_DIR = "prisma/schema";

// Domain mapping: model name -> target file
const MODEL_DOMAIN = {
  // base.prisma — core entities
  Company: "base",
  CompanyOnboarding: "base",
  User: "base",
  UserCompany: "base",
  UserCompanyPermission: "base",
  UserGroup: "base",
  UserGroupMember: "base",

  // system.prisma — system/infra
  SystemSetting: "system",
  SystemLog: "system",
  AuditLog: "system",
  CloneLog: "system",
  Tutorial: "system",
  Notification: "system",
  NotificationPreference: "system",
  NotificationGroup: "system",
  NotificationGroupMember: "system",
  Dashboard: "system",
  Kpi: "system",
  KpiValue: "system",
  DashboardWidget: "system",
  SavedReport: "system",
  AiUsageLog: "system",
  Embedding: "system",

  // finance.prisma
  Category: "finance",
  CostCenter: "finance",
  AccountsPayable: "finance",
  PayablePayment: "finance",
  PayableApproval: "finance",
  PayableAttachment: "finance",
  PayableCostAllocation: "finance",
  AccountsReceivable: "finance",
  ReceivablePayment: "finance",
  BankAccount: "finance",
  BankTransaction: "finance",
  PixTransaction: "finance",
  ApprovalThreshold: "finance",
  ApprovalThresholdApprover: "finance",
  ApprovalLevel: "finance",
  ApprovalLevelApprover: "finance",
  PaymentRequest: "finance",
  PaymentApproval: "finance",
  CollectionRule: "finance",
  CollectionRuleStep: "finance",
  CollectionAction: "finance",
  DdaBoleto: "finance",
  DdaConfig: "finance",
  DdaSyncLog: "finance",
  BudgetAccount: "finance",
  BudgetVersion: "finance",
  BudgetEntry: "finance",
  BudgetActual: "finance",
  BudgetAlert: "finance",

  // inventory.prisma
  Material: "inventory",
  Inventory: "inventory",
  InventoryMovement: "inventory",
  StockReservation: "inventory",
  StockLocation: "inventory",
  LocationInventory: "inventory",
  StockTransfer: "inventory",
  StockTransferItem: "inventory",
  IntercompanyTransfer: "inventory",
  IntercompanyTransferItem: "inventory",
  PhysicalInventory: "inventory",
  InventoryCount: "inventory",
  Lot: "inventory",
  LotMovement: "inventory",

  // production.prisma
  ProductionOrder: "production",
  ProductionOrderMaterial: "production",
  ProductionOrderOperation: "production",
  BomItem: "production",
  MrpParameter: "production",
  MrpRun: "production",
  MrpSuggestion: "production",
  WorkCenter: "production",
  ProductionLog: "production",
  MachineStop: "production",
  OeeTarget: "production",
  ProductionCost: "production",
  ProductionCostMaterial: "production",
  ProductionCostLabor: "production",
  MaterialStandardCost: "production",

  // sales.prisma
  Customer: "sales",
  Lead: "sales",
  LeadActivity: "sales",
  SalesQuote: "sales",
  SalesQuoteItem: "sales",
  SalesOrder: "sales",
  SalesOrderItem: "sales",

  // purchasing.prisma
  Supplier: "purchasing",
  SupplierMaterial: "purchasing",
  Quote: "purchasing",
  QuoteItem: "purchasing",
  PurchaseOrder: "purchasing",
  PurchaseOrderItem: "purchasing",
  MaterialRequisition: "purchasing",
  MaterialRequisitionItem: "purchasing",
  RequisitionApproval: "purchasing",
  SupplierReturn: "purchasing",
  SupplierReturnItem: "purchasing",

  // fiscal.prisma
  ReceivedInvoice: "fiscal",
  ReceivedInvoiceItem: "fiscal",
  IssuedInvoice: "fiscal",
  IssuedInvoiceItem: "fiscal",
  SefazSyncConfig: "fiscal",
  SefazSyncLog: "fiscal",
  SefazPendingNfe: "fiscal",
  SefazManifestacaoLog: "fiscal",
  import_documents: "fiscal",
  nfe_queue_jobs: "fiscal",
  TaxRegime: "fiscal",

  // hr.prisma
  Department: "hr",
  JobPosition: "hr",
  Employee: "hr",
  TimeClockEntry: "hr",
  TimesheetDay: "hr",
  WorkSchedule: "hr",
  WorkShift: "hr",
  EmployeeSchedule: "hr",
  HoursBank: "hr",
  TimeClockAdjustment: "hr",
  Holiday: "hr",
  Payroll: "hr",
  PayrollItem: "hr",
  PayrollEvent: "hr",
  Vacation: "hr",
  ThirteenthSalary: "hr",
  Termination: "hr",
  BenefitType: "hr",
  EmployeeBenefit: "hr",
  TransportVoucher: "hr",
  Training: "hr",
  EmployeeTraining: "hr",
  SkillMatrix: "hr",
  AdmissionProcess: "hr",
  AdmissionStep: "hr",
  AdmissionDocument: "hr",
  AdmissionExam: "hr",
  EmployeeDependent: "hr",
  LeaveRecord: "hr",
  IncomeTaxTable: "hr",
  INSSTable: "hr",

  // receiving.prisma
  MaterialReceiving: "receiving",
  MaterialReceivingItem: "receiving",
  ReceivingDivergence: "receiving",
  QualityCertificate: "receiving",
  PickingList: "receiving",
  PickingListItem: "receiving",
  PickingVerification: "receiving",

  // quality.prisma
  QualityInspection: "quality",
  QualityInspectionItem: "quality",
  NonConformity: "quality",

  // documents.prisma
  GedDocument: "documents",
  GedCategory: "documents",
  GedAccessLog: "documents",

  // impex.prisma
  Port: "impex",
  CustomsBroker: "impex",
  CargoType: "impex",
  Incoterm: "impex",
  ImportProcess: "impex",
  ImportProcessItem: "impex",
  ImportProcessEvent: "impex",
  ImportProcessCost: "impex",
  ExchangeContract: "impex",
  ExchangeLiquidation: "impex",

  // catalog.prisma
  ProductCategory: "catalog",
  AttributeDefinition: "catalog",
  CategoryAttribute: "catalog",
  Product: "catalog",
  ProductImage: "catalog",
  ProductVideo: "catalog",
  ProductAttachment: "catalog",

  // workflow.prisma
  WorkflowDefinition: "workflow",
  WorkflowStep: "workflow",
  WorkflowTransition: "workflow",
  WorkflowInstance: "workflow",
  WorkflowStepHistory: "workflow",

  // gpd.prisma
  StrategicGoal: "gpd",
  GoalIndicator: "gpd",
  IndicatorHistory: "gpd",
  ActionPlan: "gpd",
  ActionPlanTask: "gpd",

  // tasks.prisma
  Task: "tasks",
  TaskHistory: "tasks",
  TaskAttachment: "tasks",
};

// Read schema
const schema = readFileSync(SCHEMA_PATH, "utf-8");
const lines = schema.split("\n");

// Parse blocks (model/enum)
const blocks = [];
let currentBlock = null;
let braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const modelMatch = line.match(/^(model|enum)\s+(\w+)\s*\{/);

  if (modelMatch && !currentBlock) {
    currentBlock = {
      type: modelMatch[1],
      name: modelMatch[2],
      startLine: i,
      lines: [line],
    };
    braceDepth = 1;
  } else if (currentBlock) {
    currentBlock.lines.push(line);
    // Count braces
    for (const ch of line) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth === 0) {
      currentBlock.endLine = i;
      blocks.push(currentBlock);
      currentBlock = null;
    }
  }
}

// Extract header (generator + datasource)
const firstModelLine = blocks[0]?.startLine ?? 0;
const header = lines.slice(0, firstModelLine).join("\n").trim();

// Group blocks by domain
const domainBlocks = {};
const enumBlocks = [];
const unmapped = [];

for (const block of blocks) {
  if (block.type === "enum") {
    enumBlocks.push(block);
  } else if (MODEL_DOMAIN[block.name]) {
    const domain = MODEL_DOMAIN[block.name];
    if (!domainBlocks[domain]) domainBlocks[domain] = [];
    domainBlocks[domain].push(block);
  } else {
    unmapped.push(block.name);
  }
}

if (unmapped.length > 0) {
  console.error("⚠️  Unmapped models:", unmapped.join(", "));
  console.error("Add them to MODEL_DOMAIN in this script and re-run.");
  process.exit(1);
}

// Create output directory
mkdirSync(OUTPUT_DIR, { recursive: true });

// Write base.prisma with header
const baseContent = [
  header,
  "",
  ...(domainBlocks["base"] || []).map((b) => b.lines.join("\n")),
].join("\n\n");
writeFileSync(join(OUTPUT_DIR, "base.prisma"), baseContent + "\n");
delete domainBlocks["base"];

// Write domain files
for (const [domain, dBlocks] of Object.entries(domainBlocks)) {
  const content = dBlocks.map((b) => b.lines.join("\n")).join("\n\n");
  writeFileSync(join(OUTPUT_DIR, `${domain}.prisma`), content + "\n");
}

// Write enums
const enumContent = enumBlocks.map((b) => b.lines.join("\n")).join("\n\n");
writeFileSync(join(OUTPUT_DIR, "enums.prisma"), enumContent + "\n");

// Summary
console.log("✅ Schema split complete!");
console.log(`   Models: ${blocks.filter((b) => b.type === "model").length}`);
console.log(`   Enums: ${enumBlocks.length}`);
console.log(`   Files created:`);
console.log(`     - base.prisma (header + core models)`);
for (const domain of Object.keys(domainBlocks).sort()) {
  const count = domainBlocks[domain]?.length ?? 0;
  console.log(`     - ${domain}.prisma (${count} models)`);
}
// base was deleted from domainBlocks, count from original
const baseCount = MODEL_DOMAIN
  ? Object.values(MODEL_DOMAIN).filter((d) => d === "base").length
  : 0;
console.log(`     base.prisma has ${baseCount} models + header`);
console.log(`     - enums.prisma (${enumBlocks.length} enums)`);
