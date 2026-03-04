import { useEffect, useState } from 'react';
import { Users, ClipboardCheck, Building2, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalEmployees: number;
  activeEvaluations: number;
  companies: number;
  completionRate: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    activeEvaluations: 0,
    companies: 4,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const [adminEvalResult, operativeEvalResult] = await Promise.all([
        supabase
          .from('administrative_evaluations')
          .select('*', { count: 'exact', head: true })
          .in('status', ['draft', 'pending_employee', 'pending_manager', 'pending_rrhh']),
        supabase
          .from('operative_evaluations')
          .select('*', { count: 'exact', head: true })
          .in('status', ['draft', 'pending_employee', 'pending_manager', 'pending_rrhh'])
      ]);

      const [adminCompletedResult, operativeCompletedResult] = await Promise.all([
        supabase
          .from('administrative_evaluations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase
          .from('operative_evaluations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
      ]);

      const [adminTotalResult, operativeTotalResult] = await Promise.all([
        supabase
          .from('administrative_evaluations')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('operative_evaluations')
          .select('*', { count: 'exact', head: true })
      ]);

      const activeEvaluations = (adminEvalResult.count || 0) + (operativeEvalResult.count || 0);
      const completedCount = (adminCompletedResult.count || 0) + (operativeCompletedResult.count || 0);
      const totalEvals = (adminTotalResult.count || 0) + (operativeTotalResult.count || 0);

      setStats({
        totalEmployees: employeeCount || 0,
        activeEvaluations: activeEvaluations,
        companies: 4,
        completionRate: totalEvals ? Math.round((completedCount / totalEvals) * 100) : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Empleados',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Evaluaciones Activas',
      value: stats.activeEvaluations,
      icon: ClipboardCheck,
      color: 'bg-green-500',
    },
    {
      title: 'Empresas',
      value: stats.companies,
      icon: Building2,
      color: 'bg-purple-500',
    },
    {
      title: 'Tasa de Completitud',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-slate-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-slate-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Empresas del Grupo AMMI</h3>
          <div className="space-y-3">
            {[
              { name: 'AMMI', logo: 'https://i.imgur.com/F0RKq8C.png' },
              { name: 'PLIHSA', logo: 'https://plihsa.com/wp-content/uploads/2023/02/Plihsa_Logo_Azul.svg' },
              { name: 'PTM', logo: 'https://i.imgur.com/FpiAvCx.png' },
              { name: 'MillFoods', logo: 'https://i.imgur.com/kAzFS5n.png' },
            ].map((company) => (
              <div
                key={company.name}
                className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <img src={company.logo} alt={company.name} className="w-12 h-12 object-contain" />
                <span className="font-medium text-slate-700">{company.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Calendario de Evaluaciones {new Date().getFullYear()}</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-slate-800">Definición de Metas</h4>
              <p className="text-sm text-slate-600">Enero - Febrero</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold text-slate-800">Revisión de Metas</h4>
              <p className="text-sm text-slate-600">Junio - Julio</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <h4 className="font-semibold text-slate-800">Evaluación Final</h4>
              <p className="text-sm text-slate-600">Diciembre</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
