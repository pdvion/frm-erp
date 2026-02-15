-- VIO-1126: EDI — Electronic Data Interchange

-- Enums
DO $$ BEGIN
  CREATE TYPE edi_format AS ENUM ('EDIFACT', 'FLAT_FILE', 'XML', 'JSON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE edi_message_type AS ENUM ('ORDERS', 'ORDRSP', 'DESADV', 'INVOIC', 'RECADV', 'PRICAT', 'INVRPT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE edi_direction AS ENUM ('INBOUND', 'OUTBOUND');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE edi_message_status AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'ERROR', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE edi_partner_status AS ENUM ('ACTIVE', 'INACTIVE', 'TESTING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS edi_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  cnpj VARCHAR(18),
  format edi_format NOT NULL DEFAULT 'EDIFACT',
  status edi_partner_status NOT NULL DEFAULT 'ACTIVE',
  sftp_host TEXT,
  sftp_port INT DEFAULT 22,
  sftp_user TEXT,
  sftp_password TEXT,
  sftp_inbound_path TEXT,
  sftp_outbound_path TEXT,
  webhook_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS edi_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  partner_id UUID NOT NULL REFERENCES edi_partners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  message_type edi_message_type NOT NULL,
  direction edi_direction NOT NULL,
  status edi_message_status NOT NULL DEFAULT 'PENDING',
  reference_number VARCHAR(100),
  file_name TEXT,
  raw_content TEXT,
  parsed_data JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  related_order_id UUID,
  related_invoice_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS edi_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  partner_id UUID NOT NULL REFERENCES edi_partners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  message_type edi_message_type NOT NULL,
  direction edi_direction NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  field_mappings JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, partner_id, message_type, direction)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_edi_partners_company ON edi_partners(company_id);
CREATE INDEX IF NOT EXISTS idx_edi_messages_company ON edi_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_edi_messages_partner ON edi_messages(partner_id);
CREATE INDEX IF NOT EXISTS idx_edi_messages_status ON edi_messages(status);
CREATE INDEX IF NOT EXISTS idx_edi_messages_type ON edi_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_edi_messages_direction ON edi_messages(direction);
CREATE INDEX IF NOT EXISTS idx_edi_mappings_company ON edi_mappings(company_id);
CREATE INDEX IF NOT EXISTS idx_edi_mappings_partner ON edi_mappings(partner_id);
