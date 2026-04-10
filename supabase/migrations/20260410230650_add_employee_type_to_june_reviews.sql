/*
  # Agregar employee_type a june_reviews

  ## Cambios
  - Agrega columna `employee_type` a `june_reviews` para distinguir entre
    revisiones de empleados administrativos y operativos.
  - Valor por defecto 'administrativo' para no romper registros existentes.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'june_reviews' AND column_name = 'employee_type'
  ) THEN
    ALTER TABLE june_reviews
      ADD COLUMN employee_type text NOT NULL DEFAULT 'administrativo'
        CHECK (employee_type = ANY (ARRAY['administrativo', 'operativo']));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_june_reviews_employee_type ON june_reviews(employee_type);
