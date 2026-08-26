import { jsPDF } from 'jspdf';

export interface EmployeeReportRow {
  employee_code: string;
  full_name: string;
  position: string;
  department: string;
  sub_department: string;
  employee_type: string;
  status: string;
  hire_date: string;
  manager_name: string;
  work_location: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  marital_status: string;
  age: number | null;
}

const NAVY = '#1e3a5f';
const LIGHT_BG = '#f1f5f9';
const BORDER = '#cbd5e1';
const ALT_ROW = '#f8fafc';

const PAGE_W = 279.4;
const PAGE_H = 215.9;
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 16;
const FOOTER_H = 8;
const CONTENT_BOTTOM = PAGE_H - FOOTER_H - 3;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-HN');
  } catch {
    return iso;
  }
}

function cap(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let logoDataUrlCache: string | null = null;

async function getLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlCache) return logoDataUrlCache;
  try {
    const response = await fetch('/Logo_PLIHSA_BLUE.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    logoDataUrlCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return logoDataUrlCache;
  } catch {
    return null;
  }
}

export async function generateEmployeeReportPdf(rows: EmployeeReportRow[]): Promise<string> {
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape' });
  const [nr, ng, nb] = hexToRgb(NAVY);
  const logoData = await getLogoDataUrl();

  const drawHeader = (page: number, totalPages: number) => {
    doc.setFillColor(nr, ng, nb);
    doc.rect(0, 0, PAGE_W, 4, 'F');

    const y = 6;
    if (logoData) {
      doc.addImage(logoData, 'PNG', MARGIN + 1, y - 1, 20, 7);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(nr, ng, nb);
      doc.text('PLIHSA', MARGIN + 3, y + 4);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Reporte de Empleados', PAGE_W / 2, y + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    const rightX = PAGE_W - MARGIN - 40;
    doc.text(`Generado: ${new Date().toLocaleDateString('es-HN')}`, rightX, y);
    doc.text(`Pagina ${page} de ${totalPages}`, rightX, y + 4);

    doc.setDrawColor(...hexToRgb(BORDER));
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y + 8, PAGE_W - MARGIN, y + 8);

    return HEADER_H;
  };

  const totalPagesPlaceholder = 1;
  let y = drawHeader(1, totalPagesPlaceholder);

  const cols = [
    { label: 'Codigo', width: 16 },
    { label: 'Nombre', width: 38 },
    { label: 'Puesto', width: 30 },
    { label: 'Departamento', width: 28 },
    { label: 'Sub-Depto', width: 22 },
    { label: 'Tipo', width: 14 },
    { label: 'Estado', width: 14 },
    { label: 'Ingreso', width: 16 },
    { label: 'Jefe Inmediato', width: 30 },
    { label: 'Ubicacion', width: 20 },
    { label: 'Email', width: 30 },
    { label: 'Telefono', width: 16 },
    { label: 'Ciudad', width: 16 },
  ];

  const totalColWidth = cols.reduce((a, c) => a + c.width, 0);
  const colX: number[] = [];
  let acc = MARGIN;
  for (const c of cols) {
    colX.push(acc);
    acc += c.width;
  }

  const drawTableHeader = () => {
    doc.setFillColor(nr, ng, nb);
    doc.rect(MARGIN, y, totalColWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    cols.forEach((c, i) => {
      doc.text(c.label, colX[i] + 1.5, y + 4);
    });
    y += 6;
  };

  drawTableHeader();

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
    terminated: 'Terminado',
  };

  const typeLabels: Record<string, string> = {
    administrativo: 'Admin.',
    operativo: 'Oper.',
  };

  const newPage = () => {
    doc.addPage();
    y = drawHeader(doc.getNumberOfPages(), 1);
    drawTableHeader();
  };

  rows.forEach((row, idx) => {
    if (y + 5 > CONTENT_BOTTOM) newPage();

    const rowBg = idx % 2 === 0 ? ALT_ROW : 'white';
    doc.setFillColor(...hexToRgb(rowBg === 'white' ? '#ffffff' : ALT_ROW));
    doc.rect(MARGIN, y, totalColWidth, 5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(55, 65, 81);

    const cellValues = [
      row.employee_code || '',
      row.full_name || '',
      row.position || '',
      row.department || '',
      row.sub_department || '',
      typeLabels[row.employee_type] || row.employee_type || '',
      statusLabels[row.status] || cap(row.status) || '',
      fmtDate(row.hire_date),
      row.manager_name || '',
      row.work_location || '',
      row.email || '',
      row.phone || '',
      row.city || '',
    ];

    cellValues.forEach((val, i) => {
      const maxW = cols[i].width - 3;
      const text = doc.splitTextToSize(String(val), maxW);
      doc.text(text[0] || '', colX[i] + 1.5, y + 3.5);
    });

    doc.setDrawColor(...hexToRgb(BORDER));
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y + 5, MARGIN + totalColWidth, y + 5);

    y += 5;
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `PLIHSA - Reporte de Empleados | ${rows.length} registros`,
      MARGIN,
      PAGE_H - 3,
    );
  }

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const [onr, ong, onb] = hexToRgb(NAVY);
    doc.setFillColor(onr, ong, onb);
    doc.rect(0, PAGE_H - 1.5, PAGE_W, 1.5, 'F');
  }

  return URL.createObjectURL(doc.output('blob'));
}

export function generateEmployeeReportExcel(rows: EmployeeReportRow[]): void {
  const headers = [
    'Codigo',
    'Nombre Completo',
    'Puesto',
    'Departamento',
    'Sub-Departamento',
    'Tipo de Empleado',
    'Estado',
    'Fecha de Ingreso',
    'Jefe Inmediato',
    'Ubicacion de Trabajo',
    'Email',
    'Telefono',
    'Ciudad',
    'Genero',
    'Estado Civil',
    'Edad',
  ];

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
    terminated: 'Terminado',
  };

  const typeLabels: Record<string, string> = {
    administrativo: 'Administrativo',
    operativo: 'Operativo',
  };

  const csvRows = [headers.join(',')];

  for (const r of rows) {
    const values = [
      r.employee_code || '',
      r.full_name || '',
      r.position || '',
      r.department || '',
      r.sub_department || '',
      typeLabels[r.employee_type] || r.employee_type || '',
      statusLabels[r.status] || cap(r.status) || '',
      fmtDate(r.hire_date),
      r.manager_name || '',
      r.work_location || '',
      r.email || '',
      r.phone || '',
      r.city || '',
      cap(r.gender) || '',
      cap(r.marital_status) || '',
      r.age != null ? String(r.age) : '',
    ];

    const escaped = values.map(v => {
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    });
    csvRows.push(escaped.join(','));
  }

  const csv = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte_empleados_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
