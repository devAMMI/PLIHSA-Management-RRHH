import { jsPDF } from 'jspdf';

interface CvEmployee {
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  position?: string;
  employee_type?: string;
  status?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  national_id?: string;
  birth_date?: string;
  hire_date?: string;
  gender?: string;
  marital_status?: string;
  education_level?: string;
  university?: string;
  degree?: string;
  company?: { name?: string } | null;
  department?: { name?: string } | null;
  sub_department?: { name?: string } | null;
  manager?: { first_name?: string; last_name?: string; position?: string } | null;
  work_location?: { name?: string; city?: string } | null;
}

export async function downloadEmployeeCvPdf(employee: CvEmployee): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const navy: [number, number, number] = [30, 58, 95];
  const slate: [number, number, number] = [71, 85, 105];
  const name = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Empleado';
  let y = 22;

  doc.setFillColor(...navy);
  doc.rect(0, 0, 215.9, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...navy);
  doc.text(name, 18, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...slate);
  doc.text(employee.position || 'Perfil profesional', 18, y + 7);
  doc.setDrawColor(...navy);
  doc.line(18, y + 12, 198, y + 12);
  y += 24;

  const section = (title: string) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(18, y - 5, 180, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text(title, 22, y);
    y += 10;
  };
  const row = (label: string, value: string | undefined) => {
    if (!value) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...slate);
    doc.text(`${label}:`, 22, y);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(value, 135), 62, y);
    y += 6;
  };

  section('Información laboral');
  row('Código', employee.employee_code);
  row('Empresa', employee.company?.name);
  row('Departamento', employee.department?.name);
  row('Subdepartamento', employee.sub_department?.name);
  row('Tipo', employee.employee_type);
  row('Estado', employee.status);
  row('Fecha de ingreso', formatDate(employee.hire_date));
  row('Jefe directo', employee.manager ? `${employee.manager.first_name || ''} ${employee.manager.last_name || ''}`.trim() : undefined);
  y += 5;

  section('Información personal');
  row('Identidad', employee.national_id);
  row('Fecha de nacimiento', formatDate(employee.birth_date));
  row('Género', employee.gender);
  row('Estado civil', employee.marital_status);
  y += 5;

  section('Contacto');
  row('Correo', employee.email);
  row('Teléfono', employee.phone);
  row('Dirección', employee.address);
  row('Ciudad', employee.city || employee.work_location?.city);
  row('Ubicación', employee.work_location?.name);
  y += 5;

  section('Formación académica');
  row('Nivel educativo', employee.education_level);
  row('Universidad', employee.university);
  row('Título / carrera', employee.degree);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`PLIHSA - Perfil de empleado | Generado: ${new Date().toLocaleDateString('es-HN')}`, 18, 285);
  doc.setFillColor(...navy);
  doc.rect(0, 289, 215.9, 8, 'F');
  doc.save(`CV_${name.replace(/\s+/g, '_')}.pdf`);
}

function formatDate(value?: string): string {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-HN');
}
