
/*
  # Crear usuarios Roberto Moya y Alvaro Rivera con rol manager

  1. Nuevos usuarios en auth.users
    - Roberto Moya: rmoya@ammi.com
    - Alvaro Rivera: alvaro.rivera@plihsa.com

  2. Nuevos registros en system_users
    - Ambos con rol 'manager' y empresa PLIHSA
    - is_active = true
*/

DO $$
DECLARE
  v_roberto_auth_id uuid := gen_random_uuid();
  v_alvaro_auth_id  uuid := gen_random_uuid();
  v_plihsa_id uuid := 'ef0cbe1b-06be-4587-a9a3-6233c14795f5';
BEGIN

  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    aud, role, created_at, updated_at
  ) VALUES
  (
    v_roberto_auth_id,
    'rmoya@ammi.com',
    crypt('Plihsa2024!', gen_salt('bf')),
    now(),
    '{"full_name": "Roberto Moya"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    v_alvaro_auth_id,
    'alvaro.rivera@plihsa.com',
    crypt('Plihsa2024!', gen_salt('bf')),
    now(),
    '{"full_name": "Alvaro Rivera"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  );

  INSERT INTO system_users (user_id, company_id, role, is_active, email, first_name, last_name)
  VALUES
  (
    v_roberto_auth_id,
    v_plihsa_id,
    'manager',
    true,
    'rmoya@ammi.com',
    'Roberto',
    'Moya'
  ),
  (
    v_alvaro_auth_id,
    v_plihsa_id,
    'manager',
    true,
    'alvaro.rivera@plihsa.com',
    'Alvaro',
    'Rivera'
  );

END $$;
