/*
  # Crear tabla de historial laboral (employee_work_history)

  ## Descripción
  Crea la tabla `employee_work_history` para almacenar la experiencia laboral
  previa de los empleados en otras empresas (antes de unirse a AMMI Group).

  ## Nuevas Tablas
  - `employee_work_history`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, FK a employees) - ON DELETE CASCADE
    - `company_name` (text) - Nombre de la empresa anterior
    - `position` (text) - Cargo que ocupó
    - `start_date` (date) - Fecha de inicio
    - `end_date` (date) - Fecha de finalización
    - `reason_leaving` (text) - Motivo de salida
    - `reference_name` (text) - Nombre de referencia
    - `reference_phone` (text) - Teléfono de referencia
    - `created_at` (timestamptz)

  ## Propósito
  - Documentar experiencia laboral previa del empleado
  - Útil para evaluaciones y desarrollo profesional
  - Permite verificar referencias laborales
  - Historial completo de carrera del empleado

  ## Notas Importantes
  - Esta tabla NO afecta la tabla `employees` existente
  - Es completamente independiente
  - ON DELETE CASCADE: si se elimina empleado, se elimina su historial
  - Un empleado puede tener múltiples trabajos previos
*/

-- Crear tabla de historial laboral
CREATE TABLE IF NOT EXISTS employee_work_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL,
  position        TEXT NOT NULL,
  start_date      DATE,
  end_date        DATE,
  reason_leaving  TEXT,
  reference_name  TEXT,
  reference_phone TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE employee_work_history IS 'Experiencia laboral previa del empleado en otras empresas. Permite documentar historial completo de carrera.';

-- Crear índice para búsquedas por empleado
CREATE INDEX IF NOT EXISTS idx_employee_work_history_employee ON employee_work_history(employee_id);