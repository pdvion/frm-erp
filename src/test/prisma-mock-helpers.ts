/**
 * Helpers para criar mocks tipados do Prisma
 * 
 * IMPORTANTE: Use estes helpers em vez de criar objetos manualmente
 * para garantir que os mocks reflitam os tipos reais do Prisma.
 * 
 * Prisma retorna:
 * - Decimal para campos numéricos com precisão (totalValue, amount, etc.)
 * - Date para campos de data
 * - null para campos opcionais não preenchidos
 * 
 * @example
 * // ERRADO - mock com tipos incorretos
 * const material = { id: "1", cost: 100 }; // cost deveria ser Decimal
 * 
 * // CORRETO - usar helper
 * const material = createMockMaterial({ cost: 100 });
 */

// Helpers para criar mocks tipados do Prisma

// Tipo para simular Decimal do Prisma em testes
export class MockDecimal {
  private value: number;

  constructor(value: number | string) {
    this.value = typeof value === "string" ? parseFloat(value) : value;
  }

  toNumber(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  valueOf(): number {
    return this.value;
  }

  // Permite que Number(decimal) funcione
  [Symbol.toPrimitive](hint: string): number | string {
    if (hint === "string") return this.toString();
    return this.value;
  }
}

/**
 * Converte um número para MockDecimal (simula Prisma.Decimal)
 */
export function toDecimal(value: number | null | undefined): MockDecimal | null {
  if (value === null || value === undefined) return null;
  return new MockDecimal(value);
}

/**
 * Cria um mock de Material com tipos corretos
 */
export function createMockMaterial(overrides: Partial<{
  id: string;
  code: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  unitId: string | null;
  cost: number | null;
  price: number | null;
  minStock: number | null;
  maxStock: number | null;
  currentStock: number | null;
  weight: number | null;
  weightUnit: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? "mock-material-id",
    code: overrides.code ?? "MAT001",
    name: overrides.name ?? "Material Teste",
    description: overrides.description ?? null,
    categoryId: overrides.categoryId ?? null,
    unitId: overrides.unitId ?? null,
    cost: toDecimal(overrides.cost ?? null),
    price: toDecimal(overrides.price ?? null),
    minStock: toDecimal(overrides.minStock ?? null),
    maxStock: toDecimal(overrides.maxStock ?? null),
    currentStock: toDecimal(overrides.currentStock ?? 0),
    weight: toDecimal(overrides.weight ?? null),
    weightUnit: overrides.weightUnit ?? null,
    location: overrides.location ?? null,
    notes: overrides.notes ?? null,
    isActive: overrides.isActive ?? true,
    companyId: overrides.companyId ?? "mock-company-id",
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Cria um mock de Invoice com tipos corretos
 */
export function createMockInvoice(overrides: Partial<{
  id: string;
  invoiceNumber: string;
  accessKey: string | null;
  issueDate: Date;
  totalValue: number;
  totalProducts: number;
  freightValue: number | null;
  discountValue: number | null;
  status: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? "mock-invoice-id",
    invoiceNumber: overrides.invoiceNumber ?? "000001",
    accessKey: overrides.accessKey ?? null,
    issueDate: overrides.issueDate ?? new Date(),
    totalValue: toDecimal(overrides.totalValue ?? 1000),
    totalProducts: toDecimal(overrides.totalProducts ?? 1000),
    freightValue: toDecimal(overrides.freightValue ?? null),
    discountValue: toDecimal(overrides.discountValue ?? null),
    status: overrides.status ?? "PENDING",
    companyId: overrides.companyId ?? "mock-company-id",
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Cria um mock de PaymentRequest com tipos corretos
 */
export function createMockPaymentRequest(overrides: Partial<{
  id: string;
  code: string;
  amount: number;
  status: string;
  urgency: string;
  justification: string | null;
  requestedAt: Date;
  dueDate: Date;
  companyId: string;
}> = {}) {
  return {
    id: overrides.id ?? "mock-payment-request-id",
    code: overrides.code ?? "PAY001",
    amount: toDecimal(overrides.amount ?? 1000),
    status: overrides.status ?? "PENDING",
    urgency: overrides.urgency ?? "NORMAL",
    justification: overrides.justification ?? null,
    requestedAt: overrides.requestedAt ?? new Date(),
    dueDate: overrides.dueDate ?? new Date(),
    companyId: overrides.companyId ?? "mock-company-id",
  };
}

/**
 * Cria um mock de Supplier com tipos corretos
 */
export function createMockSupplier(overrides: Partial<{
  id: string;
  cnpj: string;
  companyName: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? "mock-supplier-id",
    cnpj: overrides.cnpj ?? "12345678000199",
    companyName: overrides.companyName ?? "Fornecedor Teste LTDA",
    tradeName: overrides.tradeName ?? null,
    email: overrides.email ?? null,
    phone: overrides.phone ?? null,
    isActive: overrides.isActive ?? true,
    companyId: overrides.companyId ?? "mock-company-id",
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Cria um mock de Employee com tipos corretos
 */
export function createMockEmployee(overrides: Partial<{
  id: string;
  registration: string;
  name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  hireDate: Date;
  salary: number | null;
  status: string;
  positionId: string | null;
  departmentId: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? "mock-employee-id",
    registration: overrides.registration ?? "EMP001",
    name: overrides.name ?? "Funcionário Teste",
    cpf: overrides.cpf ?? "12345678901",
    email: overrides.email ?? null,
    phone: overrides.phone ?? null,
    hireDate: overrides.hireDate ?? new Date(),
    salary: toDecimal(overrides.salary ?? null),
    status: overrides.status ?? "ACTIVE",
    positionId: overrides.positionId ?? null,
    departmentId: overrides.departmentId ?? null,
    companyId: overrides.companyId ?? "mock-company-id",
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Helper para criar lista de mocks
 */
export function createMockList<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overridesFn?: (index: number) => Partial<T>
): T[] {
  return Array.from({ length: count }, (_, i) => 
    factory(overridesFn ? overridesFn(i) : undefined)
  );
}
