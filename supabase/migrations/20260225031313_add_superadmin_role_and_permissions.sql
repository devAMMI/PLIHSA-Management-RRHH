/*
  # Agregar Rol Superadmin y Sistema de Permisos

  1. Cambios en la Base de Datos
    - Agregar rol 'superadmin' a system_users
    - Crear tabla de permisos por rol
    - Crear función para verificar permisos
    
  2. Roles del Sistema
    - superadmin: Acceso total al sistema, puede crear/editar/eliminar usuarios y configuraciones
    - admin: Administrador de empresa, acceso completo a su empresa
    - rrhh: Recursos humanos, gestión de empleados
    - manager: Gerente, acceso de lectura/escritura limitado
    - employee: Empleado, acceso de solo lectura
    - viewer: Visitante, acceso muy limitado
  
  3. Seguridad
    - Solo superadmin puede crear otros superadmin
    - Solo superadmin y admin pueden gestionar usuarios
    - RLS aplicado correctamente
*/

-- Modificar constraint de roles para incluir superadmin
ALTER TABLE system_users DROP CONSTRAINT IF EXISTS system_users_role_check;
ALTER TABLE system_users ADD CONSTRAINT system_users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'rrhh', 'manager', 'employee', 'viewer'));

-- Crear tabla de permisos
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Insertar permisos por rol
INSERT INTO role_permissions (role, permission) VALUES
  -- Superadmin tiene todos los permisos
  ('superadmin', 'users.create'),
  ('superadmin', 'users.read'),
  ('superadmin', 'users.update'),
  ('superadmin', 'users.delete'),
  ('superadmin', 'users.change_role'),
  ('superadmin', 'users.reset_password'),
  ('superadmin', 'employees.create'),
  ('superadmin', 'employees.read'),
  ('superadmin', 'employees.update'),
  ('superadmin', 'employees.delete'),
  ('superadmin', 'companies.create'),
  ('superadmin', 'companies.read'),
  ('superadmin', 'companies.update'),
  ('superadmin', 'companies.delete'),
  ('superadmin', 'departments.manage'),
  ('superadmin', 'system.configure'),
  
  -- Admin
  ('admin', 'users.create'),
  ('admin', 'users.read'),
  ('admin', 'users.update'),
  ('admin', 'users.delete'),
  ('admin', 'users.reset_password'),
  ('admin', 'employees.create'),
  ('admin', 'employees.read'),
  ('admin', 'employees.update'),
  ('admin', 'employees.delete'),
  ('admin', 'departments.manage'),
  
  -- RRHH
  ('rrhh', 'users.read'),
  ('rrhh', 'employees.create'),
  ('rrhh', 'employees.read'),
  ('rrhh', 'employees.update'),
  ('rrhh', 'employees.delete'),
  ('rrhh', 'departments.read'),
  
  -- Manager
  ('manager', 'users.read'),
  ('manager', 'employees.read'),
  ('manager', 'employees.update'),
  ('manager', 'departments.read'),
  
  -- Employee
  ('employee', 'employees.read'),
  ('employee', 'departments.read'),
  
  -- Viewer
  ('viewer', 'employees.read'),
  ('viewer', 'departments.read')
ON CONFLICT (role, permission) DO NOTHING;

-- Función para verificar permisos
CREATE OR REPLACE FUNCTION has_permission(user_role text, required_permission text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role = user_role AND permission = required_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM system_users
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE role_permissions IS 'Permisos asignados a cada rol del sistema';
COMMENT ON FUNCTION has_permission IS 'Verifica si un rol tiene un permiso específico';
COMMENT ON FUNCTION get_user_role IS 'Obtiene el rol del usuario autenticado actual';
