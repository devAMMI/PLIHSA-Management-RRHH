import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Eye, Trash2, Calendar, User, Building2, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';

interface Employee {
  first_name: string;
  last_name: string;
  position: string;
  employee_code: string;
  department: { name: string } | null;
}

interface AdministrativeGoalDefinition {
  id: string;
  employee_id: string;
  evaluation_period: string;
  definition_date: string;
  employee_comments: string;
  manager_comments: string;
  status: string;
  created_at: string;
  employee: Employee;
  individual_goals: Array<{
    goal_number: number;
    goal_description: string;
    measurement_and_expected_results: string;
  }>;
  competency_behaviors: Array<{
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
}

export function GoalDefinitionsList({ type, onBack, filterStatus: initialFilterStatus }: GoalDefinitionsListProps) {
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
              department:departments!employees_department_id_fkey (name)
            ),
            individual_goals (
              goal_number,
              goal_description,
              measurement_and_expected_results
            ),
            competency_behaviors (
              behavior_number,
              behavior_description
            )
          `)
          .order('created_at', { ascending: false });

        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
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
              department:departments!employees_department_id_fkey (name)
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

        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
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

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Borrador' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle, label: 'Enviado' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Aprobado' }
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
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
          <div className={`${type === 'administrative' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-green-600 to-green-700'} px-8 py-6`}>
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
                    <option value="submitted">Enviado</option>
                    <option value="approved">Aprobado</option>
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
                          {getStatusBadge(definition.status)}
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
                          className={`p-2 ${type === 'administrative' ? 'text-blue-600 hover:bg-blue-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition`}
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

      {showModal && selectedDefinition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`${type === 'administrative' ? 'bg-blue-900' : 'bg-green-900'} text-white px-6 py-4 flex items-center justify-between`}>
              <h2 className="text-xl font-bold">
                Definición de Metas - {selectedDefinition.employee.first_name} {selectedDefinition.employee.last_name}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 ${type === 'administrative' ? 'hover:bg-blue-800' : 'hover:bg-green-800'} rounded-lg transition`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-slate-700">Posición:</span>
                  <p className="text-slate-600">{selectedDefinition.employee.position}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Departamento:</span>
                  <p className="text-slate-600">{selectedDefinition.employee.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Periodo:</span>
                  <p className="text-slate-600">{selectedDefinition.evaluation_period}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Fecha de Definición:</span>
                  <p className="text-slate-600">{new Date(selectedDefinition.definition_date).toLocaleDateString('es-HN')}</p>
                </div>
              </div>

              {isAdministrative(selectedDefinition) && (
                <>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 text-lg">Metas Individuales</h3>
                    <div className="space-y-3">
                      {selectedDefinition.individual_goals.map((goal) => (
                        <div key={goal.goal_number} className="border border-slate-200 rounded-lg p-4">
                          <div className="font-semibold text-blue-900 mb-2">Meta #{goal.goal_number}</div>
                          <div className="text-sm space-y-2">
                            <div>
                              <span className="font-medium text-slate-700">Descripción:</span>
                              <p className="text-slate-600 mt-1">{goal.goal_description}</p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Medición:</span>
                              <p className="text-slate-600 mt-1">{goal.measurement_and_expected_results}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 text-lg">Competencias Conductuales/Habilidades</h3>
                    <div className="space-y-2">
                      {selectedDefinition.competency_behaviors.map((behavior) => (
                        <div key={behavior.behavior_number} className="border border-slate-200 rounded-lg p-3">
                          <span className="font-semibold text-blue-900">#{behavior.behavior_number}:</span>
                          <span className="text-slate-600 ml-2">{behavior.behavior_description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isOperative(selectedDefinition) && (
                <>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 text-lg">Funciones del Puesto y Resultados Esperados</h3>
                    <div className="space-y-3">
                      {selectedDefinition.operative_individual_goals.map((goal) => (
                        <div key={goal.goal_number} className="border border-slate-200 rounded-lg p-4">
                          <div className="font-semibold text-green-900 mb-2">#{goal.goal_number}</div>
                          <div className="text-sm space-y-2">
                            <div>
                              <span className="font-medium text-slate-700">Función:</span>
                              <p className="text-slate-600 mt-1">{goal.goal_description}</p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Resultados Esperados:</span>
                              <p className="text-slate-600 mt-1">{goal.measurement_and_expected_results}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 text-lg">Competencias Conductuales y Habilidades Técnicas</h3>
                    <div className="space-y-2">
                      {selectedDefinition.operative_safety_standards.map((standard) => (
                        <div key={standard.standard_number} className="border border-slate-200 rounded-lg p-3">
                          <span className="font-semibold text-green-900">#{standard.standard_number}:</span>
                          <span className="text-slate-600 ml-2">{standard.standard_description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedDefinition.manager_comments && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Comentarios del Jefe Inmediato</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedDefinition.manager_comments}
                  </p>
                </div>
              )}

              {selectedDefinition.employee_comments && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Comentarios del Colaborador</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedDefinition.employee_comments}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-6 py-2 ${type === 'administrative' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition font-medium`}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
