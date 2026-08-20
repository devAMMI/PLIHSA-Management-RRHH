/*
  # Add generated PDF storage columns to june_reviews

  1. New Columns on `june_reviews`
    - `generated_pdf_url` (text) — Storage path/URL of the auto-generated PDF
    - `generated_pdf_uploaded_at` (timestamptz) — when the PDF was generated and stored

  2. Purpose
    When a user clicks "Descargar y Guardar PDF" in the Revisión de Metas form,
    the system generates a PDF from the visible form, uploads it to the
    `goal-signed-documents` bucket (under `revision-junio/...`), and stores
    the resulting URL here so the document can be retrieved later without
    re-generating it.

  3. Security
    No new RLS policies needed — existing CRUD policies on `june_reviews`
    already cover SELECT/INSERT/UPDATE/DELETE for authenticated users.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'june_reviews' AND column_name = 'generated_pdf_url'
  ) THEN
    ALTER TABLE june_reviews ADD COLUMN generated_pdf_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'june_reviews' AND column_name = 'generated_pdf_uploaded_at'
  ) THEN
    ALTER TABLE june_reviews ADD COLUMN generated_pdf_uploaded_at timestamptz;
  END IF;
END $$;

COMMENT ON COLUMN june_reviews.generated_pdf_url IS 'Storage path of the auto-generated PDF for this review';
COMMENT ON COLUMN june_reviews.generated_pdf_uploaded_at IS 'Timestamp when the generated PDF was stored';
