/*
  # Create evaluation_audit_logs table

  ## Purpose
  Records every time a system user creates or updates an evaluation or review.
  This provides a full audit trail of: who evaluated whom, when, and what type.

  ## New Table: evaluation_audit_logs
  - id: unique log entry
  - action_type: 'created' or 'updated'
  - evaluation_type: 'administrativa', 'operativa', 'revision_junio_administrativa', 'revision_junio_operativa'
  - evaluation_id: the ID of the evaluation/review record
  - evaluator_system_user_id: the system_users.id of who performed the action
  - evaluator_employee_id: the employees.id linked to that system user
  - evaluated_employee_id: the employees.id of who was evaluated
  - performed_at: timestamp of the action

  ## Security
  - RLS enabled
  - superadmin, admin, rrhh, manager, jefe can read all logs
  - Any authenticated user can insert their own log entries
  - No updates or deletes allowed (immutable audit trail)
*/

CREATE TABLE IF NOT EXISTS evaluation_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('created', 'updated')),
  evaluation_type text NOT NULL CHECK (evaluation_type IN ('administrativa', 'operativa', 'revision_junio_administrativa', 'revision_junio_operativa')),
  evaluation_id uuid NOT NULL,
  evaluator_system_user_id uuid REFERENCES system_users(id) ON DELETE SET NULL,
  evaluator_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  evaluated_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE evaluation_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view all audit logs"
  ON evaluation_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager', 'jefe')
        AND system_users.is_active = true
    )
  );

CREATE POLICY "Authenticated users can insert their own audit logs"
  ON evaluation_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluator_system_user_id IN (
      SELECT id FROM system_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_audit_logs_evaluator ON evaluation_audit_logs(evaluator_system_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_evaluated ON evaluation_audit_logs(evaluated_employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON evaluation_audit_logs(performed_at DESC);
