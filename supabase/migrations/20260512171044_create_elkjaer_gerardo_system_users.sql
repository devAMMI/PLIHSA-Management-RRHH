
/*
  # Crear system_users para Elkjaer Flores y Gerardo Mendoza

  1. Descripcion
    - Ambos usuarios ya existen en auth.users pero no tienen registro en system_users
    - Se crean con rol 'jefe', empresa PLIHSA, vinculados a su empleado respectivo

  2. Usuarios creados
    - elkjaer.flores@plihsa.com -> empleado Elkjaer David Flores Flores
    - gerardo.mendoza@plihsa.com -> empleado Gerardo Jose Mendoza Rodriguez

  3. Seguridad
    - Sin cambios en RLS (tabla ya tiene politicas activas)
*/

INSERT INTO system_users (user_id, email, role, company_id, employee_id, is_active, created_at, updated_at)
VALUES (
  '547cbba7-4c1a-41f4-b082-055f5fe5026a',
  'elkjaer.flores@plihsa.com',
  'jefe',
  'ef0cbe1b-06be-4587-a9a3-6233c14795f5',
  'b5610910-3a34-40d4-8ff8-ccedb5cd8285',
  true,
  now(),
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'jefe',
  company_id = 'ef0cbe1b-06be-4587-a9a3-6233c14795f5',
  employee_id = 'b5610910-3a34-40d4-8ff8-ccedb5cd8285',
  is_active = true,
  updated_at = now();

INSERT INTO system_users (user_id, email, role, company_id, employee_id, is_active, created_at, updated_at)
VALUES (
  '662a5008-403f-4850-bc57-26c0c9e79635',
  'gerardo.mendoza@plihsa.com',
  'jefe',
  'ef0cbe1b-06be-4587-a9a3-6233c14795f5',
  'bdec3cf7-2ee4-4b96-81d7-ba7570a734e6',
  true,
  now(),
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'jefe',
  company_id = 'ef0cbe1b-06be-4587-a9a3-6233c14795f5',
  employee_id = 'bdec3cf7-2ee4-4b96-81d7-ba7570a734e6',
  is_active = true,
  updated_at = now();
