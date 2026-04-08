import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, User, GraduationCap, Users, Building2, Clock, MapPinned, Home, CreditCard as Edit2, Trash2, Heart } from 'lucide-react';
import { formatSeniorityFromDate } from '../../lib/seniority';
import { EmployeeEvaluationsHistory } from './EmployeeEvaluationsHistory';

interface EmployeeProfilePageProps {
  employee: any;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EmployeeProfilePage({ employee, onBack, onEdit, onDelete }: EmployeeProfilePageProps) {
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
  const workSeniority = formatSeniorityFromDate(employee.hire_date);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver a empleados</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div
            className="h-64 bg-cover bg-center relative"
            style={{ backgroundImage: 'url(/Banner-PLIHSA_4.jpeg)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-white"></div>
          </div>

          <div className="px-8 pb-8">
            <div className="flex items-end gap-8 -mt-28 mb-8 relative">
              <div className="relative z-10">
                <div className="w-48 h-48 rounded-full bg-white border-8 border-white shadow-xl ring-4 ring-slate-100 flex items-center justify-center overflow-hidden">
                  {employee.photo_url ? (
                    <img src={employee.photo_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-24 h-24 text-slate-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 pb-6 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900">
                      {employee.first_name} {employee.last_name}
                    </h1>
                    <p className="text-xl text-slate-600 mt-2">{employee.position}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium ${
                        employee.employee_type === 'administrativo'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {employee.employee_type === 'administrativo' ? 'Administrativo' : 'Operativo'}
                      </span>
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium ${
                        employee.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-sm text-slate-500 ml-2">
                        Código: {employee.employee_code}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onEdit}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={onDelete}
                      className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      title="Eliminar empleado"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Información Laboral</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <p className="text-sm font-medium text-slate-500">Empresa</p>
                      </div>
                      <p className="text-lg text-slate-900 font-semibold">{employee.company?.name || 'N/A'}</p>
                    </div>
                    {employee.department && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Departamento</p>
                        </div>
                        <p className="text-lg text-slate-900 font-semibold">{employee.department.name}</p>
                      </div>
                    )}
                    {employee.plant && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPinned className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Planta</p>
                        </div>
                        <p className="text-lg text-slate-900 font-semibold">{employee.plant.name}</p>
                      </div>
                    )}
                    {employee.work_location && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Ubicación Física</p>
                        </div>
                        <p className="text-lg text-slate-900 font-semibold">{employee.work_location.name}</p>
                        {employee.work_location.city && (
                          <p className="text-sm text-slate-600">{employee.work_location.city}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <p className="text-sm font-medium text-slate-500">Fecha de Contratación</p>
                      </div>
                      <p className="text-lg text-slate-900 font-semibold">{formatDate(employee.hire_date)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <p className="text-sm font-medium text-slate-500">Antigüedad Laboral</p>
                      </div>
                      <p className="text-lg text-slate-900 font-semibold">{workSeniority}</p>
                    </div>
                  </div>
                  {employee.manager && (
                    <div className="mt-6 pt-6 border-t border-slate-300">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-700">Jefe Directo</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                        <p className="text-lg text-slate-900 font-bold">
                          {employee.manager.first_name} {employee.manager.last_name}
                        </p>
                        <p className="text-slate-600 mt-1">{employee.manager.position}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Información Personal</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {employee.national_id && (
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-2">Cédula / ID</p>
                        <p className="text-lg text-slate-900 font-semibold">{employee.national_id}</p>
                      </div>
                    )}
                    {employee.birth_date && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Fecha de Nacimiento</p>
                        </div>
                        <p className="text-lg text-slate-900 font-semibold">{formatDate(employee.birth_date)}</p>
                      </div>
                    )}
                    {age && (
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-2">Edad</p>
                        <p className="text-lg text-slate-900 font-semibold">{age} años</p>
                      </div>
                    )}
                    {employee.gender && (
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-2">Género</p>
                        <p className="text-lg text-slate-900 font-semibold capitalize">{employee.gender}</p>
                      </div>
                    )}
                    {employee.marital_status && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Estado Civil</p>
                        </div>
                        <p className="text-lg text-slate-900 font-semibold capitalize">{employee.marital_status.replace('_', ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {(employee.education_level || employee.university || employee.degree) && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">Educación</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {employee.education_level && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Nivel Educativo</p>
                          <p className="text-lg text-slate-900 font-semibold capitalize">{employee.education_level}</p>
                        </div>
                      )}
                      {employee.university && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Universidad</p>
                          <p className="text-lg text-slate-900 font-semibold">{employee.university}</p>
                        </div>
                      )}
                      {employee.degree && (
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-2">Título / Carrera</p>
                          <p className="text-lg text-slate-900 font-semibold">{employee.degree}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <EmployeeEvaluationsHistory
                  employeeId={employee.id}
                  employeeType={employee.employee_type || 'administrativo'}
                />
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Mail className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Contacto</h2>
                  </div>
                  <div className="space-y-4">
                    {employee.email && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Email</p>
                        </div>
                        <a
                          href={`mailto:${employee.email}`}
                          className="text-blue-600 hover:text-blue-700 font-medium break-all"
                        >
                          {employee.email}
                        </a>
                      </div>
                    )}
                    {employee.phone && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Teléfono</p>
                        </div>
                        <a
                          href={`tel:${employee.phone}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {employee.phone}
                        </a>
                      </div>
                    )}
                    {employee.address && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Dirección</p>
                        </div>
                        <p className="text-slate-900">{employee.address}</p>
                      </div>
                    )}
                    {employee.city && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">Ciudad</p>
                        </div>
                        <p className="text-slate-900">{employee.city}</p>
                      </div>
                    )}
                    {employee.state && (
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-2">Departamento / Estado</p>
                        <p className="text-slate-900">{employee.state}</p>
                      </div>
                    )}
                  </div>
                </div>

                {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
                  <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Phone className="w-5 h-5 text-red-600" />
                      </div>
                      <h2 className="text-lg font-bold text-red-900">Contacto de Emergencia</h2>
                    </div>
                    <div className="space-y-3">
                      {employee.emergency_contact_name && (
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-1">Nombre</p>
                          <p className="text-red-900 font-semibold">{employee.emergency_contact_name}</p>
                        </div>
                      )}
                      {employee.emergency_contact_phone && (
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-1">Teléfono</p>
                          <a
                            href={`tel:${employee.emergency_contact_phone}`}
                            className="text-red-600 hover:text-red-700 font-semibold"
                          >
                            {employee.emergency_contact_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
