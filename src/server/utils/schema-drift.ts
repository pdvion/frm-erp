import fs from "fs";
import path from "path";

/**
 * Schema Drift Detection Utility
 *
 * Parses Prisma schema files and compares model/field definitions
 * against the real database via information_schema queries.
 *
 * This catches the exact class of bug where schema.prisma is updated
 * but no SQL migration is applied to the database.
 */

interface PrismaField {
  name: string;
  dbColumn: string;
  type: string;
  isOptional: boolean;
  isRelation: boolean;
}

interface PrismaModel {
  name: string;
  tableName: string;
  fields: PrismaField[];
}

interface DbColumn {
  column_name: string;
  is_nullable: string;
  data_type: string;
  udt_name: string;
}

export interface DriftIssue {
  table: string;
  model: string;
  type: "missing_table" | "missing_column" | "extra_column";
  column?: string;
  detail: string;
}

/**
 * Parse all .prisma files in a directory and extract model definitions.
 */
export function parsePrismaSchema(schemaDir: string): PrismaModel[] {
  const models: PrismaModel[] = [];
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".prisma"));

  for (const file of files) {
    const content = fs.readFileSync(path.join(schemaDir, file), "utf-8");
    const lines = content.split("\n");

    let currentModel: PrismaModel | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Start of model
      const modelMatch = trimmed.match(/^model\s+(\w+)\s*\{/);
      if (modelMatch) {
        currentModel = { name: modelMatch[1], tableName: "", fields: [] };
        continue;
      }

      // End of model
      if (trimmed === "}" && currentModel) {
        // If no @@map, Prisma uses the model name as table name
        if (!currentModel.tableName) {
          currentModel.tableName = currentModel.name;
        }
        models.push(currentModel);
        currentModel = null;
        continue;
      }

      if (!currentModel) continue;

      // @@map("table_name")
      const mapMatch = trimmed.match(/@@map\("([^"]+)"\)/);
      if (mapMatch) {
        currentModel.tableName = mapMatch[1];
        continue;
      }

      // Skip directives, comments, empty lines
      if (
        trimmed.startsWith("@@") ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("///") ||
        trimmed === ""
      ) {
        continue;
      }

      // Parse field: name Type[]? @map("col") @db.Xxx ...
      const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)(\[\])?(\?)?/);
      if (!fieldMatch) continue;

      const [, fieldName, fieldType, isArray, optional] = fieldMatch;

      // Detect relations:
      // - Has @relation directive
      // - Is an array type (Type[]) — always a relation
      // - Type starts with uppercase and is not a scalar Prisma type
      const scalarTypes = ["String", "Int", "Float", "Decimal", "Boolean", "DateTime", "Json", "BigInt", "Bytes"];
      const isRelation =
        !!isArray ||
        trimmed.includes("@relation") ||
        (fieldType[0] === fieldType[0].toUpperCase() && !scalarTypes.includes(fieldType));

      // Get @map column name if present
      const colMapMatch = trimmed.match(/@map\("([^"]+)"\)/);
      const dbColumn = colMapMatch ? colMapMatch[1] : fieldName;

      currentModel.fields.push({
        name: fieldName,
        dbColumn,
        type: fieldType,
        isOptional: !!optional,
        isRelation,
      });
    }
  }

  return models;
}

/**
 * Get all columns for a table from information_schema.
 */
export async function getTableColumns(
  queryFn: (sql: string, params: string[]) => Promise<DbColumn[]>,
  tableName: string,
  schema = "public",
): Promise<DbColumn[]> {
  return queryFn(
    `SELECT column_name, is_nullable, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, tableName],
  );
}

/**
 * Check if a table exists in the database.
 */
export async function tableExists(
  queryFn: (sql: string, params: string[]) => Promise<{ exists: boolean }[]>,
  tableName: string,
  schema = "public",
): Promise<boolean> {
  const result = await queryFn(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = $1 AND table_name = $2
     ) as exists`,
    [schema, tableName],
  );
  return result[0]?.exists ?? false;
}

/**
 * Compare Prisma schema models against the real database.
 * Returns a list of drift issues found.
 */
export async function detectSchemaDrift(
  schemaDir: string,
  queryFn: (sql: string, params: string[]) => Promise<unknown[]>,
): Promise<DriftIssue[]> {
  const models = parsePrismaSchema(schemaDir);
  const issues: DriftIssue[] = [];

  for (const model of models) {
    // Skip enum-like models (no real table)
    if (model.fields.length === 0) continue;

    // Check table exists
    const exists = await tableExists(
      queryFn as (sql: string, params: string[]) => Promise<{ exists: boolean }[]>,
      model.tableName,
    );

    if (!exists) {
      issues.push({
        table: model.tableName,
        model: model.name,
        type: "missing_table",
        detail: `Table "${model.tableName}" (model ${model.name}) does not exist in the database`,
      });
      continue;
    }

    // Get actual columns
    const dbColumns = await getTableColumns(
      queryFn as (sql: string, params: string[]) => Promise<DbColumn[]>,
      model.tableName,
    );
    const dbColumnNames = new Set(dbColumns.map((c) => c.column_name));

    // Check each non-relation field exists in DB
    const schemaColumns = model.fields.filter((f) => !f.isRelation);
    for (const field of schemaColumns) {
      if (!dbColumnNames.has(field.dbColumn)) {
        issues.push({
          table: model.tableName,
          model: model.name,
          type: "missing_column",
          column: field.dbColumn,
          detail: `Column "${field.dbColumn}" (field ${model.name}.${field.name}) missing from table "${model.tableName}"`,
        });
      }
    }

    // Check for extra DB columns not in schema (informational, not blocking)
    const schemaColumnNames = new Set(schemaColumns.map((f) => f.dbColumn));
    for (const dbCol of dbColumns) {
      if (!schemaColumnNames.has(dbCol.column_name)) {
        issues.push({
          table: model.tableName,
          model: model.name,
          type: "extra_column",
          column: dbCol.column_name,
          detail: `Column "${dbCol.column_name}" exists in table "${model.tableName}" but not in Prisma model ${model.name}`,
        });
      }
    }
  }

  return issues;
}
