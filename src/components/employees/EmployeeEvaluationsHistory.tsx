import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  FileText, CheckCircle, Clock, Upload, Eye, Calendar, Target,
  ChevronDown, ChevronUp, ClipboardCheck, X, User,
} from 'lucide-react';
import { GoalDefinitionViewer } from '../goals/GoalDefinitionViewer';
import { OperativeGoalDefinitionViewer } from '../goals/OperativeGoalDefinitionViewer';

interface GoalDefinitionRecord {
  id: string;
  employee_id: string;
  evaluation_period: string;
  definition_date: string;
  employee_comments: string;
  manager_comments: string;
  status: string;
  workflow_status?: string;
  signed_document_url?: string;
  signed_document_filename?: string;
  signed_document_mime_type?: string;
  signed_document_uploaded_at?: string;
  completed_at?: string;
  created_at: string;
  employee: {
    employee_code: string;
    first_name: string;
    last_name: string;
    position: string;
    hire_date: string;
    department: { name: string } | null;
    sub_department: { name: string } | null;
    manager: { first_name: string; last_name: string; position: string } | null;
  };
  individual_goals: Array<{
    id: string;
    goal_number: number;
    goal_description: string;
    measurement_and_expected_results: string;
  }>;
  competency_behaviors: Array<{
    id: string;
    behavior_number: number;
    behavior_description: string;
  }>;
}

interface OperativeGoalDefinitionRecord {
  id: string;
  employee_id: string;
  evaluation_period: string;
  definition_date: string;
  work_area: string;
  status: string;
  workflow_status?: string;
  signed_document_url?: string;
  signed_document_filename?: string;
  signed_document_mime_type?: string;
  signed_document_uploaded_at?: string;
  completed_at?: string;
  created_at: string;
  manager_comments: string;
  employee_comments: string;
  employee: {
    employee_code: string;
    first_name: string;
    last_name: string;
    position: string;
    hire_date: string;
    department: { name: string } | null;
    sub_department: { name: string } | null;
    manager: { first_name: string; last_name: string; position: string } | null;
  };
  operative_individual_goals: Array<{
    goal_number: number;
    goal_description: string;
    measurement_and_expected_results: string;
  }>;
  operative_safety_standards: Array<{
    standard_number: number;
    standard_description: string;
  }>;
}

interface JuneReviewRecord {
  id: string;
  employee_id: string;
  review_date: string | null;
  review_code: string | null;
  department: string | null;
  position: string | null;
  status: string;
  manager_comments: string;
  employee_comments: string;
  signed_document_url?: string;
  signed_document_filename?: string;
  signed_document_mime_type?: string;
  signed_document_uploaded_at?: string;
  completed_at?: string;
  created_at: string;
  employee_type: string;
  goals: Array<{
    id: string;
    goal_number: number;
    goal_description: string;
    results_description: string;
    rating: string | null;
  }>;
  competencies: Array<{
    id: string;
    competency_number: number;
    competency_description: string;
    rating: string | null;
  }>;
}

interface AuditInfo {
  evaluator_name: string;
  performed_at: string;
}

type EvaluationEntry =
  | { kind: 'definition-admin'; data: GoalDefinitionRecord; audit?: AuditInfo }
  | { kind: 'definition-operative'; data: OperativeGoalDefinitionRecord; audit?: AuditInfo }
  | { kind: 'june-review'; data: JuneReviewRecord; audit?: AuditInfo };

interface EmployeeEvaluationsHistoryProps {
  employeeId: string;
  employeeType: string;
}

function WorkflowBadge({ status }: { status?: string }) {
  const ws = status || 'draft';
  const config: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
    draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Borrador' },
    pending_signature: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Upload, label: 'Pendiente Firma' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Finalizado' },
  };
  const c = config[ws] || config.draft;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

const RATING_LABELS: Record<string, string> = {
  below_expectations: 'Debajo de Expectativas',
  needs_improvement: 'Desempeno a Mejorar',
  meets_expectations: 'Cumple Expectativas',
  exceeds_expectations: 'Supera Expectativas',
};

function JuneReviewModal({ review, onClose }: { review: JuneReviewRecord; onClose: () => void }) {
  const isComplete = review.status === 'completed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Revision de Metas Individuales</h2>
              <p className="text-blue-200 text-sm">2da Evaluacion &mdash; Junio 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Departamento</p>
              <p className="font-semibold text-slate-800">{review.department || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Fecha de Revision</p>
              <p className="font-semibold text-slate-800">
                {review.review_date
                  ? new Date(review.review_date + 'T00:00:00').toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Estado</p>
              <WorkflowBadge status={review.status} />
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-[#1e3a5f] text-white px-4 py-2 font-bold text-sm text-center rounded-t-lg">
              REVISION DE METAS INDIVIDUALES
            </div>
            <div className="border border-slate-300 rounded-b-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No.</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Meta Individual / Resultados</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-36">Calificacion</th>
                  </tr>
                </thead>
                <tbody>
                  {review.goals.map((goal) => (
                    <>
                      <tr key={`g-${goal.goal_number}`}>
                        <td className="border border-slate-200 px-3 py-3 text-center font-bold text-sm align-middle" rowSpan={2}>
                          {goal.goal_number}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-sm text-slate-800">
                          {goal.goal_description || <span className="text-slate-400 italic">Sin descripcion</span>}
                        </td>
                        <td className="border border-slate-200 px-2 py-2 text-center">
                          {goal.rating ? (
                            <span className="text-xs font-semibold text-[#1e3a5f] bg-blue-50 px-2 py-1 rounded">
                              {RATING_LABELS[goal.rating] || goal.rating}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                      <tr key={`gr-${goal.goal_number}`} className="bg-slate-50">
                        <td className="border border-slate-200 px-3 py-2" colSpan={2}>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Resultados a la fecha de revision:</p>
                          <p className="text-sm text-slate-700">{goal.results_description || <span className="text-slate-400 italic">Sin resultados registrados</span>}</p>
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-[#1e3a5f] text-white px-4 py-2 font-bold text-sm text-center rounded-t-lg">
              REVISION DE FACTORES CONDUCTUALES Y HABILIDADES TECNICAS
            </div>
            <div className="border border-slate-300 rounded-b-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs">
                    <th className="border border-slate-300 px-3 py-2 text-center w-10">No.</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Conducta / Habilidad Tecnica</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-36">Calificacion</th>
                  </tr>
                </thead>
                <tbody>
                  {review.competencies.map((comp) => (
                    <tr key={`c-${comp.competency_number}`}>
                      <td className="border border-slate-200 px-3 py-3 text-center font-bold text-sm">{comp.competency_number}</td>
                      <td className="border border-slate-200 px-3 py-2 text-sm text-slate-800">
                        {comp.competency_description || <span className="text-slate-400 italic">Sin descripcion</span>}
                      </td>
                      <td className="border border-slate-200 px-2 py-2 text-center">
                        {comp.rating ? (
                          <span className="text-xs font-semibold text-[#1e3a5f] bg-blue-50 px-2 py-1 rounded">
                            {RATING_LABELS[comp.rating] || comp.rating}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(review.manager_comments || review.employee_comments) && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {review.manager_comments && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Comentarios Jefe Inmediato</p>
                  <p className="text-sm text-slate-700">{review.manager_comments}</p>
                </div>
              )}
              {review.employee_comments && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Comentarios del Colaborador</p>
                  <p className="text-sm text-slate-700">{review.employee_comments}</p>
                </div>
              )}
            </div>
          )}

          {review.signed_document_url && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">{review.signed_document_filename || 'Documento firmado'}</p>
                  {review.signed_document_uploaded_at && (
                    <p className="text-xs text-green-600">
                      Subido el {new Date(review.signed_document_uploaded_at).toLocaleDateString('es-HN')}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={review.signed_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Ver Documento
              </a>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmployeeEvaluationsHistory({ employeeId, employeeType }: EmployeeEvaluationsHistoryProps) {
  const [entries, setEntries] = useState<EvaluationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<EvaluationEntry | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchEvaluations();
  }, [employeeId, employeeType]);

  const fetchEvaluations = async () => {
    setLoading(true);
    const result: EvaluationEntry[] = [];

    try {
      if (employeeType === 'administrativo') {
        const { data } = await supabase
          .from('goal_definitions')
          .select(`
            *,
            employee:employees!goal_definitions_employee_id_fkey (
              employee_code, first_name, last_name, position, hire_date,
              department:departments!employees_department_id_fkey (name),
              sub_department:sub_departments!employees_sub_department_id_fkey (name),
              manager:manager_id (first_name, last_name, position)
            ),
            individual_goals (id, goal_number, goal_description, measurement_and_expected_results),
            competency_behaviors (id, behavior_number, behavior_description)
          `)
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false });

        if (data) {
          data.forEach((record) => {
            result.push({ kind: 'definition-admin', data: record as GoalDefinitionRecord });
          });
        }
      } else {
        const { data } = await supabase
          .from('operative_goal_definitions')
          .select(`
            *,
            employee:employees!operative_goal_definitions_employee_id_fkey (
              employee_code, first_name, last_name, position, hire_date,
              department:departments!employees_department_id_fkey (name),
              sub_department:sub_departments!employees_sub_department_id_fkey (name),
              manager:manager_id (first_name, last_name, position)
            ),
            operative_individual_goals (goal_number, goal_description, measurement_and_expected_results),
            operative_safety_standards (standard_number, standard_description)
          `)
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false });

        if (data) {
          data.forEach((record) => {
            result.push({ kind: 'definition-operative', data: record as OperativeGoalDefinitionRecord });
          });
        }
      }

      const { data: reviews } = await supabase
        .from('june_reviews')
        .select(`
          *,
          goals:june_review_goals(id, goal_number, goal_description, results_description, rating),
          competencies:june_review_competencies(id, competency_number, competency_description, rating)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (reviews) {
        reviews.forEach((r) => {
          result.push({
            kind: 'june-review',
            data: {
              ...r,
              goals: r.goals || [],
              competencies: r.competencies || [],
            } as JuneReviewRecord,
          });
        });
      }
      const allIds = result.map(e => e.data.id);
      if (allIds.length > 0) {
        const { data: auditData } = await supabase
          .from('evaluation_audit_logs')
          .select(`
            evaluation_id,
            action_type,
            performed_at,
            evaluator:evaluator_system_user_id (first_name, last_name),
            evaluator_employee:evaluator_employee_id (first_name, last_name)
          `)
          .in('evaluation_id', allIds)
          .eq('action_type', 'created')
          .order('performed_at', { ascending: true });

        if (auditData) {
          const auditMap: Record<string, AuditInfo> = {};
          auditData.forEach((a: any) => {
            if (!auditMap[a.evaluation_id]) {
              const emp = a.evaluator_employee;
              const sys = a.evaluator;
              const name = emp
                ? `${emp.first_name} ${emp.last_name}`
                : sys
                ? `${sys.first_name} ${sys.last_name}`
                : 'Usuario desconocido';
              auditMap[a.evaluation_id] = {
                evaluator_name: name,
                performed_at: a.performed_at,
              };
            }
          });
          result.forEach((entry, i) => {
            const info = auditMap[entry.data.id];
            if (info) (result[i] as any).audit = info;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setEntries(result);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEntry(null);
    fetchEvaluations();
  };

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Target className="w-6 h-6 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Historial de Evaluaciones</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const formatGMT6 = (iso: string) => {
    const d = new Date(iso);
    const offset = -6 * 60;
    const local = new Date(d.getTime() + offset * 60 * 1000);
    const date = local.toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const time = local.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
    return { date, time };
  };

  const getEntryMeta = (entry: EvaluationEntry) => {
    if (entry.kind === 'definition-admin') {
      return {
        label: 'Definicion de Metas &mdash; Administrativo',
        labelText: 'Definicion de Metas — Administrativo',
        step: 1,
        color: 'blue',
        badgeClass: 'bg-blue-100 text-blue-700',
        borderClass: 'bg-blue-500',
        workflowStatus: entry.data.workflow_status,
        hasDoc: !!entry.data.signed_document_url,
        date: entry.data.definition_date,
        completedAt: entry.data.completed_at,
        period: (entry.data as GoalDefinitionRecord).evaluation_period,
        countA: (entry.data as GoalDefinitionRecord).individual_goals.length,
        countB: (entry.data as GoalDefinitionRecord).competency_behaviors.length,
        labelA: 'metas',
        labelB: 'conductas',
        icon: <FileText className="w-6 h-6 text-blue-600" />,
      };
    }
    if (entry.kind === 'definition-operative') {
      return {
        label: 'Definicion de Factores &mdash; Operativo',
        labelText: 'Definicion de Factores — Operativo',
        step: 1,
        color: 'orange',
        badgeClass: 'bg-orange-100 text-orange-700',
        borderClass: 'bg-orange-500',
        workflowStatus: entry.data.workflow_status,
        hasDoc: !!entry.data.signed_document_url,
        date: entry.data.definition_date,
        completedAt: entry.data.completed_at,
        period: (entry.data as OperativeGoalDefinitionRecord).evaluation_period,
        countA: (entry.data as OperativeGoalDefinitionRecord).operative_individual_goals.length,
        countB: (entry.data as OperativeGoalDefinitionRecord).operative_safety_standards.length,
        labelA: 'funciones',
        labelB: 'estandares',
        icon: <FileText className="w-6 h-6 text-orange-600" />,
      };
    }
    const r = entry.data as JuneReviewRecord;
    const isAdmin = r.employee_type === 'administrativo';
    return {
      label: isAdmin ? 'Revision Junio — Administrativo' : 'Revision Junio — Operativo',
      labelText: isAdmin ? 'Revision Junio — Administrativo' : 'Revision Junio — Operativo',
      step: 2,
      color: isAdmin ? 'teal' : 'orange',
      badgeClass: isAdmin ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700',
      borderClass: isAdmin ? 'bg-teal-500' : 'bg-orange-500',
      workflowStatus: r.status,
      hasDoc: !!r.signed_document_url,
      date: r.review_date || r.created_at,
      completedAt: r.completed_at,
      period: 'Junio 2026',
      countA: r.goals.filter(g => g.goal_description).length,
      countB: r.competencies.filter(c => c.competency_description).length,
      labelA: 'metas revisadas',
      labelB: 'conductas evaluadas',
      icon: <ClipboardCheck className={`w-6 h-6 ${isAdmin ? 'text-teal-600' : 'text-orange-600'}`} />,
    };
  };

  return (
    <>
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Target className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-slate-900">Historial de Evaluaciones</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {entries.length === 0
                  ? 'Sin evaluaciones registradas'
                  : `${entries.length} evaluacion${entries.length !== 1 ? 'es' : ''} registrada${entries.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </button>

        {expanded && (
          <div className="px-6 pb-6">
            {entries.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay evaluaciones registradas aun</p>
                <p className="text-slate-400 text-sm mt-1">Las evaluaciones completadas apareceran aqui</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                <div className="space-y-4">
                  {entries.map((entry, index) => {
                    const meta = getEntryMeta(entry);
                    const isCompleted = meta.workflowStatus === 'completed';
                    return (
                      <div key={`${entry.kind}-${entry.data.id}`} className="relative flex items-start gap-4 pl-4">
                        <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm border-2 ${
                          isCompleted ? 'bg-green-50 border-green-400' : meta.workflowStatus === 'pending_signature' ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-300'
                        }`}>
                          {isCompleted ? <CheckCircle className="w-6 h-6 text-green-600" /> : meta.icon}
                        </div>

                        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden">
                          <div className={`h-1 ${meta.borderClass}`}></div>
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${meta.badgeClass}`}>
                                    Etapa {meta.step}
                                  </span>
                                  <WorkflowBadge status={meta.workflowStatus} />
                                  {meta.hasDoc && (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-200">
                                      <CheckCircle className="w-3 h-3" />
                                      Documento firmado
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-base font-bold text-slate-800 mb-1">{meta.labelText}</h3>

                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(meta.date).toLocaleDateString('es-HN', {
                                      year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                  </span>
                                  {meta.period && <span className="text-slate-400">|</span>}
                                  {meta.period && <span>{meta.period}</span>}
                                </div>

                                <div className="flex gap-3 text-xs text-slate-500">
                                  <span className="bg-slate-100 px-2 py-1 rounded">{meta.countA} {meta.labelA}</span>
                                  <span className="bg-slate-100 px-2 py-1 rounded">{meta.countB} {meta.labelB}</span>
                                  {isCompleted && meta.completedAt && (
                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                      Finalizado el {new Date(meta.completedAt).toLocaleDateString('es-HN')}
                                    </span>
                                  )}
                                </div>

                                {entry.audit && (
                                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span>
                                      Evaluado por:{' '}
                                      <span className="font-semibold text-slate-700">{entry.audit.evaluator_name}</span>
                                      {' — '}
                                      {(() => {
                                        const { date, time } = formatGMT6(entry.audit.performed_at);
                                        return <span>{date}, {time} (GMT-6)</span>;
                                      })()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => setSelectedEntry(entry)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border ${
                                  meta.color === 'blue' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                                  : meta.color === 'teal' ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200'
                                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200'
                                }`}
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedEntry && selectedEntry.kind === 'definition-admin' && (
        <GoalDefinitionViewer
          definition={selectedEntry.data as GoalDefinitionRecord}
          onClose={handleClose}
          onUpdate={fetchEvaluations}
          mode="view"
        />
      )}

      {selectedEntry && selectedEntry.kind === 'definition-operative' && (
        <OperativeGoalDefinitionViewer
          definition={selectedEntry.data as OperativeGoalDefinitionRecord}
          onClose={handleClose}
          onUpdate={fetchEvaluations}
          mode="view"
        />
      )}

      {selectedEntry && selectedEntry.kind === 'june-review' && (
        <JuneReviewModal
          review={selectedEntry.data as JuneReviewRecord}
          onClose={handleClose}
        />
      )}
    </>
  );
}
