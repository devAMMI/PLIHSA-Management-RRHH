/*
# Crear usuario Faustino Duran - Gerente de RRHH MillFoods

## Descripcion
  Crea un nuevo usuario del sistema para Faustino Duran, Gerente de RRHH
  para MillFoods y PTM. Tendra acceso unicamente a:
  1. Empleados (modulo de gestion de empleados)
  2. Reporte de Empleados (exportacion de empleados)

## Detalles del usuario
  - Email: faustino.duran@millfoods.com
  - Nombre: Faustino Duran
  - Cargo: Gerente de RRHH
  - Empresa principal: MillFoods (f279f1b7-7142-4fba-abe7-89a81965d360)
  - Empresas accesibles: MillFoods + PTM (7ee95c9d-d7cf-4a5f-afe5-a6112b45bc41)
  - Rol: rrhh (necesario para ver empleados de su empresa)
  - Contrasena temporal: Temporal2026

## Permisos del menu lateral
  Se configuran permisos personalizados en user_sidebar_permissions:
  - employees: OTORGADO (modulo Empleados)
  - employee-report: OTORGADO (Reporte de Empleados)
  - Todos los demas modulos: BLOQUEADO

## Seguridad
  - Sin cambios en RLS (las politicas existentes permiten a rrhh ver
    empleados de su empresa)
  - El usuario se crea en auth.users con email confirmado
*/

DO $$
DECLARE
  faustino_uid uuid;
  millfoods_id uuid := 'f279f1b7-7142-4fba-abe7-89a81965d360';
  ptm_id uuid := '7ee95c9d-d7cf-4a5f-afe5-a6112b45bc41';
  sys_user_id uuid;
BEGIN

  -- Crear usuario en auth.users si no existe
  SELECT id INTO faustino_uid FROM auth.users WHERE email = 'faustino.duran@millfoods.com';
  IF faustino_uid IS NULL THEN
    faustino_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      faustino_uid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'faustino.duran@millfoods.com',
      crypt('Temporal2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
    VALUES (faustino_uid, faustino_uid, 'faustino.duran@millfoods.com', 'email',
      jsonb_build_object('sub', faustino_uid::text, 'email', 'faustino.duran@millfoods.com'),
      now(), now(), now());
  END IF;

  -- Crear system_users con rol rrhh, empresa MillFoods, acceso a PTM
  INSERT INTO system_users (user_id, email, role, company_id, accessible_company_ids, is_active, created_at, updated_at)
  VALUES (
    faustino_uid,
    'faustino.duran@millfoods.com',
    'rrhh',
    millfoods_id,
    ARRAY[ptm_id]::uuid[],
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = 'faustino.duran@millfoods.com',
    role = 'rrhh',
    company_id = millfoods_id,
    accessible_company_ids = ARRAY[ptm_id]::uuid[],
    is_active = true,
    updated_at = now();

  -- Obtener el id de system_users para configurar permisos
  SELECT id INTO sys_user_id FROM system_users WHERE user_id = faustino_uid;

  -- Limpiar permisos anteriores si existen
  DELETE FROM user_sidebar_permissions WHERE system_user_id = sys_user_id;

  -- Otorgar acceso SOLO a Empleados y Reporte de Empleados
  INSERT INTO user_sidebar_permissions (system_user_id, menu_item_id, granted, granted_by)
  VALUES
    (sys_user_id, 'employees', true, faustino_uid),
    (sys_user_id, 'employee-report', true, faustino_uid);

  -- Bloquear explicitamente todos los demas modulos
  INSERT INTO user_sidebar_permissions (system_user_id, menu_item_id, granted, granted_by)
  VALUES
    (sys_user_id, 'dashboard', false, faustino_uid),
    (sys_user_id, 'goal-definition-enero', false, faustino_uid),
    (sys_user_id, 'evaluacion-junio-v2', false, faustino_uid),
    (sys_user_id, 'evaluacion-final', false, faustino_uid),
    (sys_user_id, 'evaluation-admin-enero', false, faustino_uid),
    (sys_user_id, 'evaluation-operative-enero', false, faustino_uid),
    (sys_user_id, 'evaluations-list', false, faustino_uid),
    (sys_user_id, 'nueva-evaluacion-administrativa', false, faustino_uid),
    (sys_user_id, 'evaluacion-administrativa-nueva', false, faustino_uid),
    (sys_user_id, 'system-users', false, faustino_uid),
    (sys_user_id, 'reportes', false, faustino_uid),
    (sys_user_id, 'settings', false, faustino_uid),
    (sys_user_id, 'audit-log', false, faustino_uid),
    (sys_user_id, 'raw-evaluations', false, faustino_uid),
    (sys_user_id, 'sql-executor', false, faustino_uid);

END $$;
