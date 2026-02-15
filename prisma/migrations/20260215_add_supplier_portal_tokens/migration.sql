-- VIO-1125: Supplier Portal Tokens
CREATE TABLE IF NOT EXISTS supplier_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_supplier_portal_tokens_company ON supplier_portal_tokens(company_id);
CREATE INDEX idx_supplier_portal_tokens_supplier ON supplier_portal_tokens(supplier_id);
CREATE INDEX idx_supplier_portal_tokens_token ON supplier_portal_tokens(token);
