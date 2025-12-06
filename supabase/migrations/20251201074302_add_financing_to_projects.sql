/*
  # Add Financing Fields to Projects

  1. Changes
    - Add financing_enabled boolean to track if financing calculator is used
    - Add financing_loan_amount for the loan amount
    - Add financing_term for the loan duration (7, 10, 15, or 20 years)
    - Add financing_interest_rate for the applicable rate
    - Add financing_monthly_payment for calculated monthly payment

  2. Notes
    - All financing fields are nullable (customer may not want financing)
    - Default values set to NULL
    - These fields store the financing details selected by the customer
*/

-- Add financing columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'financing_enabled'
  ) THEN
    ALTER TABLE projects ADD COLUMN financing_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'financing_loan_amount'
  ) THEN
    ALTER TABLE projects ADD COLUMN financing_loan_amount numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'financing_term'
  ) THEN
    ALTER TABLE projects ADD COLUMN financing_term integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'financing_interest_rate'
  ) THEN
    ALTER TABLE projects ADD COLUMN financing_interest_rate numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'financing_monthly_payment'
  ) THEN
    ALTER TABLE projects ADD COLUMN financing_monthly_payment numeric(10,2);
  END IF;
END $$;

-- Add constraint to ensure financing_term is valid (7, 10, 15, or 20 years)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_financing_term_check'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_financing_term_check 
    CHECK (financing_term IN (7, 10, 15, 20) OR financing_term IS NULL);
  END IF;
END $$;
