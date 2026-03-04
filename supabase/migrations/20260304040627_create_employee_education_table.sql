/*
  # Crear tabla de educación de empleados (employee_education)

  ## Descripción
  Crea la tabla `employee_education` para normalizar el historial educativo
  de los empleados. En lugar de tener campos education_level, university, degree
  en la tabla employees, ahora cada empleado puede tener múltiples registros
  educativos con toda la información detallada.

  ## Nuevas Tablas
  - `employee_education`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, FK a employees) - ON DELETE CASCADE
    - `education_level_id` (smallint, FK a education_levels)
    - `institution` (text) - Universidad/Instituto
    - `degree` (text) - Título obtenido
    - `field_of_study` (text) - Carrera/Especialidad
    - `start_date` (date) - Fecha inicio
    - `end_date` (date) - Fecha finalización
    - `is_completed` (boolean) - Si completó el nivel
    - `notes` (text) - Notas adicionales
    - `created_at` (timestamptz)

  ## Normalización 3FN
  Esta tabla extrae de `employees`:
  - education_level → education_level_id (referencia a catálogo)
  - university → institution
  - degree → degree
  
  ## Ventajas
  - Un empleado puede tener múltiples estudios (ej: Técnico + Universitario)
  - Información más detallada (fechas, carrera, si completó)
  - Datos normalizados y consistentes

  ## Notas Importantes
  - Esta tabla NO afecta la tabla `employees` existente
  - NO elimina campos de employees todavía
  - Es completamente independiente por ahora
  - ON DELETE CASCADE: si se elimina empleado, se eliminan sus registros educativos
*/

-- Crear tabla de educación de empleados
CREATE TABLE IF NOT EXISTS employee_education (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  education_level_id   SMALLINT NOT NULL REFERENCES education_levels(id),
  institution          TEXT NOT NULL,
  degree               TEXT,
  field_of_study       TEXT,
  start_date           DATE,
  end_date             DATE,
  is_completed         BOOLEAN NOT NULL DEFAULT false,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE employee_education IS 'Historial educativo del empleado. Normalizado desde employees para cumplir 3FN. Un empleado puede tener múltiples registros educativos.';

-- Crear índice para búsquedas por empleado
CREATE INDEX IF NOT EXISTS idx_employee_education_employee ON employee_education(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_education_level ON employee_education(education_level_id);