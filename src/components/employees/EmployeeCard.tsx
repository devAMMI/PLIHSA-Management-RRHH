import { User, Building2, MapPin } from 'lucide-react';

interface EmployeeCardProps {
  employee: {
    id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
    position: string;
    employee_type: 'operativo' | 'administrativo';
    photo_url: string | null;
    company: { name: string; logo_url: string | null };
    department: { name: string } | null;
    plant: { name: string } | null;
  };
  onClick: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 overflow-hidden">
          {employee.photo_url ? (
            <img
              src={employee.photo_url}
              alt={`${employee.first_name} ${employee.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-slate-400" />
          )}
        </div>

        <h3 className="font-semibold text-slate-800 text-lg">
          {employee.first_name} {employee.last_name}
        </h3>
        <p className="text-sm text-slate-600 mb-1">{employee.position}</p>
        <p className="text-xs text-slate-500 mb-4">{employee.employee_code}</p>

        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="w-4 h-4" />
            <span>{employee.company.name}</span>
          </div>

          {employee.plant && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{employee.plant.name}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              employee.employee_type === 'administrativo'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {employee.employee_type === 'administrativo' ? 'Administrativo' : 'Operativo'}
          </span>
        </div>
      </div>
    </div>
  );
}
