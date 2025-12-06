/*
  # Update Team Invites Role Constraint

  ## Summary
  Update the role check constraint on team_invites table to support all new sales roles.

  ## Changes
  1. Drop the old role check constraint
  2. Add new constraint with all supported roles including:
     - owner, admin, head_of_sales, sales_manager
     - account_manager_field, commercial_inside, field_marketeer
     - employee, viewer
  
  ## Notes
  - Allows inviting users to any role (permissions still control who can invite)
  - Aligns with the updated role system
*/

-- Drop the old constraint
ALTER TABLE team_invites 
  DROP CONSTRAINT IF EXISTS team_invites_role_check;

-- Add new constraint with all roles
ALTER TABLE team_invites 
  ADD CONSTRAINT team_invites_role_check 
  CHECK (role IN (
    'owner',
    'admin',
    'head_of_sales',
    'sales_manager',
    'account_manager_field',
    'commercial_inside',
    'field_marketeer',
    'employee',
    'viewer'
  ));
