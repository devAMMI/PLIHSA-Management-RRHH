import { useEffect, useState } from 'react';
import { CalendarDays, Search, Building2, Briefcase, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

interface VacationEmployee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  position: string | null;
  photo_url: string | null;
  hire_date: string | null;
  status: string;
  company: { id: string; name: string } | null;
  department: { name: string } | null;
  vacation_balance: { total_days: number; used_days: number } | null;
}

export function VacationEmployees() {
  const { systemUser } = useAuth();
  const { activeCompany, allCompanies } = useCompany();
  const [employees, setEmployees] = useState<VacationEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('all');

  useEffect(() => {
    if (activeCompany) void loadEmployees();
  }, [activeCompany, allCompanies]);

  const loadEmployees = async () => {
    if (!activeCompany) return;
    setLoading(true);
    const isSuperAdmin = systemUser?.role === 'superadmin';
    const isRrhh = systemUser?.role === 'rrhh';
    const companyIds = isRrhh && allCompanies.length > 1 ? allCompanies.map((c) => c.id) : [activeCompany.id];

    let query = supabase
      .from('employees')
      .select(`
        id, employee_code, first_name, last_name, position, photo_url, hire_date, status,
        company:companies(id, name),
        department:departments(name),
        vacation_balance:vacation_balances!vacation_balances_employee_id_fkey(total_days, used_days)
      `)
      .eq('status', 'active');

    if (!isSuperAdmin) query = query.in('company_id', companyIds);

    const { data, error } = await query.order('first_name');
    if (error) {
      console.error('Error loading employees:', error);
    } else {
      setEmployees((data as unknown as VacationEmployee[]) || []);
    }
    setLoading(false);
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === 'all' || emp.company?.id === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const totalDays = filtered.reduce((sum, e) => sum + (e.vacation_balance?.total_days || 0), 0);
  const totalUsed = filtered.reduce((sum, e) => sum + (e.vacation_balance?.used_days || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Gestión de ausencias</p>
          <h1 className="text-2xl font-bold text-slate-800">Vacaciones Empleados</h1>
          <p className="text-slate-500 mt-1">Listado de empleados con días de vacaciones asignados.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Total días asignados</p>
            <p className="text-xl font-bold text-blue-700">{totalDays}</p>
          </div>
          <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Días usados</p>
            <p className="text-xl font-bold text-amber-600">{totalUsed}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar empleado, código, puesto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        {systemUser?.role === 'superadmin' && (
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las empresas</option>
            {allCompanies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Cargando empleados...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No se encontraron empleados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold">Empleado</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Puesto</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Fecha de ingreso</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Empresa</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Antigüedad</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Días de vacaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => {
                  const tenure = calculateTenure(emp.hire_date);
                  const total = emp.vacation_balance?.total_days || 30;
                  const used = emp.vacation_balance?.used_days || 0;
                  const remaining = total - used;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {emp.photo_url ? (
                            <img src={emp.photo_url} alt={`${emp.first_name} ${emp.last_name}`} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-slate-200">
                              <span className="text-sm font-bold text-blue-600">{emp.first_name.charAt(0)}{emp.last_name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-slate-400">{emp.employee_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700">{emp.position || 'Sin puesto'}</span>
                        </div>
                        {emp.department?.name && <p className="text-xs text-slate-400 mt-1 ml-6">{emp.department.name}</p>}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{emp.hire_date ? formatDate(emp.hire_date) : 'Sin registro'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700">{emp.company?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700">{tenure}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-blue-500" />
                            <span className="text-lg font-bold text-blue-700">{total}</span>
                            <span className="text-xs text-slate-400">días</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${total > 0 ? (remaining / total) * 100 : 0}%` }} />
                          </div>
                          {used > 0 && <span className="text-xs text-amber-600 font-medium">{used} usados · {remaining} disponibles</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function calculateTenure(hireDate: string | null): string {
  if (!hireDate) return 'Sin registro';
  const start = new Date(`${hireDate}T00:00:00`);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  let totalMonths = years * 12 + months;
  if (now.getDate() < start.getDate()) totalMonths -= 1;
  if (totalMonths < 0) return 'Recién ingresado';
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  if (m === 0) return `${y} ${y === 1 ? 'año' : 'años'}`;
  return `${y} ${y === 1 ? 'año' : 'años'} ${m} ${m === 1 ? 'mes' : 'meses'}`;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
}
