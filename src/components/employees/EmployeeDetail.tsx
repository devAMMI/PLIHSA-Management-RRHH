import { X, User, Briefcase, Mail, Phone, MapPin, GraduationCap, Calendar, Edit2, Trash2, Users } from 'lucide-react';

interface EmployeeDetailProps {
  employee: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EmployeeDetail({ employee, onClose, onEdit, onDelete }: EmployeeDetailProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = employee.birth_date ? calculateAge(employee.birth_date) : employee.age;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Perfil de Empleado</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
              title="Editar"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
              title="Eliminar"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {employee.photo_url ? (
                <img src={employee.photo_url} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-800">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-lg text-slate-600 mt-1">{employee.position}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-slate-500">Código: {employee.employee_code}</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  employee.employee_type === 'administrativo'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {employee.employee_type === 'administrativo' ? 'Administrativo' : 'Operativo'}
                </span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  employee.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800">Información Personal</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.national_id && (
                <div>
                  <p className="text-sm text-slate-500">Cédula / ID</p>
                  <p className="text-slate-800 font-medium">{employee.national_id}</p>
                </div>
              )}
              {employee.birth_date && (
                <div>
                  <p className="text-sm text-slate-500">Fecha de Nacimiento</p>
                  <p className="text-slate-800 font-medium">{formatDate(employee.birth_date)}</p>
                </div>
              )}
              {age && (
                <div>
                  <p className="text-sm text-slate-500">Edad</p>
                  <p className="text-slate-800 font-medium">{age} años</p>
                </div>
              )}
              {employee.gender && (
                <div>
                  <p className="text-sm text-slate-500">Género</p>
                  <p className="text-slate-800 font-medium capitalize">{employee.gender}</p>
                </div>
              )}
              {employee.marital_status && (
                <div>
                  <p className="text-sm text-slate-500">Estado Civil</p>
                  <p className="text-slate-800 font-medium capitalize">{employee.marital_status.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800">Información Laboral</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Empresa</p>
                <p className="text-slate-800 font-medium">{employee.company?.name || 'N/A'}</p>
              </div>
              {employee.department && (
                <div>
                  <p className="text-sm text-slate-500">Departamento</p>
                  <p className="text-slate-800 font-medium">{employee.department.name}</p>
                </div>
              )}
              {employee.plant && (
                <div>
                  <p className="text-sm text-slate-500">Planta</p>
                  <p className="text-slate-800 font-medium">{employee.plant.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Fecha de Contratación</p>
                <p className="text-slate-800 font-medium">{formatDate(employee.hire_date)}</p>
              </div>
              {employee.manager && (
                <div className="md:col-span-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-700">Jefe Directo</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-slate-800 font-semibold">
                      {employee.manager.first_name} {employee.manager.last_name}
                    </p>
                    <p className="text-sm text-slate-600">{employee.manager.position}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800">Contacto</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.email && (
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-slate-800 font-medium">{employee.email}</p>
                </div>
              )}
              {employee.phone && (
                <div>
                  <p className="text-sm text-slate-500">Teléfono</p>
                  <p className="text-slate-800 font-medium">{employee.phone}</p>
                </div>
              )}
              {employee.address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500">Dirección</p>
                  <p className="text-slate-800 font-medium">{employee.address}</p>
                </div>
              )}
              {employee.city && (
                <div>
                  <p className="text-sm text-slate-500">Ciudad</p>
                  <p className="text-slate-800 font-medium">{employee.city}</p>
                </div>
              )}
              {employee.state && (
                <div>
                  <p className="text-sm text-slate-500">Departamento / Estado</p>
                  <p className="text-slate-800 font-medium">{employee.state}</p>
                </div>
              )}
            </div>
          </div>

          {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">Contacto de Emergencia</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.emergency_contact_name && (
                  <div>
                    <p className="text-sm text-slate-500">Nombre</p>
                    <p className="text-slate-800 font-medium">{employee.emergency_contact_name}</p>
                  </div>
                )}
                {employee.emergency_contact_phone && (
                  <div>
                    <p className="text-sm text-slate-500">Teléfono</p>
                    <p className="text-slate-800 font-medium">{employee.emergency_contact_phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(employee.education_level || employee.university || employee.degree) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">Educación</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employee.education_level && (
                  <div>
                    <p className="text-sm text-slate-500">Nivel Educativo</p>
                    <p className="text-slate-800 font-medium capitalize">{employee.education_level}</p>
                  </div>
                )}
                {employee.university && (
                  <div>
                    <p className="text-sm text-slate-500">Universidad</p>
                    <p className="text-slate-800 font-medium">{employee.university}</p>
                  </div>
                )}
                {employee.degree && (
                  <div>
                    <p className="text-sm text-slate-500">Título / Carrera</p>
                    <p className="text-slate-800 font-medium">{employee.degree}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
