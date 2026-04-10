/*
  # Agregar campos de revision de Junio a evaluaciones administrativas

  ## Descripcion
  Agrega los campos necesarios para la Parte 2 (Revision de Junio) del formulario
  "Definicion de Factores y Revision del Desempeno Administrativo".

  La parte 2 incluye:
  - Fecha de revision
  - Comentarios del jefe inmediato en la revision
  - Comentarios del colaborador en la revision
  - Las calificaciones y resultados se almacenan en evaluation_goal_reviews y evaluation_competency_reviews (ya existen)

  ## Cambios en Tablas

  ### administrative_evaluations
  - `review_manager_comments` (text, nullable) - Comentarios del jefe en la revision
  - `review_employee_comments` (text, nullable) - Comentarios del colaborador en la revision
  - `review_date` ya existe en la tabla
  - `review_signed_document_url` (text, nullable) - URL del documento firmado de la revision
  - `review_signed_document_filename` (text, nullable) - Nombre del archivo de revision
  - `review_signed_document_mime_type` (text, nullable) - Tipo de archivo
  - `review_signed_document_uploaded_at` (timestamptz, nullable) - Fecha de subida
  - `review_signed_document_uploaded_by` (uuid, nullable) - Usuario que subio el documento
  - `review_status` (text, nullable) - Estado de la revision: draft, pending_signature, completed
  - `review_completed_at` (timestamptz, nullable) - Fecha de completado de la revision

  ## Notas
  - Todos los campos son nullable para mantener compatibilidad con evaluaciones existentes
  - Los campos de calificacion individuales ya estan en evaluation_goal_reviews y evaluation_competency_reviews
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_manager_comments'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_manager_comments text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_employee_comments'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_employee_comments text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_signed_document_url'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_signed_document_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_signed_document_filename'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_signed_document_filename text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_signed_document_mime_type'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_signed_document_mime_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_signed_document_uploaded_at'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_signed_document_uploaded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_signed_document_uploaded_by'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_signed_document_uploaded_by uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_status'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_status text DEFAULT 'not_started' CHECK (review_status IN ('not_started', 'draft', 'pending_signature', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'review_completed_at'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN review_completed_at timestamptz;
  END IF;
END $$;

ALTER POLICY "RRHH and managers can manage goal reviews"
  ON evaluation_goal_reviews
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager', 'jefe')
    )
  );

ALTER POLICY "RRHH and managers can manage competency reviews"
  ON evaluation_competency_reviews
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager', 'jefe')
    )
  );
