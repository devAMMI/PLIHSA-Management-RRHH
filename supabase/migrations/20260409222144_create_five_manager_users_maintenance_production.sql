/*
  # Create 5 manager users for Maintenance and Production departments

  ## Summary
  Creates system users for 5 department heads who report to Alvaro Rivera (Plant Manager).
  All users are assigned the "manager" role with password "Temporal2026".

  ## New Users
  1. Lucia Chavez - Coordinadora de Calidad (lucia.chavez@plihsa.com)
  2. Mario Guevara - Jefe de Control de Calidad (mario.guevara@plihsa.com)
  3. Juan Alvarenga - Jefe de Producción (juan.alvarenga@plihsa.com)
  4. Gerardo Mendoza - Jefe de Mantenimiento (gerardo.mendoza@plihsa.com)
  5. Elkjaer Flores - Jefe de Producción Inyección (elkjaer.flores@plihsa.com)

  ## Role
  All users: manager (they have subordinates but report to Alvaro Rivera)

  ## Security
  Passwords are set as temporary and should be changed on first login.
*/

DO $$
DECLARE
  v_lucia_id      uuid;
  v_mario_id      uuid;
  v_juan_id       uuid;
  v_gerardo_id    uuid;
  v_elkjaer_id    uuid;
  v_plihsa_id     uuid := 'ef0cbe1b-06be-4587-a9a3-6233c14795f5';
BEGIN

  -- Lucia Chavez
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lucia.chavez@plihsa.com') THEN
    v_lucia_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_lucia_id,
      '00000000-0000-0000-0000-000000000000',
      'lucia.chavez@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false, 'authenticated', 'authenticated'
    );
    INSERT INTO system_users (user_id, email, employee_id, company_id, role, is_active)
    VALUES (v_lucia_id, 'lucia.chavez@plihsa.com', 'f72109e2-51de-472f-898d-ab9780e3e553', v_plihsa_id, 'manager', true);
  END IF;

  -- Mario Guevara
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mario.guevara@plihsa.com') THEN
    v_mario_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_mario_id,
      '00000000-0000-0000-0000-000000000000',
      'mario.guevara@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false, 'authenticated', 'authenticated'
    );
    INSERT INTO system_users (user_id, email, employee_id, company_id, role, is_active)
    VALUES (v_mario_id, 'mario.guevara@plihsa.com', 'a139c969-6e6e-46fd-b11e-10778d3532b4', v_plihsa_id, 'manager', true);
  END IF;

  -- Juan Alvarenga
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'juan.alvarenga@plihsa.com') THEN
    v_juan_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_juan_id,
      '00000000-0000-0000-0000-000000000000',
      'juan.alvarenga@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false, 'authenticated', 'authenticated'
    );
    INSERT INTO system_users (user_id, email, employee_id, company_id, role, is_active)
    VALUES (v_juan_id, 'juan.alvarenga@plihsa.com', 'c2d341d9-bebf-4c04-90bd-937031fad146', v_plihsa_id, 'manager', true);
  END IF;

  -- Gerardo Mendoza
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gerardo.mendoza@plihsa.com') THEN
    v_gerardo_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_gerardo_id,
      '00000000-0000-0000-0000-000000000000',
      'gerardo.mendoza@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false, 'authenticated', 'authenticated'
    );
    INSERT INTO system_users (user_id, email, employee_id, company_id, role, is_active)
    VALUES (v_gerardo_id, 'gerardo.mendoza@plihsa.com', 'bdec3cf7-2ee4-4b96-81d7-ba7570a734e6', v_plihsa_id, 'manager', true);
  END IF;

  -- Elkjaer Flores
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'elkjaer.flores@plihsa.com') THEN
    v_elkjaer_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    ) VALUES (
      v_elkjaer_id,
      '00000000-0000-0000-0000-000000000000',
      'elkjaer.flores@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false, 'authenticated', 'authenticated'
    );
    INSERT INTO system_users (user_id, email, employee_id, company_id, role, is_active)
    VALUES (v_elkjaer_id, 'elkjaer.flores@plihsa.com', 'b5610910-3a34-40d4-8ff8-ccedb5cd8285', v_plihsa_id, 'manager', true);
  END IF;

END $$;
