/*
  # Create Work Orders System

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text, required)
      - `email` (text)
      - `phone` (text)
      - `role` (text, enum: schilder, voorman, leerling, zzp)
      - `hourly_rate` (decimal)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
    
    - `work_orders`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `work_order_number` (text, unique, auto-generated)
      - `title` (text, required)
      - `scheduled_date` (date)
      - `status` (text, enum: planned, in_progress, completed)
      - `assigned_employees` (jsonb, array of employee ids)
      - `estimated_hours` (decimal)
      - `notes` (text)
      - `created_at` (timestamp)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
    
    - `work_order_tasks`
      - `id` (uuid, primary key)
      - `work_order_id` (uuid, references work_orders)
      - `description` (text, required)
      - `is_completed` (boolean, default false)
      - `completed_at` (timestamp)
      - `sort_order` (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own team and work orders
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text CHECK (role IN ('schilder', 'voorman', 'leerling', 'zzp')) DEFAULT 'schilder',
  hourly_rate decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  work_order_number text UNIQUE NOT NULL,
  title text NOT NULL,
  scheduled_date date,
  status text CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned',
  assigned_employees jsonb DEFAULT '[]'::jsonb,
  estimated_hours decimal(5,2),
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create work_order_tasks table
CREATE TABLE IF NOT EXISTS work_order_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_tasks ENABLE ROW LEVEL SECURITY;

-- Employees policies
CREATE POLICY "Users can view own employees"
  ON employees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own employees"
  ON employees FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Work orders policies
CREATE POLICY "Users can view own work orders"
  ON work_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_orders.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own work orders"
  ON work_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_orders.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own work orders"
  ON work_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_orders.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_orders.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own work orders"
  ON work_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_orders.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Work order tasks policies
CREATE POLICY "Users can view own work order tasks"
  ON work_order_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_orders
      JOIN projects ON projects.id = work_orders.project_id
      WHERE work_orders.id = work_order_tasks.work_order_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own work order tasks"
  ON work_order_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_orders
      JOIN projects ON projects.id = work_orders.project_id
      WHERE work_orders.id = work_order_tasks.work_order_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own work order tasks"
  ON work_order_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_orders
      JOIN projects ON projects.id = work_orders.project_id
      WHERE work_orders.id = work_order_tasks.work_order_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_orders
      JOIN projects ON projects.id = work_orders.project_id
      WHERE work_orders.id = work_order_tasks.work_order_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own work order tasks"
  ON work_order_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_orders
      JOIN projects ON projects.id = work_orders.project_id
      WHERE work_orders.id = work_order_tasks.work_order_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_project_id ON work_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_order_tasks_work_order_id ON work_order_tasks(work_order_id);