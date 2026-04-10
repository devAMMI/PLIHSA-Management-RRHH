import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter, Users } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeModal } from './EmployeeModal';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { EmployeeFilterSidebar } from './EmployeeFilterSidebar';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  position: string;
  employee_type: 'operativo' | 'administrativo';
  photo_url: string | null;
  department_id: string | null;
  work_location_id: string | null;
  company: { id: string; name: string; logo_url: string | null };
  department: { id: string; name: string } | null;
  plant: { name: string } | null;
  work_location: { id: string; name: string } | null;
  status: string;
}

interface Company {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
}

interface WorkLocation {
  id: string;
  name: string;
}

export function EmployeeList() {
  const { activeCompany } = useCompany();
  const { systemUser } = useAuth();
  const isManager = systemUser?.role === 'manager';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'operativo' | 'administrativo'>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [filterWorkLocation, setFilterWorkLocation] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (activeCompany) {
      loadCompanies();
      loadDepartments();
      loadWorkLocations();
      loadEmployees();
    }
  }, [activeCompany]);

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

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadWorkLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('work_locations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setWorkLocations(data || []);
    } catch (error) {
      console.error('Error loading work locations:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      if (!activeCompany) return;

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          company:companies(id, name, logo_url),
          department:departments(name),
          plant:plants(name),
          work_location:work_locations(id, name, city, code),
          manager:manager_id(id, first_name, last_name, position)
        `)
        .eq('company_id', activeCompany.id)
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

    const matchesDepartment =
      !filterDepartment || emp.department_id === filterDepartment;

    const matchesWorkLocation =
      !filterWorkLocation || emp.work_location_id === filterWorkLocation;

    return matchesSearch && matchesFilter && matchesCompany && matchesDepartment && matchesWorkLocation;
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

  if (showDetail && selectedEmployee) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-8">
          <EmployeeProfilePage
            employee={selectedEmployee}
            onBack={handleCloseDetail}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <EmployeeFilterSidebar
        departments={departments}
        workLocations={workLocations}
        selectedDepartment={filterDepartment}
        selectedWorkLocation={filterWorkLocation}
        onDepartmentChange={setFilterDepartment}
        onWorkLocationChange={setFilterWorkLocation}
        employeeCount={filteredEmployees.length}
        totalEmployees={employees.length}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {isManager && (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Vista de Gerente</p>
                <p className="text-xs text-blue-600">Mostrando empleados bajo tu cargo directo</p>
              </div>
            </div>
          )}

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

          {!isManager && (
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
          )}

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

            {!isManager && (
              <button
                onClick={handleNewEmployee}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Nuevo Empleado
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {showModal && (
            <EmployeeModal
              employee={selectedEmployee}
              onClose={handleCloseModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}
