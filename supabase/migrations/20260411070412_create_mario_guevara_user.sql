
/*
  # Create system user for Mario Guevara

  1. Creates auth.users entry for Mario Guevara
  2. Creates system_users entry linked to existing employee
  
  Details:
  - Email: mario.guevara@plihsa.com
  - Role: jefe
  - Company: PLIHSA (ef0cbe1b-06be-4587-a9a3-6233c14795f5)
  - Employee ID: a139c969-6e6e-46fd-b11e-10778d3532b4 (Mario Johel Guevara Ortiz)
  - Password: Temporal2026
*/

DO $$
DECLARE
  new_user_id uuid;
  employee_uuid uuid := 'a139c969-6e6e-46fd-b11e-10778d3532b4';
  company_uuid uuid := 'ef0cbe1b-06be-4587-a9a3-6233c14795f5';
BEGIN
  new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'mario.guevara@plihsa.com',
    crypt('Temporal2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Mario Guevara"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  INSERT INTO system_users (
    user_id,
    email,
    role,
    is_active,
    company_id,
    employee_id
  ) VALUES (
    new_user_id,
    'mario.guevara@plihsa.com',
    'jefe',
    true,
    company_uuid,
    employee_uuid
  );

END $$;
