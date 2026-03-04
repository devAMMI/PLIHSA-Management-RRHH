/*
  # Agregar Cálculo de Antigüedad Laboral

  1. Nueva Función
    - `calculate_work_seniority(hire_date)` - Calcula la antigüedad laboral en años, meses y días
    - Retorna un tipo compuesto con años, meses y días
    - Maneja casos donde hire_date es NULL

  2. Seguridad
    - Función IMMUTABLE para mejor rendimiento
    - Puede ser usada en queries y vistas

  3. Uso
    - Se puede usar directamente en queries: `SELECT calculate_work_seniority(hire_date) FROM employees`
    - Retorna formato: (años, meses, días)
*/

-- Crear tipo compuesto para la antigüedad
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seniority_type') THEN
    CREATE TYPE seniority_type AS (
      years integer,
      months integer,
      days integer
    );
  END IF;
END $$;

-- Función para calcular antigüedad laboral
CREATE OR REPLACE FUNCTION calculate_work_seniority(hire_date date)
RETURNS seniority_type
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result seniority_type;
  current_date_val date := CURRENT_DATE;
BEGIN
  -- Si hire_date es NULL, retornar 0,0,0
  IF hire_date IS NULL THEN
    result.years := 0;
    result.months := 0;
    result.days := 0;
    RETURN result;
  END IF;

  -- Si hire_date es en el futuro, retornar 0,0,0
  IF hire_date > current_date_val THEN
    result.years := 0;
    result.months := 0;
    result.days := 0;
    RETURN result;
  END IF;

  -- Calcular años completos
  result.years := EXTRACT(YEAR FROM AGE(current_date_val, hire_date))::integer;
  
  -- Calcular meses completos
  result.months := EXTRACT(MONTH FROM AGE(current_date_val, hire_date))::integer;
  
  -- Calcular días
  result.days := EXTRACT(DAY FROM AGE(current_date_val, hire_date))::integer;

  RETURN result;
END;
$$;

-- Comentario explicativo
COMMENT ON FUNCTION calculate_work_seniority(date) IS 
'Calcula la antigüedad laboral de un empleado desde su fecha de contratación hasta hoy. Retorna años, meses y días.';
