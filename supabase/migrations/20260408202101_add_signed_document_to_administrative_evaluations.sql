/*
  # Agregar campos de documento firmado a evaluaciones administrativas

  1. Cambios en Tabla
    - `administrative_evaluations`
      - `signed_document_url` (text, nullable) - URL del documento firmado subido
      - `signed_document_filename` (text, nullable) - Nombre del archivo
      - `signed_document_mime_type` (text, nullable) - Tipo de archivo (PDF/PNG/JPG)
      - `signed_document_uploaded_at` (timestamptz, nullable) - Fecha de subida
      - `signed_document_uploaded_by` (uuid, nullable) - Usuario que subió el documento

  2. Notas
    - Al subir el documento firmado, el status pasa a 'completed'
    - Todos los campos son opcionales hasta completar el flujo
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'signed_document_url'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN signed_document_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'signed_document_filename'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN signed_document_filename text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'signed_document_mime_type'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN signed_document_mime_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'signed_document_uploaded_at'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN signed_document_uploaded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'signed_document_uploaded_by'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN signed_document_uploaded_by uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'administrative_evaluations' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE administrative_evaluations ADD COLUMN completed_at timestamptz;
  END IF;
END $$;
