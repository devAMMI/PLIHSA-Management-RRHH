import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, FileCheck2, X, Send, History, UserCheck, ShieldCheck } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*, employee:employees(first_name,last_name,employee_code,position,department:departments(name),manager:employees!employees_manager_id_fkey(first_name,last_name))')
      .order('requested_at', { ascending: false });
    if (error) setMessage({ type: 'error', text: 'No se pudieron cargar las solicitudes.' });
    setRequests((data as unknown as VacationRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { void loadRequests(); }, []);

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    return end >= start ? Math.floor((end.getTime() - start.getTime()) / 86400000) + 1 : 0;
  }, [startDate, endDate]);

  const submitRequest = async () => {
    if (!employee?.id || days < 1) { setMessage({ type: 'error', text: 'Selecciona un periodo válido.' }); return; }
    setSaving(true); setMessage(null);
    const { data, error } = await supabase.rpc('create_vacation_request', { p_start_date: startDate, p_end_date: endDate, p_days: days, p_reason: reason.trim() || null });
    if (error) setMessage({ type: 'error', text: 'No se pudo registrar la solicitud.' });
    else { setMessage({ type: 'success', text: 'Solicitud enviada. Será revisada por tu jefe directo.' }); setStartDate(''); setEndDate(''); setReason(''); await loadRequests(); }
    setSaving(false);
  };

  const advanceRequest = async (requestId: string, decision: 'approved' | 'rejected') => {
    setSaving(true); setMessage(null);
    const { error } = await supabase.rpc('advance_vacation_request', { p_request_id: requestId, p_decision: decision, p_notes: reviewNotes[requestId] || null });
    if (error) setMessage({ type: 'error', text: 'No se pudo actualizar la solicitud.' });
    else { setMessage({ type: 'success', text: decision === 'approved' ? 'Solicitud avanzada al siguiente aprobador.' : 'Solicitud rechazada.' }); await loadRequests(); }
    setSaving(false);
  };

  const ownRequests = requests.filter((r) => r.employee_id === employee?.id);
  const pendingReview = requests.filter((r) => r.status === 'pending');
  const allRequests = requests;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Gestión de ausencias</p>
          <h1 className="text-2xl font-bold text-slate-800">Vacaciones</h1>
          <p className="text-slate-500 mt-1">Solicita tus días y consulta el estado de cada aprobación.</p>
        </div>
      </div>

      {message && <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{message.text}</div>}

      {/* Section 1: Employee request form */}
      {employee && !isApprovalMode && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Send className="w-5 h-5" /></div>
            <div><h2 className="text-lg font-bold text-slate-800">Solicitar Vacaciones</h2><p className="text-sm text-slate-500">Tu solicitud pasará por tres aprobaciones: jefe directo, gerente general y RRHH.</p></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm font-medium text-slate-700">Fecha de inicio<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <label className="text-sm font-medium text-slate-700">Fecha de fin<input type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <div className="rounded-lg bg-blue-50 px-4 py-3"><p className="text-xs text-blue-600 uppercase font-semibold">Días solicitados</p><p className="text-2xl font-bold text-blue-900 mt-1">{days || '—'}</p></div>
          </div>
          <label className="block text-sm font-medium text-slate-700 mt-4">Motivo (opcional)<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 resize-none" placeholder="Comentario para tu jefe o RRHH" /></label>
          <button onClick={submitRequest} disabled={saving || !employee?.id || days < 1} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"><Send className="w-4 h-4" />Enviar solicitud</button>
        </section>
      )}

      {/* Section 2: My requests history */}
      {employee && !isApprovalMode && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><History className="w-5 h-5" /></div><h2 className="text-lg font-bold text-slate-800">Mis Solicitudes</h2></div>
          {loading ? <div className="p-10 text-center text-slate-500">Cargando...</div> : ownRequests.length === 0 ? <div className="p-10 text-center text-slate-500">No has registrado solicitudes.</div> : (
            <div className="divide-y divide-slate-100">
              {ownRequests.map((r) => <RequestRow key={r.id} request={r} />)}
            </div>
          )}
        </section>
      )}

      {/* Section 3: Admin approval panel */}
      {canReview && isApprovalMode && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div><div><h2 className="text-lg font-bold text-slate-800">Panel de Aprobaciones</h2><p className="text-sm text-slate-500">Revisa las solicitudes pendientes en tu empresa. Cada solicitud avanza: jefe directo, gerente general, RRHH.</p></div></div>
          {loading ? <div className="p-10 text-center text-slate-500">Cargando...</div> : pendingReview.length === 0 ? <div className="p-10 text-center text-slate-500">No hay solicitudes pendientes.</div> : (
            <div className="divide-y divide-slate-100">
              {pendingReview.map((r) => <ApprovalRow key={r.id} request={r} saving={saving} reviewNotes={reviewNotes} setReviewNotes={setReviewNotes} onAdvance={advanceRequest} />)}
            </div>
          )}
        </section>
      )}

      {/* Section 4: All requests (admin view) */}
      {canReview && isApprovalMode && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><FileCheck2 className="w-5 h-5" /></div><h2 className="text-lg font-bold text-slate-800">Todas las Solicitudes</h2></div>
          {loading ? <div className="p-10 text-center text-slate-500">Cargando...</div> : allRequests.length === 0 ? <div className="p-10 text-center text-slate-500">No hay solicitudes registradas.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Empleado</th>
                    <th className="px-4 py-3 text-left font-semibold">Periodo</th>
                    <th className="px-4 py-3 text-left font-semibold">Días</th>
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
                      <td className="px-4 py-3 text-slate-600">{r.days}</td>
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
      )}
    </div>
  );
}

function RequestRow({ request: r }: { request: VacationRequest }) {
  return (
    <article className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div>
        <div>
          <h3 className="font-semibold text-slate-800">{formatDate(r.start_date)} — {formatDate(r.end_date)} · <span className="text-blue-700">{r.days} días</span></h3>
          {r.reason && <p className="text-sm text-slate-500 mt-1">{r.reason}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={r.status} />
            {r.status === 'pending' && <StageBadge stage={r.workflow_stage} />}
            <span className="text-xs text-slate-400">Solicitado: {formatDateTime(r.requested_at)}</span>
          </div>
          {r.review_notes && <p className="text-sm text-slate-500 mt-1">Notas: {r.review_notes}</p>}
        </div>
      </div>
    </article>
  );
}

function ApprovalRow({ request: r, saving, reviewNotes, setReviewNotes, onAdvance }: { request: VacationRequest; saving: boolean; reviewNotes: Record<string, string>; setReviewNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>; onAdvance: (id: string, decision: 'approved' | 'rejected') => void }) {
  return (
    <article className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><UserCheck className="w-5 h-5" /></div>
        <div>
          <h3 className="font-semibold text-slate-800">{r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Empleado'}</h3>
          <p className="text-sm text-slate-600 mt-1">{r.employee?.position || ''} {r.employee?.department?.name ? `· ${r.employee.department.name}` : ''}</p>
          <p className="text-sm text-slate-600 mt-1">{formatDate(r.start_date)} — {formatDate(r.end_date)} · <strong>{r.days} días</strong></p>
          {r.reason && <p className="text-sm text-slate-500 mt-1">{r.reason}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StageBadge stage={r.workflow_stage} />
            <span className="text-xs text-slate-400">Solicitado: {formatDateTime(r.requested_at)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 lg:w-[400px]">
        <input value={reviewNotes[r.id] || ''} onChange={(e) => setReviewNotes((c) => ({ ...c, [r.id]: e.target.value }))} placeholder="Comentario (opcional)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={() => onAdvance(r.id, 'approved')} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"><Check className="w-4 h-4" />Aprobar</button>
        <button onClick={() => onAdvance(r.id, 'rejected')} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"><X className="w-4 h-4" />Rechazar</button>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-emerald-50 text-emerald-700', rejected: 'bg-red-50 text-red-700', cancelled: 'bg-slate-100 text-slate-500' };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}><Clock3 className="w-3 h-3" />{statusLabels[status] || status}</span>;
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = { pending_manager: 'bg-blue-50 text-blue-700', pending_general_manager: 'bg-indigo-50 text-indigo-700', pending_hr: 'bg-purple-50 text-purple-700', approved: 'bg-emerald-50 text-emerald-700', rejected: 'bg-red-50 text-red-700' };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[stage] || 'bg-slate-100 text-slate-600'}`}>{stageLabels[stage] || stage}</span>;
}

function formatDate(value: string): string { return new Date(`${value}T00:00:00`).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function formatDateTime(value: string): string { return new Date(value).toLocaleString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
