import { supabase } from './supabase';

type AuditActionType = 'created' | 'updated' | 'deleted';
type AuditEvaluationType =
  | 'administrativa'
  | 'operativa'
  | 'revision_junio_administrativa'
  | 'revision_junio_operativa'
  | 'empleado';

interface LogDeletionParams {
  actionType: AuditActionType;
  evaluationType: AuditEvaluationType;
  evaluationId?: string;
  evaluatorSystemUserId?: string | null;
  evaluatorEmployeeId?: string | null;
  evaluatedEmployeeId?: string | null;
  targetName?: string;
  details?: string;
}

export async function logAuditEvent(params: LogDeletionParams): Promise<void> {
  try {
    await supabase.from('evaluation_audit_logs').insert({
      action_type: params.actionType,
      evaluation_type: params.evaluationType,
      evaluation_id: params.evaluationId || null,
      evaluator_system_user_id: params.evaluatorSystemUserId || null,
      evaluator_employee_id: params.evaluatorEmployeeId || null,
      evaluated_employee_id: params.evaluatedEmployeeId || null,
      target_name: params.targetName || null,
      details: params.details || null,
      performed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error writing audit log:', err);
  }
}
