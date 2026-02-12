import { describe, it, expect } from "vitest";
import path from "path";
import { parsePrismaSchema } from "./schema-drift";

/**
 * Unit tests for the schema parser (no DB connection needed).
 */
describe("parsePrismaSchema", () => {
  const schemaDir = path.resolve(__dirname, "../../../prisma/schema");

  it("should parse all prisma schema files without errors", () => {
    const models = parsePrismaSchema(schemaDir);
    expect(models.length).toBeGreaterThan(0);
  });

  it("should extract table names from @@map", () => {
    const models = parsePrismaSchema(schemaDir);
    const company = models.find((m) => m.name === "Company");
    expect(company).toBeDefined();
    expect(company!.tableName).toBe("companies");
  });

  it("should extract fields with @map column names", () => {
    const models = parsePrismaSchema(schemaDir);
    const company = models.find((m) => m.name === "Company");
    expect(company).toBeDefined();

    const legacyId = company!.fields.find((f) => f.name === "legacyId");
    if (legacyId) {
      // If legacyId has @map, dbColumn should be the mapped name
      expect(legacyId.dbColumn).toBeDefined();
    }
  });

  it("should identify relation fields", () => {
    const models = parsePrismaSchema(schemaDir);
    const company = models.find((m) => m.name === "Company");
    expect(company).toBeDefined();

    const relations = company!.fields.filter((f) => f.isRelation);
    expect(relations.length).toBeGreaterThan(0);
  });

  it("should not include relation fields as DB columns", () => {
    const models = parsePrismaSchema(schemaDir);
    const company = models.find((m) => m.name === "Company");
    expect(company).toBeDefined();

    const nonRelations = company!.fields.filter((f) => !f.isRelation);
    // All non-relation fields should have simple types
    for (const field of nonRelations) {
      expect(["String", "Int", "Float", "Decimal", "Boolean", "DateTime", "Json", "BigInt", "Bytes"]).toContain(
        field.type,
      );
    }
  });

  it("should parse all expected models", () => {
    const models = parsePrismaSchema(schemaDir);
    const modelNames = models.map((m) => m.name);

    // Spot-check key models exist
    expect(modelNames).toContain("Company");
    expect(modelNames).toContain("User");
    expect(modelNames).toContain("Employee");
    expect(modelNames).toContain("Material");
    expect(modelNames).toContain("Inventory");
    expect(modelNames).toContain("ProductionOrder");
  });
});
