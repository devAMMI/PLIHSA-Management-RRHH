interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  photo_url?: string;
  hire_date?: string;
  sub_department?: string;
}

interface AdministrativeEvaluation {
  id: string;
  evaluation_code: string;
  employee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  general_observations: string;
  evaluator_name: string;
  evaluator_position: string;
  attendance_rating: number;
  punctuality_rating: number;
  presentation_rating: number;
  job_knowledge_rating: number;
  quality_rating: number;
  productivity_rating: number;
  initiative_rating: number;
  collaboration_rating: number;
  communication_rating: number;
  planning_rating: number;
  decision_making_rating: number;
  leadership_rating: number;
  employee?: Employee;
}

interface OperativeEvaluation {
  id: string;
  evaluation_code: string;
  employee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  general_observations: string;
  evaluator_name: string;
  evaluator_position: string;
  attendance_rating: number;
  punctuality_rating: number;
  presentation_rating: number;
  task_completion_rating: number;
  work_quality_rating: number;
  speed_efficiency_rating: number;
  safety_compliance_rating: number;
  tool_care_rating: number;
  teamwork_rating: number;
  instruction_following_rating: number;
  problem_solving_rating: number;
  adaptation_rating: number;
  employee?: Employee;
}

const fmtDate = (d: string | undefined) => {
  if (!d) return "";
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const SCORE_COLORS: Record<number, { bg: string; color: string; label: string }> = {
  1: { bg: "#fce4ec", color: "#b71c1c", label: "Debajo de Expectativas" },
  2: { bg: "#fff3e0", color: "#e65100", label: "Desempeño a Mejorar" },
  3: { bg: "#e8f5e9", color: "#1b5e20", label: "Cumple Expectativas" },
  4: { bg: "#e3f2fd", color: "#0d47a1", label: "Supera Expectativas" },
  5: { bg: "#f3e5f5", color: "#6a1b9a", label: "Excepcional" },
};

const getRatingLabel = (rating: number): string => {
  return SCORE_COLORS[rating]?.label || "Sin calificar";
};

interface PDFTemplateProps {
  evaluation: AdministrativeEvaluation;
}

export function AdministrativePDFTemplate({ evaluation }: PDFTemplateProps) {
  const employee = evaluation.employee;

  const ratingFields = [
    { label: "Asistencia", value: evaluation.attendance_rating },
    { label: "Puntualidad", value: evaluation.punctuality_rating },
    { label: "Presentación Personal", value: evaluation.presentation_rating },
    { label: "Conocimiento del Trabajo", value: evaluation.job_knowledge_rating },
    { label: "Calidad del Trabajo", value: evaluation.quality_rating },
    { label: "Productividad", value: evaluation.productivity_rating },
    { label: "Iniciativa", value: evaluation.initiative_rating },
    { label: "Colaboración", value: evaluation.collaboration_rating },
    { label: "Comunicación", value: evaluation.communication_rating },
    { label: "Planificación", value: evaluation.planning_rating },
    { label: "Toma de Decisiones", value: evaluation.decision_making_rating },
    { label: "Liderazgo", value: evaluation.leadership_rating },
  ];

  return (
    <div
      id="pdf-print-area"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        padding: 32,
        maxWidth: 800,
        margin: "0 auto",
        color: "#000",
        fontSize: 11,
        lineHeight: 1.5,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 120,
                padding: "8px 12px",
                border: "1px solid #000",
                fontWeight: 900,
                fontSize: 20,
                color: "#1a3f6f",
                letterSpacing: 2,
              }}
            >
              PLIHSA
            </td>
            <td
              style={{
                padding: "8px 16px",
                border: "1px solid #000",
                fontWeight: 700,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Evaluación de Desempeño Administrativo
            </td>
            <td
              style={{
                padding: "8px 12px",
                border: "1px solid #000",
                fontSize: 10,
                minWidth: 160,
              }}
            >
              <div>
                <b>Código:</b> {evaluation.evaluation_code}
              </div>
              <div>
                <b>Fecha:</b> {fmtDate(evaluation.created_at)}
              </div>
              <div>
                <b>Estado:</b> {evaluation.status === 'completed' ? 'Completada' : 'Borrador'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Nombre del Colaborador:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000" }}>
              {employee ? `${employee.first_name} ${employee.last_name}` : "N/A"}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Posición del Colaborador:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000" }}>
              {employee?.position || "N/A"}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Departamento:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000", width: "30%" }}>
              {evaluation.department || employee?.department || "N/A"}
            </td>
            <td
              style={{
                width: 180,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Fecha de Ingreso:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000" }}>
              {fmtDate(employee?.hire_date)}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Evaluador:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000" }}>
              {evaluation.evaluator_name} - {evaluation.evaluator_position}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr>
            <td
              colSpan={5}
              style={{
                background: "#1a3f6f",
                color: "#fff",
                padding: "8px 10px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1,
              }}
            >
              EVALUACIÓN DE FACTORES DE DESEMPEÑO
            </td>
          </tr>
          <tr>
            <th
              style={{
                width: 40,
                padding: "6px 8px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontSize: 10,
              }}
            >
              No.
            </th>
            <th
              style={{
                padding: "6px 8px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontSize: 10,
              }}
            >
              Factor Evaluado
            </th>
            <th
              style={{
                padding: "6px 8px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontSize: 10,
                textAlign: "center",
                width: 80,
              }}
            >
              Puntuación
            </th>
            <th
              style={{
                padding: "6px 8px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontSize: 10,
                width: 200,
              }}
            >
              Calificación
            </th>
          </tr>
        </thead>
        <tbody>
          {ratingFields.map((field, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "8px 8px",
                  border: "1px solid #000",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </td>
              <td style={{ padding: "8px 8px", border: "1px solid #000" }}>{field.label}</td>
              <td
                style={{
                  padding: "8px 8px",
                  border: "1px solid #000",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {field.value}/5
              </td>
              <td
                style={{
                  padding: "8px 8px",
                  border: "1px solid #000",
                  background: SCORE_COLORS[field.value]?.bg || "#f5f5f5",
                  color: SCORE_COLORS[field.value]?.color || "#000",
                  fontWeight: 600,
                }}
              >
                {getRatingLabel(field.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {evaluation.general_observations && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <tbody>
            <tr>
              <td
                style={{
                  width: 160,
                  padding: "10px",
                  border: "1px solid #000",
                  background: "#1a3f6f",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 10,
                  verticalAlign: "top",
                }}
              >
                Observaciones Generales
              </td>
              <td style={{ padding: "10px", border: "1px solid #000", minHeight: 50 }}>
                {evaluation.general_observations}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: "33%",
                padding: "28px 20px 10px",
                textAlign: "center",
                fontSize: 10,
                borderTop: "1px solid #000",
              }}
            >
              Firma Colaborador
            </td>
            <td
              style={{
                width: "33%",
                padding: "28px 20px 10px",
                textAlign: "center",
                fontSize: 10,
                borderTop: "1px solid #000",
              }}
            >
              Firma Evaluador
            </td>
            <td
              style={{
                width: "34%",
                padding: "28px 20px 10px",
                textAlign: "center",
                fontSize: 10,
                borderTop: "1px solid #000",
              }}
            >
              Firma RRHH
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface OperativePDFTemplateProps {
  evaluation: OperativeEvaluation;
}

export function OperativePDFTemplate({ evaluation }: OperativePDFTemplateProps) {
  const employee = evaluation.employee;

  const ratingFields = [
    { label: "Asistencia", value: evaluation.attendance_rating },
    { label: "Puntualidad", value: evaluation.punctuality_rating },
    { label: "Presentación Personal", value: evaluation.presentation_rating },
    { label: "Cumplimiento de Tareas", value: evaluation.task_completion_rating },
    { label: "Calidad del Trabajo", value: evaluation.work_quality_rating },
    { label: "Velocidad y Eficiencia", value: evaluation.speed_efficiency_rating },
    { label: "Cumplimiento de Normas de Seguridad", value: evaluation.safety_compliance_rating },
    { label: "Cuidado de Herramientas", value: evaluation.tool_care_rating },
    { label: "Trabajo en Equipo", value: evaluation.teamwork_rating },
    { label: "Seguimiento de Instrucciones", value: evaluation.instruction_following_rating },
    { label: "Resolución de Problemas", value: evaluation.problem_solving_rating },
    { label: "Adaptación al Cambio", value: evaluation.adaptation_rating },
  ];

  return (
    <div
      id="pdf-print-area"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        padding: 32,
        maxWidth: 800,
        margin: "0 auto",
        color: "#000",
        fontSize: 11,
        lineHeight: 1.5,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 120,
                padding: "8px 12px",
                border: "1px solid #000",
                fontWeight: 900,
                fontSize: 20,
                color: "#1a3f6f",
                letterSpacing: 2,
              }}
            >
              PLIHSA
            </td>
            <td
              style={{
                padding: "8px 16px",
                border: "1px solid #000",
                fontWeight: 700,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Evaluación de Desempeño Operativo
            </td>
            <td
              style={{
                padding: "8px 12px",
                border: "1px solid #000",
                fontSize: 10,
                minWidth: 160,
              }}
            >
              <div>
                <b>Código:</b> {evaluation.evaluation_code}
              </div>
              <div>
                <b>Fecha:</b> {fmtDate(evaluation.created_at)}
              </div>
              <div>
                <b>Estado:</b> {evaluation.status === 'completed' ? 'Completada' : 'Borrador'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Nombre del Colaborador:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000" }}>
              {employee ? `${employee.first_name} ${employee.last_name}` : "N/A"}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Posición del Colaborador:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000" }}>
              {employee?.position || "N/A"}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Departamento:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000", width: "30%" }}>
              {evaluation.department || employee?.department || "N/A"}
            </td>
            <td
              style={{
                width: 180,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Fecha de Ingreso:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000" }}>
              {fmtDate(employee?.hire_date)}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: "5px 10px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Evaluador:
            </td>
            <td style={{ padding: "5px 10px", border: "1px solid #000" }}>
              {evaluation.evaluator_name} - {evaluation.evaluator_position}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr>
            <td
              colSpan={5}
              style={{
                background: "#1a3f6f",
                color: "#fff",
                padding: "8px 10px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1,
              }}
            >
              EVALUACIÓN DE FACTORES DE DESEMPEÑO
            </td>
          </tr>
          <tr>
            <th
              style={{
                width: 40,
                padding: "6px 8px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontSize: 10,
              }}
            >
              No.
            </th>
            <th
              style={{
                padding: "6px 8px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontSize: 10,
              }}
            >
              Factor Evaluado
            </th>
            <th
              style={{
                padding: "6px 8px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontSize: 10,
                textAlign: "center",
                width: 80,
              }}
            >
              Puntuación
            </th>
            <th
              style={{
                padding: "6px 8px",
                border: "1px solid #000",
                background: "#1a3f6f",
                color: "#fff",
                fontSize: 10,
                width: 200,
              }}
            >
              Calificación
            </th>
          </tr>
        </thead>
        <tbody>
          {ratingFields.map((field, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "8px 8px",
                  border: "1px solid #000",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </td>
              <td style={{ padding: "8px 8px", border: "1px solid #000" }}>{field.label}</td>
              <td
                style={{
                  padding: "8px 8px",
                  border: "1px solid #000",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {field.value}/5
              </td>
              <td
                style={{
                  padding: "8px 8px",
                  border: "1px solid #000",
                  background: SCORE_COLORS[field.value]?.bg || "#f5f5f5",
                  color: SCORE_COLORS[field.value]?.color || "#000",
                  fontWeight: 600,
                }}
              >
                {getRatingLabel(field.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {evaluation.general_observations && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <tbody>
            <tr>
              <td
                style={{
                  width: 160,
                  padding: "10px",
                  border: "1px solid #000",
                  background: "#1a3f6f",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 10,
                  verticalAlign: "top",
                }}
              >
                Observaciones Generales
              </td>
              <td style={{ padding: "10px", border: "1px solid #000", minHeight: 50 }}>
                {evaluation.general_observations}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
        <tbody>
          <tr>
            <td
              style={{
                width: "33%",
                padding: "28px 20px 10px",
                textAlign: "center",
                fontSize: 10,
                borderTop: "1px solid #000",
              }}
            >
              Firma Colaborador
            </td>
            <td
              style={{
                width: "33%",
                padding: "28px 20px 10px",
                textAlign: "center",
                fontSize: 10,
                borderTop: "1px solid #000",
              }}
            >
              Firma Evaluador
            </td>
            <td
              style={{
                width: "34%",
                padding: "28px 20px 10px",
                textAlign: "center",
                fontSize: 10,
                borderTop: "1px solid #000",
              }}
            >
              Firma RRHH
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
