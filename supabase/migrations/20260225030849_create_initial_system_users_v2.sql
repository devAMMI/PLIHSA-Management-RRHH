/*
  # Crear Usuarios Iniciales del Sistema v2

  1. Descripción
    - Crea 3 usuarios administrativos para acceder al sistema
    - Usuarios: Karla Sagastume, Andrea Fuentes, Practicante
    - Todos con contraseña temporal: Temporal2026
    
  2. Usuarios a Crear
    - karla.sagastume@plihsa.com (Administrador)
    - Andrea.fuentes@plihsa.com (Administrador)
    - practicante@plihsa.com (Empleado)
  
  3. Notas
    - Los usuarios están vinculados a la empresa PLIHSA
    - Todos los usuarios están activos
    - Las contraseñas deben ser cambiadas en el primer acceso
    - Roles válidos: admin, rrhh, manager, employee, viewer
*/

DO $$
DECLARE
  v_company_id uuid := 'ef0cbe1b-06be-4587-a9a3-6233c14795f5'; -- PLIHSA
  v_user_id_1 uuid;
  v_user_id_2 uuid;
  v_user_id_3 uuid;
BEGIN
  -- Usuario 1: Karla Sagastume
  SELECT id INTO v_user_id_1 FROM auth.users WHERE email = 'karla.sagastume@plihsa.com';
  
  IF v_user_id_1 IS NULL THEN
    v_user_id_1 := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      v_user_id_1,
      '00000000-0000-0000-0000-000000000000',
      'karla.sagastume@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );
    
    INSERT INTO system_users (user_id, company_id, role, is_active)
    VALUES (v_user_id_1, v_company_id, 'admin', true);
    
    RAISE NOTICE 'Usuario karla.sagastume@plihsa.com creado exitosamente';
  ELSE
    RAISE NOTICE 'Usuario karla.sagastume@plihsa.com ya existe';
  END IF;

  -- Usuario 2: Andrea Fuentes
  SELECT id INTO v_user_id_2 FROM auth.users WHERE email = 'Andrea.fuentes@plihsa.com';
  
  IF v_user_id_2 IS NULL THEN
    v_user_id_2 := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      v_user_id_2,
      '00000000-0000-0000-0000-000000000000',
      'Andrea.fuentes@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );
    
    INSERT INTO system_users (user_id, company_id, role, is_active)
    VALUES (v_user_id_2, v_company_id, 'admin', true);
    
    RAISE NOTICE 'Usuario Andrea.fuentes@plihsa.com creado exitosamente';
  ELSE
    RAISE NOTICE 'Usuario Andrea.fuentes@plihsa.com ya existe';
  END IF;

  -- Usuario 3: Practicante
  SELECT id INTO v_user_id_3 FROM auth.users WHERE email = 'practicante@plihsa.com';
  
  IF v_user_id_3 IS NULL THEN
    v_user_id_3 := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      v_user_id_3,
      '00000000-0000-0000-0000-000000000000',
      'practicante@plihsa.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );
    
    INSERT INTO system_users (user_id, company_id, role, is_active)
    VALUES (v_user_id_3, v_company_id, 'employee', true);
    
    RAISE NOTICE 'Usuario practicante@plihsa.com creado exitosamente';
  ELSE
    RAISE NOTICE 'Usuario practicante@plihsa.com ya existe';
  END IF;

END $$;
