import { useEffect, useMemo, useState, useCallback } from 'react';
import { CalendarDays, Check, Clock3, FileCheck2, X, Send, History, UserCheck, ShieldCheck, CalendarPlus, AlertCircle, ChevronRight, XCircle, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface VacationRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  workflow_stage: string;
  requested_by: string | null;
  manager_approved_by: string | null;
  manager_approved_at: string | null;
  general_manager_approved_by: string | null;
  general_manager_approved_at: string | null;
  hr_approved_by: string | null;
  hr_approved_at: string | null;
  employee?: { first_name: string; last_name: string; employee_code: string; position: string | null; department?: { name: string } | null; manager?: { first_name: string; last_name: string } | null } | null;
}

interface VacationBalance {
  id: string;
  year: number;
  total_days: number;
  used_days: number;
  notes: string | null;
}

const stageLabels: Record<string, string> = {
  pending_manager: 'Jefe Directo',
  pending_general_manager: 'Gerente General',
  pending_hr: 'Recursos Humanos',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};
const statusLabels: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' };
const reviewerRoles = ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'];

export function VacationModule({ mode = 'request' }: { mode?: 'request' | 'approvals' }) {
  const { systemUser, employee } = useAuth();
  const canReview = reviewerRoles.includes(systemUser?.role || '');
  const isApprovalMode = mode === 'approvals';
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [balances, setBalances] = useState<VacationBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('all');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*, employee:employees(first_name,last_name,employee_code,position,department:departments(name),manager:employees!employees_manager_id_fkey(first_name,last_name))')
      .order('requested_at', { ascending: false });
    if (error) setMessage({ type: 'error', text: 'No se pudieron cargar las solicitudes.' });
    setRequests((data as unknown as VacationRequest[]) || []);
    setLoading(false);
  }, []);

  const loadBalances = useCallback(async () => {
    if (!employee?.id) return;
    const { data, error } = await supabase
      .from('vacation_balances')
      .select('id, year, total_days, used_days, notes')
      .eq('employee_id', employee.id)
      .order('year', { ascending: true });
    if (!error && data) setBalances(data as VacationBalance[]);
  }, [employee?.id]);

  useEffect(() => {
    void loadRequests();
    void loadBalances();
  }, [loadRequests, loadBalances]);

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    return end >= start ? Math.floor((end.getTime() - start.getTime()) / 86400000) + 1 : 0;
  }, [startDate, endDate]);

  const totalAssigned = balances.reduce((sum, b) => sum + b.total_days, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.used_days, 0);
  const totalAvailable = totalAssigned - totalUsed;

  const submitRequest = async () => {
    if (!employee?.id || days < 1) { setMessage({ type: 'error', text: 'Selecciona un periodo válido.' }); return; }
    if (days > totalAvailable) { setMessage({ type: 'error', text: `Solo tienes ${totalAvailable} días disponibles.` }); return; }
    setSaving(true); setMessage(null);
    const { error } = await supabase.rpc('create_vacation_request', { p_start_date: startDate, p_end_date: endDate, p_days: days, p_reason: reason.trim() || null });
    if (error) {
      setMessage({ type: 'error', text: error.message.includes('Invalid vacation period') ? 'Las fechas no son válidas.' : 'No se pudo registrar la solicitud.' });
    } else {
      setMessage({ type: 'success', text: 'Solicitud enviada. Será revisada por tu jefe directo.' });
      setStartDate(''); setEndDate(''); setReason('');
      await Promise.all([loadRequests(), loadBalances()]);
    }
    setSaving(false);
  };

  const advanceRequest = async (requestId: string, decision: 'approved' | 'rejected') => {
    setSaving(true); setMessage(null);
    const { error } = await supabase.rpc('advance_vacation_request', { p_request_id: requestId, p_decision: decision, p_notes: reviewNotes[requestId] || null });
    if (error) {
      const msg = error.message.includes('Only the') ? error.message.replace('Only the ', 'Solo ') : 'No se pudo actualizar la solicitud.';
      setMessage({ type: 'error', text: msg });
    } else {
      setMessage({ type: 'success', text: decision === 'approved' ? 'Solicitud avanzada al siguiente aprobador.' : 'Solicitud rechazada.' });
      await loadRequests();
    }
    setSaving(false);
  };

  const cancelRequest = async (requestId: string) => {
    setSaving(true); setMessage(null);
    const { error } = await supabase.rpc('cancel_vacation_request', { p_request_id: requestId });
    if (error) {
      setMessage({ type: 'error', text: 'No se pudo cancelar la solicitud.' });
    } else {
      setMessage({ type: 'success', text: 'Solicitud cancelada.' });
      await loadRequests();
    }
    setSaving(false);
  };

  const ownRequests = requests.filter((r) => r.employee_id === employee?.id);
  const pendingReview = requests.filter((r) => r.status === 'pending' && (stageFilter === 'all' || r.workflow_stage === stageFilter));
  const allRequests = requests;

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.filter((r) => r.status === 'pending').forEach((r) => {
      counts[r.workflow_stage] = (counts[r.workflow_stage] || 0) + 1;
    });
    return counts;
  }, [requests]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Gestión de ausencias</p>
          <h1 className="text-2xl font-bold text-slate-800">{isApprovalMode ? 'Aprobar Vacaciones' : 'Solicitar Vacaciones'}</h1>
          <p className="text-slate-500 mt-1">
            {isApprovalMode ? 'Revisa y aprueba las solicitudes de tu equipo.' : 'Solicita tus días de vacaciones y consulta el estado de cada aprobación.'}
          </p>
        </div>
      </div>

      {message && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Section 1: Employee request form */}
      {employee && !isApprovalMode && (
        <>
          {/* Balance summary card */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-bold">Mi Saldo de Vacaciones</h2>
                <p className="text-sm text-blue-100">Resumen de días asignados y disponibles</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-xs text-blue-100 uppercase font-semibold">Días asignados</p>
                <p className="text-3xl font-bold mt-1">{totalAssigned}</p>
              </div>
              <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-xs text-blue-100 uppercase font-semibold">Días usados</p>
                <p className="text-3xl font-bold mt-1">{totalUsed}</p>
              </div>
              <div className="bg-white/25 rounded-xl p-4 backdrop-blur-sm ring-1 ring-white/30">
                <p className="text-xs text-blue-100 uppercase font-semibold">Días disponibles</p>
                <p className="text-3xl font-bold mt-1">{totalAvailable}</p>
              </div>
            </div>
            {balances.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {balances.map((b, i) => {
                  const avail = b.total_days - b.used_days;
                  return (
                    <div key={b.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                      <span className="font-semibold">{i + 1}{i === 0 ? 'er' : i === 1 ? 'do' : i === 2 ? 'er' : 'to'} año</span>
                      <span className="text-blue-100">{b.year}-{b.year + 1}</span>
                      <span className="text-blue-200">·</span>
                      <span className={avail > 0 ? 'text-emerald-200 font-semibold' : 'text-amber-200 font-semibold'}>{avail} disp.</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Request form */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Send className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Nueva Solicitud</h2>
                <p className="text-sm text-slate-500">Tu solicitud pasará por tres aprobaciones: jefe directo, gerente general y RRHH.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="text-sm font-medium text-slate-700">
                Fecha de inicio
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (endDate && endDate < e.target.value) setEndDate(''); }} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Fecha de fin
                <input type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </label>
              <div className="rounded-lg bg-blue-50 px-4 py-3 border border-blue-100">
                <p className="text-xs text-blue-600 uppercase font-semibold">Días solicitados</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{days || '—'}</p>
                {days > 0 && totalAvailable > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">Quedarán {totalAvailable - days} días</p>
                )}
              </div>
            </div>
            {days > totalAvailable && totalAssigned > 0 && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Solo tienes {totalAvailable} días disponibles. No puedes solicitar {days} días.
              </div>
            )}
            <label className="block text-sm font-medium text-slate-700 mt-4">
              Motivo (opcional)
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Comentario para tu jefe o RRHH" />
            </label>
            <button onClick={submitRequest} disabled={saving || !employee?.id || days < 1 || (totalAssigned > 0 && days > totalAvailable)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <Send className="w-4 h-4" />
              {saving ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </section>

          {/* My requests history */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><History className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Mis Solicitudes</h2>
                <p className="text-sm text-slate-500">{ownRequests.length} solicitud{ownRequests.length !== 1 ? 'es' : ''} registrada{ownRequests.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {loading ? (
              <div className="p-10 text-center text-slate-500">Cargando...</div>
            ) : ownRequests.length === 0 ? (
              <div className="p-10 text-center">
                <CalendarPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No has registrado solicitudes todavía.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {ownRequests.map((r) => (
                  <RequestRow key={r.id} request={r} canCancel={r.status === 'pending'} onCancel={() => cancelRequest(r.id)} saving={saving} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Section 3: Admin approval panel */}
      {canReview && isApprovalMode && (
        <>
          {/* Stage filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStageFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${stageFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Todas las pendientes ({requests.filter((r) => r.status === 'pending').length})
            </button>
            {Object.entries(stageLabels).filter(([k]) => k.startsWith('pending_')).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStageFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${stageFilter === key ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {label} ({stageCounts[key] || 0})
              </button>
            ))}
          </div>

          {/* Pending approvals */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Panel de Aprobaciones</h2>
                <p className="text-sm text-slate-500">
                  {pendingReview.length === 0 ? 'No hay solicitudes pendientes.' : `${pendingReview.length} solicitud${pendingReview.length !== 1 ? 'es' : ''} esperando revisión.`}
                </p>
              </div>
            </div>
            {loading ? (
              <div className="p-10 text-center text-slate-500">Cargando...</div>
            ) : pendingReview.length === 0 ? (
              <div className="p-10 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No hay solicitudes pendientes en esta etapa.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReview.map((r) => (
                  <ApprovalRow key={r.id} request={r} saving={saving} reviewNotes={reviewNotes} setReviewNotes={setReviewNotes} onAdvance={advanceRequest} />
                ))}
              </div>
            )}
          </section>

          {/* All requests table */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><FileCheck2 className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Todas las Solicitudes</h2>
                <p className="text-sm text-slate-500">{allRequests.length} solicitud{allRequests.length !== 1 ? 'es' : ''} en total</p>
              </div>
            </div>
            {loading ? (
              <div className="p-10 text-center text-slate-500">Cargando...</div>
            ) : allRequests.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No hay solicitudes registradas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Empleado</th>
                      <th className="px-4 py-3 text-left font-semibold">Periodo</th>
                      <th className="px-4 py-3 text-center font-semibold">Días</th>
                      <th className="px-4 py-3 text-left font-semibold">Solicitado</th>
                      <th className="px-4 py-3 text-left font-semibold">Etapa</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold">Aprobado por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(r.start_date)} — {formatDate(r.end_date)}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{r.days}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(r.requested_at)}</td>
                        <td className="px-4 py-3"><StageBadge stage={r.workflow_stage} /></td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.manager_approved_at && <div className="text-xs">Jefe: {formatDateTime(r.manager_approved_at)}</div>}
                          {r.general_manager_approved_at && <div className="text-xs">Gerente: {formatDateTime(r.general_manager_approved_at)}</div>}
                          {r.hr_approved_at && <div className="text-xs">RRHH: {formatDateTime(r.hr_approved_at)}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* No employee linked */}
      {!employee && !isApprovalMode && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Tu usuario no tiene un perfil de empleado vinculado. Contacta a Recursos Humanos.</p>
        </section>
      )}
    </div>
  );
}

function RequestRow({ request: r, canCancel, onCancel, saving }: { request: VacationRequest; canCancel: boolean; onCancel: () => void; saving: boolean }) {
  return (
    <article className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><CalendarDays className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800">{formatDate(r.start_date)} — {formatDate(r.end_date)} · <span className="text-blue-700">{r.days} días</span></h3>
          {r.reason && <p className="text-sm text-slate-500 mt-1">{r.reason}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={r.status} />
            {r.status === 'pending' && <StageBadge stage={r.workflow_stage} />}
            <span className="text-xs text-slate-400">Solicitado: {formatDateTime(r.requested_at)}</span>
          </div>
          {r.review_notes && <p className="text-sm text-slate-500 mt-1">Notas: {r.review_notes}</p>}
          {r.status === 'pending' && (
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
              <StageIndicator stage={r.workflow_stage} />
            </div>
          )}
        </div>
      </div>
      {canCancel && (
        <button onClick={onCancel} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors flex-shrink-0">
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
      )}
    </article>
  );
}

function StageIndicator({ stage }: { stage: string }) {
  const stages = ['pending_manager', 'pending_general_manager', 'pending_hr'];
  const currentIndex = stages.indexOf(stage);
  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${i < currentIndex ? 'bg-emerald-500' : i === currentIndex ? 'bg-blue-500' : 'bg-slate-200'}`} />
          {i < stages.length - 1 && <div className={`w-4 h-0.5 ${i < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
        </div>
      ))}
      <span className="ml-1">{stageLabels[stage]}</span>
    </div>
  );
}

function ApprovalRow({ request: r, saving, reviewNotes, setReviewNotes, onAdvance }: { request: VacationRequest; saving: boolean; reviewNotes: Record<string, string>; setReviewNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>; onAdvance: (id: string, decision: 'approved' | 'rejected') => void }) {
  return (
    <article className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"><UserCheck className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800">{r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Empleado'}</h3>
          <p className="text-sm text-slate-600 mt-0.5">{r.employee?.position || ''} {r.employee?.department?.name ? `· ${r.employee.department.name}` : ''}</p>
          <p className="text-sm text-slate-600 mt-1">{formatDate(r.start_date)} — {formatDate(r.end_date)} · <strong>{r.days} días</strong></p>
          {r.reason && <p className="text-sm text-slate-500 mt-1">{r.reason}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StageBadge stage={r.workflow_stage} />
            <span className="text-xs text-slate-400">Solicitado: {formatDateTime(r.requested_at)}</span>
          </div>
          {r.manager_approved_at && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600">
              <Check className="w-3 h-3" /> Jefe directo aprobó el {formatDateTime(r.manager_approved_at)}
            </div>
          )}
          {r.general_manager_approved_at && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600">
              <Check className="w-3 h-3" /> Gerente general aprobó el {formatDateTime(r.general_manager_approved_at)}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 lg:w-[420px]">
        <input value={reviewNotes[r.id] || ''} onChange={(e) => setReviewNotes((c) => ({ ...c, [r.id]: e.target.value }))} placeholder="Comentario (opcional)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
        <button onClick={() => onAdvance(r.id, 'approved')} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          <Check className="w-4 h-4" /> Aprobar
        </button>
        <button onClick={() => onAdvance(r.id, 'rejected')} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
          <X className="w-4 h-4" /> Rechazar
        </button>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-emerald-50 text-emerald-700', rejected: 'bg-red-50 text-red-700', cancelled: 'bg-slate-100 text-slate-500' };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock3 className="w-3 h-3" />,
    approved: <CheckCircle2 className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
    cancelled: <X className="w-3 h-3" />,
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>{icons[status]}{statusLabels[status] || status}</span>;
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    pending_manager: 'bg-blue-50 text-blue-700',
    pending_general_manager: 'bg-cyan-50 text-cyan-700',
    pending_hr: 'bg-teal-50 text-teal-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[stage] || 'bg-slate-100 text-slate-600'}`}><ChevronRight className="w-3 h-3" />{stageLabels[stage] || stage}</span>;
}

function formatDate(value: string): string { return new Date(`${value}T00:00:00`).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function formatDateTime(value: string): string { return new Date(value).toLocaleString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
