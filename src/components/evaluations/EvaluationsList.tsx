import { useState, useEffect } from 'react';
import { FileText, Eye, Calendar, User, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Evaluation {
  id: string;
  status: string;
  created_at: string;
  employee_name: string;
  position: string;
  employee_type: string;
  period_name: string;
  department: string;
}

export function EvaluationsList() {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filter, setFilter] = useState<'all' | 'administrativo' | 'operativo'>('all');

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const [adminResult, operativeResult] = await Promise.all([
        supabase
          .from('administrative_evaluations')
          .select(`
            id,
            status,
            created_at,
            department,
            employee_id,
            evaluation_period_id,
            employees (
              first_name,
              last_name,
              position,
              employee_type
            ),
            evaluation_periods (
              name
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('operative_evaluations')
          .select(`
            id,
            status,
            created_at,
            department,
            employee_id,
            evaluation_period_id,
            employees (
              first_name,
              last_name,
              position,
              employee_type
            ),
            evaluation_periods (
              name
            )
          `)
          .order('created_at', { ascending: false })
      ]);

      const adminEvals = (adminResult.data || []).map(item => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        employee_name: `${item.employees?.first_name} ${item.employees?.last_name}`,
        position: item.employees?.position || '',
        employee_type: item.employees?.employee_type || 'administrativo',
        period_name: item.evaluation_periods?.name || '',
        department: item.department || 'Sin departamento'
      }));

      const operativeEvals = (operativeResult.data || []).map(item => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        employee_name: `${item.employees?.first_name} ${item.employees?.last_name}`,
        position: item.employees?.position || '',
        employee_type: item.employees?.employee_type || 'operativo',
        period_name: item.evaluation_periods?.name || '',
        department: item.department || 'Sin departamento'
      }));

      setEvaluations([...adminEvals, ...operativeEvals].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading evaluations:', error);
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
      completed: 'bg-green-100 text-green-700'
    };

    const labels = {
      draft: 'Borrador',
      pending_employee: 'Pendiente Empleado',
      pending_manager: 'Pendiente Manager',
      pending_rrhh: 'Pendiente RRHH',
      completed: 'Completada'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (filter === 'all') return true;
    return evaluation.employee_type === filter;
  });

  if (loading) {
    return <div className="p-8">Cargando evaluaciones...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Evaluaciones Guardadas</h1>
        <p className="text-slate-600">Visualiza y gestiona todas las evaluaciones del sistema</p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todas ({evaluations.length})
        </button>
        <button
          onClick={() => setFilter('administrativo')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'administrativo'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Administrativas ({evaluations.filter(e => e.employee_type === 'administrativo').length})
        </button>
        <button
          onClick={() => setFilter('operativo')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'operativo'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Operativas ({evaluations.filter(e => e.employee_type === 'operativo').length})
        </button>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay evaluaciones</h3>
          <p className="text-slate-600">No se encontraron evaluaciones con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{evaluation.employee_name}</h3>
                      <p className="text-sm text-slate-600">{evaluation.position}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{evaluation.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4" />
                      <span className="capitalize">{evaluation.employee_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(evaluation.created_at).toLocaleDateString('es-HN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(evaluation.status)}
                    <span className="text-sm text-slate-500">{evaluation.period_name}</span>
                  </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Eye className="w-4 h-4" />
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
