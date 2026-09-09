import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, FileCheck2, X } from 'lucide-react';
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
  employee?: { first_name: string; last_name: string; employee_code: string; department?: { name: string } | null } | null;
}

const reviewerRoles = ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'];
const statusLabels = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' };

export function VacationModule() {
  const { systemUser, employee } = useAuth();
  const canReview = reviewerRoles.includes(systemUser?.role || '');
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
    const { data, error } = await supabase.from('vacation_requests').select('*, employee:employees(first_name,last_name,employee_code,department:departments(name))').order('requested_at', { ascending: false });
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
    const { error } = await supabase.from('vacation_requests').insert({ employee_id: employee.id, start_date: startDate, end_date: endDate, days, reason: reason.trim() || null });
    if (error) setMessage({ type: 'error', text: 'No se pudo registrar la solicitud.' });
    else { setMessage({ type: 'success', text: 'Solicitud enviada para aprobación.' }); setStartDate(''); setEndDate(''); setReason(''); await loadRequests(); }
    setSaving(false);
  };

  const reviewRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    setSaving(true); setMessage(null);
    const { error } = await supabase.rpc('review_vacation_request', { p_request_id: requestId, p_status: status, p_review_notes: reviewNotes[requestId] || null });
    if (error) setMessage({ type: 'error', text: 'No se pudo actualizar la solicitud.' });
    else { setMessage({ type: 'success', text: status === 'approved' ? 'Solicitud aprobada.' : 'Solicitud rechazada.' }); await loadRequests(); }
    setSaving(false);
  };

  const ownRequests = requests.filter((request) => request.employee_id === employee?.id);
  const reviewRequests = canReview ? requests : [];
  const visibleRequests = canReview ? reviewRequests : ownRequests;

  return <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Gestión de ausencias</p><h1 className="text-2xl font-bold text-slate-800">Vacaciones</h1><p className="text-slate-500 mt-1">Solicita días y consulta el estado de tus periodos.</p></div><div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm"><CalendarDays className="w-5 h-5 text-blue-600" /><span className="text-sm font-medium text-slate-700">{canReview ? 'Panel de aprobación' : 'Nueva solicitud'}</span></div></div>
    {message && <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{message.text}</div>}
    {employee && <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><h2 className="text-lg font-bold text-slate-800 mb-5">Solicitar vacaciones</h2><div className="grid md:grid-cols-3 gap-4"><label className="text-sm font-medium text-slate-700">Desde<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-medium text-slate-700">Hasta<input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label><div className="rounded-lg bg-blue-50 px-4 py-3"><p className="text-xs text-blue-600 uppercase font-semibold">Días solicitados</p><p className="text-2xl font-bold text-blue-900 mt-1">{days || '—'}</p></div></div><label className="block text-sm font-medium text-slate-700 mt-4">Motivo (opcional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 resize-none" placeholder="Agrega un comentario para tu jefe o Recursos Humanos" /></label><button onClick={submitRequest} disabled={saving || !employee?.id} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"><CalendarDays className="w-4 h-4" />Enviar solicitud</button></section>}
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-6 border-b border-slate-200"><h2 className="text-lg font-bold text-slate-800">{canReview ? 'Solicitudes por aprobar' : 'Mis solicitudes'}</h2></div>{loading ? <div className="p-10 text-center text-slate-500">Cargando solicitudes...</div> : visibleRequests.length === 0 ? <div className="p-10 text-center text-slate-500">No hay solicitudes para mostrar.</div> : <div className="divide-y divide-slate-100">{visibleRequests.map((request) => <article key={request.id} className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div><div><h3 className="font-semibold text-slate-800">{request.employee ? `${request.employee.first_name} ${request.employee.last_name}` : 'Mi solicitud'}</h3><p className="text-sm text-slate-600 mt-1">{formatDate(request.start_date)} — {formatDate(request.end_date)} · <strong>{request.days} días</strong></p>{request.reason && <p className="text-sm text-slate-500 mt-1">{request.reason}</p>}<span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : request.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{request.status === 'pending' ? <Clock3 className="w-3 h-3" /> : <FileCheck2 className="w-3 h-3" />}{statusLabels[request.status]}</span></div></div>{canReview && request.status === 'pending' && <div className="flex flex-col sm:flex-row gap-2 lg:w-[360px]"><input value={reviewNotes[request.id] || ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Comentario (opcional)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button onClick={() => reviewRequest(request.id, 'approved')} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"><Check className="w-4 h-4" />Aprobar</button><button onClick={() => reviewRequest(request.id, 'rejected')} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"><X className="w-4 h-4" />Rechazar</button></div>}</article>)}</div>}</section>
  </div>;
}

function formatDate(value: string): string { return new Date(`${value}T00:00:00`).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }); }
