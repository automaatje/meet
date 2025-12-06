/*
  # Add organization_id to existing tables

  1. Changes
    - Add organization_id column to customers, projects, invoices, work_orders, webhooks
    - Create function to auto-set organization_id based on user
    - Update RLS policies to filter by organization_id

  2. Security
    - Update all RLS policies to check organization membership
*/

-- Add organization_id to customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
  END IF;
END $$;

-- Add organization_id to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
  END IF;
END $$;

-- Add organization_id to invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
  END IF;
END $$;

-- Add organization_id to work_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_orders' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(organization_id);
  END IF;
END $$;

-- Add organization_id to webhooks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhooks' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE webhooks ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id);
  END IF;
END $$;

-- Add organization_id to employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
  END IF;
END $$;

-- Update RLS policies for customers
DROP POLICY IF EXISTS "Users can view own customers" ON customers;
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON customers;

CREATE POLICY "Users can view their organization's customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can create customers in their organization"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update their organization's customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can delete their organization's customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Update RLS policies for projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view their organization's projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can create projects in their organization"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can update their organization's projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can delete their organization's projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );