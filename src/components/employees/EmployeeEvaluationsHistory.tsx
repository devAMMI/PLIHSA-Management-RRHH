import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, CheckCircle, Clock, Upload, Eye, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';
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

type EvaluationEntry =
  | { type: 'administrative'; step: number; label: string; data: GoalDefinitionRecord }
  | { type: 'operative'; step: number; label: string; data: OperativeGoalDefinitionRecord };

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
          data.forEach((record, idx) => {
            result.push({
              type: 'administrative',
              step: idx + 1,
              label: 'Definicion de Metas - Administrativo',
              data: record as GoalDefinitionRecord,
            });
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
          data.forEach((record, idx) => {
            result.push({
              type: 'operative',
              step: idx + 1,
              label: 'Definicion de Factores - Operativo',
              data: record as OperativeGoalDefinitionRecord,
            });
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
                    const isAdministrative = entry.type === 'administrative';
                    const accentColor = isAdministrative ? 'blue' : 'orange';
                    const definitionDate = entry.data.definition_date;
                    const workflowStatus = entry.data.workflow_status;
                    const hasSignedDoc = !!entry.data.signed_document_url;

                    const goalCount = isAdministrative
                      ? (entry.data as GoalDefinitionRecord).individual_goals.length
                      : (entry.data as OperativeGoalDefinitionRecord).operative_individual_goals.length;

                    const secondaryCount = isAdministrative
                      ? (entry.data as GoalDefinitionRecord).competency_behaviors.length
                      : (entry.data as OperativeGoalDefinitionRecord).operative_safety_standards.length;

                    const secondaryLabel = isAdministrative ? 'competencias' : 'estandares';

                    return (
                      <div key={entry.data.id} className="relative flex items-start gap-4 pl-4">
                        <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm border-2 ${
                          workflowStatus === 'completed'
                            ? 'bg-green-50 border-green-400'
                            : workflowStatus === 'pending_signature'
                            ? 'bg-amber-50 border-amber-400'
                            : `bg-${accentColor}-50 border-${accentColor}-300`
                        }`}>
                          {workflowStatus === 'completed' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <FileText className={`w-6 h-6 text-${accentColor}-600`} />
                          )}
                        </div>

                        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden">
                          <div className={`h-1 ${isAdministrative ? 'bg-blue-500' : 'bg-orange-500'}`}></div>

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                                    isAdministrative ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    Evaluacion {entries.length - index}
                                  </span>
                                  <WorkflowBadge status={workflowStatus} />
                                  {hasSignedDoc && (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-200">
                                      <CheckCircle className="w-3 h-3" />
                                      Documento firmado
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-base font-bold text-slate-800 mb-1">{entry.label}</h3>

                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(definitionDate).toLocaleDateString('es-HN', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  {entry.data.evaluation_period && (
                                    <span className="text-slate-400">|</span>
                                  )}
                                  {entry.data.evaluation_period && (
                                    <span>{entry.data.evaluation_period}</span>
                                  )}
                                </div>

                                <div className="flex gap-4 text-xs text-slate-500">
                                  <span className="bg-slate-100 px-2 py-1 rounded">
                                    {goalCount} {isAdministrative ? 'metas' : 'funciones'}
                                  </span>
                                  <span className="bg-slate-100 px-2 py-1 rounded">
                                    {secondaryCount} {secondaryLabel}
                                  </span>
                                  {workflowStatus === 'completed' && entry.data.completed_at && (
                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                      Finalizado el {new Date(entry.data.completed_at).toLocaleDateString('es-HN')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => setSelectedEntry(entry)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                                  isAdministrative
                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
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

      {selectedEntry && selectedEntry.type === 'administrative' && (
        <GoalDefinitionViewer
          definition={selectedEntry.data as GoalDefinitionRecord}
          onClose={handleClose}
          onUpdate={fetchEvaluations}
          mode="view"
        />
      )}

      {selectedEntry && selectedEntry.type === 'operative' && (
        <OperativeGoalDefinitionViewer
          definition={selectedEntry.data as OperativeGoalDefinitionRecord}
          onClose={handleClose}
          onUpdate={fetchEvaluations}
          mode="view"
        />
      )}
    </>
  );
}
