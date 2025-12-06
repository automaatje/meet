/*
  # Make company_name optional in customers table

  1. Changes
    - Alter `customers` table to make `company_name` nullable
    - This allows customers to be created with only a contact name
  
  2. Notes
    - Contact name remains required as every customer needs at least one identifier
    - Existing data is preserved
*/

ALTER TABLE customers 
ALTER COLUMN company_name DROP NOT NULL;
