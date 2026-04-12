import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Eye, Trash2, Calendar, User, Building2, CheckCircle, Clock, ArrowLeft, Upload, Search, X } from 'lucide-react';
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

interface AuditInfo {
  evaluator_name: string;
  performed_at: string;
}

const formatGMT6 = (iso: string) => {
  const d = new Date(iso);
  const offset = -6 * 60;
  const local = new Date(d.getTime() + offset * 60 * 1000);
  const date = local.toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const time = local.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  return { date, time };
};

export function GoalDefinitionsList({ type, onBack, filterStatus: initialFilterStatus, workflowFilter }: GoalDefinitionsListProps) {
  const [allDefinitions, setAllDefinitions] = useState<(AdministrativeGoalDefinition | OperativeGoalDefinition)[]>([]);
  const [definitions, setDefinitions] = useState<(AdministrativeGoalDefinition | OperativeGoalDefinition)[]>([]);
  const [auditMap, setAuditMap] = useState<Record<string, AuditInfo>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDefinition, setSelectedDefinition] = useState<AdministrativeGoalDefinition | OperativeGoalDefinition | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>(initialFilterStatus || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDefinitions();
  }, [filterStatus, type]);

  useEffect(() => {
    applySearch();
  }, [allDefinitions, searchTerm]);

  const applySearch = () => {
    if (!searchTerm.trim()) {
      setDefinitions(allDefinitions);
      return;
    }
    const term = searchTerm.toLowerCase();
    setDefinitions(
      allDefinitions.filter(d =>
        d.employee.first_name.toLowerCase().includes(term) ||
        d.employee.last_name.toLowerCase().includes(term) ||
        d.employee.employee_code.toLowerCase().includes(term) ||
        d.employee.position.toLowerCase().includes(term) ||
        (d.employee.department?.name || '').toLowerCase().includes(term)
      )
    );
  };

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
          query = query.or('workflow_status.is.null,workflow_status.eq.draft,workflow_status.eq.pending_signature');
        } else if (workflowFilter === 'completed') {
          query = query.eq('workflow_status', 'completed');
        } else if (filterStatus !== 'all') {
          query = query.eq('workflow_status', filterStatus);
        }

        const { data, error } = await query;
        if (error) throw error;
        const loadedAdm = data || [];
        setAllDefinitions(loadedAdm);
        setDefinitions(loadedAdm);

        if (loadedAdm.length > 0) {
          const ids = loadedAdm.map((d: any) => d.id);
          const { data: auditData } = await supabase
            .from('evaluation_audit_logs')
            .select(`
              evaluation_id,
              performed_at,
              evaluator:evaluator_system_user_id (first_name, last_name),
              evaluator_employee:evaluator_employee_id (first_name, last_name)
            `)
            .in('evaluation_id', ids)
            .eq('action_type', 'created')
            .order('performed_at', { ascending: true });

          if (auditData) {
            const map: Record<string, AuditInfo> = {};
            auditData.forEach((a: any) => {
              if (!map[a.evaluation_id]) {
                const emp = a.evaluator_employee;
                const sys = a.evaluator;
                const name = emp
                  ? `${emp.first_name} ${emp.last_name}`
                  : sys
                  ? `${sys.first_name} ${sys.last_name}`
                  : 'Usuario desconocido';
                map[a.evaluation_id] = { evaluator_name: name, performed_at: a.performed_at };
              }
            });
            setAuditMap(map);
          }
        }
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
          query = query.or('workflow_status.is.null,workflow_status.eq.draft,workflow_status.eq.pending_signature');
        } else if (workflowFilter === 'completed') {
          query = query.eq('workflow_status', 'completed');
        } else if (filterStatus !== 'all') {
          query = query.eq('workflow_status', filterStatus);
        }

        const { data, error } = await query;
        if (error) throw error;
        const loaded = data || [];
        setAllDefinitions(loaded);
        setDefinitions(loaded);

        if (loaded.length > 0) {
          const ids = loaded.map((d: any) => d.id);
          const { data: auditData } = await supabase
            .from('evaluation_audit_logs')
            .select(`
              evaluation_id,
              performed_at,
              evaluator:evaluator_system_user_id (first_name, last_name),
              evaluator_employee:evaluator_employee_id (first_name, last_name)
            `)
            .in('evaluation_id', ids)
            .eq('action_type', 'created')
            .order('performed_at', { ascending: true });

          if (auditData) {
            const map: Record<string, AuditInfo> = {};
            auditData.forEach((a: any) => {
              if (!map[a.evaluation_id]) {
                const emp = a.evaluator_employee;
                const sys = a.evaluator;
                const name = emp
                  ? `${emp.first_name} ${emp.last_name}`
                  : sys
                  ? `${sys.first_name} ${sys.last_name}`
                  : 'Usuario desconocido';
                map[a.evaluation_id] = { evaluator_name: name, performed_at: a.performed_at };
              }
            });
            setAuditMap(map);
          }
        }
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

  const accentColor = type === 'administrative' ? 'blue' : 'orange';

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
          <div className={`${accentColor === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-orange-600 to-orange-700'} px-8 py-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-8 h-8" />
                  Definición de Metas — {type === 'administrative' ? 'Administrativo' : 'Operativo'}
                </h1>
                <p className="text-white/80 mt-1">
                  {allDefinitions.length} definicion{allDefinitions.length !== 1 ? 'es' : ''} registrada{allDefinitions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código, posición o departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                />
              </div>

              {!initialFilterStatus && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                >
                  <option value="all">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="pending_signature">Pendiente Firma</option>
                  <option value="completed">Finalizado</option>
                </select>
              )}

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className={`inline-block animate-spin rounded-full h-12 w-12 border-4 ${accentColor === 'blue' ? 'border-blue-500' : 'border-orange-500'} border-t-transparent`}></div>
                <p className="mt-4 text-slate-600">Cargando definiciones...</p>
              </div>
            ) : definitions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay definiciones de metas registradas'}
                </p>
                <p className="text-slate-500 mt-2">
                  {searchTerm ? 'Intenta con otro término de búsqueda' : 'Las definiciones aparecerán aquí una vez sean guardadas'}
                </p>
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
                            <span>{new Date(definition.definition_date + 'T00:00:00').toLocaleDateString('es-HN')}</span>
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
                              <span>Factores: {definition.operative_individual_goals.length}</span>
                              <span>Estándares: {definition.operative_safety_standards.length}</span>
                            </>
                          )}
                          <span>Código: {definition.employee.employee_code}</span>
                        </div>
                        {auditMap[definition.id] && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>
                              Creado por:{' '}
                              <span className="font-semibold text-slate-700">{auditMap[definition.id].evaluator_name}</span>
                              {' — '}
                              {(() => {
                                const { date, time } = formatGMT6(auditMap[definition.id].performed_at);
                                return <span>{date}, {time} (GMT-6)</span>;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDefinition(definition);
                            setShowModal(true);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition ${
                            accentColor === 'blue'
                              ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                              : 'text-orange-700 bg-orange-50 hover:bg-orange-100'
                          }`}
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => handleDelete(definition.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
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
