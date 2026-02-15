#!/usr/bin/env node
/**
 * VIO-1136: Apply schema drift migration
 * Creates 5 missing tables: edi_partners, edi_messages, edi_mappings,
 * supplier_portal_tokens, customer_portal_tokens
 *
 * Usage: node scripts/apply-drift-migration.mjs
 * Requires DATABASE_URL in .env
 */

import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });

const MIGRATION_SQL = `
-- VIO-1136: Schema Drift Resolution
-- Create 5 missing tables + 5 enums for EDI and Portal tokens

-- ═══ EDI Enums ═══

DO $$ BEGIN
  CREATE TYPE edi_format AS ENUM ('EDIFACT', 'FLAT_FILE', 'XML', 'JSON');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE edi_message_type AS ENUM ('ORDERS', 'ORDRSP', 'DESADV', 'INVOIC', 'RECADV', 'PRICAT', 'INVRPT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE edi_direction AS ENUM ('INBOUND', 'OUTBOUND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE edi_message_status AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'ERROR', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE edi_partner_status AS ENUM ('ACTIVE', 'INACTIVE', 'TESTING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══ EDI Tables ═══

CREATE TABLE IF NOT EXISTS edi_partners (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  code             VARCHAR(50) NOT NULL,
  name             TEXT NOT NULL,
  cnpj             VARCHAR(18),
  format           edi_format NOT NULL DEFAULT 'EDIFACT',
  status           edi_partner_status NOT NULL DEFAULT 'ACTIVE',
  sftp_host        TEXT,
  sftp_port        INT DEFAULT 22,
  sftp_user        TEXT,
  sftp_password    TEXT,
  sftp_inbound_path  TEXT,
  sftp_outbound_path TEXT,
  webhook_url      TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_edi_partners_company_id ON edi_partners(company_id);

CREATE TABLE IF NOT EXISTS edi_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  partner_id        UUID NOT NULL REFERENCES edi_partners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  message_type      edi_message_type NOT NULL,
  direction         edi_direction NOT NULL,
  status            edi_message_status NOT NULL DEFAULT 'PENDING',
  reference_number  VARCHAR(100),
  file_name         TEXT,
  raw_content       TEXT,
  parsed_data       JSONB,
  error_message     TEXT,
  processed_at      TIMESTAMPTZ,
  related_order_id  UUID,
  related_invoice_id UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edi_messages_company_id ON edi_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_edi_messages_partner_id ON edi_messages(partner_id);
CREATE INDEX IF NOT EXISTS idx_edi_messages_status ON edi_messages(status);
CREATE INDEX IF NOT EXISTS idx_edi_messages_message_type ON edi_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_edi_messages_direction ON edi_messages(direction);

CREATE TABLE IF NOT EXISTS edi_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  partner_id      UUID NOT NULL REFERENCES edi_partners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  message_type    edi_message_type NOT NULL,
  direction       edi_direction NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  field_mappings  JSONB NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, partner_id, message_type, direction)
);

CREATE INDEX IF NOT EXISTS idx_edi_mappings_company_id ON edi_mappings(company_id);
CREATE INDEX IF NOT EXISTS idx_edi_mappings_partner_id ON edi_mappings(partner_id);

-- ═══ Portal Token Tables ═══

CREATE TABLE IF NOT EXISTS supplier_portal_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  supplier_id  UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  token        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_supplier_portal_tokens_company_id ON supplier_portal_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_portal_tokens_supplier_id ON supplier_portal_tokens(supplier_id);

CREATE TABLE IF NOT EXISTS customer_portal_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  token        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_company_id ON customer_portal_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_customer_id ON customer_portal_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_token ON customer_portal_tokens(token);
`;

async function main() {
  console.log("🔄 Connecting to database...");
  const client = await pool.connect();

  try {
    console.log("🔄 Applying migration: create_edi_and_portal_token_tables...");
    await client.query(MIGRATION_SQL);
    console.log("✅ Migration applied successfully!");

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('edi_partners', 'edi_messages', 'edi_mappings', 'supplier_portal_tokens', 'customer_portal_tokens')
      ORDER BY table_name
    `);
    console.log(`\n✅ Tables created (${result.rows.length}/5):`);
    for (const row of result.rows) {
      console.log(`   - ${row.table_name}`);
    }

    if (result.rows.length !== 5) {
      console.error("❌ Expected 5 tables but found", result.rows.length);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
