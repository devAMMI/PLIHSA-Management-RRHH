import { useEffect, useState, useMemo } from 'react';
import { CalendarDays, Search, Building2, Briefcase, Clock, X, Plus, Save, Trash2, AlertTriangle } from 'lucide-react';
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
  vacation_balances: VacationBalance[];
}

interface VacationBalance {
  id: string;
  year: number;
  total_days: number;
  used_days: number;
  notes: string | null;
}

export function VacationEmployees() {
  const { systemUser } = useAuth();
  const { activeCompany, allCompanies } = useCompany();
  const [employees, setEmployees] = useState<VacationEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [editingEmployee, setEditingEmployee] = useState<VacationEmployee | null>(null);

  const canEdit = systemUser?.role === 'superadmin' || systemUser?.role === 'rrhh';

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
        vacation_balances:vacation_balances!vacation_balances_employee_id_fkey(id, year, total_days, used_days, notes)
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

  const totalDays = filtered.reduce((sum, e) => sum + sumBalances(e.vacation_balances, 'total_days'), 0);
  const totalUsed = filtered.reduce((sum, e) => sum + sumBalances(e.vacation_balances, 'used_days'), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Gestión de ausencias</p>
          <h1 className="text-2xl font-bold text-slate-800">Vacaciones Empleados</h1>
          <p className="text-slate-500 mt-1">Listado de empleados con días de vacaciones asignados por año.</p>
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
                  {canEdit && <th className="px-5 py-3.5 text-center font-semibold">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => {
                  const tenure = calculateTenure(emp.hire_date);
                  const total = sumBalances(emp.vacation_balances, 'total_days');
                  const used = sumBalances(emp.vacation_balances, 'used_days');
                  const remaining = total - used;
                  const yearCount = emp.vacation_balances?.length || 0;
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
                          <span className="text-xs text-slate-400">{yearCount} {yearCount === 1 ? 'año' : 'años'} · {used} usados · {remaining} disponibles</span>
                        </div>
                      </td>
                      {canEdit && (
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-xs hover:bg-blue-100 transition-colors"
                          >
                            Editar días
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingEmployee && (
        <VacationEditModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSaved={() => {
            setEditingEmployee(null);
            void loadEmployees();
          }}
        />
      )}
    </div>
  );
}

function VacationEditModal({ employee, onClose, onSaved }: { employee: VacationEmployee; onClose: () => void; onSaved: () => void }) {
  const [balances, setBalances] = useState<VacationBalance[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hireYear = useMemo(() => {
    if (!employee.hire_date) return null;
    return new Date(`${employee.hire_date}T00:00:00`).getFullYear();
  }, [employee.hire_date]);

  useEffect(() => {
    if (employee.vacation_balances && employee.vacation_balances.length > 0) {
      setBalances([...employee.vacation_balances].sort((a, b) => a.year - b.year));
    } else if (hireYear) {
      const currentYear = new Date().getFullYear();
      const years: VacationBalance[] = [];
      for (let y = hireYear; y <= currentYear; y++) {
        years.push({ id: '', year: y, total_days: 30, used_days: 0, notes: null });
      }
      setBalances(years);
    } else {
      setBalances([{ id: '', year: new Date().getFullYear(), total_days: 30, used_days: 0, notes: null }]);
    }
  }, [employee, hireYear]);

  const addYear = () => {
    const maxYear = balances.length > 0 ? Math.max(...balances.map((b) => b.year)) : new Date().getFullYear();
    setBalances([...balances, { id: '', year: maxYear + 1, total_days: 30, used_days: 0, notes: null }]);
  };

  const removeYear = (index: number) => {
    setBalances(balances.filter((_, i) => i !== index));
  };

  const updateBalance = (index: number, field: keyof VacationBalance, value: string | number) => {
    const updated = [...balances];
    if (field === 'notes') {
      updated[index] = { ...updated[index], notes: value as string };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    }
    setBalances(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      for (const bal of balances) {
        if (bal.total_days < bal.used_days) {
          setError(`El año ${bal.year}: los días usados no pueden ser mayores a los días totales.`);
          setSaving(false);
          return;
        }
      }

      for (const bal of balances) {
        if (bal.id) {
          const { error: updateError } = await supabase
            .from('vacation_balances')
            .update({ total_days: bal.total_days, used_days: bal.used_days, notes: bal.notes, updated_at: new Date().toISOString() })
            .eq('id', bal.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('vacation_balances')
            .insert({ employee_id: employee.id, year: bal.year, total_days: bal.total_days, used_days: bal.used_days, notes: bal.notes });
          if (insertError) {
            if (insertError.code === '23505') {
              const { error: upErr } = await supabase
                .from('vacation_balances')
                .update({ total_days: bal.total_days, used_days: bal.used_days, notes: bal.notes, updated_at: new Date().toISOString() })
                .eq('employee_id', employee.id)
                .eq('year', bal.year);
              if (upErr) throw upErr;
            } else {
              throw insertError;
            }
          }
        }
      }

      const removed = (employee.vacation_balances || []).filter((orig) => !balances.some((b) => b.id === orig.id));
      for (const rem of removed) {
        const { error: delErr } = await supabase.from('vacation_balances').delete().eq('id', rem.id);
        if (delErr) throw delErr;
      }

      onSaved();
    } catch (err) {
      console.error('Error saving vacation balances:', err);
      setError('Error al guardar los días de vacaciones. Verifique los permisos.');
      setSaving(false);
    }
  };

  const totalAssigned = balances.reduce((sum, b) => sum + b.total_days, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.used_days, 0);
  const totalRemaining = totalAssigned - totalUsed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {employee.photo_url ? (
              <img src={employee.photo_url} alt={employee.first_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">{employee.first_name.charAt(0)}{employee.last_name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800">{employee.first_name} {employee.last_name}</h2>
              <p className="text-xs text-slate-500">{employee.position || 'Sin puesto'} · {employee.company?.name || ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Ingreso: <strong className="text-slate-800">{employee.hire_date ? formatDate(employee.hire_date) : 'Sin registro'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Antigüedad: <strong className="text-slate-800">{calculateTenure(employee.hire_date)}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Días de vacaciones por año</h3>
            <button onClick={addYear} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
              <Plus className="w-4 h-4" /> Agregar año
            </button>
          </div>

          {balances.length === 0 ? (
            <p className="text-center text-slate-400 py-4">No hay años registrados. Agregue uno para empezar.</p>
          ) : (
            balances.map((bal, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">{bal.year}</span>
                    {hireYear && bal.year === hireYear && <span className="text-xs text-slate-400">(Año de ingreso)</span>}
                  </div>
                  <button onClick={() => removeYear(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Días totales</label>
                    <input
                      type="number"
                      min={0}
                      value={bal.total_days}
                      onChange={(e) => updateBalance(index, 'total_days', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Días usados</label>
                    <input
                      type="number"
                      min={0}
                      value={bal.used_days}
                      onChange={(e) => updateBalance(index, 'used_days', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notas (opcional)</label>
                  <input
                    type="text"
                    value={bal.notes || ''}
                    onChange={(e) => updateBalance(index, 'notes', e.target.value)}
                    placeholder="Ej: Vacaciones acumuladas del año anterior..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Disponibles:</span>
                  <span className={`font-bold ${bal.total_days - bal.used_days >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    {bal.total_days - bal.used_days} días
                  </span>
                </div>
              </div>
            ))
          )}

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-center justify-around">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-semibold uppercase">Total asignado</p>
              <p className="text-xl font-bold text-blue-700">{totalAssigned}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-500 font-semibold uppercase">Total usados</p>
              <p className="text-xl font-bold text-amber-600">{totalUsed}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-500 font-semibold uppercase">Total disponibles</p>
              <p className="text-xl font-bold text-emerald-600">{totalRemaining}</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function sumBalances(balances: VacationBalance[] | null | undefined, field: 'total_days' | 'used_days'): number {
  if (!balances || balances.length === 0) return 0;
  return balances.reduce((sum, b) => sum + (b[field] || 0), 0);
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
