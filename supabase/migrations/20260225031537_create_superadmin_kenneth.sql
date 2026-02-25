/*
  # Crear Usuario Superadministrador Kenneth

  1. Descripción
    - Crea el usuario superadmin kenneth@plihsa.com
    - Contraseña: Temporal2026
    - Este usuario tiene el máximo nivel de permisos en el sistema
    
  2. Superadmin
    - kenneth@plihsa.com (Super Administrador)
    - Puede gestionar todo en el sistema incluyendo otros superadmins
  
  3. Notas
    - Este usuario está vinculado a la empresa PLIHSA
    - Activo por defecto
    - Debe cambiar la contraseña en el primer acceso
*/

DO $$
DECLARE
  v_company_id uuid := 'ef0cbe1b-06be-4587-a9a3-6233c14795f5'; -- PLIHSA
  v_user_id uuid;
BEGIN
  -- Usuario Superadmin: Kenneth
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'kenneth@plihsa.com';
  
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
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
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'kenneth@plihsa.com',
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
    VALUES (v_user_id, v_company_id, 'superadmin', true);
    
    RAISE NOTICE 'Usuario superadmin kenneth@plihsa.com creado exitosamente';
  ELSE
    -- Si ya existe, actualizar a superadmin
    UPDATE system_users 
    SET role = 'superadmin'
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Usuario kenneth@plihsa.com actualizado a superadmin';
  END IF;

END $$;
