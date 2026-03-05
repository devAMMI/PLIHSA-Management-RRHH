/*
  # Agregar Constraints Únicos a Campos de Empleados
  
  **Fecha**: 5 de Marzo de 2026
  **Propósito**: Garantizar integridad de datos únicos por empleado
  
  ## Cambios Realizados
  
  1. **Campo `national_id`**
     - Agregar constraint UNIQUE
     - Permite NULL (empleados sin identidad registrada)
     - Pero si existe, debe ser único
  
  2. **Validaciones Implementadas**
     - Código de empleado (`employee_code`): Ya tiene UNIQUE ✓
     - Identidad (`national_id`): Nuevo UNIQUE constraint
     - Identidad Honduras (`national_id_hn`): Ya tiene UNIQUE ✓
     - Identidad Legacy (`national_id_legacy`): Ya tiene UNIQUE ✓
  
  ## Beneficios
  
  - Previene duplicación de identidades
  - Garantiza integridad referencial
  - Evita errores de captura
  - Facilita búsquedas y validaciones
  
  ## Notas de Seguridad
  
  - Se verificó que no existen duplicados antes de aplicar
  - El constraint permite NULL para empleados sin identidad
  - RLS policies siguen aplicando
*/

-- Agregar constraint UNIQUE a national_id
-- Permite NULL pero valores únicos cuando existen
ALTER TABLE employees
ADD CONSTRAINT employees_national_id_key 
UNIQUE (national_id);

-- Crear índice para mejorar rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_employees_national_id 
ON employees(national_id) 
WHERE national_id IS NOT NULL;

-- Crear índice para employee_code si no existe
CREATE INDEX IF NOT EXISTS idx_employees_employee_code 
ON employees(employee_code);

-- Verificar constraints aplicados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar constraint en national_id
  SELECT COUNT(*) INTO v_count
  FROM pg_constraint
  WHERE conrelid = 'employees'::regclass
  AND conname = 'employees_national_id_key';
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Constraint employees_national_id_key aplicado correctamente';
  ELSE
    RAISE EXCEPTION 'Error: Constraint employees_national_id_key no se aplicó';
  END IF;
END $$;
