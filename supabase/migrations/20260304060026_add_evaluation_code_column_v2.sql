/*
  # Agregar Código de Evaluación

  1. Cambios
    - Agregar columna `evaluation_code` a `administrative_evaluations`
    - Agregar columna `evaluation_code` a `operative_evaluations`
    - Generar códigos para evaluaciones existentes
  
  2. Formato del Código
    - ADM-{employee_code}-{fecha}
    - OPE-{employee_code}-{fecha}
    - Ejemplo: ADM-PLI018-20260304
*/

-- Agregar columna evaluation_code a administrative_evaluations
ALTER TABLE administrative_evaluations
ADD COLUMN IF NOT EXISTS evaluation_code TEXT;

-- Agregar columna evaluation_code a operative_evaluations
ALTER TABLE operative_evaluations
ADD COLUMN IF NOT EXISTS evaluation_code TEXT;

-- Generar códigos para evaluaciones administrativas existentes
UPDATE administrative_evaluations ae
SET evaluation_code = CONCAT(
  'ADM-',
  REPLACE(e.employee_code, '-', ''),
  '-',
  TO_CHAR(ae.created_at, 'YYYYMMDD')
)
FROM employees e
WHERE ae.employee_id = e.id
AND ae.evaluation_code IS NULL;

-- Generar códigos para evaluaciones operativas existentes
UPDATE operative_evaluations oe
SET evaluation_code = CONCAT(
  'OPE-',
  REPLACE(e.employee_code, '-', ''),
  '-',
  TO_CHAR(oe.created_at, 'YYYYMMDD')
)
FROM employees e
WHERE oe.employee_id = e.id
AND oe.evaluation_code IS NULL;

-- Crear índices para búsqueda rápida por código
CREATE INDEX IF NOT EXISTS idx_administrative_evaluations_code 
ON administrative_evaluations(evaluation_code);

CREATE INDEX IF NOT EXISTS idx_operative_evaluations_code 
ON operative_evaluations(evaluation_code);