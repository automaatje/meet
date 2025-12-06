/*
  # Fix team_invites foreign key constraint

  1. Changes
    - Add missing foreign key constraint from team_invites.invited_by to user_profiles.user_id
    - This enables the Supabase query to join team_invites with user_profiles
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add the missing foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_invites_invited_by_fkey'
  ) THEN
    ALTER TABLE team_invites 
    ADD CONSTRAINT team_invites_invited_by_fkey 
    FOREIGN KEY (invited_by) 
    REFERENCES user_profiles(user_id) 
    ON DELETE CASCADE;
  END IF;
END $$;
