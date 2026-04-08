/*
  # Agregar campos de documento firmado a evaluaciones operativas

  1. Cambios en Tabla
    - `operative_evaluations`
      - `signed_document_url` (text, nullable) - URL del documento firmado
      - `signed_document_filename` (text, nullable) - Nombre del archivo
      - `signed_document_mime_type` (text, nullable) - Tipo MIME del archivo
      - `signed_document_uploaded_at` (timestamptz, nullable) - Fecha de subida
      - `signed_document_uploaded_by` (uuid, nullable) - Usuario que subió el documento
      - `completed_at` (timestamptz, nullable) - Fecha de finalización

  2. Notas
    - Mismo esquema que administrative_evaluations para consistencia
    - Los documentos se guardan en el bucket goal-signed-documents bajo la carpeta operative/
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_evaluations' AND column_name = 'signed_document_url'
  ) THEN
    ALTER TABLE operative_evaluations ADD COLUMN signed_document_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_evaluations' AND column_name = 'signed_document_filename'
  ) THEN
    ALTER TABLE operative_evaluations ADD COLUMN signed_document_filename text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_evaluations' AND column_name = 'signed_document_mime_type'
  ) THEN
    ALTER TABLE operative_evaluations ADD COLUMN signed_document_mime_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_evaluations' AND column_name = 'signed_document_uploaded_at'
  ) THEN
    ALTER TABLE operative_evaluations ADD COLUMN signed_document_uploaded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_evaluations' AND column_name = 'signed_document_uploaded_by'
  ) THEN
    ALTER TABLE operative_evaluations ADD COLUMN signed_document_uploaded_by uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_evaluations' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE operative_evaluations ADD COLUMN completed_at timestamptz;
  END IF;
END $$;
