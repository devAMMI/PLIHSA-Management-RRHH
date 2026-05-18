/*
  # Reset password for Gerardo Mendoza
  
  Updates the encrypted password for gerardo.mendoza@plihsa.com 
  to 'Temporal2026' using bcrypt hashing.
*/

UPDATE auth.users
SET 
  encrypted_password = crypt('Temporal2026', gen_salt('bf')),
  updated_at = now()
WHERE email = 'gerardo.mendoza@plihsa.com';
