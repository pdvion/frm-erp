import { describe, it, expect } from "vitest";
import {
  calculateMTBF,
  calculateMTTR,
  calculateAvailability,
  calculateMaintenanceCost,
  calculatePreventiveRatio,
  getNextMaintenanceDate,
  isMaintenanceDue,
  calculateDurationMinutes,
  getPriorityWeight,
  generateChecklistFromPlan,
} from "./maintenance";

// ==========================================================================
// calculateMTBF
// ==========================================================================
describe("calculateMTBF", () => {
  it("should return operating hours when no failures", () => {
    expect(calculateMTBF(1000, 0)).toBe(1000);
  });

  it("should return 0 when no operating hours and no failures", () => {
    expect(calculateMTBF(0, 0)).toBe(0);
  });

  it("should calculate MTBF correctly", () => {
    expect(calculateMTBF(1000, 5)).toBe(200);
  });

  it("should handle single failure", () => {
    expect(calculateMTBF(500, 1)).toBe(500);
  });

  it("should round to 2 decimal places", () => {
    expect(calculateMTBF(1000, 3)).toBe(333.33);
  });

  it("should handle negative failure count as zero failures", () => {
    expect(calculateMTBF(1000, -1)).toBe(1000);
  });
});

// ==========================================================================
// calculateMTTR
// ==========================================================================
describe("calculateMTTR", () => {
  it("should return 0 when no repairs", () => {
    expect(calculateMTTR(0, 0)).toBe(0);
  });

  it("should calculate MTTR in hours from minutes", () => {
    expect(calculateMTTR(600, 5)).toBe(2);
  });

  it("should handle single repair", () => {
    expect(calculateMTTR(120, 1)).toBe(2);
  });

  it("should round to 2 decimal places", () => {
    expect(calculateMTTR(100, 3)).toBe(0.56);
  });

  it("should return 0 for negative repair count", () => {
    expect(calculateMTTR(100, -1)).toBe(0);
  });
});

// ==========================================================================
// calculateAvailability
// ==========================================================================
describe("calculateAvailability", () => {
  it("should return 100% when both are 0", () => {
    expect(calculateAvailability(0, 0)).toBe(100);
  });

  it("should return 100% when MTTR is 0", () => {
    expect(calculateAvailability(200, 0)).toBe(100);
  });

  it("should calculate correctly", () => {
    // MTBF=200, MTTR=2 → 200/(200+2) = 99.01%
    expect(calculateAvailability(200, 2)).toBe(99.01);
  });

  it("should handle equal MTBF and MTTR", () => {
    expect(calculateAvailability(100, 100)).toBe(50);
  });

  it("should handle low availability", () => {
    // MTBF=10, MTTR=90 → 10/(10+90) = 10%
    expect(calculateAvailability(10, 90)).toBe(10);
  });
});

// ==========================================================================
// calculateMaintenanceCost
// ==========================================================================
describe("calculateMaintenanceCost", () => {
  it("should sum parts and labor cost", () => {
    expect(calculateMaintenanceCost(500, 300)).toBe(800);
  });

  it("should handle zero costs", () => {
    expect(calculateMaintenanceCost(0, 0)).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    expect(calculateMaintenanceCost(100.555, 200.444)).toBe(301);
  });
});

// ==========================================================================
// calculatePreventiveRatio
// ==========================================================================
describe("calculatePreventiveRatio", () => {
  it("should return 0 when no orders", () => {
    expect(calculatePreventiveRatio(0, 0)).toBe(0);
  });

  it("should return 100% when all preventive", () => {
    expect(calculatePreventiveRatio(10, 10)).toBe(100);
  });

  it("should calculate ratio correctly", () => {
    expect(calculatePreventiveRatio(7, 10)).toBe(70);
  });

  it("should handle 0 preventive", () => {
    expect(calculatePreventiveRatio(0, 10)).toBe(0);
  });
});

// ==========================================================================
// getNextMaintenanceDate
// ==========================================================================
describe("getNextMaintenanceDate", () => {
  const base = new Date("2026-01-01T00:00:00Z");

  it("should add days for DAILY frequency", () => {
    const result = getNextMaintenanceDate(base, "DAILY", 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-02");
  });

  it("should add 7 days for WEEKLY frequency", () => {
    const result = getNextMaintenanceDate(base, "WEEKLY", 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-08");
  });

  it("should add 14 days for BIWEEKLY frequency", () => {
    const result = getNextMaintenanceDate(base, "BIWEEKLY", 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-15");
  });

  it("should add months for MONTHLY frequency", () => {
    const result = getNextMaintenanceDate(base, "MONTHLY", 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-01");
  });

  it("should add 3 months for QUARTERLY frequency", () => {
    const result = getNextMaintenanceDate(base, "QUARTERLY", 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-04-01");
  });

  it("should add 6 months for SEMIANNUAL frequency", () => {
    const result = getNextMaintenanceDate(base, "SEMIANNUAL", 1);
    expect(result.getMonth()).toBe(6); // July (0-indexed)
  });

  it("should add years for ANNUAL frequency", () => {
    const result = getNextMaintenanceDate(base, "ANNUAL", 1);
    expect(result.toISOString().slice(0, 10)).toBe("2027-01-01");
  });

  it("should handle HOURS frequency (8h/day default)", () => {
    const result = getNextMaintenanceDate(base, "HOURS", 24);
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-04");
  });

  it("should multiply by frequencyValue", () => {
    const result = getNextMaintenanceDate(base, "MONTHLY", 3);
    expect(result.toISOString().slice(0, 10)).toBe("2026-04-01");
  });

  it("should default frequencyValue to 1", () => {
    const result = getNextMaintenanceDate(base, "DAILY");
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-02");
  });
});

// ==========================================================================
// isMaintenanceDue
// ==========================================================================
describe("isMaintenanceDue", () => {
  it("should return false when nextDueDate is null", () => {
    expect(isMaintenanceDue(null)).toBe(false);
  });

  it("should return true when due date is in the past", () => {
    const past = new Date("2020-01-01");
    expect(isMaintenanceDue(past, new Date("2026-01-01"))).toBe(true);
  });

  it("should return false when due date is in the future", () => {
    const future = new Date("2030-01-01");
    expect(isMaintenanceDue(future, new Date("2026-01-01"))).toBe(false);
  });

  it("should return true when due date equals now", () => {
    const now = new Date("2026-01-01");
    expect(isMaintenanceDue(now, now)).toBe(true);
  });
});

// ==========================================================================
// calculateDurationMinutes
// ==========================================================================
describe("calculateDurationMinutes", () => {
  it("should calculate minutes between two dates", () => {
    const start = new Date("2026-01-01T08:00:00Z");
    const end = new Date("2026-01-01T10:30:00Z");
    expect(calculateDurationMinutes(start, end)).toBe(150);
  });

  it("should return 0 when end is before start", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T08:00:00Z");
    expect(calculateDurationMinutes(start, end)).toBe(0);
  });

  it("should return 0 when same time", () => {
    const t = new Date("2026-01-01T08:00:00Z");
    expect(calculateDurationMinutes(t, t)).toBe(0);
  });
});

// ==========================================================================
// getPriorityWeight
// ==========================================================================
describe("getPriorityWeight", () => {
  it("should return 1 for EMERGENCY", () => {
    expect(getPriorityWeight("EMERGENCY")).toBe(1);
  });

  it("should return 2 for URGENT", () => {
    expect(getPriorityWeight("URGENT")).toBe(2);
  });

  it("should return 3 for HIGH", () => {
    expect(getPriorityWeight("HIGH")).toBe(3);
  });

  it("should return 4 for NORMAL", () => {
    expect(getPriorityWeight("NORMAL")).toBe(4);
  });

  it("should return 5 for LOW", () => {
    expect(getPriorityWeight("LOW")).toBe(5);
  });

  it("should return 4 (NORMAL) for unknown priority", () => {
    expect(getPriorityWeight("UNKNOWN")).toBe(4);
  });
});

// ==========================================================================
// generateChecklistFromPlan
// ==========================================================================
describe("generateChecklistFromPlan", () => {
  it("should return empty array for null", () => {
    expect(generateChecklistFromPlan(null)).toEqual([]);
  });

  it("should return empty array for non-array", () => {
    expect(generateChecklistFromPlan("invalid" as unknown as null)).toEqual([]);
  });

  it("should generate checklist with sequences", () => {
    const items = [
      { description: "Verificar óleo", isRequired: true },
      { description: "Limpar filtro", isRequired: false },
      { description: "Testar pressão", isRequired: true },
    ];
    const result = generateChecklistFromPlan(items);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ sequence: 1, description: "Verificar óleo", isRequired: true });
    expect(result[1]).toEqual({ sequence: 2, description: "Limpar filtro", isRequired: false });
    expect(result[2]).toEqual({ sequence: 3, description: "Testar pressão", isRequired: true });
  });

  it("should default isRequired to false", () => {
    const items = [{ description: "Check", isRequired: undefined as unknown as boolean }];
    const result = generateChecklistFromPlan(items);
    expect(result[0]?.isRequired).toBe(false);
  });
});
