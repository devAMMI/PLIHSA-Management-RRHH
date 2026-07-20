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

interface FinalAdministrativeEvaluationPDFTemplateProps {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  subDepartment: string;
  hireDate: string;
  evaluationDate: string;
  timeInPosition: string;
  managerName: string;
  periodName: string;
  formCode: string;
  formVersion: string;
  individualGoals: IndividualGoal[];
  competencies: Competency[];
  goalsAverage: number;
  competenciesAverage: number;
  finalScore: number;
  overallComments: string;
  employeeComments: string;
  createdAt: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 10) return '#16a34a';
  if (score >= 8) return '#2563eb';
  if (score >= 6) return '#d97706';
  return '#dc2626';
};

const getScoreLabel = (score: number): string => {
  if (score >= 10) return 'Excede';
  if (score >= 8) return 'Cumple';
  if (score >= 6) return 'A Mejorar';
  return 'Debajo';
};

export function FinalAdministrativeEvaluationPDFTemplate(props: FinalAdministrativeEvaluationPDFTemplateProps) {
  const {
    id,
    employeeName,
    position,
    department,
    subDepartment,
    hireDate,
    evaluationDate,
    timeInPosition,
    managerName,
    periodName,
    formCode,
    formVersion,
    individualGoals,
    competencies,
    goalsAverage,
    competenciesAverage,
    finalScore,
    overallComments,
    employeeComments,
    createdAt
  } = props;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id={id} style={{ width: '794px', padding: '40px', backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '3px solid #2563eb', paddingBottom: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <img src="/Profile-pic-plihsa-logo-foto.jpg" alt="PLIHSA" style={{ height: '56px' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>
            Evaluación Final del Desempeño Administrativo
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Código: {formCode} | Versión: {formVersion} | Período: {periodName}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
          DATOS DEL COLABORADOR
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', width: '20%' }}>Nombre:</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', width: '30%' }}>{employeeName}</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', width: '20%' }}>Posición:</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', width: '30%' }}>{position}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>Departamento:</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1' }}>{department}</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>Sub-depto:</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1' }}>{subDepartment || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>Fecha Ingreso:</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1' }}>{formatDate(hireDate)}</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>Tiempo Posición:</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1' }}>{timeInPosition || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>Jefe Inmediato:</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1' }}>{managerName || 'N/A'}</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>Fecha Evaluación:</td>
              <td style={{ padding: '4px 8px', border: '1px solid #cbd5e1' }}>{formatDate(evaluationDate)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569', margin: '0 0 6px 0' }}>ESCALA DE CALIFICACIÓN:</p>
        <div style={{ display: 'flex', gap: '12px', fontSize: '10px' }}>
          <span><strong style={{ color: '#16a34a' }}>10</strong> = Excede</span>
          <span><strong style={{ color: '#2563eb' }}>8-9</strong> = Cumple</span>
          <span><strong style={{ color: '#d97706' }}>6-7</strong> = A Mejorar</span>
          <span><strong style={{ color: '#dc2626' }}>1-5</strong> = Debajo</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', backgroundColor: '#2563eb', padding: '6px 12px', borderRadius: '4px', marginBottom: '8px' }}>
          EVALUACIÓN DE METAS INDIVIDUALES (60%)
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#dbeafe' }}>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8', width: '4%' }}>No.</th>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8', width: '10%' }}>Calif.</th>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8' }}>Meta / Medición y Resultados</th>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8', width: '22%' }}>Comentarios Jefe</th>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8', width: '22%' }}>Comentarios Colaborador</th>
            </tr>
          </thead>
          <tbody>
            {individualGoals.map((goal) => (
              <tr key={goal.goal_number}>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', textAlign: 'center', fontWeight: 'bold' }}>{goal.goal_number}</td>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', textAlign: 'center', fontWeight: 'bold', color: getScoreColor(goal.numeric_score ? parseFloat(goal.numeric_score) : 0) }}>
                  {goal.numeric_score || '--'}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', verticalAlign: 'top' }}>
                  {goal.goal_description && <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{goal.goal_description}</p>}
                  {goal.measurement_results && <p style={{ margin: 0, color: '#475569' }}>{goal.measurement_results}</p>}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', verticalAlign: 'top' }}>{goal.manager_comments || ''}</td>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', verticalAlign: 'top' }}>{goal.employee_comments || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', fontSize: '11px' }}>
          <span style={{ fontWeight: 'bold', color: '#475569' }}>Promedio Metas: </span>
          <span style={{ fontWeight: 'bold', color: getScoreColor(goalsAverage), marginLeft: '8px', fontSize: '14px' }}>
            {goalsAverage > 0 ? goalsAverage.toFixed(2) : '--'}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', backgroundColor: '#2563eb', padding: '6px 12px', borderRadius: '4px', marginBottom: '8px' }}>
          EVALUACIÓN DE COMPETENCIAS CONDUCTUALES (40%)
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#dbeafe' }}>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8', width: '4%' }}>No.</th>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8', width: '10%' }}>Calif.</th>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8' }}>Competencia</th>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8', width: '25%' }}>Comentarios Jefe</th>
              <th style={{ padding: '4px 6px', border: '1px solid #94a3b8', width: '25%' }}>Comentarios Colaborador</th>
            </tr>
          </thead>
          <tbody>
            {competencies.map((comp) => (
              <tr key={comp.competency_number}>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', textAlign: 'center', fontWeight: 'bold' }}>{comp.competency_number}</td>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', textAlign: 'center', fontWeight: 'bold', color: getScoreColor(comp.numeric_score ? parseFloat(comp.numeric_score) : 0) }}>
                  {comp.numeric_score || '--'}
                </td>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', verticalAlign: 'top' }}>{comp.competency_description || ''}</td>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', verticalAlign: 'top' }}>{comp.manager_comments || ''}</td>
                <td style={{ padding: '4px 6px', border: '1px solid #94a3b8', verticalAlign: 'top' }}>{comp.employee_comments || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', fontSize: '11px' }}>
          <span style={{ fontWeight: 'bold', color: '#475569' }}>Promedio Competencias: </span>
          <span style={{ fontWeight: 'bold', color: getScoreColor(competenciesAverage), marginLeft: '8px', fontSize: '14px' }}>
            {competenciesAverage > 0 ? competenciesAverage.toFixed(2) : '--'}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '2px solid #2563eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>CALIFICACIÓN FINAL</p>
            <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0' }}>Metas (60%) + Competencias (40%)</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: getScoreColor(finalScore), margin: 0 }}>
              {finalScore > 0 ? finalScore.toFixed(2) : '--'}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: getScoreColor(finalScore), margin: 0 }}>
              {finalScore > 0 ? getScoreLabel(finalScore) : 'Pendiente'}
            </p>
          </div>
        </div>
      </div>

      {(overallComments || employeeComments) && (
        <div style={{ marginBottom: '20px' }}>
          {overallComments && (
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Comentarios Generales del Jefe:</h3>
              <p style={{ fontSize: '10px', color: '#475569', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', margin: 0, whiteSpace: 'pre-wrap' }}>{overallComments}</p>
            </div>
          )}
          {employeeComments && (
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Comentarios del Colaborador:</h3>
              <p style={{ fontSize: '10px', color: '#475569', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', margin: 0, whiteSpace: 'pre-wrap' }}>{employeeComments}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #94a3b8', textAlign: 'center', width: '33%' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Firma del Colaborador</p>
                <div style={{ borderTop: '1px solid #475569', paddingTop: '4px' }}>
                  <p style={{ margin: 0 }}>{employeeName}</p>
                  <p style={{ margin: 0, color: '#64748b' }}>Fecha: ____________</p>
                </div>
              </td>
              <td style={{ padding: '8px', border: '1px solid #94a3b8', textAlign: 'center', width: '33%' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Firma del Jefe Inmediato</p>
                <div style={{ borderTop: '1px solid #475569', paddingTop: '4px' }}>
                  <p style={{ margin: 0 }}>{managerName || '__________'}</p>
                  <p style={{ margin: 0, color: '#64748b' }}>Fecha: ____________</p>
                </div>
              </td>
              <td style={{ padding: '8px', border: '1px solid #94a3b8', textAlign: 'center', width: '33%' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Firma de RRHH</p>
                <div style={{ borderTop: '1px solid #475569', paddingTop: '4px' }}>
                  <p style={{ margin: 0 }}>__________</p>
                  <p style={{ margin: 0, color: '#64748b' }}>Fecha: ____________</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '9px', color: '#94a3b8', textAlign: 'center' }}>
        <p style={{ margin: 0 }}>Documento generado el {new Date(createdAt).toLocaleString('es-HN')}</p>
        <p style={{ margin: '2px 0 0 0' }}>PLIHSA · Sistema de Evaluación del Desempeño · {formCode}</p>
      </div>
    </div>
  );
}
