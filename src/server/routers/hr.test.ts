import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listDepartmentsInputSchema = z.object({
  includeInactive: z.boolean().default(false),
}).optional();

const createDepartmentInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  costCenterId: z.string().optional(),
});

const listPositionsInputSchema = z.object({
  departmentId: z.string().optional(),
}).optional();

const createPositionInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  baseSalary: z.number().optional(),
  level: z.number().optional(),
});

const listEmployeesInputSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "VACATION", "LEAVE", "SUSPENDED", "TERMINATED", "ALL"]).optional(),
  departmentId: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const createEmployeeInputSchema = z.object({
  name: z.string().min(1),
  cpf: z.string().min(11).max(14),
  rg: z.string().optional(),
  birthDate: z.date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  departmentId: z.string(),
  positionId: z.string(),
  hireDate: z.date(),
  salary: z.number().positive(),
  workSchedule: z.string().optional(),
  bankCode: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
});

const updateEmployeeInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  salary: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "VACATION", "LEAVE", "SUSPENDED", "TERMINATED"]).optional(),
});

const terminateEmployeeInputSchema = z.object({
  id: z.string(),
  terminationDate: z.date(),
  terminationType: z.enum(["VOLUNTARY", "INVOLUNTARY", "RETIREMENT", "CONTRACT_END", "OTHER"]),
  reason: z.string().optional(),
});

const calculatePayrollInputSchema = z.object({
  employeeId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  overtime50: z.number().default(0),
  overtime100: z.number().default(0),
  absences: z.number().default(0),
  bonuses: z.number().default(0),
  deductions: z.number().default(0),
});

const listVacationsInputSchema = z.object({
  employeeId: z.string().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ALL"]).optional(),
  year: z.number().optional(),
}).optional();

const scheduleVacationInputSchema = z.object({
  employeeId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  daysCount: z.number().min(5).max(30),
  sellDays: z.number().min(0).max(10).default(0),
  notes: z.string().optional(),
});

const listTimesheetsInputSchema = z.object({
  employeeId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(50),
}).optional();

const registerTimesheetInputSchema = z.object({
  employeeId: z.string(),
  date: z.date(),
  clockIn: z.string(),
  clockOut: z.string().optional(),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
  notes: z.string().optional(),
});

describe("HR Router Schemas", () => {
  describe("listDepartments input", () => {
    it("should accept empty input", () => {
      const result = listDepartmentsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should default includeInactive to false", () => {
      const result = listDepartmentsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.includeInactive).toBe(false);
      }
    });

    it("should accept includeInactive true", () => {
      const result = listDepartmentsInputSchema.safeParse({ includeInactive: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createDepartment input", () => {
    it("should accept valid input", () => {
      const result = createDepartmentInputSchema.safeParse({
        code: "DEP001",
        name: "Recursos Humanos",
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = createDepartmentInputSchema.safeParse({
        code: "DEP002",
        name: "Financeiro",
        description: "Departamento Financeiro",
        parentId: "dep-001",
        costCenterId: "cc-001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing code", () => {
      const result = createDepartmentInputSchema.safeParse({
        name: "Departamento",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code", () => {
      const result = createDepartmentInputSchema.safeParse({
        code: "",
        name: "Departamento",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const result = createDepartmentInputSchema.safeParse({
        code: "DEP001",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createDepartmentInputSchema.safeParse({
        code: "DEP001",
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listPositions input", () => {
    it("should accept empty input", () => {
      const result = listPositionsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept departmentId", () => {
      const result = listPositionsInputSchema.safeParse({ departmentId: "dep-123" });
      expect(result.success).toBe(true);
    });
  });

  describe("createPosition input", () => {
    it("should accept valid input", () => {
      const result = createPositionInputSchema.safeParse({
        code: "POS001",
        name: "Analista de RH",
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = createPositionInputSchema.safeParse({
        code: "POS002",
        name: "Gerente Financeiro",
        description: "Responsável pelo setor financeiro",
        departmentId: "dep-001",
        baseSalary: 8000,
        level: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing code", () => {
      const result = createPositionInputSchema.safeParse({
        name: "Cargo",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const result = createPositionInputSchema.safeParse({
        code: "POS001",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listEmployees input", () => {
    it("should accept empty input", () => {
      const result = listEmployeesInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listEmployeesInputSchema.safeParse({ search: "João" });
      expect(result.success).toBe(true);
    });

    it("should accept status ACTIVE", () => {
      const result = listEmployeesInputSchema.safeParse({ status: "ACTIVE" });
      expect(result.success).toBe(true);
    });

    it("should accept status VACATION", () => {
      const result = listEmployeesInputSchema.safeParse({ status: "VACATION" });
      expect(result.success).toBe(true);
    });

    it("should accept status LEAVE", () => {
      const result = listEmployeesInputSchema.safeParse({ status: "LEAVE" });
      expect(result.success).toBe(true);
    });

    it("should accept status SUSPENDED", () => {
      const result = listEmployeesInputSchema.safeParse({ status: "SUSPENDED" });
      expect(result.success).toBe(true);
    });

    it("should accept status TERMINATED", () => {
      const result = listEmployeesInputSchema.safeParse({ status: "TERMINATED" });
      expect(result.success).toBe(true);
    });

    it("should accept status ALL", () => {
      const result = listEmployeesInputSchema.safeParse({ status: "ALL" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = listEmployeesInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept departmentId", () => {
      const result = listEmployeesInputSchema.safeParse({ departmentId: "dep-123" });
      expect(result.success).toBe(true);
    });

    it("should default page to 1", () => {
      const result = listEmployeesInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
      }
    });

    it("should default limit to 20", () => {
      const result = listEmployeesInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.limit).toBe(20);
      }
    });
  });

  describe("createEmployee input", () => {
    it("should accept valid input", () => {
      const result = createEmployeeInputSchema.safeParse({
        name: "João Silva",
        cpf: "12345678901",
        birthDate: new Date("1990-05-15"),
        departmentId: "dep-001",
        positionId: "pos-001",
        hireDate: new Date("2026-01-15"),
        salary: 5000,
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = createEmployeeInputSchema.safeParse({
        name: "Maria Santos",
        cpf: "98765432109",
        rg: "123456789",
        birthDate: new Date("1985-10-20"),
        gender: "FEMALE",
        maritalStatus: "MARRIED",
        email: "maria@empresa.com",
        phone: "(11) 99999-9999",
        address: "Rua das Flores, 100",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        departmentId: "dep-001",
        positionId: "pos-001",
        hireDate: new Date("2026-01-15"),
        salary: 8000,
        workSchedule: "08:00-17:00",
        bankCode: "237",
        bankAgency: "1234",
        bankAccount: "12345-6",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing name", () => {
      const result = createEmployeeInputSchema.safeParse({
        cpf: "12345678901",
        birthDate: new Date(),
        departmentId: "dep-001",
        positionId: "pos-001",
        hireDate: new Date(),
        salary: 5000,
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createEmployeeInputSchema.safeParse({
        name: "",
        cpf: "12345678901",
        birthDate: new Date(),
        departmentId: "dep-001",
        positionId: "pos-001",
        hireDate: new Date(),
        salary: 5000,
      });
      expect(result.success).toBe(false);
    });

    it("should reject cpf too short", () => {
      const result = createEmployeeInputSchema.safeParse({
        name: "João",
        cpf: "123",
        birthDate: new Date(),
        departmentId: "dep-001",
        positionId: "pos-001",
        hireDate: new Date(),
        salary: 5000,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero salary", () => {
      const result = createEmployeeInputSchema.safeParse({
        name: "João",
        cpf: "12345678901",
        birthDate: new Date(),
        departmentId: "dep-001",
        positionId: "pos-001",
        hireDate: new Date(),
        salary: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative salary", () => {
      const result = createEmployeeInputSchema.safeParse({
        name: "João",
        cpf: "12345678901",
        birthDate: new Date(),
        departmentId: "dep-001",
        positionId: "pos-001",
        hireDate: new Date(),
        salary: -1000,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = createEmployeeInputSchema.safeParse({
        name: "João",
        cpf: "12345678901",
        birthDate: new Date(),
        departmentId: "dep-001",
        positionId: "pos-001",
        hireDate: new Date(),
        salary: 5000,
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all gender values", () => {
      const genders = ["MALE", "FEMALE", "OTHER"];
      for (const gender of genders) {
        const result = createEmployeeInputSchema.safeParse({
          name: "Teste",
          cpf: "12345678901",
          birthDate: new Date(),
          departmentId: "dep-001",
          positionId: "pos-001",
          hireDate: new Date(),
          salary: 5000,
          gender,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept all maritalStatus values", () => {
      const statuses = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"];
      for (const maritalStatus of statuses) {
        const result = createEmployeeInputSchema.safeParse({
          name: "Teste",
          cpf: "12345678901",
          birthDate: new Date(),
          departmentId: "dep-001",
          positionId: "pos-001",
          hireDate: new Date(),
          salary: 5000,
          maritalStatus,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateEmployee input", () => {
    it("should accept id only", () => {
      const result = updateEmployeeInputSchema.safeParse({ id: "emp-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateEmployeeInputSchema.safeParse({
        id: "emp-123",
        name: "Novo Nome",
        salary: 6000,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateEmployeeInputSchema.safeParse({
        name: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all status values", () => {
      const statuses = ["ACTIVE", "VACATION", "LEAVE", "SUSPENDED", "TERMINATED"];
      for (const status of statuses) {
        const result = updateEmployeeInputSchema.safeParse({ id: "emp-123", status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("terminateEmployee input", () => {
    it("should accept valid termination", () => {
      const result = terminateEmployeeInputSchema.safeParse({
        id: "emp-123",
        terminationDate: new Date(),
        terminationType: "VOLUNTARY",
      });
      expect(result.success).toBe(true);
    });

    it("should accept termination with reason", () => {
      const result = terminateEmployeeInputSchema.safeParse({
        id: "emp-123",
        terminationDate: new Date(),
        terminationType: "INVOLUNTARY",
        reason: "Redução de quadro",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all termination types", () => {
      const types = ["VOLUNTARY", "INVOLUNTARY", "RETIREMENT", "CONTRACT_END", "OTHER"];
      for (const terminationType of types) {
        const result = terminateEmployeeInputSchema.safeParse({
          id: "emp-123",
          terminationDate: new Date(),
          terminationType,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject missing terminationDate", () => {
      const result = terminateEmployeeInputSchema.safeParse({
        id: "emp-123",
        terminationType: "VOLUNTARY",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing terminationType", () => {
      const result = terminateEmployeeInputSchema.safeParse({
        id: "emp-123",
        terminationDate: new Date(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("calculatePayroll input", () => {
    it("should accept valid input", () => {
      const result = calculatePayrollInputSchema.safeParse({
        employeeId: "emp-123",
        month: 1,
        year: 2026,
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = calculatePayrollInputSchema.safeParse({
        employeeId: "emp-123",
        month: 1,
        year: 2026,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.overtime50).toBe(0);
        expect(result.data.overtime100).toBe(0);
        expect(result.data.absences).toBe(0);
        expect(result.data.bonuses).toBe(0);
        expect(result.data.deductions).toBe(0);
      }
    });

    it("should accept full input", () => {
      const result = calculatePayrollInputSchema.safeParse({
        employeeId: "emp-123",
        month: 12,
        year: 2026,
        overtime50: 10,
        overtime100: 5,
        absences: 1,
        bonuses: 500,
        deductions: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should reject month less than 1", () => {
      const result = calculatePayrollInputSchema.safeParse({
        employeeId: "emp-123",
        month: 0,
        year: 2026,
      });
      expect(result.success).toBe(false);
    });

    it("should reject month greater than 12", () => {
      const result = calculatePayrollInputSchema.safeParse({
        employeeId: "emp-123",
        month: 13,
        year: 2026,
      });
      expect(result.success).toBe(false);
    });

    it("should reject year less than 2020", () => {
      const result = calculatePayrollInputSchema.safeParse({
        employeeId: "emp-123",
        month: 1,
        year: 2019,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listVacations input", () => {
    it("should accept empty input", () => {
      const result = listVacationsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept employeeId", () => {
      const result = listVacationsInputSchema.safeParse({ employeeId: "emp-123" });
      expect(result.success).toBe(true);
    });

    it("should accept all status values", () => {
      const statuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ALL"];
      for (const status of statuses) {
        const result = listVacationsInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should accept year", () => {
      const result = listVacationsInputSchema.safeParse({ year: 2026 });
      expect(result.success).toBe(true);
    });
  });

  describe("scheduleVacation input", () => {
    it("should accept valid input", () => {
      const result = scheduleVacationInputSchema.safeParse({
        employeeId: "emp-123",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-30"),
        daysCount: 30,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default sellDays", () => {
      const result = scheduleVacationInputSchema.safeParse({
        employeeId: "emp-123",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-30"),
        daysCount: 30,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sellDays).toBe(0);
      }
    });

    it("should accept vacation with sell days", () => {
      const result = scheduleVacationInputSchema.safeParse({
        employeeId: "emp-123",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-20"),
        daysCount: 20,
        sellDays: 10,
        notes: "Venda de 10 dias",
      });
      expect(result.success).toBe(true);
    });

    it("should reject daysCount less than 5", () => {
      const result = scheduleVacationInputSchema.safeParse({
        employeeId: "emp-123",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-04"),
        daysCount: 4,
      });
      expect(result.success).toBe(false);
    });

    it("should reject daysCount greater than 30", () => {
      const result = scheduleVacationInputSchema.safeParse({
        employeeId: "emp-123",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-08-15"),
        daysCount: 31,
      });
      expect(result.success).toBe(false);
    });

    it("should reject sellDays greater than 10", () => {
      const result = scheduleVacationInputSchema.safeParse({
        employeeId: "emp-123",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-20"),
        daysCount: 20,
        sellDays: 11,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listTimesheets input", () => {
    it("should accept empty input", () => {
      const result = listTimesheetsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept employeeId", () => {
      const result = listTimesheetsInputSchema.safeParse({ employeeId: "emp-123" });
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = listTimesheetsInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should default page to 1", () => {
      const result = listTimesheetsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
      }
    });

    it("should default limit to 50", () => {
      const result = listTimesheetsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.limit).toBe(50);
      }
    });
  });

  describe("registerTimesheet input", () => {
    it("should accept valid input", () => {
      const result = registerTimesheetInputSchema.safeParse({
        employeeId: "emp-123",
        date: new Date("2026-01-15"),
        clockIn: "08:00",
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = registerTimesheetInputSchema.safeParse({
        employeeId: "emp-123",
        date: new Date("2026-01-15"),
        clockIn: "08:00",
        clockOut: "17:00",
        breakStart: "12:00",
        breakEnd: "13:00",
        notes: "Dia normal",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing employeeId", () => {
      const result = registerTimesheetInputSchema.safeParse({
        date: new Date(),
        clockIn: "08:00",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing date", () => {
      const result = registerTimesheetInputSchema.safeParse({
        employeeId: "emp-123",
        clockIn: "08:00",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing clockIn", () => {
      const result = registerTimesheetInputSchema.safeParse({
        employeeId: "emp-123",
        date: new Date(),
      });
      expect(result.success).toBe(false);
    });
  });
});
