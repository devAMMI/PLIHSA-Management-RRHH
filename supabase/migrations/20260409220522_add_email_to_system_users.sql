/*
  # Add email column to system_users table

  ## Summary
  The manage-users edge function was failing because it called auth.admin.listUsers
  which is unreliable. Instead, we store the email directly on the system_users table
  so it can be retrieved with a simple SELECT.

  ## Changes
  - Add `email` column (text, nullable) to system_users table
  - Populate existing records from auth.users via a DO block
  - The create-admin-user edge function will be updated to write the email on insert

  ## Notes
  - Email is stored for display purposes only
  - Auth is still the source of truth for authentication
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'email'
  ) THEN
    ALTER TABLE system_users ADD COLUMN email text;
  END IF;
END $$;

UPDATE system_users su
SET email = au.email
FROM auth.users au
WHERE au.id = su.user_id
  AND su.email IS NULL;
