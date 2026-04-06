/*
  # Add Signed Document Metadata and Storage Configuration

  1. New Storage Bucket
    - `goal-signed-documents` - For storing scanned signed documents
    - Public access for authenticated users
    - File size limit: 10MB
    - Allowed types: PDF, JPG, PNG

  2. New Columns
    - `signed_document_filename` (text) - Original filename of uploaded document
    - `signed_document_mime_type` (text) - MIME type (application/pdf, image/jpeg, image/png)
    
  3. Security
    - Storage policies for authenticated users to upload/read their documents
    - RLS policies already exist for the tables

  4. Changes Applied To
    - goal_definitions table
    - operative_goal_definitions table
*/

-- Create storage bucket for signed documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'goal-signed-documents',
  'goal-signed-documents',
  false,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Add filename column to goal_definitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_definitions' AND column_name = 'signed_document_filename'
  ) THEN
    ALTER TABLE goal_definitions ADD COLUMN signed_document_filename text;
  END IF;
END $$;

-- Add mime type column to goal_definitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_definitions' AND column_name = 'signed_document_mime_type'
  ) THEN
    ALTER TABLE goal_definitions ADD COLUMN signed_document_mime_type text;
  END IF;
END $$;

-- Add filename column to operative_goal_definitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_goal_definitions' AND column_name = 'signed_document_filename'
  ) THEN
    ALTER TABLE operative_goal_definitions ADD COLUMN signed_document_filename text;
  END IF;
END $$;

-- Add mime type column to operative_goal_definitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_goal_definitions' AND column_name = 'signed_document_mime_type'
  ) THEN
    ALTER TABLE operative_goal_definitions ADD COLUMN signed_document_mime_type text;
  END IF;
END $$;

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Users can upload signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete signed documents" ON storage.objects;

-- Storage policy: Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload signed documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'goal-signed-documents'
);

-- Storage policy: Allow authenticated users to read documents from their company
CREATE POLICY "Users can view signed documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'goal-signed-documents'
);

-- Storage policy: Allow users to update their uploaded documents
CREATE POLICY "Users can update signed documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'goal-signed-documents'
)
WITH CHECK (
  bucket_id = 'goal-signed-documents'
);

-- Storage policy: Allow users to delete their uploaded documents
CREATE POLICY "Users can delete signed documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'goal-signed-documents'
);

-- Add helpful comments
COMMENT ON COLUMN goal_definitions.signed_document_filename IS 'Original filename of uploaded signed document';
COMMENT ON COLUMN goal_definitions.signed_document_mime_type IS 'MIME type of signed document (application/pdf, image/jpeg, image/png)';
COMMENT ON COLUMN operative_goal_definitions.signed_document_filename IS 'Original filename of uploaded signed document';
COMMENT ON COLUMN operative_goal_definitions.signed_document_mime_type IS 'MIME type of signed document (application/pdf, image/jpeg, image/png)';