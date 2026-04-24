import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, User, Building2, Calendar, Clock, CheckCircle, AlertCircle, Eye, FileText, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

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
}: JuneReviewsListProps) {
  const { systemUser } = useAuth();
  const [reviews, setReviews] = useState<JuneReview[]>([]);
  const [auditMap, setAuditMap] = useState<Record<string, AuditInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
              {titleMap[statusFilter]} &mdash;{' '}
              {employeeType === 'operativo' ? 'Operativo' : 'Administrativo'}
            </h1>
            <p className="text-sm text-slate-500">2da Evaluacion &mdash; Revision Junio 2026</p>
          </div>
          <button
            onClick={onNew}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold transition shadow-sm ${
              employeeType === 'operativo'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            Nueva Revision
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <input
              type="text"
              placeholder="Buscar por nombre, codigo o departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">Cargando revisiones...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No se encontraron revisiones</p>
              <p className="text-slate-400 text-sm mt-1">
                {search
                  ? 'Intenta con otro termino de busqueda'
                  : 'Crea una nueva revision para comenzar'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Codigo
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Departamento
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Fecha Revision
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((review) => {
                  const statusInfo = STATUS_CONFIG[review.status] || STATUS_CONFIG['draft'];
                  return (
                    <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              employeeType === 'operativo' ? 'bg-orange-100' : 'bg-teal-100'
                            }`}
                          >
                            <User
                              className={`w-4 h-4 ${
                                employeeType === 'operativo' ? 'text-orange-600' : 'text-teal-600'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {review.employee_name}
                            </p>
                            <p className="text-xs text-slate-500">{review.position || '\u2014'}</p>
                            {auditMap[review.id] && (
                              <div className="flex items-center gap-1 mt-1">
                                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="text-xs text-slate-500">
                                  Evaluado por:{' '}
                                  <span className="font-semibold text-slate-700">{auditMap[review.id].evaluator_name}</span>
                                  {' \u2014 '}
                                  {(() => {
                                    const { date, time } = formatGMT6(auditMap[review.id].performed_at);
                                    return <span>{date}, {time} (GMT-6)</span>;
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600 font-mono">
                          {review.review_code || '\u2014'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {review.department || '\u2014'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {review.review_date
                            ? new Date(review.review_date + 'T00:00:00').toLocaleDateString('es-HN')
                            : new Date(review.created_at).toLocaleDateString('es-HN')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(review.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              employeeType === 'operativo'
                                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {review.status === 'completed' ? 'Ver' : 'Editar'}
                          </button>
                          <button
                            onClick={() => handleDelete(review.id, review.employee_name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">
              {filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado
              {filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
