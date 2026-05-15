/*
  # Add 'empleado' to evaluation_type constraint in evaluation_audit_logs

  - Drops the existing evaluation_type CHECK constraint
  - Adds a new CHECK constraint that includes 'empleado' (used when logging employee deletions)
  - Also makes evaluation_id optional (NULL allowed) since deletion logs may not have an evaluation_id
*/

ALTER TABLE evaluation_audit_logs
  DROP CONSTRAINT IF EXISTS evaluation_audit_logs_evaluation_type_check;

ALTER TABLE evaluation_audit_logs
  ADD CONSTRAINT evaluation_audit_logs_evaluation_type_check
  CHECK (evaluation_type IN ('administrativa', 'operativa', 'revision_junio_administrativa', 'revision_junio_operativa', 'empleado'));

ALTER TABLE evaluation_audit_logs
  ALTER COLUMN evaluation_id DROP NOT NULL;
