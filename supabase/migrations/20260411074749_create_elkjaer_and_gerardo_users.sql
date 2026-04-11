
/*
  # Create users for Elkjaer David Flores Flores and Gerardo José Mendoza Rodriguez

  1. New Auth Users
    - elkjaer.flores@plihsa.com — role: jefe, company: PLIHSA
    - gerardo.mendoza@plihsa.com — role: jefe, company: PLIHSA

  2. New System Users
    - Both linked to their respective employee records
    - Both active, role = jefe

  Notes:
    - Passwords set to Temporal2026 (users should change on first login)
    - Uses pgcrypto for password hashing compatible with Supabase Auth
*/

DO $$
DECLARE
  v_elkjaer_auth_id uuid;
  v_gerardo_auth_id uuid;
  v_plihsa_company_id uuid;
  v_elkjaer_employee_id uuid;
  v_gerardo_employee_id uuid;
BEGIN
  SELECT id INTO v_plihsa_company_id FROM companies WHERE code = 'PLIHSA';
  SELECT id INTO v_elkjaer_employee_id FROM employees WHERE employee_code = '01000168';
  SELECT id INTO v_gerardo_employee_id FROM employees WHERE employee_code = '01000184';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'elkjaer.flores@plihsa.com') THEN
    v_elkjaer_auth_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_elkjaer_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'elkjaer.flores@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated'
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_elkjaer_auth_id,
      'elkjaer.flores@plihsa.com',
      jsonb_build_object('sub', v_elkjaer_auth_id::text, 'email', 'elkjaer.flores@plihsa.com'),
      'email',
      now(),
      now(),
      now()
    );

    INSERT INTO system_users (user_id, email, employee_id, company_id, role, is_active, created_at, updated_at)
    VALUES (v_elkjaer_auth_id, 'elkjaer.flores@plihsa.com', v_elkjaer_employee_id, v_plihsa_company_id, 'jefe', true, now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gerardo.mendoza@plihsa.com') THEN
    v_gerardo_auth_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_gerardo_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'gerardo.mendoza@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated'
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_gerardo_auth_id,
      'gerardo.mendoza@plihsa.com',
      jsonb_build_object('sub', v_gerardo_auth_id::text, 'email', 'gerardo.mendoza@plihsa.com'),
      'email',
      now(),
      now(),
      now()
    );

    INSERT INTO system_users (user_id, email, employee_id, company_id, role, is_active, created_at, updated_at)
    VALUES (v_gerardo_auth_id, 'gerardo.mendoza@plihsa.com', v_gerardo_employee_id, v_plihsa_company_id, 'jefe', true, now(), now());
  END IF;
END $$;
