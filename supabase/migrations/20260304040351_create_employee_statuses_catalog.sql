/*
  # Crear catálogo de estados de empleado

  ## Descripción
  Crea la tabla `employee_statuses` que define los estados disponibles
  para los empleados en el sistema.

  ## Nuevas Tablas
  - `employee_statuses`
    - `id` (smallint, primary key, auto-increment)
    - `code` (text, unique) - Código único del estado
    - `name` (text) - Nombre descriptivo

  ## Datos Iniciales
  Se insertan 4 estados:
  1. **active** - Activo
  2. **inactive** - Inactivo
  3. **suspended** - Suspendido
  4. **on_leave** - De permiso

  ## Notas Importantes
  - Esta tabla NO afecta ninguna tabla existente
  - Es completamente independiente
  - Se usará después para agregar campo `status_id` en employees
*/

-- Crear tabla de estados de empleado
CREATE TABLE IF NOT EXISTS employee_statuses (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

COMMENT ON TABLE employee_statuses IS 'Catálogo de estados posibles para empleados (activo, inactivo, suspendido, de permiso).';

-- Insertar datos iniciales
INSERT INTO employee_statuses (code, name) VALUES
  ('active',     'Activo'),
  ('inactive',   'Inactivo'),
  ('suspended',  'Suspendido'),
  ('on_leave',   'De permiso')
ON CONFLICT (code) DO NOTHING;