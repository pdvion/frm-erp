import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";
import { type DriftIssue, detectSchemaDrift, parsePrismaSchema } from "./schema-drift";

// Load .env explicitly — vitest.setup.ts mocks everything, so process.env is empty
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/**
 * Integration test: connects to the REAL Supabase database and verifies
 * that the Prisma schema matches the actual DB structure.
 *
 * This test catches the exact class of bug where schema.prisma is updated
 * but no SQL migration is applied (e.g., PR #43 adding legacyId/deletedAt
 * without corresponding ALTER TABLE statements).
 *
 * Run with:
 *   npx vitest run src/server/utils/schema-drift.integration.test.ts
 *
 * Requires DATABASE_URL in .env pointing to the real Supabase instance.
 */

const DATABASE_URL = process.env["DATABASE_URL"];
const shouldRun = !!DATABASE_URL && !DATABASE_URL.includes("[PROJECT_ID]");
const SCHEMA_DIR = path.resolve(__dirname, "../../../prisma/schema");

describe.skipIf(!shouldRun)("Schema Drift Detection (Integration)", () => {
  let pool: pg.Pool;
  let driftIssues: DriftIssue[];

  beforeAll(async () => {
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 10000,
    });

    async function queryFn(sql: string, params: string[]): Promise<unknown[]> {
      const result = await pool.query(sql, params);
      return result.rows;
    }

    // Run drift detection ONCE and share results across all tests
    driftIssues = await detectSchemaDrift(SCHEMA_DIR, queryFn);
  }, 30000);

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("should connect to the database", async () => {
    const result = await pool.query("SELECT NOW() as now");
    expect(result.rows[0].now).toBeInstanceOf(Date);
  });

  it("should have no missing tables", () => {
    const missingTables = driftIssues.filter((i) => i.type === "missing_table");
    if (missingTables.length > 0) {
      const details = missingTables.map((i) => `  - ${i.detail}`).join("\n");
      console.error(`\n❌ MISSING TABLES (${missingTables.length}):\n${details}\n`);
    }
    expect(missingTables).toEqual([]);
  });

  it("should have no missing columns (schema drift)", () => {
    const missingColumns = driftIssues.filter((i) => i.type === "missing_column");
    if (missingColumns.length > 0) {
      const details = missingColumns.map((i) => `  - ${i.detail}`).join("\n");
      console.error(`\n❌ SCHEMA DRIFT — MISSING COLUMNS (${missingColumns.length}):\n${details}\n`);
      console.error(
        "FIX: Apply SQL migrations for these columns using /db-migration workflow.\n" +
          "This happens when prisma/schema is updated without a corresponding ALTER TABLE.\n",
      );
    }
    expect(missingColumns).toEqual([]);
  });

  it("should report extra DB columns not in schema (informational)", () => {
    const extraColumns = driftIssues.filter((i) => i.type === "extra_column");
    if (extraColumns.length > 0) {
      const details = extraColumns.map((i) => `  - ${i.detail}`).join("\n");
      console.warn(`\n⚠️  EXTRA DB COLUMNS (${extraColumns.length}) — not blocking:\n${details}\n`);
    }
    // This is informational only — extra columns don't break anything
  });

  it("should parse all schema models successfully", () => {
    const models = parsePrismaSchema(SCHEMA_DIR);
    expect(models.length).toBeGreaterThan(50);
    for (const model of models) {
      expect(model.tableName).toBeTruthy();
    }
  });
});
