import { useState, useEffect } from 'react';
import { Users, FileSpreadsheet, FileText, Search, Loader2, Building, Filter, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { generateEmployeeReportPdf, generateEmployeeReportExcel, type EmployeeReportRow } from '../../lib/employeeReportPdf';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  terminated: 'Terminado',
};

const TYPE_LABELS: Record<string, string> = {
  administrativo: 'Administrativo',
  operativo: 'Operativo',
};

export function EmployeeReport() {
  const { activeCompany, allCompanies } = useCompany();
  const { systemUser } = useAuth();
  const [rows, setRows] = useState<EmployeeReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadDepartments();
    loadEmployees();
  }, [activeCompany, allCompanies]);

  const loadDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name').order('name');
    setDepartments((data as any[]) || []);
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const isRrhh = systemUser?.role === 'rrhh';
      const companyIds = isRrhh && allCompanies.length > 1
        ? allCompanies.map(c => c.id)
        : activeCompany ? [activeCompany.id] : [];

      let query = supabase
        .from('employees')
        .select(`
          id, employee_code, first_name, last_name, position, employee_type, status,
          hire_date, email, phone, city, gender, marital_status, age,
          department_id, sub_department_id, manager_id, work_location_id,
          departments(name),
          sub_departments(name),
          work_locations(name),
          manager:manager_id(first_name, last_name)
        `)
        .order('first_name');

      if (companyIds.length > 0) {
        query = query.in('company_id', companyIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const reportRows: EmployeeReportRow[] = ((data as any[]) || []).map((e: any) => ({
        employee_code: e.employee_code || '',
        full_name: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
        position: e.position || '',
        department: e.departments?.name || '',
        sub_department: e.sub_departments?.name || '',
        employee_type: e.employee_type || '',
        status: e.status || '',
        hire_date: e.hire_date || '',
        manager_name: e.manager ? `${e.manager.first_name || ''} ${e.manager.last_name || ''}`.trim() : '',
        work_location: e.work_locations?.name || '',
        email: e.email || '',
        phone: e.phone || '',
        city: e.city || '',
        gender: e.gender || '',
        marital_status: e.marital_status || '',
        age: e.age ?? null,
      }));

      setRows(reportRows);
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = rows.filter(r => {
    const matchSearch = !search ||
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase()) ||
      r.position.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || r.department === deptFilter;
    const matchType = !typeFilter || r.employee_type === typeFilter;
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchDept && matchType && matchStatus;
  });

  const handleExportPdf = async () => {
    setExporting('pdf');
    try {
      const url = await generateEmployeeReportPdf(filteredRows);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_empleados_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    setExporting('excel');
    try {
      generateEmployeeReportExcel(filteredRows);
    } finally {
      setExporting(null);
    }
  };

  const hasFilters = deptFilter || typeFilter || statusFilter;
  const clearFilters = () => {
    setDeptFilter('');
    setTypeFilter('');
    setStatusFilter('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reporte de Empleados</h1>
          <p className="text-sm text-slate-500">Listado detallado de empleados con area, puesto, jefe y mas</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, codigo o puesto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
              showFilters || hasFilters
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasFilters && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleExportExcel}
              disabled={exporting !== null || filteredRows.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Exportar Excel
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exporting !== null || filteredRows.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Exportar PDF
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los departamentos</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los tipos</option>
              <option value="administrativo">Administrativo</option>
              <option value="operativo">Operativo</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspendido</option>
              <option value="terminated">Terminado</option>
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Empleados</p>
            <p className="text-xl font-bold text-slate-800">{filteredRows.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <span className="text-green-600 text-sm font-bold">A</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Activos</p>
            <p className="text-xl font-bold text-slate-800">{filteredRows.filter(r => r.status === 'active').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Building className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Departamentos</p>
            <p className="text-xl font-bold text-slate-800">{new Set(filteredRows.map(r => r.department).filter(Boolean)).size}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <span className="text-amber-600 text-sm font-bold">J</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Con Jefe Asignado</p>
            <p className="text-xl font-bold text-slate-800">{filteredRows.filter(r => r.manager_name).length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <Users className="w-10 h-10 text-slate-300" />
            <p className="text-sm text-slate-400">No se encontraron empleados con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Codigo</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Nombre</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Puesto</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Departamento</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tipo</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Ingreso</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Jefe Inmediato</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Ubicacion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.employee_code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.position}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.department || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{TYPE_LABELS[r.employee_type] || r.employee_type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'active' ? 'bg-green-100 text-green-700'
                        : r.status === 'inactive' ? 'bg-slate-100 text-slate-600'
                        : r.status === 'suspended' ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {r.hire_date ? new Date(r.hire_date + 'T00:00:00').toLocaleDateString('es-HN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.manager_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.work_location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredRows.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Mostrando {filteredRows.length} de {rows.length} empleados
        </p>
      )}
    </div>
  );
}
