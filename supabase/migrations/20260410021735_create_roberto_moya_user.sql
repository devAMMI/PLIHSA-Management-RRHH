/*
  # Crear usuario para Roberto Moya (Gerente General)

  - Crea auth user para roberto.moya@plihsa.com
  - Asigna rol "manager" vinculado a su registro de empleado
  - Roberto Moya es Gerente General y jefe directo de Alvaro Rivera y otros
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'roberto.moya@plihsa.com',
    crypt('Plihsa2025!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false, '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'roberto.moya@plihsa.com',
    'email',
    jsonb_build_object('sub', v_user_id::text, 'email', 'roberto.moya@plihsa.com'),
    now(), now(), now()
  );

  INSERT INTO system_users (user_id, employee_id, company_id, role, is_active, email)
  VALUES (
    v_user_id,
    'ac49c55b-440d-43a2-8ce3-a47b8a29eb3d',
    'ef0cbe1b-06be-4587-a9a3-6233c14795f5',
    'manager',
    true,
    'roberto.moya@plihsa.com'
  );
END $$;
