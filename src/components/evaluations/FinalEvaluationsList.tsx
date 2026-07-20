import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { FileText, Eye, Calendar, User, Briefcase, Building2, ArrowLeft, Plus } from 'lucide-react';

interface FinalEvaluation {
  id: string;
  evaluation_code: string;
  status: string;
  evaluation_date: string;
  created_at: string;
  employee_name: string;
  position: string;
  department: string;
  final_score: number | null;
}

interface FinalEvaluationsListProps {
  onBack?: () => void;
  onNewEvaluation?: () => void;
  onEditEvaluation?: (evaluationId: string) => void;
}

export function FinalEvaluationsList({ onBack, onNewEvaluation, onEditEvaluation }: FinalEvaluationsListProps) {
  const { activeCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<FinalEvaluation[]>([]);

  useEffect(() => {
    if (activeCompany) {
      loadEvaluations();
    }
  }, [activeCompany]);

  const loadEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('final_administrative_evaluations')
        .select(`
          id,
          evaluation_code,
          status,
          evaluation_date,
          created_at,
          department,
          employee_id,
          employees!final_administrative_evaluations_employee_id_fkey (
            id,
            first_name,
            last_name,
            position
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(item => ({
        id: item.id,
        evaluation_code: item.evaluation_code || '',
        status: item.status,
        evaluation_date: item.evaluation_date || '',
        created_at: item.created_at,
        employee_name: item.employees ? `${item.employees.first_name} ${item.employees.last_name}` : 'Sin nombre',
        position: item.employees?.position || '',
        department: item.department || 'Sin departamento',
        final_score: null
      }));

      const goalScores = await Promise.all(formatted.map(async (ev) => {
        const [goalsRes, compsRes] = await Promise.all([
          supabase.from('final_evaluation_individual_goals').select('numeric_score').eq('evaluation_id', ev.id),
          supabase.from('final_evaluation_competencies').select('numeric_score').eq('evaluation_id', ev.id)
        ]);
        const goals = (goalsRes.data || []).filter(g => g.numeric_score != null);
        const comps = (compsRes.data || []).filter(c => c.numeric_score != null);
        const goalsAvg = goals.length > 0 ? goals.reduce((a, g) => a + Number(g.numeric_score), 0) / goals.length : 0;
        const compsAvg = comps.length > 0 ? comps.reduce((a, c) => a + Number(c.numeric_score), 0) / comps.length : 0;
        if (goals.length === 0 && comps.length === 0) return null;
        if (goals.length === 0) return compsAvg;
        if (comps.length === 0) return goalsAvg;
        return (goalsAvg * 0.6) + (compsAvg * 0.4);
      }));

      setEvaluations(formatted.map((ev, i) => ({ ...ev, final_score: goalScores[i] })));
    } catch (error) {
      console.error('Error loading final evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      pending_signature: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700'
    };
    const labels: Record<string, string> = {
      draft: 'Borrador',
      pending_signature: 'Pendiente Firma',
      completed: 'Completada'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 10) return 'text-green-600';
    if (score >= 8) return 'text-blue-600';
    if (score >= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return <div className="p-8">Cargando evaluaciones...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
          )}
          <h2 className="text-2xl font-bold text-slate-800">Evaluaciones Finales Guardadas</h2>
        </div>
        {onNewEvaluation && (
          <button
            onClick={onNewEvaluation}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nueva Evaluación
          </button>
        )}
      </div>

      {evaluations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay evaluaciones finales</h3>
          <p className="text-slate-500 mb-6">Aún no se ha realizado ninguna evaluación final administrativa.</p>
          {onNewEvaluation && (
            <button
              onClick={onNewEvaluation}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Evaluación
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Posición</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Departamento</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Calificación Final</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{ev.employee_name}</p>
                          <p className="text-xs text-slate-500">{ev.evaluation_code || 'Sin código'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{ev.position || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{ev.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ev.final_score != null ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold ${getScoreColor(ev.final_score)}`}>{ev.final_score.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Sin calificar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(ev.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleDateString('es-HN') : new Date(ev.created_at).toLocaleDateString('es-HN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {onEditEvaluation && (
                        <button
                          onClick={() => onEditEvaluation(ev.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Ver/Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
