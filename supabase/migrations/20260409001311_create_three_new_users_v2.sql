
/*
  # Create 3 new system users v2

  ## Users Created
  1. dev@ammi.com - Superadmin (company: AMMI)
  2. demo@ammi.com - Superadmin (company: AMMI)
  3. infraestructura@plihsa.com - Admin (company: PLIHSA)

  ## Notes
  - All passwords set to "Temporal2026"
  - Email confirmation set to now() so they can log in immediately
  - Uses IF NOT EXISTS pattern to avoid conflicts
*/

DO $$
DECLARE
  dev_uid uuid;
  demo_uid uuid;
  infra_uid uuid;
  ammi_company_id uuid := 'a193919b-a633-480d-bfaa-0b987c9349dd';
  plihsa_company_id uuid := 'ef0cbe1b-06be-4587-a9a3-6233c14795f5';
BEGIN

  -- dev@ammi.com
  SELECT id INTO dev_uid FROM auth.users WHERE email = 'dev@ammi.com';
  IF dev_uid IS NULL THEN
    dev_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      dev_uid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'dev@ammi.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
    VALUES (dev_uid, dev_uid, 'dev@ammi.com', 'email',
      jsonb_build_object('sub', dev_uid::text, 'email', 'dev@ammi.com'),
      now(), now(), now());
  END IF;

  -- demo@ammi.com
  SELECT id INTO demo_uid FROM auth.users WHERE email = 'demo@ammi.com';
  IF demo_uid IS NULL THEN
    demo_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      demo_uid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'demo@ammi.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
    VALUES (demo_uid, demo_uid, 'demo@ammi.com', 'email',
      jsonb_build_object('sub', demo_uid::text, 'email', 'demo@ammi.com'),
      now(), now(), now());
  END IF;

  -- infraestructura@plihsa.com
  SELECT id INTO infra_uid FROM auth.users WHERE email = 'infraestructura@plihsa.com';
  IF infra_uid IS NULL THEN
    infra_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      infra_uid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'infraestructura@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
    VALUES (infra_uid, infra_uid, 'infraestructura@plihsa.com', 'email',
      jsonb_build_object('sub', infra_uid::text, 'email', 'infraestructura@plihsa.com'),
      now(), now(), now());
  END IF;

  -- system_users
  INSERT INTO system_users (user_id, company_id, role, is_active, created_at, updated_at)
  VALUES (dev_uid, ammi_company_id, 'superadmin', true, now(), now())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO system_users (user_id, company_id, role, is_active, created_at, updated_at)
  VALUES (demo_uid, ammi_company_id, 'superadmin', true, now(), now())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO system_users (user_id, company_id, role, is_active, created_at, updated_at)
  VALUES (infra_uid, plihsa_company_id, 'admin', true, now(), now())
  ON CONFLICT (user_id) DO NOTHING;

END $$;
