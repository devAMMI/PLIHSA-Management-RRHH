/*
  # Arreglar recursión infinita en políticas de system_users

  1. Problema
    - La política "Admins can view all users" causa recursión infinita
    - La política hace SELECT en system_users dentro de su propia verificación
  
  2. Solución
    - Crear función helper que usa SECURITY DEFINER
    - Reemplazar política con función que evita recursión
  
  3. Seguridad
    - Mantener restricciones de acceso
    - Usar auth.uid() directamente sin subqueries recursivas
*/

-- Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Admins can view all users" ON system_users;
DROP POLICY IF EXISTS "Users can view own profile" ON system_users;

-- Crear función helper para verificar si el usuario es admin
-- SECURITY DEFINER permite que la función se ejecute con privilegios del creador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM system_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
END;
$$;

-- Crear función helper para verificar roles de RRHH
CREATE OR REPLACE FUNCTION public.is_hr()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM system_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'rrhh')
    AND is_active = true
  );
END;
$$;

-- Crear función helper para verificar roles de manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM system_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'rrhh', 'manager')
    AND is_active = true
  );
END;
$$;

-- Recrear políticas de system_users sin recursión
CREATE POLICY "Users can view own profile"
  ON system_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all system users"
  ON system_users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert system users"
  ON system_users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update system users"
  ON system_users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Ahora actualizar las políticas de employees para usar las funciones helper
DROP POLICY IF EXISTS "Admin and HR can insert employees" ON employees;
DROP POLICY IF EXISTS "Admin, HR and managers can update employees" ON employees;
DROP POLICY IF EXISTS "Admin and HR can delete employees" ON employees;

CREATE POLICY "HR can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (is_hr());

CREATE POLICY "Managers can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (is_manager())
  WITH CHECK (is_manager());

CREATE POLICY "HR can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (is_hr());

-- Actualizar políticas de employee_family_members
DROP POLICY IF EXISTS "Admin and HR can insert family members" ON employee_family_members;
DROP POLICY IF EXISTS "Admin, HR and managers can update family members" ON employee_family_members;
DROP POLICY IF EXISTS "Admin and HR can delete family members" ON employee_family_members;

CREATE POLICY "HR can insert family members"
  ON employee_family_members FOR INSERT
  TO authenticated
  WITH CHECK (is_hr());

CREATE POLICY "Managers can update family members"
  ON employee_family_members FOR UPDATE
  TO authenticated
  USING (is_manager())
  WITH CHECK (is_manager());

CREATE POLICY "HR can delete family members"
  ON employee_family_members FOR DELETE
  TO authenticated
  USING (is_hr());
