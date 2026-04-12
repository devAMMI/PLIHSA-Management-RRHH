import { useState, useEffect } from 'react';
import { BarChart2, Users, ClipboardCheck, TrendingUp, Award, AlertCircle, Clock, CheckCircle, FileText, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DeptStat {
  department: string;
  total: number;
  active: number;
}

interface RatingStat {
  rating: string;
  count: number;
}

interface ReviewRow {
  employee_name: string;
  review_date: string;
  status: string;
  employee_type: string;
}

interface Summary {
  total_employees: number;
  total_active_employees: number;
  total_june_reviews: number;
  completed_june_reviews: number;
  draft_june_reviews: number;
}

const RATING_LABELS: Record<string, string> = {
  below_expectations: 'Debajo de Expectativas',
  needs_improvement: 'Desempeño a Mejorar',
  meets_expectations: 'Cumple Expectativas',
  exceeds_expectations: 'Supera Expectativas',
};

const RATING_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  below_expectations:  { bg: 'bg-red-50',    bar: 'bg-red-400',    text: 'text-red-700' },
  needs_improvement:   { bg: 'bg-amber-50',  bar: 'bg-amber-400',  text: 'text-amber-700' },
  meets_expectations:  { bg: 'bg-blue-50',   bar: 'bg-blue-500',   text: 'text-blue-700' },
  exceeds_expectations:{ bg: 'bg-green-50',  bar: 'bg-green-500',  text: 'text-green-700' },
};

export function ReportesView() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStat[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'departamentos' | 'calificaciones' | 'revisiones'>('general');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, deptRes, goalRatingsRes, compRatingsRes, reviewsRes] = await Promise.all([
        supabase.rpc('exec_sql' as any, { sql: `
          SELECT
            (SELECT COUNT(*) FROM employees WHERE status = 'active')::int as total_active_employees,
            (SELECT COUNT(*) FROM employees)::int as total_employees,
            (SELECT COUNT(*) FROM june_reviews)::int as total_june_reviews,
            (SELECT COUNT(*) FROM june_reviews WHERE status = 'completed')::int as completed_june_reviews,
            (SELECT COUNT(*) FROM june_reviews WHERE status = 'draft')::int as draft_june_reviews
        ` }).catch(() => null),

        supabase
          .from('departments' as any)
          .select('name')
          .then(async ({ data: deps }) => {
            if (!deps) return { data: [] };
            const results: DeptStat[] = [];
            for (const dep of deps as any[]) {
              const { count: total } = await supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', dep.id || '');
              const { count: active } = await supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', dep.id || '')
                .eq('status', 'active');
              results.push({ department: dep.name, total: total || 0, active: active || 0 });
            }
            return { data: results };
          }),

        supabase
          .from('june_review_goals' as any)
          .select('rating')
          .not('rating', 'is', null),

        supabase
          .from('june_review_competencies' as any)
          .select('rating')
          .not('rating', 'is', null),

        supabase
          .from('june_reviews' as any)
          .select('status, review_date, employee_type, employee:employees(first_name, last_name)')
          .order('review_date', { ascending: false }),
      ]);

      const [summaryFallback, deptResult, goalRatings, compRatings, reviewsResult] = await Promise.all([
        fetchSummary(),
        fetchDeptStats(),
        Promise.resolve(goalRatingsRes),
        Promise.resolve(compRatingsRes),
        Promise.resolve(reviewsRes),
      ]);

      setSummary(summaryFallback);
      setDeptStats(deptResult);

      const allRatings = [
        ...((goalRatings.data as any[]) || []),
        ...((compRatings.data as any[]) || []),
      ];
      const ratingMap: Record<string, number> = {};
      for (const row of allRatings) {
        if (row.rating) ratingMap[row.rating] = (ratingMap[row.rating] || 0) + 1;
      }
      setRatingStats(Object.entries(ratingMap).map(([rating, count]) => ({ rating, count })));

      const rawReviews = (reviewsResult.data as any[]) || [];
      setReviews(rawReviews.map((r: any) => ({
        employee_name: r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '—',
        review_date: r.review_date || '',
        status: r.status || '',
        employee_type: r.employee_type || '',
      })));
    } catch {
      const [s, d] = await Promise.all([fetchSummary(), fetchDeptStats()]);
      setSummary(s);
      setDeptStats(d);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (): Promise<Summary> => {
    const [emp, reviews] = await Promise.all([
      supabase.from('employees').select('id, status'),
      supabase.from('june_reviews' as any).select('id, status'),
    ]);
    const employees = (emp.data as any[]) || [];
    const revs = (reviews.data as any[]) || [];
    return {
      total_employees: employees.length,
      total_active_employees: employees.filter((e: any) => e.status === 'active').length,
      total_june_reviews: revs.length,
      completed_june_reviews: revs.filter((r: any) => r.status === 'completed').length,
      draft_june_reviews: revs.filter((r: any) => r.status === 'draft').length,
    };
  };

  const fetchDeptStats = async (): Promise<DeptStat[]> => {
    const { data: deps } = await supabase.from('departments').select('id, name');
    if (!deps) return [];
    const { data: emps } = await supabase.from('employees').select('id, department_id, status');
    const employees = (emps as any[]) || [];
    return (deps as any[])
      .map(dep => ({
        department: dep.name,
        total: employees.filter(e => e.department_id === dep.id).length,
        active: employees.filter(e => e.department_id === dep.id && e.status === 'active').length,
      }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total);
  };

  const fetchRatingsAndReviews = async () => {
    const [goalRatings, compRatings, rawReviews] = await Promise.all([
      supabase.from('june_review_goals' as any).select('rating').not('rating', 'is', null),
      supabase.from('june_review_competencies' as any).select('rating').not('rating', 'is', null),
      supabase.from('june_reviews' as any).select('status, review_date, employee_type, employee:employees(first_name, last_name)').order('review_date', { ascending: false }),
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

    const revs = (rawReviews.data as any[]) || [];
    setReviews(revs.map((r: any) => ({
      employee_name: r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '—',
      review_date: r.review_date || '',
      status: r.status || '',
      employee_type: r.employee_type || '',
    })));
  };

  useEffect(() => {
    if (!loading) return;
    fetchRatingsAndReviews();
  }, []);

  const totalRatings = ratingStats.reduce((a, b) => a + b.count, 0);
  const maxDept = deptStats.length > 0 ? Math.max(...deptStats.map(d => d.total)) : 1;

  const tabs = [
    { id: 'general', label: 'General', icon: BarChart2 },
    { id: 'departamentos', label: 'Departamentos', icon: Building },
    { id: 'calificaciones', label: 'Calificaciones', icon: Award },
    { id: 'revisiones', label: 'Revisiones', icon: FileText },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
          <p className="text-sm text-slate-500">Resumen y estadísticas del sistema RRHH</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5 text-blue-600" />}
              bg="bg-blue-50"
              label="Total Empleados"
              value={summary.total_employees}
              sub={`${summary.total_active_employees} activos`}
            />
            <StatCard
              icon={<ClipboardCheck className="w-5 h-5 text-green-600" />}
              bg="bg-green-50"
              label="Revisiones de Metas"
              value={summary.total_june_reviews}
              sub={`${summary.completed_june_reviews} completadas`}
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
              bg="bg-emerald-50"
              label="Completadas"
              value={summary.completed_june_reviews}
              sub="Revisiones finalizadas"
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              bg="bg-amber-50"
              label="En Borrador"
              value={summary.draft_june_reviews}
              sub="Revisiones pendientes"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Estado de Revisiones
              </h3>
              {summary.total_june_reviews === 0 ? (
                <EmptyState message="No hay revisiones registradas aún." />
              ) : (
                <div className="space-y-3">
                  <ProgressRow
                    label="Completadas"
                    value={summary.completed_june_reviews}
                    total={summary.total_june_reviews}
                    color="bg-green-500"
                    textColor="text-green-700"
                  />
                  <ProgressRow
                    label="En Borrador"
                    value={summary.draft_june_reviews}
                    total={summary.total_june_reviews}
                    color="bg-amber-400"
                    textColor="text-amber-700"
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-500" />
                Distribución de Calificaciones
              </h3>
              {ratingStats.length === 0 ? (
                <EmptyState message="No hay calificaciones registradas aún." />
              ) : (
                <div className="space-y-2">
                  {['exceeds_expectations', 'meets_expectations', 'needs_improvement', 'below_expectations'].map(key => {
                    const stat = ratingStats.find(r => r.rating === key);
                    if (!stat) return null;
                    const colors = RATING_COLORS[key];
                    return (
                      <ProgressRow
                        key={key}
                        label={RATING_LABELS[key]}
                        value={stat.count}
                        total={totalRatings}
                        color={colors.bar}
                        textColor={colors.text}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Departamentos Tab */}
      {activeTab === 'departamentos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-semibold text-slate-700">Empleados por Departamento</h3>
            <span className="ml-auto text-xs text-slate-400">{deptStats.length} departamentos</span>
          </div>
          {deptStats.length === 0 ? (
            <div className="p-8"><EmptyState message="No hay departamentos con empleados." /></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {deptStats.map((dept) => (
                <div key={dept.department} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-36 flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{dept.department}</p>
                    <p className="text-xs text-slate-400">{dept.active} activos</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(dept.total / maxDept) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-sm font-bold text-slate-700">{dept.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calificaciones Tab */}
      {activeTab === 'calificaciones' && (
        <div className="space-y-4">
          {ratingStats.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <EmptyState message="No hay calificaciones registradas en revisiones de metas." />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {['exceeds_expectations', 'meets_expectations', 'needs_improvement', 'below_expectations'].map(key => {
                  const stat = ratingStats.find(r => r.rating === key);
                  const count = stat?.count || 0;
                  const colors = RATING_COLORS[key];
                  const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                  return (
                    <div key={key} className={`${colors.bg} rounded-2xl p-5 border border-slate-100 shadow-sm`}>
                      <p className={`text-xs font-semibold ${colors.text} uppercase tracking-wide mb-1`}>
                        {RATING_LABELS[key]}
                      </p>
                      <p className="text-3xl font-bold text-slate-800">{count}</p>
                      <p className="text-sm text-slate-500 mt-1">{pct}% del total</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-700 mb-5">Distribución General</h3>
                <div className="space-y-4">
                  {['exceeds_expectations', 'meets_expectations', 'needs_improvement', 'below_expectations'].map(key => {
                    const stat = ratingStats.find(r => r.rating === key);
                    if (!stat) return null;
                    const colors = RATING_COLORS[key];
                    const pct = totalRatings > 0 ? Math.round((stat.count / totalRatings) * 100) : 0;
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className="w-44 flex-shrink-0">
                          <span className={`text-sm font-medium ${colors.text}`}>{RATING_LABELS[key]}</span>
                        </div>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-sm font-bold text-slate-700">{stat.count}</span>
                          <span className="text-xs text-slate-400 ml-1">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Revisiones Tab */}
      {activeTab === 'revisiones' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-semibold text-slate-700">Historial de Revisiones de Metas</h3>
            <span className="ml-auto text-xs text-slate-400">{reviews.length} registros</span>
          </div>
          {reviews.length === 0 ? (
            <div className="p-8"><EmptyState message="No hay revisiones de metas registradas." /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Colaborador</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Tipo</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Fecha</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reviews.map((rev, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{rev.employee_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 capitalize">{rev.employee_type}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {rev.review_date ? new Date(rev.review_date + 'T00:00:00').toLocaleDateString('es-HN') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rev.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: number; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, total, color, textColor }: { label: string; value: number; total: number; color: string; textColor: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 flex-shrink-0">
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
      </div>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-14 text-right flex-shrink-0">
        <span className="text-sm font-bold text-slate-700">{value}</span>
        <span className="text-xs text-slate-400 ml-1">({pct}%)</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed:         { label: 'Completada',   className: 'bg-green-100 text-green-700' },
    pending_signature: { label: 'Pend. Firma',  className: 'bg-amber-100 text-amber-700' },
    draft:             { label: 'Borrador',     className: 'bg-slate-100 text-slate-600' },
  };
  const config = map[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <AlertCircle className="w-8 h-8 text-slate-300" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
