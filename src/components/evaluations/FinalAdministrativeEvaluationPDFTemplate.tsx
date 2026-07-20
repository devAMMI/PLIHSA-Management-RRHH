interface IndividualGoal {
  goal_number: number;
  goal_description: string;
  numeric_score: string;
  measurement_results: string;
  manager_comments: string;
  employee_comments: string;
}

interface Competency {
  competency_number: number;
  competency_description: string;
  numeric_score: string;
  manager_comments: string;
  employee_comments: string;
}

export interface FinalAdministrativeEvaluationPDFTemplateProps {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  subDepartment: string;
  hireDate: string;
  evaluationDate: string;
  timeInPositionYears: string;
  timeInPositionMonths: string;
  managerName: string;
  periodName: string;
  formCode: string;
  formVersion: string;
  reviewDate: string;
  individualGoals: IndividualGoal[];
  competencies: Competency[];
  goalsAverage: number;
  competenciesAverage: number;
  finalScore: number;
  overallComments: string;
  employeeComments: string;
  createdAt: string;
}

const BLUE = '#1f5c8b';
const LIGHT_BLUE = '#d6e8f5';
const BORDER = '#94a3b8';

const cell = (content: React.ReactNode, style?: React.CSSProperties): React.ReactNode => (
  <td style={{ border: `1px solid ${BORDER}`, padding: '4px 8px', verticalAlign: 'middle', ...style }}>
    {content}
  </td>
);

const blueCell = (content: React.ReactNode, style?: React.CSSProperties): React.ReactNode => (
  <td style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', verticalAlign: 'middle', fontSize: '11px', ...style }}>
    {content}
  </td>
);

const formatDateParts = (dateStr: string) => {
  if (!dateStr) return { day: '', month: '', year: '' };
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return {
      day: String(d.getDate()).padStart(2, '0'),
      month: String(d.getMonth() + 1).padStart(2, '0'),
      year: String(d.getFullYear())
    };
  } catch {
    return { day: '', month: '', year: '' };
  }
};

const getScoreColor = (score: number) => {
  if (!score) return '#1e293b';
  if (score >= 10) return '#16a34a';
  if (score >= 8) return '#2563eb';
  if (score >= 6) return '#d97706';
  return '#dc2626';
};

const getScoreLabel = (score: number) => {
  if (!score) return '';
  if (score >= 10) return 'Excede Expectativas';
  if (score >= 8) return 'Cumple Expectativas';
  if (score >= 6) return 'Desempeño a Mejorar';
  return 'Debajo de Expectativas';
};

export function FinalAdministrativeEvaluationPDFTemplate(props: FinalAdministrativeEvaluationPDFTemplateProps) {
  const {
    id, employeeName, position, department, subDepartment,
    hireDate, evaluationDate, timeInPositionYears, timeInPositionMonths,
    managerName, formCode, formVersion, reviewDate,
    individualGoals, competencies,
    goalsAverage, competenciesAverage, finalScore,
    overallComments, employeeComments, createdAt
  } = props;

  const hireParts = formatDateParts(hireDate);
  const evalParts = formatDateParts(evaluationDate);

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
    color: '#1e293b'
  };

  return (
    <div
      id={id}
      style={{
        width: '794px',
        padding: '28px 32px',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#1e293b',
        fontSize: '11px'
      }}
    >
      {/* ── HEADER ── */}
      <table style={{ ...tableStyle, marginBottom: '10px' }}>
        <tbody>
          <tr>
            {/* Logo */}
            <td style={{ border: `1px solid ${BORDER}`, padding: '8px', width: '130px', textAlign: 'center', verticalAlign: 'middle' }}>
              <img src="/Profile-pic-plihsa-logo-foto.jpg" alt="PLIHSA" style={{ height: '52px', display: 'block', margin: '0 auto' }} />
            </td>
            {/* Title */}
            <td style={{ border: `1px solid ${BORDER}`, padding: '8px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
                Evaluación del Desempeño Administrativo
              </span>
            </td>
            {/* Codes box */}
            <td style={{ border: `1px solid ${BORDER}`, padding: 0, width: '200px', verticalAlign: 'top' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '3px 8px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#fffbe6' }}>
                      <span style={{ color: BLUE, fontWeight: 'bold' }}>Código:</span> {formCode}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px', borderBottom: `1px solid ${BORDER}` }}>
                      Versión: {formVersion}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 8px', backgroundColor: '#fff7e6' }}>
                      Fecha de Revisión: {reviewDate}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── DATOS DEL COLABORADOR ── */}
      <table style={{ ...tableStyle, marginBottom: '10px' }}>
        <tbody>
          {/* Nombre */}
          <tr>
            {blueCell('Nombre del Colaborador:', { width: '220px' })}
            {cell(employeeName || '', { colSpan: 3 } as any)}
          </tr>
          {/* Posición */}
          <tr>
            {blueCell('Posición del Colaborador:')}
            {cell(position || '', { colSpan: 3 } as any)}
          </tr>
          {/* Departamento / Sub-depto */}
          <tr>
            {blueCell('Departamento:', { width: '220px' })}
            {cell(department || '', { width: '200px' })}
            {blueCell('Sub-departamento:', { width: '160px' })}
            {cell(subDepartment || '')}
          </tr>
          {/* Antigüedad / Tiempo en posición */}
          <tr>
            {blueCell('Fecha de Antigüedad\n(Día | Mes | Año)', { whiteSpace: 'pre-line', height: '48px' })}
            {cell(
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Día</div>
                  <div style={{ fontWeight: 'bold' }}>{hireParts.day || '__'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Mes</div>
                  <div style={{ fontWeight: 'bold' }}>{hireParts.month || '__'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Año</div>
                  <div style={{ fontWeight: 'bold' }}>{hireParts.year || '__'}</div>
                </div>
              </div>,
              { textAlign: 'center' }
            )}
            {blueCell('Tiempo en la posición actual:')}
            {cell(
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Año</div>
                  <div style={{ border: `1px solid ${BORDER}`, minWidth: '40px', padding: '2px 8px', textAlign: 'center', fontWeight: 'bold' }}>{timeInPositionYears || ''}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Meses</div>
                  <div style={{ border: `1px solid ${BORDER}`, minWidth: '40px', padding: '2px 8px', textAlign: 'center', fontWeight: 'bold' }}>{timeInPositionMonths || ''}</div>
                </div>
              </div>,
              { textAlign: 'center' }
            )}
          </tr>
          {/* Jefe / Fecha evaluación */}
          <tr>
            {blueCell('Jefe Inmediato:')}
            {cell(managerName || '')}
            {blueCell('Fecha de Evaluación (Día | Mes | Año)')}
            {cell(
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Día</div>
                  <div style={{ fontWeight: 'bold' }}>{evalParts.day || '__'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Mes</div>
                  <div style={{ fontWeight: 'bold' }}>{evalParts.month || '__'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Año</div>
                  <div style={{ fontWeight: 'bold' }}>{evalParts.year || '__'}</div>
                </div>
              </div>,
              { textAlign: 'center' }
            )}
          </tr>
        </tbody>
      </table>

      {/* ── ESCALA DE CALIFICACIÓN ── */}
      <table style={{ ...tableStyle, marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ backgroundColor: BLUE, color: '#fff', padding: '5px 8px', fontWeight: 'bold', fontSize: '11px', border: `1px solid ${BORDER}` }}>
              Escala de Calificación– Para el Proceso de Evaluación del desempeño
            </td>
          </tr>
          <tr>
            <td style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', lineHeight: '1.6' }}>
              <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Excede Expectativas (10):</span> Consistentemente desempeña y cumple los requerimientos más allá de los estándares, entregando resultados de alta calidad y excelencia.<br />
              <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Cumple Expectativas (8-9):</span> Consistentemente desempeña y cumple los requerimientos, entregando calidad en los resultados.<br />
              <span style={{ color: '#d97706', fontWeight: 'bold' }}>Desempeño a Mejorar (6-7):</span> No es consistente en el desempeño y cumplimiento de los requerimientos o entrega de resultados, pero demuestra deseo de mejorar su desempeño para cumplir los requerimientos y entregar resultados de calidad.<br />
              <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Debajo de Expectativas (1-5):</span> Falla consistentemente en el desempeño y cumplimiento de los requerimientos y no entrega resultados de calidad.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── METAS INDIVIDUALES ── */}
      <table style={{ ...tableStyle, marginBottom: '4px' }}>
        <tbody>
          <tr>
            <td style={{ backgroundColor: BLUE, color: '#fff', padding: '6px 8px', fontWeight: 'bold', textAlign: 'center', border: `1px solid ${BORDER}`, fontSize: '12px' }}>
              EVALUACION METAS INDIVIDUALES (Valor 60%)
            </td>
          </tr>
        </tbody>
      </table>

      {individualGoals.map((goal) => (
        <table key={goal.goal_number} style={{ ...tableStyle, marginBottom: '8px' }}>
          <tbody>
            {/* Row 1: Score label | score value | Meta No. X header | meta description */}
            <tr>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, width: '140px', verticalAlign: 'top', fontSize: '11px' }}>
                Calificación Escala<br />Numérica
              </td>
              <td style={{ border: `1px solid ${BORDER}`, width: '100px', padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                {goal.numeric_score ? (
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: getScoreColor(parseFloat(goal.numeric_score)) }}>
                    {goal.numeric_score}
                  </span>
                ) : ''}
              </td>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, width: '80px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px' }}>
                Meta<br />No. {goal.goal_number}
              </td>
              <td style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'top', minHeight: '40px' }}>
                <span style={{ color: '#1e293b' }}>{goal.goal_description || ''}</span>
              </td>
            </tr>
            {/* Row 2: Calificación según criterio | empty | Medición y Resultados */}
            <tr>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, verticalAlign: 'top', fontSize: '11px' }}>
                Calificación según el<br />criterio de la escala
              </td>
              <td style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'middle', textAlign: 'center', fontSize: '10px', color: '#475569' }}>
                {goal.numeric_score ? getScoreLabel(parseFloat(goal.numeric_score)) : ''}
              </td>
              <td colSpan={2} style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'top' }}>
                <span style={{ fontWeight: 'bold' }}>Medición y Resultados:</span>{' '}
                <span>{goal.measurement_results || ''}</span>
              </td>
            </tr>
            {/* Row 3: Comentarios Jefe */}
            <tr>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, verticalAlign: 'top', fontSize: '11px' }}>
                Comentarios Jefe<br />Inmediato
              </td>
              <td colSpan={3} style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'top', minHeight: '36px' }}>
                {goal.manager_comments || ''}
              </td>
            </tr>
            {/* Row 4: Comentarios Colaborador */}
            <tr>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, verticalAlign: 'top', fontSize: '11px' }}>
                Comentarios del<br />Colaborador
              </td>
              <td colSpan={3} style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'top', minHeight: '36px' }}>
                {goal.employee_comments || ''}
              </td>
            </tr>
          </tbody>
        </table>
      ))}

      {/* Goals average */}
      <table style={{ ...tableStyle, marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ border: `1px solid ${BORDER}`, padding: '6px 12px', backgroundColor: LIGHT_BLUE, textAlign: 'right', fontWeight: 'bold' }}>
              Promedio Metas Individuales (60%):
            </td>
            <td style={{ border: `1px solid ${BORDER}`, padding: '6px 12px', width: '90px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: getScoreColor(goalsAverage) }}>
              {goalsAverage > 0 ? goalsAverage.toFixed(2) : '--'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── COMPETENCIAS CONDUCTUALES ── */}
      <table style={{ ...tableStyle, marginBottom: '4px' }}>
        <tbody>
          <tr>
            <td style={{ backgroundColor: BLUE, color: '#fff', padding: '6px 8px', fontWeight: 'bold', textAlign: 'center', border: `1px solid ${BORDER}`, fontSize: '12px' }}>
              EVALUACION COMPETENCIAS CONDUCTUALES (Valor 40%)
            </td>
          </tr>
        </tbody>
      </table>

      {competencies.map((comp) => (
        <table key={comp.competency_number} style={{ ...tableStyle, marginBottom: '8px' }}>
          <tbody>
            <tr>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, width: '140px', verticalAlign: 'top', fontSize: '11px' }}>
                Calificación Escala<br />Numérica
              </td>
              <td style={{ border: `1px solid ${BORDER}`, width: '100px', padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                {comp.numeric_score ? (
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: getScoreColor(parseFloat(comp.numeric_score)) }}>
                    {comp.numeric_score}
                  </span>
                ) : ''}
              </td>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, width: '80px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px' }}>
                Competencia<br />No. {comp.competency_number}
              </td>
              <td style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'top' }}>
                <span>{comp.competency_description || ''}</span>
              </td>
            </tr>
            <tr>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, verticalAlign: 'top', fontSize: '11px' }}>
                Calificación según el<br />criterio de la escala
              </td>
              <td style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'middle', textAlign: 'center', fontSize: '10px', color: '#475569' }}>
                {comp.numeric_score ? getScoreLabel(parseFloat(comp.numeric_score)) : ''}
              </td>
              <td colSpan={2} style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'top', minHeight: '24px' }}></td>
            </tr>
            <tr>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, verticalAlign: 'top', fontSize: '11px' }}>
                Comentarios Jefe<br />Inmediato
              </td>
              <td colSpan={3} style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'top', minHeight: '36px' }}>
                {comp.manager_comments || ''}
              </td>
            </tr>
            <tr>
              <td style={{ backgroundColor: BLUE, color: '#fff', fontWeight: 'bold', padding: '6px 8px', border: `1px solid ${BORDER}`, verticalAlign: 'top', fontSize: '11px' }}>
                Comentarios del<br />Colaborador
              </td>
              <td colSpan={3} style={{ border: `1px solid ${BORDER}`, padding: '6px 8px', verticalAlign: 'top', minHeight: '36px' }}>
                {comp.employee_comments || ''}
              </td>
            </tr>
          </tbody>
        </table>
      ))}

      {/* Competencies + Final average */}
      <table style={{ ...tableStyle, marginBottom: '16px' }}>
        <tbody>
          <tr>
            <td style={{ border: `1px solid ${BORDER}`, padding: '6px 12px', backgroundColor: LIGHT_BLUE, textAlign: 'right', fontWeight: 'bold' }}>
              Promedio Competencias (40%):
            </td>
            <td style={{ border: `1px solid ${BORDER}`, padding: '6px 12px', width: '90px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: getScoreColor(competenciesAverage) }}>
              {competenciesAverage > 0 ? competenciesAverage.toFixed(2) : '--'}
            </td>
          </tr>
          <tr>
            <td style={{ border: `1px solid ${BORDER}`, padding: '8px 12px', backgroundColor: BLUE, color: '#fff', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              CALIFICACIÓN FINAL (Metas 60% + Competencias 40%):
            </td>
            <td style={{ border: `1px solid ${BORDER}`, padding: '8px 12px', width: '90px', textAlign: 'center', fontWeight: 'bold', fontSize: '22px', color: getScoreColor(finalScore) }}>
              {finalScore > 0 ? finalScore.toFixed(2) : '--'}
            </td>
          </tr>
          {finalScore > 0 && (
            <tr>
              <td colSpan={2} style={{ border: `1px solid ${BORDER}`, padding: '4px 12px', textAlign: 'center', fontWeight: 'bold', color: getScoreColor(finalScore), backgroundColor: LIGHT_BLUE }}>
                {getScoreLabel(finalScore)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Comentarios generales */}
      {(overallComments || employeeComments) && (
        <table style={{ ...tableStyle, marginBottom: '16px' }}>
          <tbody>
            {overallComments && (
              <tr>
                {blueCell('Comentarios\nGenerales del Jefe', { whiteSpace: 'pre-line', width: '160px', verticalAlign: 'top' })}
                {cell(<span style={{ whiteSpace: 'pre-wrap' }}>{overallComments}</span>)}
              </tr>
            )}
            {employeeComments && (
              <tr>
                {blueCell('Comentarios del\nColaborador', { whiteSpace: 'pre-line', width: '160px', verticalAlign: 'top' })}
                {cell(<span style={{ whiteSpace: 'pre-wrap' }}>{employeeComments}</span>)}
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Firmas */}
      <table style={{ ...tableStyle, marginBottom: '16px' }}>
        <tbody>
          <tr>
            <td style={{ border: `1px solid ${BORDER}`, padding: '8px', textAlign: 'center', width: '33%', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: `1px solid #1e293b`, marginTop: '40px', paddingTop: '4px' }}>
                <strong>Firma del Colaborador</strong><br />
                <span style={{ fontSize: '10px', color: '#64748b' }}>{employeeName}</span><br />
                <span style={{ fontSize: '10px', color: '#64748b' }}>Fecha: _____________</span>
              </div>
            </td>
            <td style={{ border: `1px solid ${BORDER}`, padding: '8px', textAlign: 'center', width: '33%', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: `1px solid #1e293b`, marginTop: '40px', paddingTop: '4px' }}>
                <strong>Firma del Jefe Inmediato</strong><br />
                <span style={{ fontSize: '10px', color: '#64748b' }}>{managerName || '_____________________'}</span><br />
                <span style={{ fontSize: '10px', color: '#64748b' }}>Fecha: _____________</span>
              </div>
            </td>
            <td style={{ border: `1px solid ${BORDER}`, padding: '8px', textAlign: 'center', width: '33%', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: `1px solid #1e293b`, marginTop: '40px', paddingTop: '4px' }}>
                <strong>Firma RRHH</strong><br />
                <span style={{ fontSize: '10px', color: '#64748b' }}>_____________________</span><br />
                <span style={{ fontSize: '10px', color: '#64748b' }}>Fecha: _____________</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', borderTop: `1px solid #e2e8f0`, paddingTop: '6px' }}>
        PLIHSA · Sistema de Evaluación del Desempeño · {formCode} · Generado el {new Date(createdAt).toLocaleString('es-HN')}
      </div>
    </div>
  );
}
