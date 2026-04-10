import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Download, Printer, Upload, CheckCircle, Eye, X, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Toast } from '../ui/Toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Rating = 'below_expectations' | 'needs_improvement' | 'meets_expectations' | 'exceeds_expectations';
type ReviewStatus = 'draft' | 'pending_signature' | 'completed';

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

interface JuneReviewFormNewProps {
  reviewId: string | null;
  employeeType?: 'administrativo' | 'operativo';
  onCancel: () => void;
  onSaved: () => void;
}

const RATING_COLS: Rating[] = [
  'below_expectations',
  'needs_improvement',
  'meets_expectations',
  'exceeds_expectations',
];

const RATING_LABELS: Record<Rating, string> = {
  below_expectations: 'Debajo de Expectativas',
  needs_improvement: 'Desempeno a Mejorar',
  meets_expectations: 'Cumple Expectativas',
  exceeds_expectations: 'Supera Expectativas',
};

const emptyGoals = (): GoalRow[] =>
  Array.from({ length: 5 }, (_, i) => ({
    id: null,
    goal_number: i + 1,
    goal_description: '',
    results_description: '',
    rating: null,
  }));

const emptyCompetencies = (): CompetencyRow[] =>
  Array.from({ length: 5 }, (_, i) => ({
    id: null,
    competency_number: i + 1,
    competency_description: '',
    rating: null,
  }));

export function JuneReviewFormNew({ reviewId, employeeType = 'administrativo', onCancel, onSaved }: JuneReviewFormNewProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [reviewDate, setReviewDate] = useState('');
  const [reviewCode, setReviewCode] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [managerComments, setManagerComments] = useState('');
  const [employeeComments, setEmployeeComments] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('draft');

  const [goals, setGoals] = useState<GoalRow[]>(emptyGoals());
  const [competencies, setCompetencies] = useState<CompetencyRow[]>(emptyCompetencies());

  const [signedDocUrl, setSignedDocUrl] = useState<string | null>(null);
  const [signedDocFilename, setSignedDocFilename] = useState<string | null>(null);
  const [signedDocMimeType, setSignedDocMimeType] = useState<string | null>(null);
  const [signedDocUploadedAt, setSignedDocUploadedAt] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDocViewer, setShowDocViewer] = useState(false);

  const isReadOnly = status === 'completed';
  const isEditing = reviewId !== null;

  useEffect(() => {
    loadEmployees();
    if (reviewId) {
      loadReview(reviewId);
    }
  }, [reviewId]);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name, position, departments(name)')
      .eq('employee_type', employeeType)
      .eq('status', 'active')
      .order('first_name');
    setEmployees(data || []);
  };

  const loadReview = async (id: string) => {
    setLoading(true);
    try {
      const { data: rev, error } = await supabase
        .from('june_reviews')
        .select(`*, employee:employees(id, first_name, last_name, position, departments(name))`)
        .eq('id', id)
        .single();

      if (error) throw error;

      setSelectedEmployee(rev.employee);
      setEmployeeSearch(`${rev.employee.first_name} ${rev.employee.last_name}`);
      setReviewDate(rev.review_date || '');
      setReviewCode(rev.review_code || '');
      setDepartment(rev.department || '');
      setPosition(rev.position || '');
      setManagerComments(rev.manager_comments || '');
      setEmployeeComments(rev.employee_comments || '');
      setStatus(rev.status);

      if (rev.signed_document_url) {
        setSignedDocUrl(rev.signed_document_url);
        setSignedDocFilename(rev.signed_document_filename);
        setSignedDocMimeType(rev.signed_document_mime_type);
        setSignedDocUploadedAt(rev.signed_document_uploaded_at);
      }

      const { data: goalsData } = await supabase
        .from('june_review_goals')
        .select('*')
        .eq('review_id', id)
        .order('goal_number');

      if (goalsData && goalsData.length > 0) {
        const merged = emptyGoals().map(g => {
          const found = goalsData.find(d => d.goal_number === g.goal_number);
          return found ? {
            id: found.id,
            goal_number: found.goal_number,
            goal_description: found.goal_description || '',
            results_description: found.results_description || '',
            rating: found.rating as Rating | null,
          } : g;
        });
        setGoals(merged);
      }

      const { data: compsData } = await supabase
        .from('june_review_competencies')
        .select('*')
        .eq('review_id', id)
        .order('competency_number');

      if (compsData && compsData.length > 0) {
        const merged = emptyCompetencies().map(c => {
          const found = compsData.find(d => d.competency_number === c.competency_number);
          return found ? {
            id: found.id,
            competency_number: found.competency_number,
            competency_description: found.competency_description || '',
            rating: found.rating as Rating | null,
          } : c;
        });
        setCompetencies(merged);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error al cargar la revision', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    setEmployeeSearch(`${emp.first_name} ${emp.last_name}`);
    setPosition(emp.position || '');
    setDepartment(emp.departments?.name || '');
    setShowEmployeeDropdown(false);
  };

  const filteredEmployees = employees.filter(e =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedEmployee) {
      setToast({ message: 'Debe seleccionar un colaborador', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let currentReviewId = reviewId;

      const reviewPayload = {
        employee_id: selectedEmployee.id,
        review_date: reviewDate || null,
        review_code: reviewCode || null,
        department,
        position,
        manager_comments: managerComments,
        employee_comments: employeeComments,
        status: status === 'draft' ? 'draft' : status,
        updated_at: new Date().toISOString(),
      };

      if (!currentReviewId) {
        const { data: newRev, error } = await supabase
          .from('june_reviews')
          .insert({ ...reviewPayload, employee_type: employeeType, created_by: user?.id })
          .select()
          .single();
        if (error) throw error;
        currentReviewId = newRev.id;
      } else {
        await supabase.from('june_reviews').update(reviewPayload).eq('id', currentReviewId);
      }

      for (const goal of goals) {
        const goalPayload = {
          review_id: currentReviewId,
          goal_number: goal.goal_number,
          goal_description: goal.goal_description,
          results_description: goal.results_description,
          rating: goal.rating,
          updated_at: new Date().toISOString(),
        };
        if (goal.id) {
          await supabase.from('june_review_goals').update(goalPayload).eq('id', goal.id);
        } else {
          const { data: newGoal } = await supabase
            .from('june_review_goals')
            .insert(goalPayload)
            .select()
            .single();
          if (newGoal) {
            setGoals(prev => prev.map(g =>
              g.goal_number === goal.goal_number ? { ...g, id: newGoal.id } : g
            ));
          }
        }
      }

      for (const comp of competencies) {
        const compPayload = {
          review_id: currentReviewId,
          competency_number: comp.competency_number,
          competency_description: comp.competency_description,
          rating: comp.rating,
          updated_at: new Date().toISOString(),
        };
        if (comp.id) {
          await supabase.from('june_review_competencies').update(compPayload).eq('id', comp.id);
        } else {
          const { data: newComp } = await supabase
            .from('june_review_competencies')
            .insert(compPayload)
            .select()
            .single();
          if (newComp) {
            setCompetencies(prev => prev.map(c =>
              c.competency_number === comp.competency_number ? { ...c, id: newComp.id } : c
            ));
          }
        }
      }

      setToast({ message: 'Revision guardada correctamente', type: 'success' });
      setTimeout(() => onSaved(), 800);
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || 'Error al guardar', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleGoalChange = (index: number, field: keyof GoalRow, value: any) => {
    setGoals(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  };

  const handleGoalRating = (index: number, rating: Rating) => {
    setGoals(prev => prev.map((g, i) =>
      i === index ? { ...g, rating: g.rating === rating ? null : rating } : g
    ));
  };

  const handleCompetencyChange = (index: number, field: keyof CompetencyRow, value: any) => {
    setCompetencies(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const handleCompetencyRating = (index: number, rating: Rating) => {
    setCompetencies(prev => prev.map((c, i) =>
      i === index ? { ...c, rating: c.rating === rating ? null : rating } : c
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'El archivo no puede ser mayor a 10MB', type: 'error' });
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setToast({ message: 'Solo se permiten archivos PDF, JPG o PNG', type: 'error' });
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSignedDoc = async () => {
    if (!selectedFile || !reviewId) return;
    setUploadingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = selectedFile.name.split('.').pop();
      const filePath = `june-reviews/${reviewId}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('goal-signed-documents')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('goal-signed-documents').getPublicUrl(filePath);
      const now = new Date().toISOString();
      await supabase.from('june_reviews').update({
        signed_document_url: publicUrl,
        signed_document_filename: selectedFile.name,
        signed_document_mime_type: selectedFile.type,
        signed_document_uploaded_at: now,
        signed_document_uploaded_by: user?.id,
        status: 'pending_signature',
      }).eq('id', reviewId);
      setSignedDocUrl(publicUrl);
      setSignedDocFilename(selectedFile.name);
      setSignedDocMimeType(selectedFile.type);
      setSignedDocUploadedAt(now);
      setSelectedFile(null);
      setStatus('pending_signature');
      setToast({ message: 'Documento firmado subido correctamente', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Error al subir el documento', type: 'error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleFinalize = async () => {
    if (!signedDocUrl || !reviewId) {
      setToast({ message: 'Debe subir el documento firmado antes de finalizar', type: 'error' });
      return;
    }
    setCompleting(true);
    try {
      await supabase.from('june_reviews').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', reviewId);
      setStatus('completed');
      setToast({ message: 'Revision finalizada exitosamente', type: 'success' });
    } catch {
      setToast({ message: 'Error al finalizar la revision', type: 'error' });
    } finally {
      setCompleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!formRef.current) return;
    setGeneratingPDF(true);
    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 2.5, useCORS: true, allowTaint: true, logging: false,
        backgroundColor: '#ffffff',
        windowWidth: formRef.current.scrollWidth,
        windowHeight: formRef.current.scrollHeight,
        scrollX: 0, scrollY: 0,
      });
      const imgWidth = 215.9;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'letter');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      const empName = selectedEmployee
        ? `${selectedEmployee.first_name}_${selectedEmployee.last_name}`
        : 'Revision';
      const typeLabel = employeeType === 'operativo' ? 'Operativo' : 'Administrativo';
      pdf.save(`Revision_Junio_${typeLabel}_${empName}_${reviewDate || 'borrador'}.pdf`);
      setToast({ message: 'PDF descargado correctamente', type: 'success' });
    } catch {
      setToast({ message: 'Error al generar el PDF', type: 'error' });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Volver a la lista</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {generatingPDF ? 'Generando...' : 'Descargar PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      </div>

      {status === 'completed' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-lg">Revision Completada</p>
            <p className="text-green-700 text-sm">Esta revision ha sido finalizada y firmada correctamente.</p>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Seleccionar Colaborador <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }}
              onFocus={() => setShowEmployeeDropdown(true)}
              placeholder="Buscar colaborador administrativo..."
              disabled={isReadOnly}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
            {showEmployeeDropdown && filteredEmployees.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full text-left px-4 py-3 hover:bg-teal-50 transition border-b border-slate-50 last:border-0"
                  >
                    <p className="text-sm font-semibold text-slate-800">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-slate-500">{emp.position} &bull; {emp.departments?.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={formRef} className="bg-white border border-slate-300 shadow-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="px-6 pt-6 pb-6">

          <div className="bg-[#1e3a5f] text-white px-4 py-2.5 font-bold text-sm text-center mb-0">
            REVISION DE METAS INDIVIDUALES
          </div>

          <table className="w-full border-collapse border border-[#1e3a5f] border-t-0 mb-0">
            <tbody>
              <tr>
                <td className="bg-[#1e3a5f] text-white font-semibold text-sm px-3 py-2 w-40 border border-[#1e3a5f]">
                  Fecha de Revision
                </td>
                <td className="bg-slate-100 px-3 py-1 border border-slate-300">
                  <input
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    disabled={isReadOnly}
                    className="bg-transparent border-0 outline-none text-sm text-slate-700 disabled:text-slate-600 w-48"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse mt-4">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="border border-slate-400 px-3 py-2 text-sm font-bold text-center w-10" rowSpan={2}>No.</th>
                <th className="border border-slate-400 px-3 py-2 text-sm font-bold text-left" rowSpan={2}>
                  Metas Individuales/Resultados
                </th>
                <th className="border border-slate-400 px-2 py-1.5 text-xs font-bold text-center" colSpan={4}>
                  Calificacion<br />
                  <span className="font-normal text-xs">(Marque una X en la opcion que corresponda)</span>
                </th>
              </tr>
              <tr className="bg-[#1e3a5f] text-white">
                {RATING_COLS.map(r => (
                  <th key={r} className="border border-slate-400 px-1 py-2 text-xs font-semibold text-center w-[12%]">
                    {RATING_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goals.map((goal, index) => (
                <>
                  <tr key={`goal-${index}`} className="bg-white">
                    <td className="border border-slate-400 px-3 py-4 text-center font-bold text-sm align-middle" rowSpan={2}>
                      {goal.goal_number}
                    </td>
                    <td className="border border-slate-400 px-3 py-2 text-sm align-top">
                      <textarea
                        value={goal.goal_description}
                        onChange={(e) => handleGoalChange(index, 'goal_description', e.target.value)}
                        disabled={isReadOnly}
                        rows={2}
                        placeholder="Meta individual..."
                        className="w-full bg-transparent border-0 outline-none resize-none text-sm text-slate-800 placeholder-slate-300 disabled:text-slate-600 min-h-[40px]"
                      />
                    </td>
                    {RATING_COLS.map(r => (
                      <td key={r} className="border border-slate-400 px-2 py-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => !isReadOnly && handleGoalRating(index, r)}
                          disabled={isReadOnly}
                          className={`w-5 h-5 border-2 flex items-center justify-center mx-auto transition-all text-xs font-bold
                            ${goal.rating === r ? 'border-slate-700 text-slate-800' : 'border-slate-400'}
                            ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-slate-600'}`}
                        >
                          {goal.rating === r ? 'X' : ''}
                        </button>
                      </td>
                    ))}
                  </tr>
                  <tr key={`goal-res-${index}`} className="bg-slate-50">
                    <td className="border border-slate-400 px-3 py-2" colSpan={5}>
                      <div className="text-xs font-semibold text-slate-600 mb-1">Resultados a la fecha de revision</div>
                      <textarea
                        value={goal.results_description}
                        onChange={(e) => handleGoalChange(index, 'results_description', e.target.value)}
                        disabled={isReadOnly}
                        rows={2}
                        className="w-full bg-transparent border-0 outline-none resize-none text-sm text-slate-700 disabled:text-slate-600"
                      />
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>

          <div className="bg-[#1e3a5f] text-white px-4 py-2.5 font-bold text-sm text-center mt-6">
            REVISION DE FACTORES CONDUCTUALES Y HABILIDADES TECNICAS
          </div>

          <table className="w-full border-collapse border border-slate-400 border-t-0">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="border border-slate-400 px-3 py-2 text-sm font-bold text-center w-10" rowSpan={2}>No.</th>
                <th className="border border-slate-400 px-3 py-2 text-sm font-bold text-center" rowSpan={2}>
                  Conductas y Habilidades Tecnicas<br />
                  <span className="text-xs font-normal">(Evaluar las 5 Definidas)</span>
                </th>
                <th className="border border-slate-400 px-2 py-1.5 text-xs font-bold text-center" colSpan={4}>
                  Calificacion<br />
                  <span className="font-normal text-xs">(Marque una X en la opcion que corresponda)</span>
                </th>
              </tr>
              <tr className="bg-[#1e3a5f] text-white">
                {RATING_COLS.map(r => (
                  <th key={r} className="border border-slate-400 px-1 py-2 text-xs font-semibold text-center w-[12%]">
                    {RATING_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competencies.map((comp, index) => (
                <tr key={`comp-${index}`} className="bg-white">
                  <td className="border border-slate-400 px-3 py-3 text-center font-bold text-sm">
                    {comp.competency_number}
                  </td>
                  <td className="border border-slate-400 px-3 py-2">
                    <input
                      type="text"
                      value={comp.competency_description}
                      onChange={(e) => handleCompetencyChange(index, 'competency_description', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Conducta o habilidad tecnica..."
                      className="w-full bg-transparent border-0 outline-none text-sm text-slate-800 placeholder-slate-300 disabled:text-slate-600"
                    />
                  </td>
                  {RATING_COLS.map(r => (
                    <td key={r} className="border border-slate-400 px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => !isReadOnly && handleCompetencyRating(index, r)}
                        disabled={isReadOnly}
                        className={`w-5 h-5 border-2 flex items-center justify-center mx-auto transition-all text-xs font-bold
                          ${comp.rating === r ? 'border-slate-700 text-slate-800' : 'border-slate-400'}
                          ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-slate-600'}`}
                      >
                        {comp.rating === r ? 'X' : ''}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full border-collapse border border-slate-400 border-t-0 mt-4">
            <tbody>
              <tr>
                <td className="bg-[#1e3a5f] text-white font-bold text-sm px-4 py-3 w-48 align-top border border-slate-400">
                  Comentarios Jefe Inmediato
                </td>
                <td className="bg-white px-4 py-2 border border-slate-400">
                  <textarea
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    disabled={isReadOnly}
                    rows={3}
                    className="w-full bg-transparent border-0 outline-none resize-none text-sm text-slate-700 disabled:text-slate-600 min-h-[56px]"
                  />
                </td>
              </tr>
              <tr>
                <td className="bg-[#1e3a5f] text-white font-bold text-sm px-4 py-3 align-top border border-slate-400">
                  Comentarios del Colaborador
                </td>
                <td className="bg-white px-4 py-2 border border-slate-400">
                  <textarea
                    value={employeeComments}
                    onChange={(e) => setEmployeeComments(e.target.value)}
                    disabled={isReadOnly}
                    rows={3}
                    className="w-full bg-transparent border-0 outline-none resize-none text-sm text-slate-700 disabled:text-slate-600 min-h-[56px]"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-3 px-4 pt-12 pb-6 mt-4 gap-8">
            {['Firma Colaborador', 'Firma Jefe Inmediato', 'Firma RRHH'].map(label => (
              <div key={label} className="text-center">
                <div className="border-t border-slate-700 pt-1 mt-10">
                  <p className="text-xs font-semibold text-slate-800">{label}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {!isReadOnly && reviewId && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            Paso Final: Subir Documento Firmado
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            Descarga el PDF, firmalo a mano, escanealo o tomale una foto y subelo aqui para finalizar la revision.
          </p>

          {signedDocUrl && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">{signedDocFilename || 'Documento subido'}</p>
                  {signedDocUploadedAt && (
                    <p className="text-xs text-green-600">
                      Subido el {new Date(signedDocUploadedAt).toLocaleString('es-HN')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDocViewer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Ver Documento
              </button>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-teal-400 transition mb-5">
            <input
              type="file"
              id="june-review-signed-doc"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="june-review-signed-doc" className="cursor-pointer flex flex-col items-center gap-3">
              {selectedFile ? (
                <>
                  <FileText className="w-10 h-10 text-teal-600" />
                  <div className="text-sm text-slate-700">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Eliminar archivo
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-400" />
                  <div className="text-sm text-slate-600">
                    <p className="font-medium">Haz clic para seleccionar el documento firmado</p>
                    <p className="text-slate-500 mt-1">PDF, JPG o PNG (maximo 10MB)</p>
                  </div>
                </>
              )}
            </label>
          </div>

          <div className="flex gap-3">
            {selectedFile && (
              <button
                onClick={handleUploadSignedDoc}
                disabled={uploadingDoc}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploadingDoc ? 'Subiendo...' : 'Subir Documento'}
              </button>
            )}
            {signedDocUrl && (
              <button
                onClick={handleFinalize}
                disabled={completing}
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {completing ? 'Finalizando...' : 'Finalizar Revision'}
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'completed' && signedDocUrl && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Documentos de la Revision
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">{signedDocFilename || 'Documento firmado'}</p>
                {signedDocUploadedAt && (
                  <p className="text-xs text-green-600">
                    Subido el {new Date(signedDocUploadedAt).toLocaleString('es-HN')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowDocViewer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Ver Documento
            </button>
          </div>
        </div>
      )}

      {showDocViewer && signedDocUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
            <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <h2 className="text-lg font-bold">{signedDocFilename || 'Documento Firmado'}</h2>
              </div>
              <button onClick={() => setShowDocViewer(false)} className="p-2 hover:bg-blue-700 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden">
              {signedDocMimeType === 'application/pdf' ? (
                <iframe src={signedDocUrl} className="w-full h-full rounded-lg border-2 border-slate-300 bg-white" title="Documento Firmado" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <img src={signedDocUrl} alt="Documento Firmado" className="max-w-full max-h-full rounded-lg shadow-lg" />
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
              <button onClick={() => setShowDocViewer(false)} className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
