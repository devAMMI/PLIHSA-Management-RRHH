import { Building2, MapPin, X } from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

interface WorkLocation {
  id: string;
  name: string;
}

interface EmployeeFilterSidebarProps {
  departments: Department[];
  workLocations: WorkLocation[];
  selectedDepartment: string | null;
  selectedWorkLocation: string | null;
  onDepartmentChange: (departmentId: string | null) => void;
  onWorkLocationChange: (workLocationId: string | null) => void;
  employeeCount: number;
  totalEmployees: number;
}

export function EmployeeFilterSidebar({
  departments,
  workLocations,
  selectedDepartment,
  selectedWorkLocation,
  onDepartmentChange,
  onWorkLocationChange,
  employeeCount,
  totalEmployees
}: EmployeeFilterSidebarProps) {
  const hasActiveFilters = selectedDepartment || selectedWorkLocation;

  const clearAllFilters = () => {
    onDepartmentChange(null);
    onWorkLocationChange(null);
  };

  const uniqueDepartments = Array.from(
    new Map(departments.map(dept => [dept.name, dept])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-80 bg-white border-r border-slate-200 h-full overflow-y-auto flex-shrink-0">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar todo
            </button>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-sm text-slate-600">
            Mostrando
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {employeeCount} <span className="text-lg text-slate-500">/ {totalEmployees}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            empleados
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-slate-600" />
              <h4 className="font-medium text-slate-900">Departamento</h4>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <button
                onClick={() => onDepartmentChange(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  !selectedDepartment
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                Todos los departamentos
              </button>
              {uniqueDepartments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => onDepartmentChange(dept.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedDepartment === dept.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-slate-600" />
              <h4 className="font-medium text-slate-900">Ubicación</h4>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => onWorkLocationChange(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  !selectedWorkLocation
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                Todas las ubicaciones
              </button>
              {workLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => onWorkLocationChange(location.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedWorkLocation === location.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="pt-4 border-t border-slate-200">
            <div className="text-sm font-medium text-slate-900 mb-2">Filtros activos:</div>
            <div className="space-y-2">
              {selectedDepartment && (
                <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium">
                    {uniqueDepartments.find(d => d.id === selectedDepartment)?.name}
                  </span>
                  <button
                    onClick={() => onDepartmentChange(null)}
                    className="hover:bg-blue-100 rounded p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {selectedWorkLocation && (
                <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium">
                    {workLocations.find(l => l.id === selectedWorkLocation)?.name}
                  </span>
                  <button
                    onClick={() => onWorkLocationChange(null)}
                    className="hover:bg-green-100 rounded p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
