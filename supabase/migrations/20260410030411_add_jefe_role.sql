/*
  # Add "jefe" role to system

  ## Summary
  Adds a new role called "jefe" (Chief/Head) with identical permissions to the "manager" role.
  This allows differentiating between Gerentes (managers) and Jefes (department heads/chiefs)
  in the organizational hierarchy, while keeping the same access level.

  ## Changes
  1. Adds 'jefe' to the role check constraint on system_users table
  2. Copies all manager permissions to jefe role in role_permissions table
  3. Assigns the jefe role to: Lucia Chavez, Mario Guevara, Gerardo Mendoza
  4. Keeps Alvaro Rivera and Roberto Moya as 'manager' (Gerente)
*/

-- 1. Update the role check constraint to include 'jefe'
ALTER TABLE system_users DROP CONSTRAINT IF EXISTS system_users_role_check;
ALTER TABLE system_users ADD CONSTRAINT system_users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'rrhh', 'manager', 'jefe', 'employee', 'viewer'));

-- 2. Copy all manager permissions to jefe role
INSERT INTO role_permissions (role, permission)
SELECT 'jefe', permission
FROM role_permissions
WHERE role = 'manager'
ON CONFLICT DO NOTHING;

-- 3. Assign jefe role to Lucia, Mario Guevara, Gerardo Mendoza
UPDATE system_users 
SET role = 'jefe'
WHERE email IN (
  'lucia.chavez@plihsa.com',
  'mario.guevara@plihsa.com',
  'gerardo.mendoza@plihsa.com'
);
