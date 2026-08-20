import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, User, Building2, Calendar, Clock, CheckCircle, AlertCircle, Eye, FileText, Trash2, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { JuneReviewFormNew } from './JuneReviewFormNew';

interface JuneReview {
  id: string;
  review_code: string | null;
  review_date: string | null;
  department: string | null;
  position: string | null;
  status: string;
  created_at: string;
  employee_id: string;
  employee_name: string;
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

interface JuneReviewsListProps {
  employeeType?: 'administrativo' | 'operativo';
  statusFilter?: 'draft' | 'pending_signature' | 'completed' | 'all';
  onBack: () => void;
  onNew: () => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Borrador',
    color: 'bg-amber-100 text-amber-700 border border-amber-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  pending_signature: {
    label: 'Pendiente Firma',
    color: 'bg-blue-100 text-blue-700 border border-blue-200',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  completed: {
    label: 'Finalizada',
    color: 'bg-green-100 text-green-700 border border-green-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

export function JuneReviewsList({
  employeeType = 'administrativo',
  statusFilter = 'all',
  onBack,
  onNew,
  onEdit,
  onView,
}: JuneReviewsListProps) {
  const { systemUser } = useAuth();
  const [reviews, setReviews] = useState<JuneReview[]>([]);
  const [auditMap, setAuditMap] = useState<Record<string, AuditInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalReviewId, setModalReviewId] = useState<string | null>(null);
  const [modalViewOnly, setModalViewOnly] = useState(false);

  const titleMap: Record<string, string> = {
    all: 'Todas las Revisiones',
    draft: 'Borradores',
    pending_signature: 'Pendientes de Firma',
    completed: 'Finalizadas',
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      // For jefe role, restrict to their subordinates
      let subordinateIds: string[] | null = null;
      if (systemUser?.role === 'jefe' && systemUser.employee_id) {
        const { data: subs } = await supabase
          .from('employees')
          .select('id')
          .eq('manager_id', systemUser.employee_id);
        subordinateIds = (subs || []).map((s: { id: string }) => s.id);
        if (subordinateIds.length === 0) {
          setReviews([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from('june_reviews')
        .select(`
          id,
          review_code,
          review_date,
          department,
          position,
          status,
          created_at,
          employee_id,
          employee:employees(first_name, last_name)
        `)
        .eq('employee_type', employeeType)
        .order('created_at', { ascending: false });

      if (subordinateIds) {
        query = query.in('employee_id', subordinateIds);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((r: { id: string; review_code: string | null; review_date: string | null; department: string | null; position: string | null; status: string; created_at: string; employee_id: string; employee: { first_name: string; last_name: string } | null }) => ({
        id: r.id,
        review_code: r.review_code,
        review_date: r.review_date,
        department: r.department,
        position: r.position,
        status: r.status,
        created_at: r.created_at,
        employee_id: r.employee_id,
        employee_name: r.employee
          ? `${r.employee.first_name} ${r.employee.last_name}`
          : 'Sin nombre',
      }));
      setReviews(mapped);

      if (mapped.length > 0) {
        const ids = mapped.map((r) => r.id);
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
    } catch (err) {
      console.error('Error loading june reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeType, statusFilter, systemUser]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDelete = async (id: string, employeeName: string) => {
    if (!window.confirm(`\u00BFEst\u00E1 seguro de eliminar la revisi\u00F3n de ${employeeName}?`)) return;
    try {
      const { error } = await supabase.from('june_reviews').delete().eq('id', id);
      if (error) throw error;
      await loadReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const filtered = reviews.filter(
    (r) =>
      r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.review_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const accentBg = employeeType === 'operativo' ? 'bg-orange-600' : 'bg-teal-600';
  const accentGradient = employeeType === 'operativo' ? 'from-orange-600 to-orange-700' : 'from-teal-600 to-teal-700';
  const accentText = employeeType === 'operativo' ? 'text-orange-500' : 'text-teal-500';
  const accentHover = employeeType === 'operativo' ? 'text-orange-700 bg-orange-50 hover:bg-orange-100' : 'text-teal-700 bg-teal-50 hover:bg-teal-100';
  const accentSpinner = employeeType === 'operativo' ? 'border-orange-500' : 'border-teal-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className={`bg-gradient-to-r ${accentGradient} px-8 py-6`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-8 h-8" />
                  Revisión de Metas — {employeeType === 'operativo' ? 'Operativo' : 'Administrativo'}
                </h1>
                <p className="text-white/80 mt-1">
                  {titleMap[statusFilter]} · {reviews.length} revisión{reviews.length !== 1 ? 'es' : ''} registrada{reviews.length !== 1 ? 's' : ''}
                  {filtered.length !== reviews.length && <span className="ml-2 text-white/60">({filtered.length} mostradas)</span>}
                </p>
              </div>
              <button onClick={onNew} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 font-semibold transition shadow-sm">
                <Plus className="w-4 h-4" />
                Nueva Revisión
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o departamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className={`inline-block animate-spin rounded-full h-12 w-12 border-4 ${accentSpinner} border-t-transparent`} />
                <p className="mt-4 text-slate-600">Cargando revisiones...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">{search ? 'No se encontraron resultados' : 'No hay revisiones registradas'}</p>
                <p className="text-slate-500 mt-2">{search ? 'Intenta con otro término de búsqueda' : 'Las revisiones aparecerán aquí una vez sean guardadas'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((review, index) => {
                  const statusInfo = STATUS_CONFIG[review.status] || STATUS_CONFIG.draft;
                  const reviewDate = review.review_date
                    ? new Date(review.review_date + 'T00:00:00').toLocaleDateString('es-HN')
                    : new Date(review.created_at).toLocaleDateString('es-HN');
                  return (
                    <div key={review.id} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${accentBg}`}>#{reviews.length - index}</span>
                            <h3 className="text-lg font-bold text-slate-800">{review.employee_name}</h3>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-2"><User className={`w-4 h-4 ${accentText}`} /><span>{review.position || 'Sin puesto'}</span></div>
                            <div className="flex items-center gap-2"><Building2 className={`w-4 h-4 ${accentText}`} /><span>{review.department || 'Sin departamento'}</span></div>
                            <div className="flex items-center gap-2"><Calendar className={`w-4 h-4 ${accentText}`} /><span>{reviewDate}</span></div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <span>Código: {review.review_code || '—'}</span>
                            <span>Tipo: {employeeType === 'operativo' ? 'Operativo' : 'Administrativo'}</span>
                          </div>
                          {auditMap[review.id] && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>Evaluado por: <span className="font-semibold text-slate-700">{auditMap[review.id].evaluator_name}</span> — {(() => { const { date, time } = formatGMT6(auditMap[review.id].performed_at); return <span>{date}, {time} (GMT-6)</span>; })()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => { setModalReviewId(review.id); setModalViewOnly(true); }} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition ${accentHover}`}>
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                          {review.status !== 'completed' && (
                            <button onClick={() => { setModalReviewId(review.id); setModalViewOnly(false); }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
                              <FileText className="w-4 h-4" />
                              Editar
                            </button>
                          )}
                          <button onClick={() => handleDelete(review.id, review.employee_name)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalReviewId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-50 rounded-xl shadow-xl max-w-6xl w-full my-4 relative">
            <button
              onClick={() => setModalReviewId(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-lg shadow hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <div className="max-h-[calc(100vh-32px)] overflow-y-auto">
              <JuneReviewFormNew
                reviewId={modalReviewId}
                employeeType={employeeType}
                viewOnly={modalViewOnly}
                onCancel={() => setModalReviewId(null)}
                onSaved={() => { setModalReviewId(null); loadReviews(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
