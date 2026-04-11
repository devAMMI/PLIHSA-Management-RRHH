/*
  # Reset password for Mario Guevara

  Resets the password for mario.guevara@plihsa.com to Temporal2026
  using the correct bcrypt method compatible with Supabase Auth.
*/

UPDATE auth.users
SET 
  encrypted_password = crypt('Temporal2026', gen_salt('bf')),
  updated_at = now()
WHERE email = 'mario.guevara@plihsa.com';
