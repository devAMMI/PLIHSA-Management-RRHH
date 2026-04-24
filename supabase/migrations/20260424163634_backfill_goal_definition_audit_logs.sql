/*
  # Backfill audit logs for existing administrative goal definitions

  Inserts missing 'created' audit records for goal_definitions that were
  created before audit logging was added. Uses created_at and created_by
  to reconstruct who created each record.

  Note: operative_goal_definitions has no created_by column so cannot be backfilled.
*/

INSERT INTO evaluation_audit_logs (
  action_type,
  evaluation_type,
  evaluation_id,
  evaluator_system_user_id,
  evaluator_employee_id,
  evaluated_employee_id,
  performed_at
)
SELECT
  'created',
  'administrativa',
  gd.id,
  su.id,
  su.employee_id,
  gd.employee_id,
  gd.created_at
FROM goal_definitions gd
JOIN system_users su ON su.user_id = gd.created_by
WHERE NOT EXISTS (
  SELECT 1 FROM evaluation_audit_logs eal
  WHERE eal.evaluation_id = gd.id AND eal.action_type = 'created'
);
