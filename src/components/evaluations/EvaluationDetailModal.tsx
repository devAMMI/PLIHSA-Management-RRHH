import { useState, useEffect } from 'react';
import { X, User, Calendar, Building2, Briefcase, MapPin, FileText, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EvaluationDetailModalProps {
  evaluationId: string;
  evaluationType: 'administrativo' | 'operativo';
  onClose: () => void;
}

interface EvaluationDetail {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  definition_date: string | null;
  review_date: string | null;
  department: string;
  employee: {
    employee_code: string;
    first_name: string;
    last_name: string;
    position: string;
    email: string;
    hire_date: string;
    company: { name: string };
    department: { name: string } | null;
    plant: { name: string } | null;
  };
  manager: {
    first_name: string;
    last_name: string;
    position: string;
  } | null;
  evaluation_period: {
    name: string;
    start_date: string;
    end_date: string;
  };
  factors?: any[];
  competencies?: any[];
}

export function EvaluationDetailModal({ evaluationId, evaluationType, onClose }: EvaluationDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);

  useEffect(() => {
    loadEvaluationDetails();
  }, [evaluationId, evaluationType]);

  const loadEvaluationDetails = async () => {
    try {
      setLoading(true);
      const tableName = evaluationType === 'administrativo'
        ? 'administrative_evaluations'
        : 'operative_evaluations';

      const { data, error } = await supabase
        .from(tableName)
        .select(`
          id,
          status,
          created_at,
          updated_at,
          definition_date,
          review_date,
          department,
          employee_id,
          manager_id,
          evaluation_period_id,
          employees!${tableName}_employee_id_fkey (
            employee_code,
            first_name,
            last_name,
            position,
            email,
            hire_date,
            companies (name),
            departments (name),
            plants (name)
          ),
          manager:employees!${tableName}_manager_id_fkey (
            first_name,
            last_name,
            position
          ),
          evaluation_periods (
            name,
            start_date,
            end_date
          )
        `)
        .eq('id', evaluationId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEvaluation({
          id: data.id,
          status: data.status,
          created_at: data.created_at,
          updated_at: data.updated_at,
          definition_date: data.definition_date,
          review_date: data.review_date,
          department: data.department,
          employee: {
            employee_code: data.employees?.employee_code || '',
            first_name: data.employees?.first_name || '',
            last_name: data.employees?.last_name || '',
            position: data.employees?.position || '',
            email: data.employees?.email || '',
            hire_date: data.employees?.hire_date || '',
            company: { name: data.employees?.companies?.name || '' },
            department: data.employees?.departments ? { name: data.employees.departments.name } : null,
            plant: data.employees?.plants ? { name: data.employees.plants.name } : null
          },
          manager: data.manager ? {
            first_name: data.manager.first_name,
            last_name: data.manager.last_name,
            position: data.manager.position
          } : null,
          evaluation_period: {
            name: data.evaluation_periods?.name || '',
            start_date: data.evaluation_periods?.start_date || '',
            end_date: data.evaluation_periods?.end_date || ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading evaluation details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-700',
      pending_employee: 'bg-yellow-100 text-yellow-700',
      pending_manager: 'bg-orange-100 text-orange-700',
      pending_rrhh: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      submitted: 'bg-indigo-100 text-indigo-700',
      approved: 'bg-emerald-100 text-emerald-700'
    };

    const labels = {
      draft: 'Borrador',
      pending_employee: 'Pendiente Empleado',
      pending_manager: 'Pendiente Manager',
      pending_rrhh: 'Pendiente RRHH',
      completed: 'Completada',
      submitted: 'Enviada',
      approved: 'Aprobada'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-slate-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-red-600">No se encontró la evaluación</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Detalle de Evaluación</h2>
            <p className="text-sm text-slate-600 mt-1">ID: {evaluation.id.slice(0, 8)}...</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Estado de la Evaluación</h3>
              {getStatusBadge(evaluation.status)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Tipo de Evaluación</p>
                <p className="font-medium text-slate-800 capitalize">{evaluationType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Período</p>
                <p className="font-medium text-slate-800">{evaluation.evaluation_period.name}</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Empleado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Código de Empleado</p>
                <p className="font-medium text-slate-800">{evaluation.employee.employee_code}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Nombre Completo</p>
                <p className="font-medium text-slate-800">
                  {evaluation.employee.first_name} {evaluation.employee.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Posición</p>
                <p className="font-medium text-slate-800">{evaluation.employee.position}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Email</p>
                <p className="font-medium text-slate-800">{evaluation.employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Fecha de Contratación</p>
                <p className="font-medium text-slate-800">
                  {new Date(evaluation.employee.hire_date).toLocaleDateString('es-HN')}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Información Organizacional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Empresa</p>
                <p className="font-medium text-slate-800">{evaluation.employee.company.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Departamento</p>
                <p className="font-medium text-slate-800">
                  {evaluation.employee.department?.name || evaluation.department || 'No asignado'}
                </p>
              </div>
              {evaluation.employee.plant && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Planta</p>
                  <p className="font-medium text-slate-800">{evaluation.employee.plant.name}</p>
                </div>
              )}
            </div>
          </div>

          {evaluation.manager && (
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Jefe Directo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Nombre</p>
                  <p className="font-medium text-slate-800">
                    {evaluation.manager.first_name} {evaluation.manager.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Posición</p>
                  <p className="font-medium text-slate-800">{evaluation.manager.position}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Fechas Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Fecha de Creación</p>
                <p className="font-medium text-slate-800">
                  {new Date(evaluation.created_at).toLocaleString('es-HN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Última Actualización</p>
                <p className="font-medium text-slate-800">
                  {new Date(evaluation.updated_at).toLocaleString('es-HN')}
                </p>
              </div>
              {evaluation.definition_date && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Fecha de Definición</p>
                  <p className="font-medium text-slate-800">
                    {new Date(evaluation.definition_date).toLocaleDateString('es-HN')}
                  </p>
                </div>
              )}
              {evaluation.review_date && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Fecha de Revisión</p>
                  <p className="font-medium text-slate-800">
                    {new Date(evaluation.review_date).toLocaleDateString('es-HN')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-600 mb-1">Período de Evaluación</p>
                <p className="font-medium text-slate-800">
                  {new Date(evaluation.evaluation_period.start_date).toLocaleDateString('es-HN')} - {' '}
                  {new Date(evaluation.evaluation_period.end_date).toLocaleDateString('es-HN')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <Clock className="w-4 h-4 inline mr-2" />
              Para ver los factores y competencias evaluadas, esta funcionalidad estará disponible próximamente.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
