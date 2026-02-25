import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeModal } from './EmployeeModal';
import { EmployeeDetail } from './EmployeeDetail';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  position: string;
  employee_type: 'operativo' | 'administrativo';
  photo_url: string | null;
  company: { id: string; name: string; logo_url: string | null };
  department: { name: string } | null;
  plant: { name: string } | null;
  status: string;
}

interface Company {
  id: string;
  name: string;
  code: string;
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'operativo' | 'administrativo'>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadCompanies();
    loadEmployees();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          company:companies(id, name, logo_url),
          department:departments(name),
          plant:plants(name),
          manager:manager_id(id, first_name, last_name, position)
        `)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' || emp.employee_type === filterType;

    const matchesCompany =
      filterCompany === 'all' || emp.company.id === filterCompany;

    return matchesSearch && matchesFilter && matchesCompany;
  });

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetail(true);
  };

  const handleNewEmployee = () => {
    setSelectedEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = () => {
    setShowDetail(false);
    setShowModal(true);
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    if (!confirm(`¿Está seguro de eliminar a ${selectedEmployee.first_name} ${selectedEmployee.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      setShowDetail(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error al eliminar el empleado');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    loadEmployees();
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedEmployee(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">Cargando empleados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 flex items-center gap-4 flex-wrap min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">Todas las empresas</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">Todos los tipos</option>
              <option value="operativo">Operativo</option>
              <option value="administrativo">Administrativo</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleNewEmployee}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Empleado
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span>
          Mostrando <span className="font-semibold text-slate-900">{filteredEmployees.length}</span> de {employees.length} empleados
        </span>
        {filterCompany !== 'all' && (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            {companies.find(c => c.id === filterCompany)?.name}
          </span>
        )}
        {filterType !== 'all' && (
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full capitalize">
            {filterType}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onClick={() => handleEmployeeClick(employee)}
          />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No se encontraron empleados</p>
        </div>
      )}

      {showDetail && selectedEmployee && (
        <EmployeeDetail
          employee={selectedEmployee}
          onClose={handleCloseDetail}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
        />
      )}

      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
