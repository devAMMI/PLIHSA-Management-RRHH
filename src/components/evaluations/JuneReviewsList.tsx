import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, User, Building2, Calendar, Clock, CheckCircle, AlertCircle, Eye, FileText, Trash2, Pencil, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditEvent } from '../../lib/auditLog';

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
  employee_code: string | null;
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
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  draft: {
    label: 'Borrador',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: Clock,
  },
  pending_signature: {
    label: 'Pendiente Firma',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: AlertCircle,
  },
  completed: {
    label: 'Finalizada',
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: CheckCircle,
  },
};

export function JuneReviewsList({
  employeeType = 'administrativo',
  statusFilter = 'all',
  onBack,
  onNew,
  onEdit,
}: JuneReviewsListProps) {
  const { systemUser, employee } = useAuth();
  const [allReviews, setAllReviews] = useState<JuneReview[]>([]);
  const [reviews, setReviews] = useState<JuneReview[]>([]);
  const [numberMap, setNumberMap] = useState<Record<string, number>>({});
  const [auditMap, setAuditMap] = useState<Record<string, AuditInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const titleMap: Record<string, string> = {
    all: 'Todas las Revisiones',
    draft: 'Borradores',
    pending_signature: 'Pendientes de Firma',
    completed: 'Finalizadas',
  };

  const accentColor = employeeType === 'operativo' ? 'orange' : 'teal';

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      let subordinateIds: string[] | null = null;
      if (systemUser?.role === 'jefe' && systemUser.employee_id) {
        const { data: subs } = await supabase
          .from('employees')
          .select('id')
          .eq('manager_id', systemUser.employee_id);
        subordinateIds = (subs || []).map((s: { id: string }) => s.id);
        if (subordinateIds.length === 0) {
          setAllReviews([]);
          setReviews([]);
          setNumberMap({});
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
          employee:employees(first_name, last_name, employee_code)
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

      const mapped: JuneReview[] = (data || []).map((r: any) => ({
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
        employee_code: r.employee?.employee_code || null,
      }));

      const sorted = [...mapped].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const nm: Record<string, number> = {};
      sorted.forEach((r, i) => { nm[r.id] = i + 1; });
      setNumberMap(nm);
      setAllReviews(mapped);
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

  useEffect(() => {
    if (!search.trim()) {
      setReviews(allReviews);
      return;
    }
    const term = search.toLowerCase();
    setReviews(
      allReviews.filter(r =>
        r.employee_name.toLowerCase().includes(term) ||
        (r.review_code || '').toLowerCase().includes(term) ||
        (r.department || '').toLowerCase().includes(term) ||
        (r.position || '').toLowerCase().includes(term) ||
        (r.employee_code || '').toLowerCase().includes(term)
      )
    );
  }, [allReviews, search]);

  const handleDelete = async (review: JuneReview) => {
    if (!window.confirm(`¿Está seguro de eliminar la revisión de ${review.employee_name}?`)) return;
    try {
      const { error } = await supabase.from('june_reviews').delete().eq('id', review.id);
      if (error) throw error;

      await logAuditEvent({
        actionType: 'deleted',
        evaluationType: employeeType === 'administrativo' ? 'revision_junio_administrativa' : 'revision_junio_operativa',
        evaluationId: review.id,
        evaluatorSystemUserId: systemUser?.id,
        evaluatorEmployeeId: employee?.id,
        evaluatedEmployeeId: review.employee_id,
        targetName: review.employee_name,
        details: `Revision de metas eliminada (${employeeType === 'administrativo' ? 'Administrativo' : 'Operativo'})`,
      });

      loadReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Error al eliminar la revisión');
    }
  };

  const getWorkflowBadge = (status: string) => {
    const badge = STATUS_CONFIG[status] || STATUS_CONFIG['draft'];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
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
          <div className={`${accentColor === 'teal' ? 'bg-gradient-to-r from-teal-600 to-teal-700' : 'bg-gradient-to-r from-orange-600 to-orange-700'} px-8 py-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-8 h-8" />
                  {titleMap[statusFilter]} — {employeeType === 'operativo' ? 'Operativo' : 'Administrativo'}
                </h1>
                <p className="text-white/80 mt-1">
                  {allReviews.length} revision{allReviews.length !== 1 ? 'es' : ''} registrada{allReviews.length !== 1 ? 's' : ''}
                  {reviews.length !== allReviews.length && (
                    <span className="ml-2 text-white/60">({reviews.length} mostradas)</span>
                  )}
                </p>
                <p className="text-white/60 text-sm mt-0.5">2da Evaluación — Revisión Junio 2026</p>
              </div>
              <button
                onClick={onNew}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-slate-800 font-semibold transition shadow-sm hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
                Nueva Revisión
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código, posición o departamento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                />
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className={`inline-block animate-spin rounded-full h-12 w-12 border-4 ${accentColor === 'teal' ? 'border-teal-500' : 'border-orange-500'} border-t-transparent`}></div>
                <p className="mt-4 text-slate-600">Cargando revisiones...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">
                  {search ? 'No se encontraron resultados' : 'No hay revisiones registradas'}
                </p>
                <p className="text-slate-500 mt-2">
                  {search ? 'Intenta con otro término de búsqueda' : 'Las revisiones aparecerán aquí una vez sean guardadas'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {numberMap[review.id] && (
                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${accentColor === 'teal' ? 'bg-teal-600' : 'bg-orange-600'}`}>
                              #{numberMap[review.id]}
                            </span>
                          )}
                          <h3 className="text-lg font-bold text-slate-800">
                            {review.employee_name}
                          </h3>
                          {getWorkflowBadge(review.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>{review.position || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{review.department || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>
                              {review.review_date
                                ? new Date(review.review_date + 'T00:00:00').toLocaleDateString('es-HN')
                                : new Date(review.created_at).toLocaleDateString('es-HN')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>Código: {review.review_code || '—'}</span>
                          <span>Emp. Código: {review.employee_code || '—'}</span>
                        </div>
                        {auditMap[review.id] && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>
                              Evaluado por:{' '}
                              <span className="font-semibold text-slate-700">{auditMap[review.id].evaluator_name}</span>
                              {' — '}
                              {(() => {
                                const { date, time } = formatGMT6(auditMap[review.id].performed_at);
                                return <span>{date}, {time} (GMT-6)</span>;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {review.status !== 'completed' && (
                          <button
                            onClick={() => onEdit(review.id)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                            title="Editar revisión"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(review.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition ${
                            accentColor === 'teal'
                              ? 'text-teal-700 bg-teal-50 hover:bg-teal-100'
                              : 'text-orange-700 bg-orange-50 hover:bg-orange-100'
                          }`}
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => handleDelete(review)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          title="Eliminar revisión"
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
    </div>
  );
}
