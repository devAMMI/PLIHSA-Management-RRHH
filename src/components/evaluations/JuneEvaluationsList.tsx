import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, FileText, User, Building2, Calendar, CheckCircle, Clock, AlertCircle, Plus, ClipboardCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

const JUNE_ADMIN_PERIOD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567891';
const JUNE_OPERATIVE_PERIOD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567892';

interface JuneEvaluation {
  id: string;
  evaluation_code: string | null;
  status: string;
  review_status: string | null;
  created_at: string;
  employee_id: string;
  department: string | null;
  employee_name: string;
  position: string;
}

interface JuneEvaluationsListProps {
  type: 'administrative' | 'operative';
  statusFilter?: 'draft' | 'completed' | 'all';
  onBack: () => void;
  onNew: () => void;
  onEdit: (id: string) => void;
  onReview?: (id: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Borrador', color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  pending_signature: { label: 'Pendiente Firma', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  completed: { label: 'Finalizado', color: 'bg-green-100 text-green-700 border border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const REVIEW_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Sin Revision', color: 'bg-slate-100 text-slate-600 border border-slate-200' },
  draft: { label: 'Revision en Progreso', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  pending_signature: { label: 'Revision Pendiente Firma', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  completed: { label: 'Revision Completa', color: 'bg-green-100 text-green-700 border border-green-200' },
};

export function JuneEvaluationsList({ type, statusFilter = 'all', onBack, onNew, onEdit, onReview }: JuneEvaluationsListProps) {
  const { activeCompany } = useCompany();
  const [evaluations, setEvaluations] = useState<JuneEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const periodId = type === 'administrative' ? JUNE_ADMIN_PERIOD_ID : JUNE_OPERATIVE_PERIOD_ID;
  const table = type === 'administrative' ? 'administrative_evaluations' : 'operative_evaluations';
  const isAdmin = type === 'administrative';

  useEffect(() => {
    loadEvaluations();
  }, [activeCompany]);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from(table)
        .select(`
          id,
          evaluation_code,
          status,
          review_status,
          created_at,
          employee_id,
          department,
          employee:employees(first_name, last_name, position)
        `)
        .eq('evaluation_period_id', periodId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((e: any) => ({
        id: e.id,
        evaluation_code: e.evaluation_code,
        status: e.status,
        review_status: e.review_status || 'not_started',
        created_at: e.created_at,
        employee_id: e.employee_id,
        department: e.department,
        employee_name: e.employee ? `${e.employee.first_name} ${e.employee.last_name}` : 'Sin nombre',
        position: e.employee?.position || '',
      }));

      setEvaluations(formatted);
    } catch (error) {
      console.error('Error loading june evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = evaluations.filter(e =>
    e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.evaluation_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const title = statusFilter === 'draft' ? 'Borradores' : statusFilter === 'completed' ? 'Finalizados' : 'Todas las Evaluaciones';
  const accent = isAdmin ? 'blue' : 'orange';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">
              {title} &mdash; {isAdmin ? 'Administrativo' : 'Operativo'}
            </h1>
            <p className="text-sm text-slate-500">2da Evaluacion - Junio 2026</p>
          </div>
          <button
            onClick={onNew}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold transition shadow-sm ${
              isAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            Nueva Evaluacion
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <input
              type="text"
              placeholder="Buscar por nombre, codigo o departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">Cargando evaluaciones...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No se encontraron evaluaciones</p>
              <p className="text-slate-400 text-sm mt-1">
                {search ? 'Intenta con otro termino de busqueda' : 'Crea una nueva evaluacion para comenzar'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Colaborador</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Codigo</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Departamento</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Definicion</th>
                  {isAdmin && onReview && (
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Revision Junio</th>
                  )}
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((ev) => {
                  const statusInfo = STATUS_LABELS[ev.status] || STATUS_LABELS['draft'];
                  const reviewInfo = REVIEW_STATUS_LABELS[ev.review_status || 'not_started'];
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            <User className={`w-4 h-4 ${isAdmin ? 'text-blue-600' : 'text-orange-600'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{ev.employee_name}</p>
                            <p className="text-xs text-slate-500">{ev.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600 font-mono">{ev.evaluation_code || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {ev.department || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {new Date(ev.created_at).toLocaleDateString('es-HN')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      {isAdmin && onReview && (
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${reviewInfo.color}`}>
                            {reviewInfo.label}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(ev.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isAdmin
                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {ev.status === 'completed' ? 'Ver' : 'Editar'}
                          </button>
                          {isAdmin && onReview && (
                            <button
                              onClick={() => onReview(ev.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-teal-50 text-teal-700 hover:bg-teal-100"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              Revision
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">{filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
