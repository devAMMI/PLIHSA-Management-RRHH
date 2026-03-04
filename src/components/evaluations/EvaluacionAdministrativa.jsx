import { useState, useRef } from "react";

// ─── ESTILOS GLOBALES ────────────────────────────────────────────────────────
const FONT = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";

// ─── DATOS DEMO (simulando lo que vendría de Supabase) ───────────────────────
const DEMO_EMPLOYEES = [
  { id: "e001", code: "PLIHSA-0001", name: "Carlos Eduardo Reyes Mejía",     position: "Supervisor de Mantenimiento Coronas", department: "Mantenimiento",  sub_department: "Contabilidad", hire_date: "2021-02-01" },
  { id: "e002", code: "PLIHSA-0002", name: "Ana Patricia Soto Velásquez",    position: "Analista Financiero",                 department: "Finanzas",        sub_department: "Contabilidad", hire_date: "2020-09-01" },
  { id: "e003", code: "PLIHSA-0003", name: "María Fernanda López Rodas",     position: "Coordinadora de RRHH",                department: "Recursos Humanos",sub_department: "",             hire_date: "2019-03-15" },
  { id: "e004", code: "PLIHSA-0004", name: "Franklin Eliu Ramos Barrientos", position: "Supervisor de Producción",            department: "Producción",      sub_department: "Inyección",    hire_date: "2018-05-10" },
  { id: "e005", code: "PLIHSA-0005", name: "Bayron Joset Sierra Vasquez",    position: "Técnico de Mantenimiento Mecánico",   department: "Mantenimiento",   sub_department: "Periférico",   hire_date: "2017-08-20" },
];

const MANAGERS = [
  { id: "m001", name: "Alvaro Odilver Rivera",   position: "Gerente de Planta" },
  { id: "m002", name: "Edwin Rodil Lara Mejía",  position: "Jefe de Mantenimiento Logístico" },
  { id: "m003", name: "Edy Joel Tabora López",   position: "Supervisor de Producción" },
];

const PERIODS = [
  { id: "p1", name: "Periodo 1 - Enero / Abril 2026",     year: 2026, number: 1 },
  { id: "p2", name: "Periodo 2 - Mayo / Agosto 2026",     year: 2026, number: 2 },
  { id: "p3", name: "Periodo 3 - Septiembre / Dic 2026",  year: 2026, number: 3 },
];

const SCORE_OPTIONS = [
  { value: "",   label: "—" },
  { value: "1",  label: "Debajo de Expectativas" },
  { value: "2",  label: "Desempeño a Mejorar" },
  { value: "3",  label: "Cumple Expectativas" },
  { value: "4",  label: "Supera Expectativas" },
];

const SCORE_COLORS = {
  "1": { bg: "#fce4ec", color: "#b71c1c", label: "Debajo de Expectativas" },
  "2": { bg: "#fff3e0", color: "#e65100", label: "Desempeño a Mejorar" },
  "3": { bg: "#e8f5e9", color: "#1b5e20", label: "Cumple Expectativas" },
  "4": { bg: "#e3f2fd", color: "#0d47a1", label: "Supera Expectativas" },
};

const emptyGoal   = { description: "", measurement: "" };
const emptySkill  = { name: "" };
const emptyReview = { result: "", score: "" };

const defaultForm = {
  period_id: "p1",
  employee_id: "",
  manager_id: "",
  definition_date: "",
  review_date: "",
  goals:        [{ ...emptyGoal }, { ...emptyGoal }, { ...emptyGoal }, { ...emptyGoal }, { ...emptyGoal }],
  skills:       [{ ...emptySkill }, { ...emptySkill }, { ...emptySkill }, { ...emptySkill }, { ...emptySkill }],
  goal_reviews: [{ ...emptyReview }, { ...emptyReview }, { ...emptyReview }, { ...emptyReview }, { ...emptyReview }],
  skill_reviews:[{ ...emptyReview }, { ...emptyReview }, { ...emptyReview }, { ...emptyReview }, { ...emptyReview }],
  manager_comments: "",
  employee_comments: "",
  status: "draft",
  saved: false,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

// ─── COMPONENTES UI ───────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: "#1a3f6f", letterSpacing: "0.6px",
    textTransform: "uppercase", marginBottom: 4 }}>
    {children}{required && <span style={{ color: "#c62828", marginLeft: 2 }}>*</span>}
  </div>
);

const Input = ({ value, onChange, placeholder, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #c5cae9",
      borderRadius: 5, fontSize: 12, fontFamily: "'DM Sans',sans-serif",
      color: "#212121", background: "#fafafa", outline: "none", ...style }} />
);

const Select = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #c5cae9",
      borderRadius: 5, fontSize: 12, fontFamily: "'DM Sans',sans-serif",
      color: value ? "#212121" : "#9e9e9e", background: "#fafafa", outline: "none" }}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o.value ?? o.id} value={o.value ?? o.id}>{o.label ?? o.name}</option>)}
  </select>
);

const Textarea = ({ value, onChange, rows = 3, placeholder }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    rows={rows} placeholder={placeholder}
    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #c5cae9",
      borderRadius: 5, fontSize: 12, fontFamily: "'DM Sans',sans-serif",
      color: "#212121", background: "#fafafa", outline: "none", resize: "vertical" }} />
);

const SectionHeader = ({ children }) => (
  <div style={{ background: "#1a3f6f", color: "#fff", padding: "9px 16px",
    fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase",
    borderRadius: 4, marginBottom: 0 }}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    draft:            { label: "Borrador",          bg: "#f5f5f5", color: "#616161" },
    pending_employee: { label: "Pendiente Empleado", bg: "#e3f2fd", color: "#1565c0" },
    pending_manager:  { label: "Pendiente Gerente",  bg: "#f3e5f5", color: "#6a1b9a" },
    pending_rrhh:     { label: "Pendiente RRHH",     bg: "#fff3e0", color: "#e65100" },
    completed:        { label: "Completada",         bg: "#e8f5e9", color: "#1b5e20" },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

// ─── VISTA DE IMPRESIÓN / PDF ─────────────────────────────────────────────────
const PrintView = ({ form, employee, manager, period }) => (
  <div id="print-area" style={{ fontFamily: "'DM Sans',sans-serif", padding: 32,
    maxWidth: 800, margin: "0 auto", color: "#000", fontSize: 11, lineHeight: 1.5 }}>

    {/* Header */}
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
      <tbody>
        <tr>
          <td style={{ width: 120, padding: "8px 12px", border: "1px solid #000",
            fontWeight: 900, fontSize: 20, color: "#1a3f6f", letterSpacing: 2 }}>
            PLIHSA
          </td>
          <td style={{ padding: "8px 16px", border: "1px solid #000",
            fontWeight: 700, fontSize: 13, textAlign: "center" }}>
            Definición de Factores y Revisión del Desempeño Administrativo
          </td>
          <td style={{ padding: "8px 12px", border: "1px solid #000",
            fontSize: 10, minWidth: 160 }}>
            <div><b>Código:</b> PL-RH-P-002-F01</div>
            <div><b>Versión:</b> 01</div>
            <div><b>Fecha de Revisión:</b> 09/07/2025</div>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Datos del colaborador */}
    {[
      ["Nombre del Colaborador:", employee?.name || ""],
      ["Posición del Colaborador:", employee?.position || ""],
    ].map(([label, val]) => (
      <table key={label} style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
        <tbody><tr>
          <td style={{ width: 200, padding: "5px 10px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10 }}>{label}</td>
          <td style={{ padding: "5px 10px", border: "1px solid #000" }}>{val}</td>
        </tr></tbody>
      </table>
    ))}

    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
      <tbody><tr>
        <td style={{ width: 200, padding: "5px 10px", border: "1px solid #000",
          background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10 }}>Departamento:</td>
        <td style={{ padding: "5px 10px", border: "1px solid #000", width: "30%" }}>{employee?.department || ""}</td>
        <td style={{ width: 180, padding: "5px 10px", border: "1px solid #000",
          background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10 }}>Sub-departamento:</td>
        <td style={{ padding: "5px 10px", border: "1px solid #000" }}>{employee?.sub_department || ""}</td>
      </tr></tbody>
    </table>

    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
      <tbody><tr>
        <td style={{ width: 200, padding: "5px 10px", border: "1px solid #000",
          background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10 }}>Fecha de Ingreso:</td>
        <td style={{ padding: "5px 10px", border: "1px solid #000", width: "30%" }}>{fmtDate(employee?.hire_date)}</td>
        <td style={{ width: 180, padding: "5px 10px", border: "1px solid #000",
          background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10 }}>Fecha def. factores:</td>
        <td style={{ padding: "5px 10px", border: "1px solid #000" }}>{fmtDate(form.definition_date)}</td>
      </tr></tbody>
    </table>

    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
      <tbody><tr>
        <td style={{ width: 200, padding: "5px 10px", border: "1px solid #000",
          background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10 }}>Jefe Inmediato:</td>
        <td style={{ padding: "5px 10px", border: "1px solid #000" }}>{manager?.name || ""}</td>
      </tr></tbody>
    </table>

    {/* Metas Individuales */}
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
      <thead>
        <tr>
          <td colSpan={3} style={{ background: "#1a3f6f", color: "#fff", padding: "8px 10px",
            textAlign: "center", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>
            DEFINICIÓN METAS INDIVIDUALES
          </td>
        </tr>
        <tr>
          <th style={{ width: 40, padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>No.</th>
          <th style={{ padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>Metas Individuales</th>
          <th style={{ padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>Medición y Resultados Esperados</th>
        </tr>
      </thead>
      <tbody>
        {form.goals.map((g, i) => (
          <tr key={i}>
            <td style={{ padding: "14px 8px", border: "1px solid #000", textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
            <td style={{ padding: "14px 8px", border: "1px solid #000" }}>{g.description}</td>
            <td style={{ padding: "14px 8px", border: "1px solid #000" }}>{g.measurement}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Competencias */}
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
      <thead>
        <tr>
          <td colSpan={2} style={{ background: "#1a3f6f", color: "#fff", padding: "8px 10px",
            textAlign: "center", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>
            DEFINICIÓN DE COMPETENCIAS CONDUCTUALES/HABILIDADES
          </td>
        </tr>
        <tr>
          <th style={{ width: 40, padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>No.</th>
          <th style={{ padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>Conductas/Habilidades (Definir las 5 Principales)</th>
        </tr>
      </thead>
      <tbody>
        {form.skills.map((s, i) => (
          <tr key={i}>
            <td style={{ padding: "10px 8px", border: "1px solid #000", textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
            <td style={{ padding: "10px 8px", border: "1px solid #000" }}>{s.name}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Comentarios */}
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
      <tbody>
        <tr>
          <td style={{ width: 160, padding: "10px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10, verticalAlign: "top" }}>
            Comentarios Jefe Inmediato
          </td>
          <td style={{ padding: "10px", border: "1px solid #000", minHeight: 50 }}>{form.manager_comments}</td>
        </tr>
        <tr>
          <td style={{ padding: "10px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10, verticalAlign: "top" }}>
            Comentarios del Colaborador
          </td>
          <td style={{ padding: "10px", border: "1px solid #000", minHeight: 50 }}>{form.employee_comments}</td>
        </tr>
      </tbody>
    </table>

    {/* Firmas */}
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
      <tbody><tr>
        <td style={{ width: "50%", padding: "28px 20px 10px", textAlign: "center", fontSize: 10, borderTop: "1px solid #000" }}>
          Firma Colaborador
        </td>
        <td style={{ width: "50%", padding: "28px 20px 10px", textAlign: "center", fontSize: 10, borderTop: "1px solid #000" }}>
          Firma Jefe Inmediato
        </td>
      </tr></tbody>
    </table>

    {/* ── REVISIÓN ── */}
    <div style={{ background: "#1a3f6f", color: "#fff", padding: "8px 10px",
      textAlign: "center", fontWeight: 700, fontSize: 11, letterSpacing: 1, marginBottom: 0 }}>
      REVISIÓN DE METAS INDIVIDUALES
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: -1 }}>
      <tbody><tr>
        <td style={{ width: 130, padding: "5px 10px", border: "1px solid #000",
          background: "#1a3f6f", color: "#fff", fontWeight: 700, fontSize: 10 }}>Fecha de Revisión:</td>
        <td style={{ padding: "5px 10px", border: "1px solid #000" }}>{fmtDate(form.review_date)}</td>
      </tr></tbody>
    </table>

    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
      <thead>
        <tr>
          <th rowSpan={2} style={{ width: 30, padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>No.</th>
          <th rowSpan={2} style={{ padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>Metas Individuales/Resultados</th>
          <th colSpan={4} style={{ padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10, textAlign: "center" }}>
            Calificación (Marque una X en la opción que corresponda)
          </th>
        </tr>
        <tr>
          {["Debajo de Expectativas", "Desempeño a Mejorar", "Cumple Expectativas", "Supera Expectativas"].map(h => (
            <th key={h} style={{ padding: "6px 6px", border: "1px solid #000",
              background: "#1a3f6f", color: "#fff", fontSize: 9, textAlign: "center", width: 90 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {form.goal_reviews.map((r, i) => (
          <tr key={i}>
            <td style={{ padding: "12px 8px", border: "1px solid #000", textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
            <td style={{ padding: "12px 8px", border: "1px solid #000" }}>{r.result || form.goals[i]?.description || ""}</td>
            {["1", "2", "3", "4"].map(v => (
              <td key={v} style={{ padding: "12px 8px", border: "1px solid #000",
                textAlign: "center", background: r.score === v ? SCORE_COLORS[v]?.bg : "transparent" }}>
                {r.score === v ? "✕" : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>

    {/* Revisión de habilidades */}
    <div style={{ background: "#1a3f6f", color: "#fff", padding: "8px 10px",
      textAlign: "center", fontWeight: 700, fontSize: 11, letterSpacing: 1, marginBottom: 0 }}>
      REVISIÓN DE FACTORES CONDUCTUALES Y HABILIDADES TÉCNICAS
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
      <thead>
        <tr>
          <th rowSpan={2} style={{ width: 30, padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>No.</th>
          <th rowSpan={2} style={{ padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10 }}>Conductas y Habilidades Técnicas</th>
          <th colSpan={4} style={{ padding: "6px 8px", border: "1px solid #000",
            background: "#1a3f6f", color: "#fff", fontSize: 10, textAlign: "center" }}>
            Calificación
          </th>
        </tr>
        <tr>
          {["Debajo de Expectativas", "Desempeño a Mejorar", "Cumple Expectativas", "Supera Expectativas"].map(h => (
            <th key={h} style={{ padding: "6px 6px", border: "1px solid #000",
              background: "#1a3f6f", color: "#fff", fontSize: 9, textAlign: "center", width: 90 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {form.skill_reviews.map((r, i) => (
          <tr key={i}>
            <td style={{ padding: "12px 8px", border: "1px solid #000", textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
            <td style={{ padding: "12px 8px", border: "1px solid #000" }}>{r.result || form.skills[i]?.name || ""}</td>
            {["1", "2", "3", "4"].map(v => (
              <td key={v} style={{ padding: "12px 8px", border: "1px solid #000",
                textAlign: "center", background: r.score === v ? SCORE_COLORS[v]?.bg : "transparent" }}>
                {r.score === v ? "✕" : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>

    {/* Firmas finales */}
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody><tr>
        {["Firma Colaborador", "Firma Jefe Inmediato", "Firma RRHH"].map(f => (
          <td key={f} style={{ width: "33%", padding: "28px 12px 8px",
            textAlign: "center", fontSize: 10, borderTop: "1px solid #000" }}>{f}</td>
        ))}
      </tr></tbody>
    </table>
  </div>
);

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function EvaluacionAdministrativa() {
  const [form, setForm] = useState({ ...defaultForm });
  const [view, setView] = useState("form"); // "form" | "preview"
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const printRef = useRef();

  const employee = DEMO_EMPLOYEES.find(e => e.id === form.employee_id);
  const manager  = MANAGERS.find(m => m.id === form.manager_id);
  const period   = PERIODS.find(p => p.id === form.period_id);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const setGoal  = (i, key) => (val) => setForm(f => {
    const g = [...f.goals]; g[i] = { ...g[i], [key]: val }; return { ...f, goals: g };
  });
  const setSkill = (i, key) => (val) => setForm(f => {
    const s = [...f.skills]; s[i] = { ...s[i], [key]: val }; return { ...f, skills: s };
  });
  const setGoalReview  = (i, key) => (val) => setForm(f => {
    const r = [...f.goal_reviews]; r[i] = { ...r[i], [key]: val }; return { ...f, goal_reviews: r };
  });
  const setSkillReview = (i, key) => (val) => setForm(f => {
    const r = [...f.skill_reviews]; r[i] = { ...r[i], [key]: val }; return { ...f, skill_reviews: r };
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    if (!form.employee_id) { showToast("Selecciona un colaborador", "error"); return; }
    if (!form.manager_id)  { showToast("Selecciona un jefe inmediato", "error"); return; }
    // Aquí iría: await supabase.from('administrative_evaluations').upsert(...)
    setSaved(true);
    showToast("✅ Evaluación guardada en la base de datos");
  };

  const handlePrint = () => {
    const printContents = document.getElementById("print-area").innerHTML;
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head>
        <title>Evaluación — ${employee?.name || ""}</title>
        <link href="${FONT}" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', sans-serif; }
          @page { margin: 15mm; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head><body>${printContents}</body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  const colStyle = { flex: 1, minWidth: 0 };
  const rowStyle = { display: "flex", gap: 16, marginBottom: 14 };
  const cardStyle = { background: "#fff", borderRadius: 8, padding: 20,
    border: "1px solid #e8eaf6", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };

  return (
    <>
      <link href={FONT} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f0f2f8; font-family: 'DM Sans', sans-serif; }
        input, select, textarea { transition: border-color 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #1a3f6f !important; outline: none; }
        @media print {
          body > * { display: none !important; }
          #print-area { display: block !important; }
        }
      `}</style>

      {/* ── HIDDEN PRINT AREA ── */}
      <div style={{ display: "none" }}>
        <PrintView form={form} employee={employee} manager={manager} period={period} />
      </div>

      <div style={{ minHeight: "100vh", background: "#f0f2f8" }}>

        {/* ── TOP BAR ── */}
        <div style={{ background: "#1a3f6f", padding: "0 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#fff", color: "#1a3f6f", fontWeight: 900,
              fontSize: 13, padding: "4px 10px", borderRadius: 4, letterSpacing: 1 }}>PLIHSA</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                Definición de Factores y Revisión del Desempeño Administrativo
              </div>
              <div style={{ color: "#90a4b7", fontSize: 11 }}>Código: PL-RH-P-002-F01 · Versión 01</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StatusBadge status={form.status} />
            <button onClick={() => setView(view === "form" ? "preview" : "form")}
              style={{ ...btn, background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              {view === "form" ? "👁 Vista Previa" : "✏️ Editar"}
            </button>
            <button onClick={handleSave}
              style={{ ...btn, background: "#f57c00", color: "#fff" }}>
              💾 Guardar
            </button>
            <button onClick={handlePrint}
              style={{ ...btn, background: "#2e7d32", color: "#fff" }}>
              🖨️ Exportar PDF
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ background: "#fff", borderBottom: "2px solid #e8eaf6",
          padding: "0 28px", display: "flex", gap: 0 }}>
          {[
            { id: "info",     label: "① Datos Generales" },
            { id: "goals",    label: "② Metas Individuales" },
            { id: "skills",   label: "③ Competencias / Habilidades" },
            { id: "reviews",  label: "④ Revisión de Desempeño" },
            { id: "comments", label: "⑤ Comentarios y Firmas" },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{ padding: "12px 18px", border: "none", background: "transparent",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                color: view === t.id ? "#1a3f6f" : "#9e9e9e",
                borderBottom: view === t.id ? "3px solid #1a3f6f" : "3px solid transparent",
                fontFamily: "'DM Sans',sans-serif" }}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setView("preview")}
            style={{ marginLeft: "auto", padding: "12px 18px", border: "none",
              background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: view === "preview" ? "#f57c00" : "#9e9e9e",
              borderBottom: view === "preview" ? "3px solid #f57c00" : "3px solid transparent",
              fontFamily: "'DM Sans',sans-serif" }}>
            📄 Vista PDF
          </button>
        </div>

        <div style={{ padding: "24px 28px", maxWidth: 960, margin: "0 auto" }}>

          {/* ══ TAB 1: DATOS GENERALES ══ */}
          {view === "info" && (
            <div>
              <div style={cardStyle}>
                <SectionHeader>Período de Evaluación</SectionHeader>
                <div style={{ marginTop: 14 }}>
                  <Label required>Período</Label>
                  <Select value={form.period_id} onChange={set("period_id")}
                    options={PERIODS.map(p => ({ value: p.id, label: p.name }))} />
                </div>
              </div>

              <div style={cardStyle}>
                <SectionHeader>Datos del Colaborador</SectionHeader>
                <div style={{ marginTop: 14 }}>
                  <div style={rowStyle}>
                    <div style={colStyle}>
                      <Label required>Nombre del Colaborador</Label>
                      <Select value={form.employee_id} onChange={set("employee_id")}
                        placeholder="Seleccione un colaborador"
                        options={DEMO_EMPLOYEES.map(e => ({ value: e.id, label: `${e.name} — ${e.position}` }))} />
                    </div>
                    <div style={colStyle}>
                      <Label>Posición del Colaborador</Label>
                      <Input value={employee?.position || ""} onChange={() => {}} style={{ background: "#f5f5f5", color: "#757575" }} />
                    </div>
                  </div>
                  <div style={rowStyle}>
                    <div style={colStyle}>
                      <Label>Departamento</Label>
                      <Input value={employee?.department || ""} onChange={() => {}} style={{ background: "#f5f5f5" }} />
                    </div>
                    <div style={colStyle}>
                      <Label>Sub-departamento</Label>
                      <Input value={employee?.sub_department || ""} onChange={() => {}} style={{ background: "#f5f5f5" }} />
                    </div>
                  </div>
                  <div style={rowStyle}>
                    <div style={colStyle}>
                      <Label>Fecha de Ingreso</Label>
                      <Input value={fmtDate(employee?.hire_date) || ""} onChange={() => {}} style={{ background: "#f5f5f5" }} />
                    </div>
                    <div style={colStyle}>
                      <Label required>Fecha de definición de factores</Label>
                      <input type="date" value={form.definition_date} onChange={e => set("definition_date")(e.target.value)}
                        style={{ ...inputBase }} />
                    </div>
                  </div>
                  <div style={{ ...rowStyle, maxWidth: "50%" }}>
                    <div style={colStyle}>
                      <Label required>Jefe Inmediato</Label>
                      <Select value={form.manager_id} onChange={set("manager_id")}
                        placeholder="Seleccione el jefe inmediato"
                        options={MANAGERS.map(m => ({ value: m.id, label: `${m.name} — ${m.position}` }))} />
                    </div>
                  </div>
                </div>
              </div>

              {employee && (
                <div style={{ ...cardStyle, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1a3f6f",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800 }}>
                      {employee.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{employee.name}</div>
                      <div style={{ fontSize: 12, color: "#616161" }}>{employee.code} · {employee.position}</div>
                      <div style={{ fontSize: 12, color: "#616161" }}>{employee.department}{employee.sub_department ? ` / ${employee.sub_department}` : ""}</div>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#757575" }}>Ingreso</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(employee.hire_date)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setView("goals")} style={{ ...btn, background: "#1a3f6f", color: "#fff", padding: "10px 24px" }}>
                  Siguiente: Metas Individuales →
                </button>
              </div>
            </div>
          )}

          {/* ══ TAB 2: METAS INDIVIDUALES ══ */}
          {view === "goals" && (
            <div>
              <div style={cardStyle}>
                <SectionHeader>Definición de Metas Individuales</SectionHeader>
                <p style={{ fontSize: 11, color: "#757575", margin: "10px 0 16px" }}>
                  Define hasta 5 metas individuales con sus criterios de medición y resultados esperados.
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1a3f6f" }}>
                      <th style={{ ...th, width: 40 }}>No.</th>
                      <th style={th}>Metas Individuales</th>
                      <th style={th}>Medición y Resultados Esperados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.goals.map((g, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e8eaf6" }}>
                        <td style={{ padding: "12px 8px", textAlign: "center",
                          fontWeight: 800, color: "#1a3f6f", fontSize: 15 }}>{i + 1}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <Textarea value={g.description} onChange={setGoal(i, "description")}
                            rows={2} placeholder={`Meta ${i + 1}...`} />
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <Textarea value={g.measurement} onChange={setGoal(i, "measurement")}
                            rows={2} placeholder="Indicador / KPI / % / cantidad..." />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <NavButtons onBack={() => setView("info")} onNext={() => setView("skills")} nextLabel="Siguiente: Competencias →" />
            </div>
          )}

          {/* ══ TAB 3: COMPETENCIAS ══ */}
          {view === "skills" && (
            <div>
              <div style={cardStyle}>
                <SectionHeader>Definición de Competencias Conductuales / Habilidades</SectionHeader>
                <p style={{ fontSize: 11, color: "#757575", margin: "10px 0 16px" }}>
                  Define las 5 principales conductas o habilidades técnicas a evaluar.
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1a3f6f" }}>
                      <th style={{ ...th, width: 40 }}>No.</th>
                      <th style={th}>Conductas / Habilidades (Definir las 5 Principales)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.skills.map((s, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e8eaf6" }}>
                        <td style={{ padding: "12px 8px", textAlign: "center",
                          fontWeight: 800, color: "#1a3f6f", fontSize: 15 }}>{i + 1}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <Input value={s.name} onChange={setSkill(i, "name")}
                            placeholder={`Habilidad / Conducta ${i + 1}...`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <NavButtons onBack={() => setView("goals")} onNext={() => setView("reviews")} nextLabel="Siguiente: Revisión →" />
            </div>
          )}

          {/* ══ TAB 4: REVISIÓN ══ */}
          {view === "reviews" && (
            <div>
              {/* Fecha de revisión */}
              <div style={cardStyle}>
                <div style={rowStyle}>
                  <div style={{ maxWidth: 260 }}>
                    <Label required>Fecha de Revisión</Label>
                    <input type="date" value={form.review_date} onChange={e => set("review_date")(e.target.value)}
                      style={{ ...inputBase }} />
                  </div>
                </div>
              </div>

              {/* Revisión de metas */}
              <div style={cardStyle}>
                <SectionHeader>Revisión de Metas Individuales</SectionHeader>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
                  <thead>
                    <tr style={{ background: "#1a3f6f" }}>
                      <th style={{ ...th, width: 30 }}>No.</th>
                      <th style={th}>Metas / Resultados a la fecha</th>
                      <th style={{ ...th, width: 160, textAlign: "center" }}>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.goal_reviews.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e8eaf6",
                        background: r.score ? SCORE_COLORS[r.score]?.bg + "55" : "transparent" }}>
                        <td style={{ padding: "12px 8px", textAlign: "center",
                          fontWeight: 800, color: "#1a3f6f" }}>{i + 1}</td>
                        <td style={{ padding: "10px 8px" }}>
                          {form.goals[i]?.description && (
                            <div style={{ fontSize: 10, color: "#9e9e9e", marginBottom: 4 }}>
                              Meta definida: {form.goals[i].description}
                            </div>
                          )}
                          <Textarea value={r.result} onChange={setGoalReview(i, "result")}
                            rows={2} placeholder="Resultado alcanzado a la fecha..." />
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <Select value={r.score} onChange={setGoalReview(i, "score")} options={SCORE_OPTIONS} />
                          {r.score && (
                            <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700,
                              color: SCORE_COLORS[r.score]?.color }}>
                              {SCORE_COLORS[r.score]?.label}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Revisión de habilidades */}
              <div style={cardStyle}>
                <SectionHeader>Revisión de Factores Conductuales y Habilidades Técnicas</SectionHeader>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
                  <thead>
                    <tr style={{ background: "#1a3f6f" }}>
                      <th style={{ ...th, width: 30 }}>No.</th>
                      <th style={th}>Resultados a la fecha de revisión</th>
                      <th style={{ ...th, width: 160, textAlign: "center" }}>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.skill_reviews.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e8eaf6",
                        background: r.score ? SCORE_COLORS[r.score]?.bg + "55" : "transparent" }}>
                        <td style={{ padding: "12px 8px", textAlign: "center",
                          fontWeight: 800, color: "#1a3f6f" }}>{i + 1}</td>
                        <td style={{ padding: "10px 8px" }}>
                          {form.skills[i]?.name && (
                            <div style={{ fontSize: 10, color: "#9e9e9e", marginBottom: 4 }}>
                              Habilidad: {form.skills[i].name}
                            </div>
                          )}
                          <Textarea value={r.result} onChange={setSkillReview(i, "result")}
                            rows={2} placeholder="Resultados observados..." />
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <Select value={r.score} onChange={setSkillReview(i, "score")} options={SCORE_OPTIONS} />
                          {r.score && (
                            <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700,
                              color: SCORE_COLORS[r.score]?.color }}>
                              {SCORE_COLORS[r.score]?.label}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <NavButtons onBack={() => setView("skills")} onNext={() => setView("comments")} nextLabel="Siguiente: Comentarios →" />
            </div>
          )}

          {/* ══ TAB 5: COMENTARIOS Y FIRMAS ══ */}
          {view === "comments" && (
            <div>
              <div style={cardStyle}>
                <SectionHeader>Comentarios</SectionHeader>
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Label>Comentarios del Jefe Inmediato</Label>
                    <Textarea value={form.manager_comments} onChange={set("manager_comments")}
                      rows={4} placeholder="Observaciones del gerente / jefe inmediato..." />
                  </div>
                  <div>
                    <Label>Comentarios del Colaborador</Label>
                    <Textarea value={form.employee_comments} onChange={set("employee_comments")}
                      rows={4} placeholder="Observaciones del empleado..." />
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <SectionHeader>Estado de Firmas</SectionHeader>
                <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
                  {[
                    { label: "Firma Colaborador",   key: "pending_employee", done: ["pending_manager","pending_rrhh","completed"].includes(form.status) },
                    { label: "Firma Jefe Inmediato", key: "pending_manager",  done: ["pending_rrhh","completed"].includes(form.status) },
                    { label: "Firma RRHH",           key: "pending_rrhh",     done: form.status === "completed" },
                  ].map(f => (
                    <div key={f.key} style={{ flex: 1, border: `2px solid ${f.done ? "#2e7d32" : "#e0e0e0"}`,
                      borderRadius: 8, padding: 16, textAlign: "center",
                      background: f.done ? "#e8f5e9" : "#fafafa" }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{f.done ? "✅" : "✍️"}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: f.done ? "#2e7d32" : "#757575" }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#9e9e9e", marginTop: 2 }}>
                        {f.done ? "Firmado" : "Pendiente"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setView("reviews")} style={{ ...btn, background: "#eeeeee", color: "#424242" }}>
                  ← Anterior
                </button>
                <button onClick={handleSave} style={{ ...btn, background: "#f57c00", color: "#fff", padding: "10px 24px" }}>
                  💾 Guardar Evaluación
                </button>
                <button onClick={handlePrint} style={{ ...btn, background: "#1a3f6f", color: "#fff", padding: "10px 24px" }}>
                  🖨️ Exportar PDF
                </button>
              </div>
            </div>
          )}

          {/* ══ VISTA PREVIA PDF ══ */}
          {view === "preview" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a3f6f" }}>
                  Vista previa — tal como se imprimirá
                </div>
                <button onClick={handlePrint} style={{ ...btn, background: "#1a3f6f", color: "#fff", padding: "10px 24px" }}>
                  🖨️ Imprimir / Guardar como PDF
                </button>
              </div>
              <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                overflow: "hidden" }}>
                <PrintView form={form} employee={employee} manager={manager} period={period} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "12px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: toast.type === "error" ? "#b71c1c" : "#1b5e20", color: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)", fontFamily: "'DM Sans',sans-serif",
          animation: "fadeUp 0.25s ease" }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes fadeUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </>
  );
}

// ─── BOTONES DE NAVEGACIÓN ────────────────────────────────────────────────────
function NavButtons({ onBack, onNext, nextLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
      <button onClick={onBack} style={{ ...btn, background: "#eeeeee", color: "#424242" }}>← Anterior</button>
      <button onClick={onNext} style={{ ...btn, background: "#1a3f6f", color: "#fff", padding: "10px 24px" }}>{nextLabel}</button>
    </div>
  );
}

// ─── ESTILOS COMPARTIDOS ──────────────────────────────────────────────────────
const btn = {
  padding: "8px 16px", border: "none", borderRadius: 6, cursor: "pointer",
  fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
};
const th = {
  padding: "10px 10px", color: "#fff", fontSize: 11, fontWeight: 700,
  textAlign: "left", letterSpacing: "0.3px",
};
const inputBase = {
  width: "100%", padding: "7px 10px", border: "1.5px solid #c5cae9",
  borderRadius: 5, fontSize: 12, fontFamily: "'DM Sans',sans-serif",
  color: "#212121", background: "#fafafa", outline: "none",
};
