/*
  # Add 'deleted' action type to evaluation_audit_logs

  1. Changes
    - Drop the existing CHECK constraint on action_type that only allows 'created' and 'updated'
    - Add new CHECK constraint that also allows 'deleted'
    - Add 'target_name' column to store the name of the deleted record (employee name, evaluation id, etc.)
      since after deletion the FK references may no longer exist
    - Add 'details' column (TEXT) for optional extra context about what was deleted

  2. Notes
    - Non-destructive: only extends the constraint, does not remove any data
    - existing 'created' and 'updated' entries are unaffected
*/

ALTER TABLE evaluation_audit_logs
  DROP CONSTRAINT IF EXISTS evaluation_audit_logs_action_type_check;

ALTER TABLE evaluation_audit_logs
  ADD CONSTRAINT evaluation_audit_logs_action_type_check
  CHECK (action_type IN ('created', 'updated', 'deleted'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluation_audit_logs' AND column_name = 'target_name'
  ) THEN
    ALTER TABLE evaluation_audit_logs ADD COLUMN target_name TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluation_audit_logs' AND column_name = 'details'
  ) THEN
    ALTER TABLE evaluation_audit_logs ADD COLUMN details TEXT;
  END IF;
END $$;
