/*
  # Fix password hash cost factor for Gerardo Mendoza and Elkjaer Flores

  Problem: Both users have bcrypt hashes with cost factor 6 ($2a$06$).
  Supabase Auth requires cost factor 10 ($2a$10$) to authenticate correctly.
  This causes "Database error loading user" when trying to sign in or update password via Admin API.

  Solution: Re-hash passwords with cost factor 10 using gen_salt('bf', 10).
*/

UPDATE auth.users
SET 
  encrypted_password = crypt('Temporal2026', gen_salt('bf', 10)),
  updated_at = now()
WHERE email IN ('gerardo.mendoza@plihsa.com', 'elkjaer.flores@plihsa.com');
