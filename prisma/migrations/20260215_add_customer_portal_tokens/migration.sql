-- VIO-1124: Customer Portal Tokens
CREATE TABLE IF NOT EXISTS customer_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_customer_portal_tokens_company ON customer_portal_tokens(company_id);
CREATE INDEX idx_customer_portal_tokens_customer ON customer_portal_tokens(customer_id);
CREATE INDEX idx_customer_portal_tokens_token ON customer_portal_tokens(token);
