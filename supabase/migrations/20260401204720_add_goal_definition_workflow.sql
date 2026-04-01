/*
  # Add Goal Definition Workflow and Document Management

  1. Changes to Tables
    - Add workflow status columns to goal definition tables
    - Add document upload tracking
    
  2. New Workflow States
    - draft: Borrador inicial, se puede editar
    - pending_signature: Esperando firma manual (PDF impreso)
    - completed: Firmado y finalizado
    
  3. Document Management
    - Add signed_document_url for uploaded scanned documents
    - Add signed_document_uploaded_at timestamp
    - Add signed_document_uploaded_by user reference
    
  4. Changes Apply To
    - goal_definitions (Administrativo)
    - operative_goal_definitions (Operativo)
*/

-- Add workflow columns to goal_definitions (Administrativo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_definitions' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE goal_definitions 
    ADD COLUMN workflow_status text DEFAULT 'draft' CHECK (workflow_status IN ('draft', 'pending_signature', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_definitions' AND column_name = 'signed_document_url'
  ) THEN
    ALTER TABLE goal_definitions ADD COLUMN signed_document_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_definitions' AND column_name = 'signed_document_uploaded_at'
  ) THEN
    ALTER TABLE goal_definitions ADD COLUMN signed_document_uploaded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_definitions' AND column_name = 'signed_document_uploaded_by'
  ) THEN
    ALTER TABLE goal_definitions ADD COLUMN signed_document_uploaded_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_definitions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE goal_definitions ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Add workflow columns to operative_goal_definitions (Operativo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_goal_definitions' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE operative_goal_definitions 
    ADD COLUMN workflow_status text DEFAULT 'draft' CHECK (workflow_status IN ('draft', 'pending_signature', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_goal_definitions' AND column_name = 'signed_document_url'
  ) THEN
    ALTER TABLE operative_goal_definitions ADD COLUMN signed_document_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_goal_definitions' AND column_name = 'signed_document_uploaded_at'
  ) THEN
    ALTER TABLE operative_goal_definitions ADD COLUMN signed_document_uploaded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_goal_definitions' AND column_name = 'signed_document_uploaded_by'
  ) THEN
    ALTER TABLE operative_goal_definitions ADD COLUMN signed_document_uploaded_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_goal_definitions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE operative_goal_definitions ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Add indexes for workflow queries
CREATE INDEX IF NOT EXISTS idx_goal_def_workflow_status ON goal_definitions(workflow_status);
CREATE INDEX IF NOT EXISTS idx_goal_def_completed_at ON goal_definitions(completed_at);
CREATE INDEX IF NOT EXISTS idx_operative_goal_workflow_status ON operative_goal_definitions(workflow_status);
CREATE INDEX IF NOT EXISTS idx_operative_goal_completed_at ON operative_goal_definitions(completed_at);

-- Create storage bucket for signed documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('goal-signed-documents', 'goal-signed-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their signed documents" ON storage.objects;

-- Create storage policies
CREATE POLICY "Users can upload signed documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'goal-signed-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view signed documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'goal-signed-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their signed documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'goal-signed-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their signed documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'goal-signed-documents' AND
  auth.uid() IS NOT NULL
);

-- Add comments for documentation
COMMENT ON COLUMN goal_definitions.workflow_status IS 'Workflow state: draft (borrador), pending_signature (esperando firma), completed (finalizado)';
COMMENT ON COLUMN goal_definitions.signed_document_url IS 'URL of uploaded signed document scan';
COMMENT ON COLUMN operative_goal_definitions.workflow_status IS 'Workflow state: draft (borrador), pending_signature (esperando firma), completed (finalizado)';
COMMENT ON COLUMN operative_goal_definitions.signed_document_url IS 'URL of uploaded signed document scan';