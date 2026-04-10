/*
  # Control de acceso jerárquico para Gerentes (managers)

  ## Objetivo
  Permitir que los usuarios con rol "manager" (Gerente) solo puedan ver los empleados
  que estén directamente bajo su cargo, es decir, empleados cuyo campo `manager_id`
  apunte al empleado vinculado al usuario gerente.

  ## Cambios

  ### Políticas RLS en `employees`
  - Se elimina la política de SELECT genérica que permitía a managers ver todos los empleados
  - Se crea una nueva política que diferencia:
    - superadmin/admin/rrhh: ven todos los empleados de su empresa
    - manager: solo ve empleados donde `manager_id` = su `employee_id` vinculado en `system_users`
    - employee/viewer: solo se ve a sí mismo

  ## Notas importantes
  - El sistema usa el campo `employee_id` de `system_users` para vincular un usuario del sistema
    con su registro de empleado en la tabla `employees`
  - La jerarquía se basa en el campo `manager_id` de la tabla `employees`
  - Esta migración NO destruye datos, solo ajusta políticas de acceso
*/

-- Eliminar políticas SELECT existentes en employees para reconstruirlas
DROP POLICY IF EXISTS "Employees are viewable by authenticated users in same company" ON employees;
DROP POLICY IF EXISTS "Admin HR and managers can view employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can view employees" ON employees;
DROP POLICY IF EXISTS "Users can view employees in their company" ON employees;
DROP POLICY IF EXISTS "Superadmin can view all employees" ON employees;
DROP POLICY IF EXISTS "Admin and HR can view company employees" ON employees;
DROP POLICY IF EXISTS "Managers can view their subordinates" ON employees;
DROP POLICY IF EXISTS "Employees can view themselves" ON employees;

-- Política 1: Superadmin ve todos los empleados
CREATE POLICY "Superadmin can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role = 'superadmin'
      AND su.is_active = true
    )
  );

-- Política 2: Admin y RRHH ven todos los empleados de su empresa
CREATE POLICY "Admin and HR can view company employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role IN ('admin', 'rrhh')
      AND su.is_active = true
      AND su.company_id = employees.company_id
    )
  );

-- Política 3: Managers solo ven empleados que reportan directamente a ellos
-- (employees.manager_id = employee vinculado al usuario manager)
CREATE POLICY "Managers can view their direct subordinates"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role = 'manager'
      AND su.is_active = true
      AND su.employee_id = employees.manager_id
    )
  );

-- Política 4: Cualquier empleado puede verse a sí mismo
CREATE POLICY "Employees can view themselves"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.is_active = true
      AND su.employee_id = employees.id
    )
  );
