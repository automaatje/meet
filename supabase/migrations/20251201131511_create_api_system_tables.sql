/*
  Create API System Tables
  
  This migration creates the infrastructure for a RESTful API system for partners.
  
  New Tables:
  1. api_keys - Stores API keys for external partners
  2. api_requests - Logs all API requests for analytics
  3. partner_products - Products synced from partner APIs
  
  Security:
  - RLS enabled on all tables
  - Organization-scoped access control
*/

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rate_limit INTEGER DEFAULT 1000,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create api_requests table
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create partner_products table
CREATE TABLE IF NOT EXISTS partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  sku TEXT,
  price DECIMAL(10,2),
  stock_quantity INTEGER,
  specifications JSONB DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_api_key_id, external_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_requests_key_date ON api_requests(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_products_key ON partner_products(partner_api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Users can view their organization API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = api_keys.organization_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = api_keys.organization_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Org admins can create API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = api_keys.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Org admins can update API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = api_keys.organization_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = api_keys.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Org admins can delete API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = api_keys.organization_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = api_keys.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
      AND is_active = true
    )
  );

-- RLS Policies for api_requests
CREATE POLICY "Users can view their organization API requests"
  ON api_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api_keys
      JOIN organizations ON organizations.id = api_keys.organization_id
      WHERE api_keys.id = api_requests.api_key_id
      AND (
        organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.organization_id = organizations.id
          AND team_members.user_id = auth.uid()
          AND team_members.is_active = true
        )
      )
    )
  );

-- RLS Policies for partner_products
CREATE POLICY "Users can view their organization partner products"
  ON partner_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api_keys
      JOIN organizations ON organizations.id = api_keys.organization_id
      WHERE api_keys.id = partner_products.partner_api_key_id
      AND (
        organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.organization_id = organizations.id
          AND team_members.user_id = auth.uid()
          AND team_members.is_active = true
        )
      )
    )
  );