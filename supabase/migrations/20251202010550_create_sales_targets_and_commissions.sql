/*
  # Sales Targets and Commission Management System
  
  This migration creates tables for managing sales targets, commission rules, and commission payments.
  
  1. New Tables:
    - commission_rules: Rules for calculating commissions per organization
    - commissions: Individual commission payments calculated for users
    - activity_targets: Activity-based targets (calls, meetings, etc.)
    - revenue_targets: Revenue-based targets per user
  
  2. Features:
    - Percentage, fixed, and tiered commission structures
    - Activity tracking targets (calls, meetings, quotes, demos)
    - Revenue targets with period tracking
    - Commission approval workflow
  
  3. Security:
    - RLS enabled on all tables
    - Only managers and head of sales can configure targets
    - Users can view their own targets and commissions
*/

-- Commission Rules table
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  applies_to_roles TEXT[] DEFAULT '{}',
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  percentage DECIMAL(5,2),
  fixed_amount DECIMAL(10,2),
  tiers JSONB,
  minimum_deal_size DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Commission Payments table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(10,2) NOT NULL,
  deal_value DECIMAL(10,2),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'paid')) DEFAULT 'pending',
  period_start DATE,
  period_end DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity Targets table
CREATE TABLE IF NOT EXISTS activity_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  applies_to_roles TEXT[],
  target_type TEXT NOT NULL CHECK (target_type IN ('calls', 'meetings', 'quotes', 'demos', 'emails')),
  target_period TEXT NOT NULL CHECK (target_period IN ('daily', 'weekly', 'monthly', 'quarterly')),
  target_count INTEGER NOT NULL,
  period_start DATE,
  period_end DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue Targets table
CREATE TABLE IF NOT EXISTS revenue_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  target_revenue DECIMAL(10,2) NOT NULL,
  target_deals INTEGER,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  commission_rule_id UUID REFERENCES commission_rules(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_commission_rules_org ON commission_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_commissions_org ON commissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_activity_targets_org ON activity_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_targets_user ON activity_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_targets_org ON revenue_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_revenue_targets_user ON revenue_targets(user_id);

-- Enable RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commission_rules
CREATE POLICY "Users can view org commission rules"
  ON commission_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = commission_rules.organization_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Managers can create commission rules"
  ON commission_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = commission_rules.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Managers can update commission rules"
  ON commission_rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = commission_rules.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

-- RLS Policies for commissions
CREATE POLICY "Users can view own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = commissions.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "System can create commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = commissions.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Managers can update commissions"
  ON commissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = commissions.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

-- RLS Policies for activity_targets
CREATE POLICY "Users can view relevant activity targets"
  ON activity_targets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = activity_targets.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Managers can create activity targets"
  ON activity_targets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = activity_targets.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Managers can update activity targets"
  ON activity_targets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = activity_targets.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

-- RLS Policies for revenue_targets
CREATE POLICY "Users can view own revenue targets"
  ON revenue_targets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = revenue_targets.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Managers can create revenue targets"
  ON revenue_targets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = revenue_targets.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Managers can update revenue targets"
  ON revenue_targets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = revenue_targets.organization_id
      AND user_id = auth.uid()
      AND role IN ('head_of_sales', 'sales_manager', 'admin', 'owner')
      AND is_active = true
    )
  );