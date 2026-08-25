import { jsPDF } from 'jspdf';

type Rating = 'below_expectations' | 'needs_improvement' | 'meets_expectations' | 'exceeds_expectations';

interface GoalRow {
  id: string | null;
  goal_number: number;
  goal_description: string;
  results_description: string;
  rating: Rating | null;
}

interface CompetencyRow {
  id: string | null;
  competency_number: number;
  competency_description: string;
  rating: Rating | null;
}

interface JuneReviewPdfData {
  employeeType: 'administrativo' | 'operativo';
  employeeCode: string;
  employeeName: string;
  position: string;
  department: string;
  hireDate: string;
  managerName: string;
  reviewDate: string;
  goals: GoalRow[];
  competencies: CompetencyRow[];
  managerComments: string;
  employeeComments: string;
}

const RATING_COLS: Rating[] = [
  'below_expectations',
  'needs_improvement',
  'meets_expectations',
  'exceeds_expectations',
];

const RATING_SHORT: Record<Rating, string> = {
  below_expectations: 'Debajo de\nExpectativas',
  needs_improvement: 'Desempeno\na Mejorar',
  meets_expectations: 'Cumple\nExpectativas',
  exceeds_expectations: 'Supera\nExpectativas',
};

const NAVY = '#1e3a5f';
const LIGHT_BG = '#f1f5f9';
const BORDER = '#cbd5e1';
const TEXT_DARK = '#1e293b';
const TEXT_BODY = '#374151';

const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 10;
const CONTENT_W = PAGE_W - MARGIN * 2;

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

function splitText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  return doc.splitTextToSize(text, maxWidth);
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

export async function generateJuneReviewPdf(data: JuneReviewPdfData): Promise<string> {
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

  let y = MARGIN;
  const [nr, ng, nb] = hexToRgb(NAVY);

  // ── Header band ──
  doc.setFillColor(nr, ng, nb);
  doc.rect(0, 0, PAGE_W, 4, 'F');

  y = 7;

  // Logo
  const logoData = await getLogoDataUrl();
  if (logoData) {
    doc.addImage(logoData, 'PNG', MARGIN + 1, y - 1, 22, 8);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(nr, ng, nb);
    doc.text('PLIHSA', MARGIN + 3, y + 5);
  }

  // Title cell
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const title = data.employeeType === 'operativo'
    ? 'Revision del Desempeno Operativo'
    : 'Revision del Desempeno Administrativo';
  doc.text(title, PAGE_W / 2, y + 3, { align: 'center' });

  // Code/version/date cell
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(55, 65, 81);
  const codeX = PAGE_W - MARGIN - 48;
  doc.text('Codigo: PL-RH-P-002-F01', codeX, y);
  doc.text('Version: 01', codeX, y + 3.5);
  doc.text('Fecha de Revision: 09/07/2025', codeX, y + 7);

  // Header border
  doc.setDrawColor(...hexToRgb(BORDER));
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 9, PAGE_W - MARGIN, y + 9);

  y += 12;

  // ── Employee info ──
  doc.setFontSize(7.5);
  const colW = CONTENT_W / 2;
  const leftColX = MARGIN;
  const rightColX = MARGIN + colW;

  const leftFields: [string, string][] = [
    ['Codigo:', data.employeeCode],
    ['Nombre:', data.employeeName],
    ['Puesto:', data.position],
    ['Departamento:', data.department],
  ];
  const rightFields: [string, string][] = [
    ['Fecha de Ingreso:', fmtDate(data.hireDate)],
    ['Jefe Inmediato:', data.managerName],
    ['Fecha Definicion:', fmtDate(data.reviewDate)],
  ];

  const fieldH = 4.2;
  leftFields.forEach(([label, value], i) => {
    const ry = y + i * fieldH;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(label, leftColX, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(value || '', leftColX + 24, ry);
  });

  rightFields.forEach(([label, value], i) => {
    const ry = y + i * fieldH;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(label, rightColX, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(value || '', rightColX + 28, ry);
  });

  y += leftFields.length * fieldH + 1;

  // Divider
  doc.setDrawColor(...hexToRgb(BORDER));
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 3;

  // ── Section: Revision de Metas Individuales ──
  doc.setFillColor(nr, ng, nb);
  doc.rect(MARGIN, y, CONTENT_W, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REVISION DE METAS INDIVIDUALES', PAGE_W / 2, y + 3.4, { align: 'center' });
  y += 5;

  // Date row
  doc.setDrawColor(...hexToRgb(NAVY));
  doc.setLineWidth(0.3);
  doc.setFillColor(nr, ng, nb);
  doc.rect(MARGIN, y, 32, 5, 'FD');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Fecha de Revision', MARGIN + 16, y + 3.2, { align: 'center' });

  doc.setFillColor(...hexToRgb(LIGHT_BG));
  doc.setDrawColor(...hexToRgb(BORDER));
  doc.rect(MARGIN + 32, y, CONTENT_W - 32, 5, 'FD');
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtDate(data.reviewDate) || '', MARGIN + 34, y + 3.2);
  y += 6;

  // ── Goals table ──
  y = drawRatingTable(doc, {
    title: 'Metas Individuales/Resultados',
    subtitle: '(Marque una X en la opcion que corresponda)',
    rows: data.goals.map(g => ({
      number: g.goal_number,
      description: g.goal_description,
      rating: g.rating,
      subText: g.results_description,
      subLabel: 'Resultados a la fecha de revision',
    })),
    startY: y,
    navy: [nr, ng, nb],
  });

  // ── Section: Competencias ──
  y += 4;
  if (y > PAGE_H - 40) { doc.addPage(); y = MARGIN; }

  doc.setFillColor(nr, ng, nb);
  doc.rect(MARGIN, y, CONTENT_W, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REVISION DE FACTORES CONDUCTUALES Y HABILIDADES TECNICAS', PAGE_W / 2, y + 3.4, { align: 'center' });
  y += 5;

  y = drawRatingTable(doc, {
    title: 'Conductas y Habilidades Tecnicas (Evaluar las 5 Definidas)',
    subtitle: '(Marque una X en la opcion que corresponda)',
    rows: data.competencies.map(c => ({
      number: c.competency_number,
      description: c.competency_description,
      rating: c.rating,
    })),
    startY: y,
    navy: [nr, ng, nb],
  });

  // ── Comments ──
  y += 5;
  if (y > PAGE_H - 40) { doc.addPage(); y = MARGIN; }

  const commentW = CONTENT_W - 45;
  const commentRows: [string, string][] = [
    ['Comentarios Jefe Inmediato', data.managerComments],
    ['Comentarios del Colaborador', data.employeeComments],
  ];

  commentRows.forEach(([label, text]) => {
    const lines = splitText(doc, text || '', commentW);
    const blockH = Math.max(18, lines.length * 3.6 + 6);

    if (y + blockH > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN; }

    doc.setFillColor(nr, ng, nb);
    doc.setDrawColor(...hexToRgb(NAVY));
    doc.rect(MARGIN, y, 45, blockH, 'FD');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const labelLines = splitText(doc, label, 40);
    doc.text(labelLines, MARGIN + 3, y + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...hexToRgb(NAVY));
    doc.rect(MARGIN + 45, y, commentW, blockH, 'FD');
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(lines, MARGIN + 48, y + 4);

    y += blockH + 1;
  });

  // ── Signatures ──
  y += 20;
  if (y > PAGE_H - 30) { doc.addPage(); y = MARGIN; }

  const sigW = (CONTENT_W - 20) / 3;
  const sigLabels = ['Firma Colaborador', 'Firma Jefe Inmediato', 'Firma RRHH'];
  sigLabels.forEach((label, i) => {
    const sx = MARGIN + i * (sigW + 10);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.4);
    doc.line(sx, y, sx + sigW, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(label, sx + sigW / 2, y + 4.5, { align: 'center' });
  });

  return URL.createObjectURL(doc.output('blob'));
}

// ── Helper: rating table with pagination ──
function drawRatingTable(
  doc: jsPDF,
  opts: {
    title: string;
    subtitle: string;
    rows: {
      number: number;
      description: string;
      rating: Rating | null;
      subText?: string;
      subLabel?: string;
    }[];
    startY: number;
    navy: [number, number, number];
  },
): number {
  const { title, subtitle, rows, navy } = opts;
  let y = opts.startY;
  const [nr, ng, nb] = navy;

  const numColW = 10;
  const descColW = CONTENT_W - numColW - 72; // 72mm for 4 rating columns
  const ratingColW = 18;

  // Header row 1
  if (y > PAGE_H - 30) { doc.addPage(); y = MARGIN; }

  doc.setFillColor(nr, ng, nb);
  doc.setDrawColor(nr, ng, nb);
  doc.rect(MARGIN, y, numColW, 8, 'FD');
  doc.rect(MARGIN + numColW, y, descColW, 8, 'FD');
  doc.rect(MARGIN + numColW + descColW, y, 72, 8, 'FD');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('No.', MARGIN + numColW / 2, y + 4, { align: 'center' });
  doc.text(title, MARGIN + numColW + 3, y + 3.2);
  doc.setFontSize(6);
  doc.text('Calificacion', MARGIN + numColW + descColW + 36, y + 3, { align: 'center' });
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, MARGIN + numColW + descColW + 36, y + 6, { align: 'center' });
  y += 8;

  // Header row 2 — rating column names
  doc.setFillColor(nr, ng, nb);
  doc.rect(MARGIN, y, numColW + descColW, 7, 'FD');
  RATING_COLS.forEach((r, i) => {
    doc.rect(MARGIN + numColW + descColW + i * ratingColW, y, ratingColW, 7, 'FD');
  });
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  RATING_COLS.forEach((r, i) => {
    const lines = RATING_SHORT[r].split('\n');
    const cx = MARGIN + numColW + descColW + i * ratingColW + ratingColW / 2;
    doc.text(lines, cx, y + 3, { align: 'center', lineHeight: 1.15 });
  });
  y += 7;

  // Data rows
  rows.forEach((row) => {
    const descLines = splitText(doc, row.description || '', descColW - 4);
    const subLines = row.subText ? splitText(doc, row.subText, descColW - 4) : [];
    const subLabelLine = row.subLabel || '';
    const rowH = Math.max(8, descLines.length * 3.4 + 4);
    const subH = subLines.length > 0 ? subLines.length * 3.2 + 5 : 0;
    const totalH = rowH + subH;

    if (y + totalH > PAGE_H - MARGIN - 10) { doc.addPage(); y = MARGIN; }

    // Number cell
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...hexToRgb(BORDER));
    doc.rect(MARGIN, y, numColW, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(NAVY));
    doc.text(String(row.number), MARGIN + numColW / 2, y + rowH / 2 + 1, { align: 'center' });

    // Description cell
    const descBg = row.description ? '#eff6ff' : '#ffffff';
    doc.setFillColor(...hexToRgb(descBg));
    doc.rect(MARGIN + numColW, y, descColW, rowH, 'FD');
    doc.setFont(row.description ? 'helvetica' : 'helvetica', row.description ? 'bold' : 'normal');
    doc.setFontSize(7);
    doc.setTextColor(row.description ? 30 : 148, row.description ? 41 : 163, row.description ? 59 : 184);
    doc.text(descLines, MARGIN + numColW + 2, y + 3);

    // Rating cells
    RATING_COLS.forEach((r, i) => {
      const rx = MARGIN + numColW + descColW + i * ratingColW;
      doc.setFillColor(255, 255, 255);
      doc.rect(rx, y, ratingColW, rowH, 'FD');
      if (row.rating === r) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text('X', rx + ratingColW / 2, y + rowH / 2 + 1.5, { align: 'center' });
      }
    });

    y += rowH;

    // Sub-row (results)
    if (subH > 0) {
      doc.setFillColor(...hexToRgb('#f8fafc'));
      doc.setDrawColor(...hexToRgb(BORDER));
      doc.rect(MARGIN, y, numColW, subH, 'FD');
      doc.rect(MARGIN + numColW, y, descColW + 72, subH, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(subLabelLine.toUpperCase(), MARGIN + numColW + 2, y + 3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.text(subLines, MARGIN + numColW + 2, y + 6);

      y += subH;
    }
  });

  return y;
}


export { generateJuneReviewPdf }