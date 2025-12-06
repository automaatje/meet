/*
  # Create Invoicing System

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, foreign key to projects, nullable)
      - `customer_id` (uuid, foreign key to customers)
      - `invoice_number` (text, unique)
      - `invoice_date` (date)
      - `due_date` (date)
      - `status` (text: draft, sent, paid, overdue)
      - `subtotal` (numeric)
      - `vat_amount` (numeric)
      - `total_amount` (numeric)
      - `paid_amount` (numeric)
      - `payment_terms` (text)
      - `sent_at` (timestamptz, when invoice was sent)
      - `paid_at` (timestamptz, when fully paid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `invoice_line_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoices)
      - `description` (text)
      - `quantity` (numeric)
      - `unit_price` (numeric)
      - `total` (numeric)
      - `sort_order` (integer)

    - `payments`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoices)
      - `user_id` (uuid, foreign key to auth.users)
      - `amount` (numeric)
      - `payment_date` (date)
      - `payment_method` (text)
      - `reference` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Functions
    - Auto-generate invoice numbers
    - Auto-calculate invoice totals
    - Update overdue status

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  4. Indexes
    - Index on invoice_number for fast lookups
    - Index on customer_id for customer queries
    - Index on status for filtering
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  subtotal NUMERIC(10,2) DEFAULT 0,
  vat_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  payment_terms TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for invoice_line_items
CREATE POLICY "Users can view line items for their invoices"
  ON invoice_line_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create line items for their invoices"
  ON invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update line items for their invoices"
  ON invoice_line_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete line items for their invoices"
  ON invoice_line_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can view payments for their invoices"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payments for their invoices"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own payments"
  ON payments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  year_str TEXT;
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      REGEXP_REPLACE(
        invoice_number, 
        'INV-' || year_str || '-', 
        ''
      ) AS INTEGER
    )
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE user_id = user_uuid
  AND invoice_number LIKE 'INV-' || year_str || '-%';
  
  invoice_num := 'INV-' || year_str || '-' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice totals when line items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total), 0)
      FROM invoice_line_items
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    vat_amount = (
      SELECT COALESCE(SUM(total), 0) * 0.21
      FROM invoice_line_items
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    total_amount = (
      SELECT COALESCE(SUM(total), 0) * 1.21
      FROM invoice_line_items
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON invoice_line_items;
CREATE TRIGGER trigger_update_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

-- Trigger to update paid_amount and status when payments change
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  invoice_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_paid
  FROM payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  SELECT total_amount
  INTO invoice_total
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  UPDATE invoices
  SET 
    paid_amount = total_paid,
    status = CASE
      WHEN total_paid >= invoice_total THEN 'paid'
      WHEN status = 'draft' THEN 'draft'
      ELSE status
    END,
    paid_at = CASE
      WHEN total_paid >= invoice_total AND paid_at IS NULL THEN NOW()
      ELSE paid_at
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_payment_status ON payments;
CREATE TRIGGER trigger_update_invoice_payment_status
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_payment_status();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoices_updated_at ON invoices;
CREATE TRIGGER trigger_update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoices_updated_at();