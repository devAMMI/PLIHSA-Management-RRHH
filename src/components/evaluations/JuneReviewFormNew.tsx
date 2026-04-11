import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Download, Printer, Upload, CheckCircle, Eye, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Toast } from '../ui/Toast';
import { SignedDocumentViewer } from '../goals/SignedDocumentViewer';
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
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);

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
  const [digitalPdfUrl, setDigitalPdfUrl] = useState<string | null>(null);
  const [embeddedPdfUrl, setEmbeddedPdfUrl] = useState<string | null>(null);
  const [showEmbeddedPdf, setShowEmbeddedPdf] = useState(false);

  const isReadOnly = status === 'completed';
  const isEditing = reviewId !== null;

  useEffect(() => {
    loadEmployees();
    if (reviewId) {
      loadReview(reviewId);
    }
  }, [reviewId]);

  const loadDefinitionForEmployee = async (employeeId: string) => {
    setLoadingDefinition(true);
    try {
      if (employeeType === 'administrativo') {
        const { data: defs } = await supabase
          .from('goal_definitions')
          .select('id')
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!defs || defs.length === 0) return;
        const defId = defs[0].id;

        const [{ data: goalsData }, { data: behaviorsData }] = await Promise.all([
          supabase
            .from('individual_goals')
            .select('goal_number, goal_description, measurement_and_expected_results')
            .eq('goal_definition_id', defId)
            .order('goal_number'),
          supabase
            .from('competency_behaviors')
            .select('behavior_number, behavior_description')
            .eq('goal_definition_id', defId)
            .order('behavior_number'),
        ]);

        if (goalsData && goalsData.length > 0) {
          setGoals(emptyGoals().map(g => {
            const found = goalsData.find(d => d.goal_number === g.goal_number);
            return found ? { ...g, goal_description: found.goal_description || '' } : g;
          }));
        }

        if (behaviorsData && behaviorsData.length > 0) {
          setCompetencies(emptyCompetencies().map(c => {
            const found = behaviorsData.find(d => d.behavior_number === c.competency_number);
            return found ? { ...c, competency_description: found.behavior_description || '' } : c;
          }));
        }
      } else {
        const { data: defs } = await supabase
          .from('operative_goal_definitions')
          .select('id')
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!defs || defs.length === 0) return;
        const defId = defs[0].id;

        const { data: goalsData } = await supabase
          .from('operative_individual_goals')
          .select('goal_number, goal_description, measurement_and_expected_results')
          .eq('goal_definition_id', defId)
          .order('goal_number');

        if (goalsData && goalsData.length > 0) {
          setGoals(emptyGoals().map(g => {
            const found = goalsData.find(d => d.goal_number === g.goal_number);
            return found ? { ...g, goal_description: found.goal_description || '' } : g;
          }));
        }
      }
    } catch (err) {
      console.error('Error loading definition:', err);
    } finally {
      setLoadingDefinition(false);
    }
  };

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
    loadDefinitionForEmployee(emp.id);
  };

  const filteredEmployees = employees.filter(e =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedEmployee) {
      setToast({ message: 'Debe seleccionar un colaborador', type: 'error' });
      return;
    }
    if (!reviewDate) {
      setToast({ message: 'La fecha de revision es obligatoria', type: 'error' });
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

  const generatePdfUrl = async (): Promise<string | null> => {
    const el = pdfRef.current;
    if (!el) return null;
    try {
      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: el.offsetWidth,
        windowHeight: el.offsetHeight,
        scrollX: 0,
        scrollY: 0,
      });
      const imgWidth = 215.9;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'letter');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      const pdfBlob = pdf.output('blob');
      return URL.createObjectURL(pdfBlob);
    } catch {
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setGeneratingPDF(true);
    try {
      const pdfUrl = await generatePdfUrl();
      if (!pdfUrl) throw new Error('No se pudo generar el PDF');
      const empName = selectedEmployee
        ? `${selectedEmployee.first_name}_${selectedEmployee.last_name}`
        : 'Revision';
      const typeLabel = employeeType === 'operativo' ? 'Operativo' : 'Administrativo';
      const fileName = `Revision_Junio_${typeLabel}_${empName}_${reviewDate || 'borrador'}.pdf`;
      window.open(pdfUrl, '_blank');
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
      setToast({ message: 'PDF descargado correctamente', type: 'success' });
    } catch {
      setToast({ message: 'Error al generar el PDF', type: 'error' });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleViewPDF = async () => {
    setGeneratingPDF(true);
    try {
      const url = await generatePdfUrl();
      if (url) {
        if (embeddedPdfUrl) URL.revokeObjectURL(embeddedPdfUrl);
        setEmbeddedPdfUrl(url);
        setShowEmbeddedPdf(true);
      }
    } catch {
      setToast({ message: 'Error al generar la vista previa', type: 'error' });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && pdfRef.current) {
      const styles = Array.from(document.styleSheets)
        .map(ss => {
          try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); }
          catch { return ''; }
        }).join('\n');
      printWindow.document.write(`<html><head><title>Revision Junio</title><style>${styles}body{margin:0;padding:20px}@media print{body{margin:0;padding:0}}</style></head><body>${pdfRef.current.innerHTML}</body></html>`);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
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
            onClick={handleViewPDF}
            disabled={generatingPDF}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            {generatingPDF ? 'Generando...' : 'Ver PDF'}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
          <button
            onClick={handlePrint}
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

      {loadingDefinition && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-blue-700 font-medium">Cargando datos de la Definicion de Metas...</p>
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

      {!isEditing && selectedEmployee && goals.some(g => g.goal_description) && (
        <div className="mb-4 bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</div>
          <div>
            <p className="text-sm font-semibold text-teal-800">Datos importados de la Definicion de Metas</p>
            <p className="text-xs text-teal-700 mt-0.5">Las metas y competencias definidas en la Etapa 1 han sido cargadas automaticamente. Puede editarlas si es necesario. Los campos de calificacion y comentarios quedan en blanco para completar en esta revision.</p>
          </div>
        </div>
      )}

      <div
        ref={formRef}
        className="bg-white border border-slate-300 shadow-sm overflow-hidden"
        style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
      >
        <div style={{ padding: '16px' }}>

          <div style={{ background: '#1e3a5f', color: 'white', padding: '6px 12px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
            REVISION DE METAS INDIVIDUALES
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f', borderBottom: '1px solid #1e3a5f' }}>
            <tbody>
              <tr>
                <td style={{ background: '#1e3a5f', color: 'white', fontWeight: '600', fontSize: '11px', padding: '5px 10px', width: '140px', border: '1px solid #1e3a5f', whiteSpace: 'nowrap' }}>
                  Fecha de Revision {!reviewDate && <span style={{ color: '#fca5a5' }}>*</span>}
                </td>
                <td style={{ background: '#f1f5f9', padding: '5px 10px', border: '1px solid #cbd5e1' }}>
                  {isReadOnly ? (
                    <span style={{ fontSize: '11px', color: '#374151' }}>
                      {reviewDate ? new Date(reviewDate + 'T00:00:00').toLocaleDateString('es-HN') : ''}
                    </span>
                  ) : (
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '11px', color: '#374151' }}
                    />
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '40px' }} />
              <col />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#1e3a5f', color: 'white' }}>
                <th style={{ border: '1px solid #94a3b8', padding: '5px 4px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }} rowSpan={2}>No.</th>
                <th style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold' }} rowSpan={2}>
                  Metas Individuales/Resultados
                </th>
                <th style={{ border: '1px solid #94a3b8', padding: '4px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }} colSpan={4}>
                  Calificacion<br /><span style={{ fontWeight: 'normal', fontSize: '9px' }}>(Marque una X en la opcion que corresponda)</span>
                </th>
              </tr>
              <tr style={{ background: '#1e3a5f', color: 'white' }}>
                {RATING_COLS.map(r => (
                  <th key={r} style={{ border: '1px solid #94a3b8', padding: '4px 2px', textAlign: 'center', fontSize: '9px', fontWeight: '600', width: '11%' }}>
                    {RATING_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goals.map((goal, index) => (
                <>
                  <tr key={`goal-${index}`} style={{ background: 'white' }}>
                    <td style={{ border: '1px solid #94a3b8', padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', verticalAlign: 'middle' }} rowSpan={2}>
                      {goal.goal_number}
                    </td>
                    <td style={{ border: '1px solid #94a3b8', padding: '4px 6px', fontSize: '11px', verticalAlign: 'top', background: goal.goal_description ? '#eff6ff' : 'white' }}>
                      <textarea
                        value={goal.goal_description}
                        onChange={(e) => handleGoalChange(index, 'goal_description', e.target.value)}
                        disabled={isReadOnly}
                        rows={1}
                        placeholder="Meta individual..."
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '11px', color: '#1e293b', fontWeight: goal.goal_description ? '600' : 'normal', minHeight: '22px' }}
                      />
                    </td>
                    {RATING_COLS.map(r => (
                      <td key={r} style={{ border: '1px solid #94a3b8', padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          onClick={() => !isReadOnly && handleGoalRating(index, r)}
                          disabled={isReadOnly}
                          style={{ width: '16px', height: '16px', border: `2px solid ${goal.rating === r ? '#1e293b' : '#94a3b8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '10px', fontWeight: 'bold', cursor: isReadOnly ? 'default' : 'pointer', background: 'white', color: '#1e293b' }}
                        >
                          {goal.rating === r ? 'X' : ''}
                        </button>
                      </td>
                    ))}
                  </tr>
                  <tr key={`goal-res-${index}`} style={{ background: '#f8fafc' }}>
                    <td style={{ border: '1px solid #94a3b8', padding: '3px 6px' }} colSpan={5}>
                      <div style={{ fontSize: '9px', fontWeight: '600', color: '#475569', marginBottom: '2px' }}>Resultados a la fecha de revision</div>
                      <textarea
                        value={goal.results_description}
                        onChange={(e) => handleGoalChange(index, 'results_description', e.target.value)}
                        disabled={isReadOnly}
                        rows={1}
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '11px', color: '#374151', minHeight: '20px' }}
                      />
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>

          <div style={{ background: '#1e3a5f', color: 'white', padding: '6px 12px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>
            REVISION DE FACTORES CONDUCTUALES Y HABILIDADES TECNICAS
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: '1px solid #94a3b8', borderRight: '1px solid #94a3b8', borderBottom: '1px solid #94a3b8' }}>
            <thead>
              <tr style={{ background: '#1e3a5f', color: 'white' }}>
                <th style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center', width: '32px', fontSize: '11px', fontWeight: 'bold' }} rowSpan={2}>No.</th>
                <th style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }} rowSpan={2}>
                  Conductas y Habilidades Tecnicas<br /><span style={{ fontSize: '9px', fontWeight: 'normal' }}>(Evaluar las 5 Definidas)</span>
                </th>
                <th style={{ border: '1px solid #94a3b8', padding: '4px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }} colSpan={4}>
                  Calificacion<br /><span style={{ fontWeight: 'normal', fontSize: '9px' }}>(Marque una X en la opcion que corresponda)</span>
                </th>
              </tr>
              <tr style={{ background: '#1e3a5f', color: 'white' }}>
                {RATING_COLS.map(r => (
                  <th key={r} style={{ border: '1px solid #94a3b8', padding: '4px 2px', textAlign: 'center', fontSize: '9px', fontWeight: '600', width: '11%' }}>
                    {RATING_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competencies.map((comp, index) => (
                <tr key={`comp-${index}`} style={{ background: 'white' }}>
                  <td style={{ border: '1px solid #94a3b8', padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                    {comp.competency_number}
                  </td>
                  <td style={{ border: '1px solid #94a3b8', padding: '4px 6px', background: comp.competency_description ? '#eff6ff' : 'white' }}>
                    <input
                      type="text"
                      value={comp.competency_description}
                      onChange={(e) => handleCompetencyChange(index, 'competency_description', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Conducta o habilidad tecnica..."
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '11px', color: '#1e293b', fontWeight: comp.competency_description ? '600' : 'normal' }}
                    />
                  </td>
                  {RATING_COLS.map(r => (
                    <td key={r} style={{ border: '1px solid #94a3b8', padding: '4px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => !isReadOnly && handleCompetencyRating(index, r)}
                        disabled={isReadOnly}
                        style={{ width: '16px', height: '16px', border: `2px solid ${comp.rating === r ? '#1e293b' : '#94a3b8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '10px', fontWeight: 'bold', cursor: isReadOnly ? 'default' : 'pointer', background: 'white', color: '#1e293b' }}
                      >
                        {comp.rating === r ? 'X' : ''}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: '1px solid #94a3b8', borderRight: '1px solid #94a3b8', borderBottom: '1px solid #94a3b8', marginTop: '8px' }}>
            <tbody>
              <tr>
                <td style={{ background: '#1e3a5f', color: 'white', fontWeight: 'bold', fontSize: '11px', padding: '6px 10px', width: '160px', verticalAlign: 'top', border: '1px solid #94a3b8' }}>
                  Comentarios Jefe Inmediato
                </td>
                <td style={{ background: 'white', padding: '4px 8px', border: '1px solid #94a3b8' }}>
                  <textarea
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    disabled={isReadOnly}
                    rows={2}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '11px', color: '#374151', minHeight: '40px' }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ background: '#1e3a5f', color: 'white', fontWeight: 'bold', fontSize: '11px', padding: '6px 10px', verticalAlign: 'top', border: '1px solid #94a3b8' }}>
                  Comentarios del Colaborador
                </td>
                <td style={{ background: 'white', padding: '4px 8px', border: '1px solid #94a3b8' }}>
                  <textarea
                    value={employeeComments}
                    onChange={(e) => setEmployeeComments(e.target.value)}
                    disabled={isReadOnly}
                    rows={2}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '11px', color: '#374151', minHeight: '40px' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '32px 16px 12px', gap: '24px', marginTop: '4px' }}>
            {['Firma Colaborador', 'Firma Jefe Inmediato', 'Firma RRHH'].map(label => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px', marginTop: '24px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#1e293b' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {reviewId && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {status === 'completed' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : status === 'pending_signature' ? (
                <Upload className="w-6 h-6 text-amber-500" />
              ) : (
                <FileText className="w-6 h-6 text-slate-500" />
              )}
              <div>
                <h3 className="font-semibold text-slate-800">Estado del Documento</h3>
                <p className="text-sm text-slate-500">
                  {status === 'completed' ? 'Firmado y finalizado' : status === 'pending_signature' ? 'Esperando firma manual' : 'En edicion'}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full border font-medium text-sm ${
              status === 'completed' ? 'bg-green-100 text-green-700 border-green-300'
              : status === 'pending_signature' ? 'bg-amber-100 text-amber-700 border-amber-300'
              : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              {status === 'completed' ? 'Completado' : status === 'pending_signature' ? 'Pendiente Firma' : 'Borrador'}
            </span>
          </div>

          {status !== 'completed' && (
            <div className={`rounded-lg p-4 mb-4 ${signedDocUrl ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
              {!signedDocUrl ? (
                <>
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>Siguiente paso:</strong> Descarga el PDF, firmalo a mano, escanealo y subelo aqui.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleDownloadPDF} disabled={generatingPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50">
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </button>
                    <button onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-sm font-medium">
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Documento firmado subido. Presiona "Finalizar Revision" para completar el proceso.</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        const url = await generatePdfUrl();
                        setDigitalPdfUrl(url);
                        setShowDocViewer(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Ambos Documentos
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={handleFinalize}
                        disabled={completing}
                        className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {completing ? 'Finalizando...' : 'Finalizar Revision'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'completed' && signedDocUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 mb-3">
                <strong>Proceso completado:</strong> El documento ha sido firmado y finalizado exitosamente.
              </p>
              <button
                onClick={async () => {
                  const url = await generatePdfUrl();
                  setDigitalPdfUrl(url);
                  setShowDocViewer(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Ver Ambos Documentos
              </button>
            </div>
          )}

          {!isReadOnly && (
            <>
              {signedDocUrl && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{signedDocFilename || 'Documento firmado'}</p>
                    {signedDocUploadedAt && (
                      <p className="text-xs text-green-600">Subido el {new Date(signedDocUploadedAt).toLocaleString('es-HN')}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center hover:border-teal-400 transition">
                <input type="file" id="june-review-signed-doc" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
                <label htmlFor="june-review-signed-doc" className="cursor-pointer flex flex-col items-center gap-2">
                  {selectedFile ? (
                    <>
                      <FileText className="w-9 h-9 text-teal-600" />
                      <div className="text-sm text-slate-700">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button type="button" onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                        className="text-sm text-red-600 hover:text-red-700">Eliminar archivo</button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-9 h-9 text-slate-400" />
                      <div className="text-sm text-slate-600">
                        <p className="font-medium">{signedDocUrl ? 'Reemplazar documento firmado' : 'Haz clic para seleccionar el documento firmado'}</p>
                        <p className="text-slate-500 mt-1">PDF, JPG o PNG (maximo 10MB)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {selectedFile && (
                <div className="mt-3">
                  <button onClick={handleUploadSignedDoc} disabled={uploadingDoc}
                    className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {uploadingDoc ? 'Subiendo...' : 'Subir Documento Firmado'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showEmbeddedPdf && embeddedPdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col">
            <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Vista Previa del PDF</h2>
                  <p className="text-sm text-blue-200">
                    {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Revision de Junio'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={generatingPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#1e3a5f] rounded-lg hover:bg-blue-50 transition font-medium text-sm disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#1e3a5f] rounded-lg hover:bg-blue-50 transition font-medium text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={() => { setShowEmbeddedPdf(false); URL.revokeObjectURL(embeddedPdfUrl); setEmbeddedPdfUrl(null); }}
                  className="p-2 hover:bg-blue-800 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
              <iframe
                src={embeddedPdfUrl}
                className="w-full h-full rounded border border-slate-300 bg-white"
                title="Vista previa PDF"
              />
            </div>
          </div>
        </div>
      )}

      {showDocViewer && signedDocUrl && (
        <SignedDocumentViewer
          documentUrl={signedDocUrl}
          filename={signedDocFilename || 'documento_firmado'}
          mimeType={signedDocMimeType || 'application/pdf'}
          uploadedAt={signedDocUploadedAt || undefined}
          onClose={() => { setShowDocViewer(false); setDigitalPdfUrl(null); }}
          originalDocumentUrl={digitalPdfUrl || undefined}
          employeeName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : undefined}
        />
      )}

      <div
        ref={pdfRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '860px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '11px',
          background: 'white',
          padding: '24px',
          boxSizing: 'border-box',
        }}
        aria-hidden="true"
      >
        {/* Header */}
        <div style={{ background: '#1e3a5f', color: 'white', padding: '8px 14px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center', letterSpacing: '0.5px' }}>
          REVISION DE METAS INDIVIDUALES
        </div>

        {/* Date row */}
        <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse', border: '1px solid #1e3a5f', borderTop: 'none' }}>
          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', background: '#1e3a5f', color: 'white', fontWeight: '700', fontSize: '11px', padding: '6px 12px', width: '160px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
              Fecha de Revision
            </div>
            <div style={{ display: 'table-cell', background: '#f1f5f9', padding: '6px 12px', fontSize: '11px', color: '#374151', verticalAlign: 'middle' }}>
              {reviewDate ? new Date(reviewDate + 'T00:00:00').toLocaleDateString('es-HN') : '\u00A0'}
            </div>
          </div>
        </div>

        {/* Goals table - NO rowSpan/colSpan */}
        <div style={{ marginTop: '10px', border: '1px solid #94a3b8' }}>
          {/* Header row 1 */}
          <div style={{ display: 'table', width: '100%', background: '#1e3a5f', color: 'white' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', width: '46px', padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid #4a6fa5', verticalAlign: 'middle' }}>
                No.
              </div>
              <div style={{ display: 'table-cell', padding: '6px 8px', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid #4a6fa5', verticalAlign: 'middle' }}>
                Metas Individuales/Resultados
              </div>
              <div style={{ display: 'table-cell', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', padding: '4px', verticalAlign: 'middle' }}>
                Calificacion<br />
                <span style={{ fontWeight: 'normal', fontSize: '9px' }}>(Marque una X en la opcion que corresponda)</span>
              </div>
            </div>
          </div>
          {/* Header row 2 - rating labels */}
          <div style={{ display: 'table', width: '100%', background: '#1e3a5f', color: 'white', borderTop: '1px solid #4a6fa5' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', width: '46px', borderRight: '1px solid #4a6fa5' }}></div>
              <div style={{ display: 'table-cell', borderRight: '1px solid #4a6fa5' }}></div>
              {RATING_COLS.map(r => (
                <div key={r} style={{ display: 'table-cell', width: '13%', padding: '5px 3px', textAlign: 'center', fontSize: '9px', fontWeight: '600', borderLeft: '1px solid #4a6fa5', verticalAlign: 'middle' }}>
                  {RATING_LABELS[r]}
                </div>
              ))}
            </div>
          </div>
          {/* Goal rows */}
          {goals.map((goal) => (
            <div key={`pdf-goal-block-${goal.goal_number}`}>
              {/* Main goal row */}
              <div style={{ display: 'table', width: '100%', background: 'white', borderTop: '1px solid #cbd5e1' }}>
                <div style={{ display: 'table-row' }}>
                  <div style={{ display: 'table-cell', width: '46px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#1e3a5f', verticalAlign: 'middle', padding: '8px 4px', borderRight: '1px solid #cbd5e1' }}>
                    {goal.goal_number}
                  </div>
                  <div style={{ display: 'table-cell', padding: '7px 8px', fontSize: '11px', fontWeight: goal.goal_description ? '600' : '400', color: goal.goal_description ? '#1e293b' : '#94a3b8', background: goal.goal_description ? '#eff6ff' : 'white', borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', wordBreak: 'break-word' }}>
                    {goal.goal_description || 'Meta individual...'}
                  </div>
                  {RATING_COLS.map(r => (
                    <div key={r} style={{ display: 'table-cell', width: '13%', textAlign: 'center', verticalAlign: 'middle', padding: '6px 4px', borderLeft: '1px solid #cbd5e1' }}>
                      <div style={{
                        width: '18px', height: '18px',
                        border: `2px solid ${goal.rating === r ? '#1e293b' : '#94a3b8'}`,
                        background: 'white',
                        margin: '0 auto',
                        lineHeight: '14px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                      }}>
                        {goal.rating === r ? 'X' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Results row */}
              <div style={{ display: 'table', width: '100%', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'table-row' }}>
                  <div style={{ display: 'table-cell', width: '46px', borderRight: '1px solid #cbd5e1' }}></div>
                  <div style={{ display: 'table-cell', padding: '5px 8px', colSpan: 5 } as React.CSSProperties}>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Resultados a la fecha de revision</div>
                    <div style={{ fontSize: '11px', color: '#374151', minHeight: '22px', wordBreak: 'break-word' }}>
                      {goal.results_description || '\u00A0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Competencies section */}
        <div style={{ background: '#1e3a5f', color: 'white', padding: '8px 14px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center', marginTop: '12px', letterSpacing: '0.5px' }}>
          REVISION DE FACTORES CONDUCTUALES Y HABILIDADES TECNICAS
        </div>

        <div style={{ border: '1px solid #94a3b8' }}>
          {/* Header row 1 */}
          <div style={{ display: 'table', width: '100%', background: '#1e3a5f', color: 'white' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', width: '46px', padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid #4a6fa5', verticalAlign: 'middle' }}>
                No.
              </div>
              <div style={{ display: 'table-cell', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', borderRight: '1px solid #4a6fa5', verticalAlign: 'middle' }}>
                Conductas y Habilidades Tecnicas<br />
                <span style={{ fontSize: '9px', fontWeight: 'normal' }}>(Evaluar las 5 Definidas)</span>
              </div>
              <div style={{ display: 'table-cell', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', padding: '4px', verticalAlign: 'middle' }}>
                Calificacion<br />
                <span style={{ fontWeight: 'normal', fontSize: '9px' }}>(Marque una X en la opcion que corresponda)</span>
              </div>
            </div>
          </div>
          {/* Header row 2 - rating labels */}
          <div style={{ display: 'table', width: '100%', background: '#1e3a5f', color: 'white', borderTop: '1px solid #4a6fa5' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', width: '46px', borderRight: '1px solid #4a6fa5' }}></div>
              <div style={{ display: 'table-cell', borderRight: '1px solid #4a6fa5' }}></div>
              {RATING_COLS.map(r => (
                <div key={r} style={{ display: 'table-cell', width: '13%', padding: '5px 3px', textAlign: 'center', fontSize: '9px', fontWeight: '600', borderLeft: '1px solid #4a6fa5', verticalAlign: 'middle' }}>
                  {RATING_LABELS[r]}
                </div>
              ))}
            </div>
          </div>
          {/* Competency rows */}
          {competencies.map((comp) => (
            <div key={`pdf-comp-${comp.competency_number}`} style={{ display: 'table', width: '100%', background: 'white', borderTop: '1px solid #cbd5e1' }}>
              <div style={{ display: 'table-row' }}>
                <div style={{ display: 'table-cell', width: '46px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#1e3a5f', verticalAlign: 'middle', padding: '8px 4px', borderRight: '1px solid #cbd5e1' }}>
                  {comp.competency_number}
                </div>
                <div style={{ display: 'table-cell', padding: '7px 8px', fontSize: '11px', fontWeight: comp.competency_description ? '600' : '400', color: comp.competency_description ? '#1e293b' : '#94a3b8', background: comp.competency_description ? '#eff6ff' : 'white', borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', wordBreak: 'break-word' }}>
                  {comp.competency_description || 'Conducta o habilidad tecnica...'}
                </div>
                {RATING_COLS.map(r => (
                  <div key={r} style={{ display: 'table-cell', width: '13%', textAlign: 'center', verticalAlign: 'middle', padding: '6px 4px', borderLeft: '1px solid #cbd5e1' }}>
                    <div style={{
                      width: '18px', height: '18px',
                      border: `2px solid ${comp.rating === r ? '#1e293b' : '#94a3b8'}`,
                      background: 'white',
                      margin: '0 auto',
                      lineHeight: '14px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#1e293b',
                    }}>
                      {comp.rating === r ? 'X' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div style={{ border: '1px solid #94a3b8', marginTop: '10px' }}>
          <div style={{ display: 'table', width: '100%', borderBottom: '1px solid #94a3b8' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', background: '#1e3a5f', color: 'white', fontWeight: 'bold', fontSize: '11px', padding: '7px 10px', width: '180px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                Comentarios Jefe Inmediato
              </div>
              <div style={{ display: 'table-cell', background: 'white', padding: '7px 10px', fontSize: '11px', color: '#374151', minHeight: '44px', wordBreak: 'break-word', borderLeft: '1px solid #94a3b8' }}>
                {managerComments || '\u00A0'}
              </div>
            </div>
          </div>
          <div style={{ display: 'table', width: '100%' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', background: '#1e3a5f', color: 'white', fontWeight: 'bold', fontSize: '11px', padding: '7px 10px', width: '180px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                Comentarios del Colaborador
              </div>
              <div style={{ display: 'table-cell', background: 'white', padding: '7px 10px', fontSize: '11px', color: '#374151', minHeight: '44px', wordBreak: 'break-word', borderLeft: '1px solid #94a3b8' }}>
                {employeeComments || '\u00A0'}
              </div>
            </div>
          </div>
        </div>

        {/* Signature lines */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '40px 24px 16px', gap: '24px', marginTop: '8px' }}>
          {['Firma Colaborador', 'Firma Jefe Inmediato', 'Firma RRHH'].map(label => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ borderTop: '1.5px solid #1e293b', paddingTop: '5px', marginTop: '0' }}>
                <span style={{ fontSize: '10px', fontWeight: '600', color: '#1e293b' }}>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
