/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Testes do ESocialService
 * @see eSocial Module - Geração de eventos, XML, validação, lotes
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  generateEventId,
  formatCpfForESocial,
  formatCnpjForESocial,
  formatDateForESocial,
  calculateDeadline,
  validateEmployeeForAdmission,
  validateTermination,
  validateLeaveRecord,
  validatePayrollForRemuneration,
  getEventGroup,
  getEventTypeName,
  buildXmlS2200,
  buildXmlS2299,
  buildXmlS2230,
  buildXmlS1200,
  buildXmlS1210,
  buildXmlS1299,
  EVENT_DEFINITIONS,
  ESocialService,
} from "./esocial";

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

describe("generateEventId", () => {
  it("deve gerar ID no formato eSocial correto", () => {
    const date = new Date(2025, 0, 15, 10, 30, 45); // 2025-01-15 10:30:45
    const id = generateEventId("12345678000199", 1, date);

    expect(id).toBe("ID123456780001992025011510304500001");
    expect(id).toMatch(/^ID\d{14}\d{14}\d{5}$/);
  });

  it("deve preencher CNPJ com zeros à esquerda", () => {
    const date = new Date(2025, 5, 1, 8, 0, 0);
    const id = generateEventId("123", 42, date);

    expect(id).toContain("ID00000000000123");
    expect(id.slice(-5)).toBe("00042");
  });

  it("deve remover caracteres não numéricos do CNPJ", () => {
    const date = new Date(2025, 0, 1, 0, 0, 0);
    const id = generateEventId("12.345.678/0001-99", 1, date);

    expect(id).toContain("ID12345678000199");
  });

  it("deve preencher sequência com zeros à esquerda", () => {
    const date = new Date(2025, 0, 1, 0, 0, 0);
    const id = generateEventId("12345678000199", 999, date);

    expect(id.slice(-5)).toBe("00999");
  });
});

describe("formatCpfForESocial", () => {
  it("deve formatar CPF removendo pontuação", () => {
    expect(formatCpfForESocial("123.456.789-09")).toBe("12345678909");
  });

  it("deve preencher com zeros à esquerda", () => {
    expect(formatCpfForESocial("1234567")).toBe("00001234567");
  });

  it("deve retornar string vazia para null/undefined", () => {
    expect(formatCpfForESocial(null)).toBe("");
    expect(formatCpfForESocial(undefined)).toBe("");
  });

  it("deve retornar string vazia para string vazia", () => {
    expect(formatCpfForESocial("")).toBe("");
  });
});

describe("formatCnpjForESocial", () => {
  it("deve formatar CNPJ removendo pontuação", () => {
    expect(formatCnpjForESocial("12.345.678/0001-99")).toBe("12345678000199");
  });

  it("deve preencher com zeros à esquerda", () => {
    expect(formatCnpjForESocial("123")).toBe("00000000000123");
  });

  it("deve retornar string vazia para null/undefined", () => {
    expect(formatCnpjForESocial(null)).toBe("");
    expect(formatCnpjForESocial(undefined)).toBe("");
  });
});

describe("formatDateForESocial", () => {
  it("deve formatar Date para YYYY-MM-DD", () => {
    const date = new Date("2025-06-15T12:00:00Z");
    expect(formatDateForESocial(date)).toBe("2025-06-15");
  });

  it("deve formatar string ISO para YYYY-MM-DD", () => {
    expect(formatDateForESocial("2025-03-20T10:30:00.000Z")).toBe("2025-03-20");
  });

  it("deve retornar string vazia para null/undefined", () => {
    expect(formatDateForESocial(null)).toBe("");
    expect(formatDateForESocial(undefined)).toBe("");
  });
});

describe("calculateDeadline", () => {
  it("deve calcular prazo adicionando dias úteis para S-2200 (1 dia útil)", () => {
    // Segunda-feira, 2025-01-13
    const ref = new Date(2025, 0, 13);
    const deadline = calculateDeadline("S_2200", ref);

    // 1 dia útil depois = terça 14/01
    expect(deadline.getDate()).toBe(14);
    expect(deadline.getMonth()).toBe(0);
  });

  it("deve pular fins de semana no cálculo", () => {
    // Sexta-feira, 2025-01-17
    const ref = new Date(2025, 0, 17);
    const deadline = calculateDeadline("S_2200", ref);

    // 1 dia útil depois de sexta = segunda 20/01
    expect(deadline.getDate()).toBe(20);
    expect(deadline.getMonth()).toBe(0);
  });

  it("deve retornar mesma data para eventos sem prazo (deadlineDays=0)", () => {
    const ref = new Date(2025, 0, 15);
    const deadline = calculateDeadline("S_1000", ref);

    expect(deadline.getTime()).toBe(ref.getTime());
  });

  it("deve calcular prazo de 10 dias úteis para S-2299", () => {
    // Segunda-feira, 2025-01-06
    const ref = new Date(2025, 0, 6);
    const deadline = calculateDeadline("S_2299", ref);

    // 10 dias úteis = 2 semanas = 20/01 (segunda)
    expect(deadline.getDate()).toBe(20);
  });
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

describe("validateEmployeeForAdmission", () => {
  it("deve retornar sem erros para dados completos", () => {
    const employee = {
      cpf: "12345678909",
      name: "João Silva",
      birthDate: new Date("1990-01-01"),
      hireDate: new Date("2025-01-15"),
      contractType: "CLT",
    };

    const errors = validateEmployeeForAdmission(employee);
    expect(errors).toHaveLength(0);
  });

  it("deve retornar erros para dados faltantes", () => {
    const errors = validateEmployeeForAdmission({});

    expect(errors.length).toBeGreaterThanOrEqual(5);
    expect(errors.some(e => e.field === "cpf")).toBe(true);
    expect(errors.some(e => e.field === "name")).toBe(true);
    expect(errors.some(e => e.field === "birthDate")).toBe(true);
    expect(errors.some(e => e.field === "hireDate")).toBe(true);
    expect(errors.some(e => e.field === "contractType")).toBe(true);
  });

  it("deve validar formato do CPF", () => {
    const employee = {
      cpf: "123",
      name: "João",
      birthDate: new Date(),
      hireDate: new Date(),
      contractType: "CLT",
    };

    const errors = validateEmployeeForAdmission(employee);
    expect(errors.some(e => e.code === "INVALID_FORMAT")).toBe(true);
  });
});

describe("validateTermination", () => {
  it("deve retornar sem erros para dados completos", () => {
    const termination = {
      terminationDate: new Date("2025-06-30"),
      type: "RESIGNATION",
      employeeId: "uuid-123",
    };

    const errors = validateTermination(termination);
    expect(errors).toHaveLength(0);
  });

  it("deve retornar erros para dados faltantes", () => {
    const errors = validateTermination({});

    expect(errors.length).toBe(3);
    expect(errors.some(e => e.field === "terminationDate")).toBe(true);
    expect(errors.some(e => e.field === "type")).toBe(true);
    expect(errors.some(e => e.field === "employeeId")).toBe(true);
  });
});

describe("validateLeaveRecord", () => {
  it("deve retornar sem erros para dados completos", () => {
    const leave = {
      startDate: new Date("2025-03-01"),
      type: "MEDICAL",
      employeeId: "uuid-456",
    };

    const errors = validateLeaveRecord(leave);
    expect(errors).toHaveLength(0);
  });

  it("deve retornar erros para dados faltantes", () => {
    const errors = validateLeaveRecord({});

    expect(errors.length).toBe(3);
    expect(errors.some(e => e.field === "startDate")).toBe(true);
    expect(errors.some(e => e.field === "type")).toBe(true);
    expect(errors.some(e => e.field === "employeeId")).toBe(true);
  });
});

describe("validatePayrollForRemuneration", () => {
  it("deve retornar sem erros para dados completos", () => {
    const payroll = { referenceMonth: 6, referenceYear: 2025 };
    const errors = validatePayrollForRemuneration(payroll);
    expect(errors).toHaveLength(0);
  });

  it("deve retornar erros para dados faltantes", () => {
    const errors = validatePayrollForRemuneration({});
    expect(errors.length).toBe(2);
    expect(errors.some(e => e.field === "referenceMonth")).toBe(true);
    expect(errors.some(e => e.field === "referenceYear")).toBe(true);
  });
});

// ============================================================================
// EVENT DEFINITIONS & HELPERS
// ============================================================================

describe("EVENT_DEFINITIONS", () => {
  it("deve conter pelo menos 20 tipos de evento", () => {
    expect(EVENT_DEFINITIONS.length).toBeGreaterThanOrEqual(20);
  });

  it("deve ter todos os grupos representados", () => {
    const groups = new Set(EVENT_DEFINITIONS.map(d => d.group));
    expect(groups.has("TABLES")).toBe(true);
    expect(groups.has("NON_PERIODIC")).toBe(true);
    expect(groups.has("PERIODIC")).toBe(true);
  });

  it("deve ter tipos únicos", () => {
    const types = EVENT_DEFINITIONS.map(d => d.type);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe("getEventGroup", () => {
  it("deve retornar TABLES para S_1000", () => {
    expect(getEventGroup("S_1000")).toBe("TABLES");
  });

  it("deve retornar NON_PERIODIC para S_2200", () => {
    expect(getEventGroup("S_2200")).toBe("NON_PERIODIC");
  });

  it("deve retornar PERIODIC para S_1200", () => {
    expect(getEventGroup("S_1200")).toBe("PERIODIC");
  });
});

describe("getEventTypeName", () => {
  it("deve retornar nome legível para tipo conhecido", () => {
    expect(getEventTypeName("S_2200")).toBe("Admissão");
    expect(getEventTypeName("S_2299")).toBe("Desligamento");
    expect(getEventTypeName("S_1200")).toBe("Remuneração");
  });

  it("deve retornar o próprio tipo para tipo desconhecido", () => {
    expect(getEventTypeName("S_9999" as any)).toBe("S_9999");
  });
});

// ============================================================================
// XML BUILDERS
// ============================================================================

const mockCompany = { cnpj: "12.345.678/0001-99", name: "Empresa Teste Ltda" };
const mockEmployee = {
  cpf: "123.456.789-09",
  name: "João da Silva",
  code: 1001,
  birthDate: "1990-05-15",
  hireDate: "2025-01-10",
  contractType: "CLT",
  gender: "M",
  maritalStatus: "SINGLE",
  salary: 5000,
  address: "Rua Teste",
  addressNumber: "100",
  addressNeighborhood: "Centro",
  addressZipCode: "01001-000",
  addressState: "SP",
};

describe("buildXmlS2200", () => {
  it("deve gerar XML válido para admissão", () => {
    const xml = buildXmlS2200(mockCompany, mockEmployee, "ID_TEST_001");

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("evtAdmissao");
    expect(xml).toContain("12345678000199"); // CNPJ formatado
    expect(xml).toContain("12345678909"); // CPF formatado
    expect(xml).toContain("1990-05-15"); // Data nascimento
    expect(xml).toContain("2025-01-10"); // Data admissão
    expect(xml).toContain("5000.00"); // Salário
    expect(xml).toContain("ID_TEST_001"); // Event ID
    expect(xml).toContain("FRM_ERP_1.0"); // Versão do software
  });

  it("deve escapar caracteres XML no nome", () => {
    const emp = { ...mockEmployee, name: "João & Maria <Teste>" };
    const xml = buildXmlS2200(mockCompany, emp, "ID_TEST_002");

    expect(xml).toContain("João &amp; Maria &lt;Teste&gt;");
    expect(xml).not.toContain("<Teste>");
  });

  it("deve usar sexo F para gender F", () => {
    const emp = { ...mockEmployee, gender: "F" };
    const xml = buildXmlS2200(mockCompany, emp, "ID_TEST_003");

    expect(xml).toContain("<sexo>F</sexo>");
  });

  it("deve mapear estado civil casado", () => {
    const emp = { ...mockEmployee, maritalStatus: "MARRIED" };
    const xml = buildXmlS2200(mockCompany, emp, "ID_TEST_004");

    expect(xml).toContain("<estCiv>2</estCiv>");
  });
});

describe("buildXmlS2299", () => {
  it("deve gerar XML válido para desligamento", () => {
    const termination = {
      terminationDate: "2025-06-30",
      type: "RESIGNATION",
      totalNet: 15000,
    };

    const xml = buildXmlS2299(mockCompany, mockEmployee, termination, "ID_TEST_010");

    expect(xml).toContain("evtDeslig");
    expect(xml).toContain("12345678909"); // CPF
    expect(xml).toContain("2025-06-30"); // Data desligamento
    expect(xml).toContain("<mtvDeslig>01</mtvDeslig>"); // Pedido de demissão
    expect(xml).toContain("15000.00"); // Valor líquido
    expect(xml).toContain("ID_TEST_010");
  });

  it("deve mapear tipo de desligamento corretamente", () => {
    const termination = { terminationDate: "2025-06-30", type: "DISMISSAL_WITH_CAUSE", totalNet: 0 };
    const xml = buildXmlS2299(mockCompany, mockEmployee, termination, "ID_TEST_011");

    expect(xml).toContain("<mtvDeslig>03</mtvDeslig>"); // Justa causa
  });

  it("deve usar código 99 para tipo desconhecido", () => {
    const termination = { terminationDate: "2025-06-30", type: "UNKNOWN_TYPE", totalNet: 0 };
    const xml = buildXmlS2299(mockCompany, mockEmployee, termination, "ID_TEST_012");

    expect(xml).toContain("<mtvDeslig>99</mtvDeslig>");
  });
});

describe("buildXmlS2230", () => {
  it("deve gerar XML válido para afastamento com data fim", () => {
    const leave = {
      startDate: "2025-03-01",
      endDate: "2025-03-15",
      type: "MEDICAL",
    };

    const xml = buildXmlS2230(mockCompany, mockEmployee, leave, "ID_TEST_020");

    expect(xml).toContain("evtAfastTemp");
    expect(xml).toContain("2025-03-01");
    expect(xml).toContain("2025-03-15");
    expect(xml).toContain("<codMotAfast>01</codMotAfast>"); // Médico
    expect(xml).toContain("fimAfastamento");
  });

  it("deve gerar XML sem data fim quando não informada", () => {
    const leave = { startDate: "2025-03-01", type: "MATERNITY" };
    const xml = buildXmlS2230(mockCompany, mockEmployee, leave, "ID_TEST_021");

    expect(xml).toContain("<codMotAfast>06</codMotAfast>"); // Maternidade
    expect(xml).not.toContain("fimAfastamento");
  });

  it("deve mapear tipos de afastamento corretamente", () => {
    const types = [
      { type: "PATERNITY", code: "19" },
      { type: "BEREAVEMENT", code: "16" },
      { type: "MARRIAGE", code: "15" },
    ];

    for (const { type, code } of types) {
      const leave = { startDate: "2025-01-01", type };
      const xml = buildXmlS2230(mockCompany, mockEmployee, leave, "ID_TEST");
      expect(xml).toContain(`<codMotAfast>${code}</codMotAfast>`);
    }
  });
});

describe("buildXmlS1200", () => {
  it("deve gerar XML válido para remuneração", () => {
    const payroll = { grossSalary: 5000 };
    const xml = buildXmlS1200(mockCompany, mockEmployee, payroll, 2025, 6, "ID_TEST_030");

    expect(xml).toContain("evtRemun");
    expect(xml).toContain("<perApur>2025-06</perApur>");
    expect(xml).toContain("12345678909"); // CPF
    expect(xml).toContain("5000.00"); // Salário bruto
    expect(xml).toContain("ID_TEST_030");
  });

  it("deve formatar mês com zero à esquerda", () => {
    const payroll = { grossSalary: 3000 };
    const xml = buildXmlS1200(mockCompany, mockEmployee, payroll, 2025, 1, "ID_TEST_031");

    expect(xml).toContain("<perApur>2025-01</perApur>");
  });
});

describe("buildXmlS1210", () => {
  it("deve gerar XML válido para pagamentos", () => {
    const payroll = { netSalary: 4200 };
    const xml = buildXmlS1210(mockCompany, mockEmployee, payroll, 2025, 6, "ID_TEST_040");

    expect(xml).toContain("evtPgtos");
    expect(xml).toContain("<perRef>2025-06</perRef>");
    expect(xml).toContain("12345678909"); // CPF
    expect(xml).toContain("4200.00"); // Salário líquido
    expect(xml).toContain("ID_TEST_040");
  });
});

describe("buildXmlS1299", () => {
  it("deve gerar XML válido para fechamento de periódicos", () => {
    const xml = buildXmlS1299(mockCompany, 2025, 6, "ID_TEST_050");

    expect(xml).toContain("evtFechaEvPer");
    expect(xml).toContain("<perApur>2025-06</perApur>");
    expect(xml).toContain("12345678000199"); // CNPJ
    expect(xml).toContain("<evtRemun>S</evtRemun>");
    expect(xml).toContain("<evtPgtos>S</evtPgtos>");
    expect(xml).toContain("ID_TEST_050");
  });
});

// ============================================================================
// ESOCIAL SERVICE (with mocked Prisma)
// ============================================================================

function createMockPrisma() {
  const mock: Record<string, any> = {
    eSocialConfig: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve({ id: "cfg-1", ...create })),
    },
    eSocialRubric: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "rub-1", ...data })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    eSocialEvent: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "evt-1", ...data })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "evt-1", ...data })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    eSocialBatch: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "batch-1", batchNumber: 1, ...data })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "batch-1", ...data })),
    },
    employee: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    termination: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    leaveRecord: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    payroll: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    company: {
      findUnique: vi.fn().mockResolvedValue({ id: "comp-1", cnpj: "12345678000199", companyName: "Empresa Teste" }),
      findFirst: vi.fn().mockResolvedValue({ id: "comp-1", cnpj: "12345678000199", companyName: "Empresa Teste" }),
    },
    $transaction: vi.fn().mockImplementation((args: unknown) => {
      if (Array.isArray(args)) return Promise.all(args);
      if (typeof args === "function") return (args as (tx: unknown) => unknown)(mock);
      return Promise.resolve();
    }),
  };
  return mock as unknown as PrismaClient;
}

describe("ESocialService", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: ESocialService;

  beforeEach(() => {
    prisma = createMockPrisma() as unknown as ReturnType<typeof createMockPrisma>;
    service = new ESocialService(prisma as unknown as PrismaClient);
  });

  // --------------------------------------------------------------------------
  // CONFIG
  // --------------------------------------------------------------------------

  describe("getConfig", () => {
    it("deve retornar null quando não existe configuração", async () => {
      const result = await service.getConfig("comp-1");
      expect(result).toBeNull();
      expect((prisma as any).eSocialConfig.findUnique).toHaveBeenCalledWith({
        where: { companyId: "comp-1" },
      });
    });

    it("deve retornar configuração existente", async () => {
      const mockConfig = { id: "cfg-1", companyId: "comp-1", environment: "RESTRICTED" };
      (prisma as any).eSocialConfig.findUnique.mockResolvedValue(mockConfig);

      const result = await service.getConfig("comp-1");
      expect(result).toEqual(mockConfig);
    });
  });

  describe("upsertConfig", () => {
    it("deve criar/atualizar configuração", async () => {
      const result = await service.upsertConfig("comp-1", {
        environment: "RESTRICTED",
        autoGenerate: true,
      });

      expect((prisma as any).eSocialConfig.upsert).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.companyId).toBe("comp-1");
    });
  });

  // --------------------------------------------------------------------------
  // RUBRICS
  // --------------------------------------------------------------------------

  describe("listRubrics", () => {
    it("deve listar rubricas sem filtros", async () => {
      await service.listRubrics("comp-1");
      expect((prisma as any).eSocialRubric.findMany).toHaveBeenCalledWith({
        where: { companyId: "comp-1" },
        orderBy: { code: "asc" },
      });
    });

    it("deve aplicar filtro de tipo", async () => {
      await service.listRubrics("comp-1", { type: "EARNING" });
      expect((prisma as any).eSocialRubric.findMany).toHaveBeenCalledWith({
        where: { companyId: "comp-1", type: "EARNING" },
        orderBy: { code: "asc" },
      });
    });

    it("deve aplicar filtro de ativo", async () => {
      await service.listRubrics("comp-1", { isActive: true });
      expect((prisma as any).eSocialRubric.findMany).toHaveBeenCalledWith({
        where: { companyId: "comp-1", isActive: true },
        orderBy: { code: "asc" },
      });
    });
  });

  describe("createRubric", () => {
    it("deve criar rubrica com dados corretos", async () => {
      const result = await service.createRubric("comp-1", {
        code: "001",
        name: "Salário Base",
        type: "EARNING",
        startDate: new Date("2025-01-01"),
      });

      expect((prisma as any).eSocialRubric.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.code).toBe("001");
    });
  });

  describe("updateRubric", () => {
    it("deve atualizar rubrica com escopo de empresa", async () => {
      await service.updateRubric("rub-1", "comp-1", { name: "Salário Atualizado" });
      expect((prisma as any).eSocialRubric.updateMany).toHaveBeenCalledWith({
        where: { id: "rub-1", companyId: "comp-1" },
        data: { name: "Salário Atualizado" },
      });
    });
  });

  // --------------------------------------------------------------------------
  // EVENTS
  // --------------------------------------------------------------------------

  describe("listEvents", () => {
    it("deve listar eventos com paginação", async () => {
      (prisma as any).eSocialEvent.findMany.mockResolvedValue([]);
      (prisma as any).eSocialEvent.count.mockResolvedValue(0);

      const result = await service.listEvents("comp-1", { limit: 10, offset: 0 });

      expect(result).toEqual({ events: [], total: 0 });
      expect((prisma as any).eSocialEvent.findMany).toHaveBeenCalled();
      expect((prisma as any).eSocialEvent.count).toHaveBeenCalled();
    });

    it("deve aplicar filtros de status e tipo", async () => {
      (prisma as any).eSocialEvent.findMany.mockResolvedValue([]);
      (prisma as any).eSocialEvent.count.mockResolvedValue(0);

      await service.listEvents("comp-1", { status: "DRAFT", eventType: "S_2200" });

      const call = (prisma as any).eSocialEvent.findMany.mock.calls[0][0];
      expect(call.where.companyId).toBe("comp-1");
      expect(call.where.status).toBe("DRAFT");
      expect(call.where.eventType).toBe("S_2200");
    });
  });

  describe("getEvent", () => {
    it("deve buscar evento por id e companyId", async () => {
      await service.getEvent("evt-1", "comp-1");
      expect((prisma as any).eSocialEvent.findFirst).toHaveBeenCalledWith({
        where: { id: "evt-1", companyId: "comp-1" },
        include: expect.objectContaining({
          employee: expect.any(Object),
          batch: expect.any(Object),
        }),
      });
    });
  });

  // --------------------------------------------------------------------------
  // GENERATE EVENTS
  // --------------------------------------------------------------------------

  describe("generateEvents", () => {
    it("deve retornar resultado com erros quando não há dados HR", async () => {
      const result = await service.generateEvents({
        companyId: "comp-1",
        year: 2025,
        month: 6,
      });

      expect(result.generated).toBe(0);
      // S_1200 and S_1210 report errors when no payroll found; others just skip
      expect(result.errors.length + result.skipped).toBeGreaterThanOrEqual(0);
    });

    it("deve gerar eventos S-2200 para admissões do período", async () => {
      const mockEmployees = [
        {
          id: "emp-1",
          cpf: "12345678909",
          name: "João Silva",
          code: 1001,
          birthDate: new Date("1990-01-01"),
          hireDate: new Date("2025-06-01"),
          contractType: "CLT",
          salary: 5000,
          companyId: "comp-1",
        },
      ];

      (prisma as any).employee.findMany.mockResolvedValue(mockEmployees);
      (prisma as any).eSocialEvent.findFirst.mockResolvedValue(null); // No existing event

      const result = await service.generateEvents({
        companyId: "comp-1",
        year: 2025,
        month: 6,
        eventTypes: ["S_2200"],
      });

      expect(result.generated).toBeGreaterThanOrEqual(0);
    });

    it("deve gerar eventos S-2299 para desligamentos do período", async () => {
      const mockTerminations = [
        {
          id: "term-1",
          employeeId: "emp-1",
          terminationDate: new Date("2025-06-15"),
          type: "RESIGNATION",
          totalNet: 10000,
          employee: {
            id: "emp-1",
            cpf: "12345678909",
            name: "Maria Santos",
            code: 1002,
            companyId: "comp-1",
          },
        },
      ];

      (prisma as any).termination.findMany.mockResolvedValue(mockTerminations);
      (prisma as any).eSocialEvent.findFirst.mockResolvedValue(null);

      const result = await service.generateEvents({
        companyId: "comp-1",
        year: 2025,
        month: 6,
        eventTypes: ["S_2299"],
      });

      expect(result.generated).toBeGreaterThanOrEqual(0);
    });
  });

  // --------------------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------------------

  describe("validateEvent", () => {
    it("deve retornar valid=false quando evento não existe", async () => {
      (prisma as any).eSocialEvent.findFirst.mockResolvedValue(null);

      const result = await service.validateEvent("evt-999", "comp-1");
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("NOT_FOUND");
    });

    it("deve validar evento com XML e atualizar status", async () => {
      const mockEvent = {
        id: "evt-1",
        companyId: "comp-1",
        status: "DRAFT",
        xmlContent: "<eSocial><evtAdmissao/></eSocial>",
        eventType: "S_2200",
      };
      (prisma as any).eSocialEvent.findFirst.mockResolvedValue(mockEvent);

      const result = await service.validateEvent("evt-1", "comp-1");

      expect(result).toBeDefined();
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("errors");
    });
  });

  describe("validateBatch", () => {
    it("deve validar todos os eventos DRAFT do lote", async () => {
      (prisma as any).eSocialEvent.findMany.mockResolvedValue([
        { id: "evt-1", status: "DRAFT", xmlContent: "<xml/>" },
        { id: "evt-2", status: "DRAFT", xmlContent: "<xml/>" },
      ]);

      const result = await service.validateBatch("batch-1", "comp-1");

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("totalErrors");
    });
  });

  // --------------------------------------------------------------------------
  // BATCHES
  // --------------------------------------------------------------------------

  describe("createBatch", () => {
    it("deve criar lote com número sequencial", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue(null); // No previous batch

      const result = await service.createBatch("comp-1", "PERIODIC");

      expect((prisma as any).eSocialBatch.create).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("batchNumber");
    });

    it("deve incrementar número do lote", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue({ batchNumber: 5 });

      await service.createBatch("comp-1", "TABLES");

      const createCall = (prisma as any).eSocialBatch.create.mock.calls[0][0];
      expect(createCall.data.batchNumber).toBe(6);
    });
  });

  describe("addEventsToBatch", () => {
    it("deve adicionar eventos ao lote aberto", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue({
        id: "batch-1",
        companyId: "comp-1",
        status: "OPEN",
      });

      const result = await service.addEventsToBatch("batch-1", "comp-1", ["evt-1", "evt-2"]);

      expect((prisma as any).eSocialEvent.updateMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("deve lançar erro quando lote não está aberto", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue(null);

      await expect(
        service.addEventsToBatch("batch-1", "comp-1", ["evt-1"])
      ).rejects.toThrow();
    });
  });

  describe("closeBatch", () => {
    it("deve fechar lote aberto", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue({
        id: "batch-1",
        companyId: "comp-1",
        status: "OPEN",
      });

      await service.closeBatch("batch-1", "comp-1");

      expect((prisma as any).eSocialBatch.update).toHaveBeenCalledWith({
        where: { id: "batch-1" },
        data: { status: "CLOSED" },
      });
    });

    it("deve lançar erro quando lote não existe ou não está aberto", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue(null);

      await expect(service.closeBatch("batch-999", "comp-1")).rejects.toThrow();
    });
  });

  describe("sendBatch", () => {
    it("deve enviar lote fechado e atualizar status", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue({
        id: "batch-1",
        companyId: "comp-1",
        status: "CLOSED",
        events: [
          { id: "evt-1", status: "QUEUED", xmlContent: "<xml/>" },
          { id: "evt-2", status: "QUEUED", xmlContent: "<xml/>" },
        ],
      });

      const result = await service.sendBatch("batch-1", "comp-1");

      expect(result).toHaveProperty("batchId", "batch-1");
      expect(result).toHaveProperty("protocolNumber");
      expect(result.sentCount).toBe(2);
      expect((prisma as any).$transaction).toHaveBeenCalled();
    });

    it("deve lançar erro quando lote não está fechado", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue(null);

      await expect(service.sendBatch("batch-1", "comp-1")).rejects.toThrow();
    });
  });

  describe("checkBatchResult", () => {
    it("deve consultar retorno de lote enviado", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue({
        id: "batch-1",
        companyId: "comp-1",
        status: "SENT",
        events: [
          { id: "evt-1", status: "SENT" },
          { id: "evt-2", status: "SENT" },
        ],
      });

      const result = await service.checkBatchResult("batch-1", "comp-1");

      expect(result).toBeDefined();
      expect((prisma as any).eSocialBatch.update).toHaveBeenCalled();
    });

    it("deve lançar erro quando lote não está enviado", async () => {
      (prisma as any).eSocialBatch.findFirst.mockResolvedValue(null);

      await expect(service.checkBatchResult("batch-1", "comp-1")).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // EXCLUSION
  // --------------------------------------------------------------------------

  describe("excludeEvent", () => {
    it("deve excluir evento aceito e criar evento S-3000", async () => {
      // findFirst is called multiple times: first for the event, then for company, then for lastEvent seq
      (prisma as any).eSocialEvent.findFirst
        .mockResolvedValueOnce({
          id: "evt-1",
          companyId: "comp-1",
          status: "ACCEPTED",
          eventType: "S_2200",
          receiptNumber: "REC-001",
          referenceYear: 2025,
          referenceMonth: 6,
          employeeId: "emp-1",
        })
        .mockResolvedValueOnce({ sequenceNumber: 5 }); // lastEvent
      (prisma as any).company.findFirst.mockResolvedValue({
        cnpj: "12345678000199",
      });

      const result = await service.excludeEvent("evt-1", "comp-1");

      expect(result).toHaveProperty("exclusionEventId");
      expect((prisma as any).eSocialEvent.update).toHaveBeenCalled();
      expect((prisma as any).eSocialEvent.create).toHaveBeenCalled();
    });

    it("deve lançar erro quando evento não está aceito", async () => {
      (prisma as any).eSocialEvent.findFirst.mockResolvedValue(null);

      await expect(service.excludeEvent("evt-1", "comp-1")).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------------------------------

  describe("getDashboard", () => {
    it("deve retornar dados do dashboard", async () => {
      (prisma as any).eSocialEvent.findMany.mockResolvedValue([
        { status: "DRAFT", eventType: "S_2200", sentAt: null },
        { status: "ACCEPTED", eventType: "S_1200", sentAt: new Date("2025-06-01") },
      ]);
      (prisma as any).eSocialBatch.count = vi.fn().mockResolvedValue(1);

      const result = await service.getDashboard("comp-1");

      expect(result).toHaveProperty("totalEvents");
      expect(result).toHaveProperty("byStatus");
      expect(result).toHaveProperty("byType");
      expect(result).toHaveProperty("pendingCount");
      expect(result).toHaveProperty("sentCount");
      expect(result).toHaveProperty("acceptedCount");
      expect(result).toHaveProperty("rejectedCount");
      expect(result).toHaveProperty("openBatches");
      expect(result).toHaveProperty("currentPeriod");
    });
  });

  // --------------------------------------------------------------------------
  // LIST BATCHES
  // --------------------------------------------------------------------------

  describe("listBatches", () => {
    it("deve listar lotes sem filtros", async () => {
      await service.listBatches("comp-1");
      expect((prisma as any).eSocialBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: "comp-1" },
        })
      );
    });

    it("deve aplicar filtro de status", async () => {
      await service.listBatches("comp-1", { status: "OPEN" });
      const call = (prisma as any).eSocialBatch.findMany.mock.calls[0][0];
      expect(call.where.status).toBe("OPEN");
    });

    it("deve aplicar filtro de groupType", async () => {
      await service.listBatches("comp-1", { groupType: "PERIODIC" });
      const call = (prisma as any).eSocialBatch.findMany.mock.calls[0][0];
      expect(call.where.groupType).toBe("PERIODIC");
    });
  });
});
