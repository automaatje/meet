/*
  # Create Time Entries System

  1. New Tables
    - `time_entries`
      - `id` (uuid, primary key)
      - `work_order_id` (uuid, foreign key to work_orders)
      - `employee_id` (uuid, foreign key to employees)
      - `date` (date, when the work was performed)
      - `start_time` (time, work start time)
      - `end_time` (time, work end time)
      - `break_minutes` (integer, break duration)
      - `total_hours` (numeric, calculated total hours)
      - `notes` (text, optional notes)
      - `user_id` (uuid, who created this entry)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `actual_hours` column to `work_orders` table
    - Add `hourly_rate` column to `employees` table

  3. Security
    - Enable RLS on `time_entries` table
    - Add policies for authenticated users to manage their own time entries

  4. Indexes
    - Index on work_order_id for fast lookups
    - Index on employee_id for employee-based queries
    - Index on date for date range queries
*/

-- Add columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_orders' AND column_name = 'actual_hours'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN actual_hours NUMERIC(6,2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE employees ADD COLUMN hourly_rate NUMERIC(8,2) DEFAULT 0;
  END IF;
END $$;

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 0,
  total_hours NUMERIC(5,2) NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_work_order ON time_entries(work_order_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);

-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_entries
CREATE POLICY "Users can view time entries for their work orders"
  ON time_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_orders
      WHERE work_orders.id = time_entries.work_order_id
      AND work_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create time entries for their work orders"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM work_orders
      WHERE work_orders.id = time_entries.work_order_id
      AND work_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries"
  ON time_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update work_orders.actual_hours when time entries change
CREATE OR REPLACE FUNCTION update_work_order_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE work_orders
  SET actual_hours = (
    SELECT COALESCE(SUM(total_hours), 0)
    FROM time_entries
    WHERE work_order_id = COALESCE(NEW.work_order_id, OLD.work_order_id)
  )
  WHERE id = COALESCE(NEW.work_order_id, OLD.work_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update actual_hours
DROP TRIGGER IF EXISTS trigger_update_work_order_actual_hours ON time_entries;
CREATE TRIGGER trigger_update_work_order_actual_hours
AFTER INSERT OR UPDATE OR DELETE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION update_work_order_actual_hours();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_time_entries_updated_at ON time_entries;
CREATE TRIGGER trigger_update_time_entries_updated_at
BEFORE UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION update_time_entries_updated_at();