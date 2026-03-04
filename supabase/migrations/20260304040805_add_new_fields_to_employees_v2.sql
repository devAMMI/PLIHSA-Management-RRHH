/*
  # Agregar campos nuevos a employees (compatibilidad híbrida) - v2

  ## Descripción
  Agrega campos nuevos a la tabla `employees` sin eliminar los existentes.
  Esto permite migración gradual manteniendo compatibilidad con código actual.

  ## Campos Nuevos Agregados
  
  ### 1. Ubicación de trabajo moderna
  - `work_location_id` (uuid, FK a work_locations) - Ubicación física moderna
  
  ### 2. Identificación Hondureña - Dos Formatos
  - `national_id_hn` (text, unique) - DNI nuevo: "0801197302222" (13 dígitos)
  - `national_id_legacy` (text, unique) - Tarjeta antigua: "02219550025" (11 dígitos)
  - `passport_id` (text) - Pasaporte extranjero
  
  ### 3. Catálogos normalizados
  - `gender_id` (smallint, FK a genders) - Género normalizado
  - `status_id` (smallint, FK a employee_statuses) - Estado normalizado
  
  ### 4. Estructura organizacional
  - `sub_department_id` (uuid, FK a sub_departments) - Sub-departamento

  ## Notas Importantes
  - NINGÚN campo existente es eliminado o modificado
  - TODOS los campos nuevos son opcionales (nullable)
  - Usa IF NOT EXISTS para evitar conflictos
*/

-- 1. Agregar work_location_id (nueva ubicación física)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'work_location_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN work_location_id UUID REFERENCES work_locations(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_employees_work_location_new ON employees(work_location_id);

-- 2. Agregar national_id_hn (DNI nuevo formato)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'national_id_hn'
  ) THEN
    ALTER TABLE employees ADD COLUMN national_id_hn TEXT UNIQUE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_employees_national_id_hn_new ON employees(national_id_hn) WHERE national_id_hn IS NOT NULL;

-- 3. Agregar national_id_legacy (tarjeta identidad antigua)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'national_id_legacy'
  ) THEN
    ALTER TABLE employees ADD COLUMN national_id_legacy TEXT UNIQUE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_employees_national_id_legacy_new ON employees(national_id_legacy) WHERE national_id_legacy IS NOT NULL;

-- 4. Agregar passport_id (pasaporte extranjero)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'passport_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN passport_id TEXT;
  END IF;
END $$;

-- 5. Agregar gender_id (género normalizado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'gender_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN gender_id SMALLINT REFERENCES genders(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_employees_gender_new ON employees(gender_id);

-- 6. Agregar status_id (estado normalizado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'status_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN status_id SMALLINT REFERENCES employee_statuses(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_employees_status_new ON employees(status_id);

-- 7. Agregar sub_department_id (sub-departamento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'sub_department_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN sub_department_id UUID REFERENCES sub_departments(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_employees_sub_department_new ON employees(sub_department_id);

COMMENT ON COLUMN employees.work_location_id IS 'Ubicación física moderna (work_locations). Durante migración coexiste con plant_id. Incluye plantas Y oficinas administrativas.';
COMMENT ON COLUMN employees.national_id_hn IS 'DNI hondureño nuevo (13 dígitos sin espacios). Ej: "0801197302222". Display: "0801 1973 02222".';
COMMENT ON COLUMN employees.national_id_legacy IS 'Tarjeta identidad hondureña antigua (11 dígitos sin guiones). Ej: "02219550025". Display: "022-1955-00255".';
COMMENT ON COLUMN employees.passport_id IS 'Pasaporte u otro documento de identificación extranjero.';
COMMENT ON COLUMN employees.gender_id IS 'Género normalizado (referencia a catálogo genders). Durante migración coexiste con campo gender.';
COMMENT ON COLUMN employees.status_id IS 'Estado normalizado (referencia a catálogo employee_statuses). Durante migración coexiste con campo status.';
COMMENT ON COLUMN employees.sub_department_id IS 'Sub-departamento dentro del departamento.';