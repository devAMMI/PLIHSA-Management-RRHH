import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Eye, Trash2, Calendar, User, Building2, CheckCircle, Clock, ArrowLeft, Upload } from 'lucide-react';
import { GoalDefinitionViewer } from './GoalDefinitionViewer';
import { OperativeGoalDefinitionViewer } from './OperativeGoalDefinitionViewer';

interface Employee {
  first_name: string;
  last_name: string;
  position: string;
  employee_code: string;
  hire_date: string;
  department: { name: string } | null;
  sub_department: { name: string } | null;
  manager: { first_name: string; last_name: string; position: string } | null;
}


interface AdministrativeGoalDefinition {
  id: string;
  employee_id: string;
  evaluation_period: string;
  definition_date: string;
  employee_comments: string;
  manager_comments: string;
  status: string;
  workflow_status?: string;
  signed_document_url?: string;
  signed_document_uploaded_at?: string;
  completed_at?: string;
  created_at: string;
  employee: Employee;
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

interface OperativeGoalDefinition {
  id: string;
  employee_id: string;
  evaluation_period: string;
  definition_date: string;
  work_area: string;
  status: string;
  workflow_status?: string;
  signed_document_url?: string;
  signed_document_uploaded_at?: string;
  completed_at?: string;
  created_at: string;
  employee: Employee;
  manager_comments: string;
  employee_comments: string;
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

interface GoalDefinitionsListProps {
  type: 'administrative' | 'operative';
  onBack: () => void;
  filterStatus?: string;
  workflowFilter?: 'draft-pending' | 'completed' | 'all';
}

export function GoalDefinitionsList({ type, onBack, filterStatus: initialFilterStatus, workflowFilter }: GoalDefinitionsListProps) {
  const [definitions, setDefinitions] = useState<(AdministrativeGoalDefinition | OperativeGoalDefinition)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDefinition, setSelectedDefinition] = useState<AdministrativeGoalDefinition | OperativeGoalDefinition | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('Q1-2026');
  const [filterStatus, setFilterStatus] = useState<string>(initialFilterStatus || 'all');

  useEffect(() => {
    fetchDefinitions();
  }, [filterPeriod, filterStatus, type]);

  const fetchDefinitions = async () => {
    setLoading(true);
    try {
      if (type === 'administrative') {
        let query = supabase
          .from('goal_definitions')
          .select(`
            *,
            employee:employees!goal_definitions_employee_id_fkey (
              first_name,
              last_name,
              position,
              employee_code,
              hire_date,
              department:departments!employees_department_id_fkey (name),
              sub_department:sub_departments!employees_sub_department_id_fkey (name),
              manager:manager_id (first_name, last_name, position)
            ),
            individual_goals (
              id,
              goal_number,
              goal_description,
              measurement_and_expected_results
            ),
            competency_behaviors (
              id,
              behavior_number,
              behavior_description
            )
          `)
          .order('created_at', { ascending: false });

        if (workflowFilter === 'draft-pending') {
          query = query.in('workflow_status', ['draft', 'pending_signature', null]);
        } else if (workflowFilter === 'completed') {
          query = query.eq('workflow_status', 'completed');
        } else if (filterStatus !== 'all') {
          query = query.eq('workflow_status', filterStatus);
        }

        const { data, error } = await query;
        if (error) throw error;
        setDefinitions(data || []);
      } else {
        let query = supabase
          .from('operative_goal_definitions')
          .select(`
            *,
            employee:employees!operative_goal_definitions_employee_id_fkey (
              first_name,
              last_name,
              position,
              employee_code,
              hire_date,
              department:departments!employees_department_id_fkey (name),
              sub_department:sub_departments!employees_sub_department_id_fkey (name),
              manager:manager_id (first_name, last_name, position)
            ),
            operative_individual_goals (
              goal_number,
              goal_description,
              measurement_and_expected_results
            ),
            operative_safety_standards (
              standard_number,
              standard_description
            )
          `)
          .order('created_at', { ascending: false });

        if (workflowFilter === 'draft-pending') {
          query = query.in('workflow_status', ['draft', 'pending_signature', null]);
        } else if (workflowFilter === 'completed') {
          query = query.eq('workflow_status', 'completed');
        } else if (filterStatus !== 'all') {
          query = query.eq('workflow_status', filterStatus);
        }

        const { data, error } = await query;
        if (error) throw error;
        setDefinitions(data || []);
      }
    } catch (error) {
      console.error('Error fetching goal definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta definición de metas?')) return;

    try {
      const table = type === 'administrative' ? 'goal_definitions' : 'operative_goal_definitions';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchDefinitions();
    } catch (error) {
      console.error('Error deleting definition:', error);
      alert('Error al eliminar la definición');
    }
  };

  const getWorkflowBadge = (workflowStatus?: string) => {
    const ws = workflowStatus || 'draft';
    const badges: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Borrador' },
      pending_signature: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Upload, label: 'Pendiente Firma' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Finalizado' }
    };
    const badge = badges[ws] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const isAdministrative = (def: AdministrativeGoalDefinition | OperativeGoalDefinition): def is AdministrativeGoalDefinition => {
    return 'individual_goals' in def;
  };

  const isOperative = (def: AdministrativeGoalDefinition | OperativeGoalDefinition): def is OperativeGoalDefinition => {
    return 'operative_individual_goals' in def;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className={`${type === 'administrative' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-orange-600 to-orange-700'} px-8 py-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-8 h-8" />
                  Definiciones de Metas - {type === 'administrative' ? 'Administrativo' : 'Operativo'}
                </h1>
                <p className="text-white text-opacity-90 mt-1">
                  Visualiza y gestiona las definiciones realizadas
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!initialFilterStatus && (
              <div className="flex gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="all">Todos</option>
                    <option value="draft">Borrador</option>
                    <option value="pending_signature">Pendiente Firma</option>
                    <option value="completed">Finalizado</option>
                  </select>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-slate-600">Cargando definiciones...</p>
              </div>
            ) : definitions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">No hay definiciones de metas registradas</p>
                <p className="text-slate-500 mt-2">Las definiciones aparecerán aquí una vez sean guardadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {definitions.map((definition) => (
                  <div
                    key={definition.id}
                    className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">
                            {definition.employee.first_name} {definition.employee.last_name}
                          </h3>
                          {getWorkflowBadge(definition.workflow_status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>{definition.employee.position}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{definition.employee.department?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{new Date(definition.definition_date).toLocaleDateString('es-HN')}</span>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                          {isAdministrative(definition) && (
                            <>
                              <span>Metas: {definition.individual_goals.length}</span>
                              <span>Competencias: {definition.competency_behaviors.length}</span>
                            </>
                          )}
                          {isOperative(definition) && (
                            <>
                              <span>Metas: {definition.operative_individual_goals.length}</span>
                              <span>Estándares: {definition.operative_safety_standards.length}</span>
                            </>
                          )}
                          <span>Código: {definition.employee.employee_code}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDefinition(definition);
                            setShowModal(true);
                          }}
                          className={`p-2 ${type === 'administrative' ? 'text-blue-600 hover:bg-blue-50' : 'text-orange-600 hover:bg-orange-50'} rounded-lg transition`}
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(definition.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && selectedDefinition && type === 'administrative' && isAdministrative(selectedDefinition) && (
        <GoalDefinitionViewer
          definition={selectedDefinition}
          onClose={() => setShowModal(false)}
          onUpdate={fetchDefinitions}
          mode="view"
        />
      )}

      {showModal && selectedDefinition && type === 'operative' && isOperative(selectedDefinition) && (
        <OperativeGoalDefinitionViewer
          definition={selectedDefinition}
          onClose={() => setShowModal(false)}
          onUpdate={fetchDefinitions}
          mode="view"
        />
      )}
    </div>
  );
}
