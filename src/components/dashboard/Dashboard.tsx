import { useEffect, useState } from 'react';
import {
  Users, ClipboardCheck, TrendingUp, Target, CheckCircle2, Clock,
  Search, FileText, Briefcase, MapPin, Calendar, X,
  BarChart2, Award, AlertCircle, ChevronRight, Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { DigitalClock } from '../ui/DigitalClock';
import EvaluacionAdministrativa from '../evaluations/EvaluacionAdministrativa';

interface PhaseStats {
  total: number;
  completed: number;
  draft: number;
  pending: number;
  loading: boolean;
}

interface DeptStat {
  department: string;
  total: number;
}

interface RatingStat {
  rating: string;
  count: number;
}

interface Evaluation {
  id: string;
  status: string;
  created_at: string;
  definition_date: string;
  employee_id: string;
  evaluation_period_id: string;
  employees: {
    first_name: string;
    last_name: string;
    employee_code: string;
    position: string;
    departments: { name: string };
    work_locations: { name: string };
  };
  evaluation_periods: {
    name: string;
    period_number: number;
    year: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:            { label: 'Borrador',       color: 'text-slate-600',  bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  pending_employee: { label: 'Pend. Empleado', color: 'text-blue-700',   bg: 'bg-blue-50',     dot: 'bg-blue-500' },
  pending_manager:  { label: 'Pend. Jefe',     color: 'text-amber-700',  bg: 'bg-amber-50',    dot: 'bg-amber-500' },
  pending_rrhh:     { label: 'Pend. RRHH',     color: 'text-orange-700', bg: 'bg-orange-50',   dot: 'bg-orange-500' },
  completed:        { label: 'Completada',      color: 'text-green-700',  bg: 'bg-green-50',    dot: 'bg-green-500' },
};

const RATING_LABELS: Record<string, string> = {
  below_expectations:   'Debajo de Expectativas',
  needs_improvement:    'Desempeño a Mejorar',
  meets_expectations:   'Cumple Expectativas',
  exceeds_expectations: 'Supera Expectativas',
};

const RATING_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  below_expectations:   { bar: 'bg-red-400',    badge: 'bg-red-50 text-red-700',     text: 'text-red-600' },
  needs_improvement:    { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700', text: 'text-amber-600' },
  meets_expectations:   { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700',   text: 'text-blue-600' },
  exceeds_expectations: { bar: 'bg-green-500',  badge: 'bg-green-50 text-green-700', text: 'text-green-600' },
};

const emptyPhase: PhaseStats = { total: 0, completed: 0, draft: 0, pending: 0, loading: true };

export function Dashboard() {
  const { activeCompany } = useCompany();
  const { systemUser } = useAuth();

  const [totalEmployees, setTotalEmployees] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const [phase1, setPhase1] = useState<PhaseStats>({ ...emptyPhase });
  const [phase2, setPhase2] = useState<PhaseStats>({ ...emptyPhase });
  const [phase3, setPhase3] = useState<PhaseStats>({ ...emptyPhase });

  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStat[]>([]);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [evalsLoading, setEvalsLoading] = useState(true);
  const [periods, setPeriods] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const canSeeEvaluations = systemUser && ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'].includes(systemUser.role);
  const isSuperAdmin = systemUser?.role === 'superadmin';

  useEffect(() => {
    if (activeCompany) {
      loadAll();
    }
  }, [activeCompany]);

  useEffect(() => {
    filterEvaluations();
  }, [evaluations, searchTerm, statusFilter, periodFilter]);

  const loadAll = async () => {
    await Promise.all([
      loadEmployeeCount(),
      loadPhase1(),
      loadPhase2(),
      loadPhase3(),
      loadDeptStats(),
      loadRatingStats(),
      canSeeEvaluations ? loadEvaluations() : Promise.resolve(),
      canSeeEvaluations ? loadPeriods() : Promise.resolve(),
    ]);
  };

  const loadEmployeeCount = async () => {
    if (!activeCompany) return;
    setStatsLoading(true);
    try {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', activeCompany.id)
        .eq('status', 'active');
      setTotalEmployees(count || 0);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPhase1 = async () => {
    setPhase1(s => ({ ...s, loading: true }));
    try {
      const { data } = await supabase.from('goal_definitions' as any).select('id, status');
      const rows = (data as any[]) || [];
      setPhase1({
        total: rows.length,
        completed: rows.filter(r => r.status === 'approved').length,
        draft: rows.filter(r => r.status === 'draft').length,
        pending: rows.filter(r => ['pending_review', 'pending_approval'].includes(r.status)).length,
        loading: false,
      });
    } catch {
      setPhase1(s => ({ ...s, loading: false }));
    }
  };

  const loadPhase2 = async () => {
    setPhase2(s => ({ ...s, loading: true }));
    try {
      const { data } = await supabase.from('june_reviews' as any).select('id, status');
      const rows = (data as any[]) || [];
      setPhase2({
        total: rows.length,
        completed: rows.filter(r => r.status === 'completed').length,
        draft: rows.filter(r => r.status === 'draft').length,
        pending: rows.filter(r => r.status === 'pending_signature').length,
        loading: false,
      });
    } catch {
      setPhase2(s => ({ ...s, loading: false }));
    }
  };

  const loadPhase3 = async () => {
    setPhase3(s => ({ ...s, loading: true }));
    try {
      const [adminRes, operRes] = await Promise.all([
        supabase.from('administrative_evaluations').select('id, status'),
        supabase.from('operative_evaluations').select('id, status'),
      ]);
      const rows = [...((adminRes.data as any[]) || []), ...((operRes.data as any[]) || [])];
      setPhase3({
        total: rows.length,
        completed: rows.filter(r => r.status === 'completed').length,
        draft: rows.filter(r => r.status === 'draft').length,
        pending: rows.filter(r => ['pending_employee', 'pending_manager', 'pending_rrhh'].includes(r.status)).length,
        loading: false,
      });
    } catch {
      setPhase3(s => ({ ...s, loading: false }));
    }
  };

  const loadDeptStats = async () => {
    const { data: deps } = await supabase.from('departments').select('id, name');
    const { data: emps } = await supabase.from('employees').select('id, department_id, status');
    if (!deps || !emps) return;
    const employees = emps as any[];
    const result = (deps as any[])
      .map(dep => ({
        department: dep.name,
        total: employees.filter(e => e.department_id === dep.id && e.status === 'active').length,
      }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
    setDeptStats(result);
  };

  const loadRatingStats = async () => {
    const [goalRatings, compRatings] = await Promise.all([
      supabase.from('june_review_goals' as any).select('rating').not('rating', 'is', null),
      supabase.from('june_review_competencies' as any).select('rating').not('rating', 'is', null),
    ]);
    const allRatings = [
      ...((goalRatings.data as any[]) || []),
      ...((compRatings.data as any[]) || []),
    ];
    const ratingMap: Record<string, number> = {};
    for (const row of allRatings) {
      if (row.rating) ratingMap[row.rating] = (ratingMap[row.rating] || 0) + 1;
    }
    setRatingStats(Object.entries(ratingMap).map(([rating, count]) => ({ rating, count })));
  };

  const loadPeriods = async () => {
    if (!activeCompany) return;
    const { data } = await supabase
      .from('evaluation_periods').select('*')
      .eq('company_id', activeCompany.id)
      .order('created_at', { ascending: false });
    setPeriods(data || []);
  };

  const loadEvaluations = async () => {
    setEvalsLoading(true);
    try {
      const { data, error } = await supabase
        .from('administrative_evaluations')
        .select(`
          id, status, created_at, definition_date,
          employee_id, evaluation_period_id,
          employees!administrative_evaluations_employee_id_fkey (
            first_name, last_name, employee_code, position,
            departments(name),
            work_locations(name)
          ),
          evaluation_periods(name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEvaluations(data || []);
    } finally {
      setEvalsLoading(false);
    }
  };

  const filterEvaluations = () => {
    let filtered = [...evaluations];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.employees?.first_name?.toLowerCase().includes(term) ||
        e.employees?.last_name?.toLowerCase().includes(term) ||
        e.employees?.employee_code?.toLowerCase().includes(term) ||
        e.employees?.position?.toLowerCase().includes(term)
      );
    }
    if (statusFilter) filtered = filtered.filter(e => e.status === statusFilter);
    if (periodFilter) filtered = filtered.filter(e => e.evaluation_period_id === periodFilter);
    setFilteredEvaluations(filtered);
  };

  const clearFilters = () => { setSearchTerm(''); setStatusFilter(''); setPeriodFilter(''); };
  const hasFilters = searchTerm || statusFilter || periodFilter;

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    const d = new Date(date + 'T00:00:00');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const totalRatings = ratingStats.reduce((a, b) => a + b.count, 0);
  const maxDept = deptStats.length > 0 ? Math.max(...deptStats.map(d => d.total)) : 1;

  if (editingId) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { setEditingId(null); loadEvaluations(); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            ← Volver al Dashboard
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <EvaluacionAdministrativa evaluationId={editingId} />
        </div>
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen del ciclo de evaluaciones {year}</p>
        </div>
        <DigitalClock />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Colaboradores Activos"
          value={statsLoading ? '—' : totalEmployees}
          sub="en nómina"
        />
        <KPICard
          icon={<Target className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Definición de Metas"
          value={phase1.loading ? '—' : phase1.total}
          sub={phase1.loading ? '' : `${phase1.completed} aprobadas`}
          accent="text-emerald-600"
        />
        <KPICard
          icon={<ClipboardCheck className="w-5 h-5 text-sky-600" />}
          iconBg="bg-sky-50"
          label="Revisión de Metas"
          value={phase2.loading ? '—' : phase2.total}
          sub={phase2.loading ? '' : `${phase2.completed} completadas`}
          accent="text-sky-600"
        />
        <KPICard
          icon={<Award className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-50"
          label="Evaluación Final"
          value={phase3.loading ? '—' : phase3.total}
          sub={phase3.loading ? '' : `${phase3.completed} completadas`}
          accent="text-orange-600"
        />
      </div>

      {/* Ciclo de Evaluaciones - Fases */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-semibold text-slate-700">Ciclo de Evaluaciones {year} — Estado por Fase</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <PhaseBlock
            number={1}
            title="Definición de Metas"
            period="Enero — Febrero"
            stats={phase1}
            color={{ ring: 'ring-emerald-200', bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' }}
            completedLabel="Aprobadas"
            pendingLabel="En revisión"
          />
          <PhaseBlock
            number={2}
            title="Revisión de Metas"
            period="Junio — Julio"
            stats={phase2}
            color={{ ring: 'ring-sky-200', bg: 'bg-sky-600', light: 'bg-sky-50', text: 'text-sky-700', bar: 'bg-sky-500' }}
            completedLabel="Completadas"
            pendingLabel="Pend. firma"
          />
          <PhaseBlock
            number={3}
            title="Evaluación Final"
            period="Diciembre"
            stats={phase3}
            color={{ ring: 'ring-orange-200', bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' }}
            completedLabel="Completadas"
            pendingLabel="En proceso"
          />
        </div>
      </div>

      {/* Departamentos + Calificaciones */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Departamentos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-700">Colaboradores por Departamento</h3>
            </div>
            <div className="p-5 space-y-3">
              {deptStats.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos disponibles</p>
              ) : deptStats.map(dept => (
                <div key={dept.department} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0 text-xs font-medium text-slate-600 truncate">{dept.department}</div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(dept.total / maxDept) * 100}%` }}
                    />
                  </div>
                  <div className="w-6 text-right text-xs font-bold text-slate-700">{dept.total}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Calificaciones Revisión de Metas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-700">Calificaciones — Revisión de Metas</h3>
            </div>
            <div className="p-5 space-y-3">
              {ratingStats.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <AlertCircle className="w-7 h-7 text-slate-300" />
                  <p className="text-sm text-slate-400">Sin calificaciones registradas</p>
                </div>
              ) : (
                ['exceeds_expectations', 'meets_expectations', 'needs_improvement', 'below_expectations'].map(key => {
                  const stat = ratingStats.find(r => r.rating === key);
                  if (!stat) return null;
                  const colors = RATING_COLORS[key];
                  const pct = totalRatings > 0 ? Math.round((stat.count / totalRatings) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-36 flex-shrink-0 text-xs font-medium text-slate-600 truncate">{RATING_LABELS[key]}</div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-14 text-right flex-shrink-0">
                        <span className="text-xs font-bold text-slate-700">{stat.count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Evaluaciones Administrativas (Evaluación Final) */}
      {canSeeEvaluations && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
              <h3 className="text-base font-semibold text-slate-800">Evaluación Final — Administrativos</h3>
            </div>
            <p className="text-sm text-slate-500 ml-8">Evaluaciones de desempeño del personal administrativo</p>
          </div>

          <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
            {[
              { label: 'Total',       value: evalsLoading ? '—' : evaluations.length,                                                               color: 'text-slate-800' },
              { label: 'Completadas', value: evalsLoading ? '—' : evaluations.filter(e => e.status === 'completed').length,                         color: 'text-green-600' },
              { label: 'Borradores',  value: evalsLoading ? '—' : evaluations.filter(e => e.status === 'draft').length,                             color: 'text-slate-500' },
              { label: 'En Proceso',  value: evalsLoading ? '—' : evaluations.filter(e => ['pending_employee','pending_manager','pending_rrhh'].includes(e.status)).length, color: 'text-orange-600' },
            ].map(s => (
              <div key={s.label} className="px-6 py-4 text-center">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o posición..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white min-w-[160px]"
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="pending_employee">Pend. Empleado</option>
                <option value="pending_manager">Pend. Jefe</option>
                <option value="pending_rrhh">Pend. RRHH</option>
                <option value="completed">Completada</option>
              </select>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white min-w-[200px]"
              >
                <option value="">Todos los períodos</option>
                {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {evalsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-5 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                        <div className="h-3 bg-slate-200 rounded w-20" />
                      </div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No se encontraron evaluaciones</p>
                <p className="text-slate-400 text-sm">
                  {hasFilters ? 'Intenta cambiar los filtros de búsqueda' : 'Aún no hay evaluaciones registradas'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredEvaluations.map(evaluation => {
                  const sc = STATUS_CONFIG[evaluation.status] || STATUS_CONFIG.draft;
                  const emp = evaluation.employees;
                  const initials = `${emp?.first_name?.[0] || ''}${emp?.last_name?.[0] || ''}`;
                  return (
                    <div
                      key={evaluation.id}
                      className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {emp?.first_name} {emp?.last_name}
                          </p>
                          <p className="text-xs text-slate-400">{emp?.employee_code}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium">{emp?.position || 'Sin posición'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{emp?.departments?.name} · {emp?.work_locations?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{evaluation.evaluation_periods?.name || 'Sin período'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <button
                          onClick={() => setEditingId(evaluation.id)}
                          className="px-3 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PhaseColors {
  ring: string;
  bg: string;
  light: string;
  text: string;
  bar: string;
}

function PhaseBlock({
  number, title, period, stats, color, completedLabel, pendingLabel,
}: {
  number: number;
  title: string;
  period: string;
  stats: PhaseStats;
  color: PhaseColors;
  completedLabel: string;
  pendingLabel: string;
}) {
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${color.bg} text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm`}>
          {number}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-400">{period}</p>
        </div>
      </div>

      {stats.loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-2 bg-slate-100 rounded-full" />
          <div className="h-6 bg-slate-100 rounded w-20" />
        </div>
      ) : (
        <>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-slate-500">Progreso</span>
              <span className={`text-xs font-bold ${color.text}`}>{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color.bar} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`${color.light} rounded-xl p-3 text-center`}>
              <p className="text-xs text-slate-500 mb-0.5">Total</p>
              <p className={`text-lg font-bold text-slate-800`}>{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-0.5">{completedLabel}</p>
              <p className="text-lg font-bold text-green-700">{stats.completed}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Borrador</p>
              <p className="text-lg font-bold text-slate-600">{stats.draft}</p>
            </div>
          </div>

          {stats.pending > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{stats.pending} {pendingLabel}</span>
            </div>
          )}
          {stats.total === 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Sin registros aún</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KPICard({
  icon, iconBg, label, value, sub, accent = 'text-slate-800',
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium leading-tight">{label}</p>
        <p className={`text-2xl font-bold ${accent} leading-tight`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
