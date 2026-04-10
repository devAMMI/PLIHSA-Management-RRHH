import { useState, useEffect, useRef } from 'react';
import { Save, Upload, CheckCircle, Eye, X, Download, FileText, ArrowLeft, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Toast } from '../ui/Toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Rating = 'below_expectations' | 'needs_improvement' | 'meets_expectations' | 'exceeds_expectations';

interface GoalReview {
  goal_id: string;
  goal_number: number;
  goal_description: string;
  measurement_and_expected_results: string;
  review_id: string | null;
  results_description: string;
  rating: Rating | null;
}

interface CompetencyReview {
  competency_id: string;
  competency_number: number;
  competency_description: string;
  review_id: string | null;
  rating: Rating | null;
}

interface JuneReviewFormProps {
  evaluationId: string;
  onCancel?: () => void;
  onSaved?: () => void;
}

const RATING_LABELS: Record<Rating, string> = {
  below_expectations: 'Debajo de Expectativas',
  needs_improvement: 'Desempeno a Mejorar',
  meets_expectations: 'Cumple Expectativas',
  exceeds_expectations: 'Supera Expectativas',
};

const RATING_COLS: Rating[] = [
  'below_expectations',
  'needs_improvement',
  'meets_expectations',
  'exceeds_expectations',
];

export function JuneReviewForm({ evaluationId, onCancel, onSaved }: JuneReviewFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [evaluation, setEvaluation] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [period, setPeriod] = useState<any>(null);

  const [reviewDate, setReviewDate] = useState('');
  const [goalReviews, setGoalReviews] = useState<GoalReview[]>([]);
  const [competencyReviews, setCompetencyReviews] = useState<CompetencyReview[]>([]);
  const [managerComments, setManagerComments] = useState('');
  const [employeeComments, setEmployeeComments] = useState('');

  const [reviewStatus, setReviewStatus] = useState<'not_started' | 'draft' | 'pending_signature' | 'completed'>('not_started');
  const [signedDocUrl, setSignedDocUrl] = useState<string | null>(null);
  const [signedDocFilename, setSignedDocFilename] = useState<string | null>(null);
  const [signedDocMimeType, setSignedDocMimeType] = useState<string | null>(null);
  const [signedDocUploadedAt, setSignedDocUploadedAt] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    loadData();
  }, [evaluationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: evalData, error: evalError } = await supabase
        .from('administrative_evaluations')
        .select(`
          *,
          employee:employees(
            id, first_name, last_name, position, hire_date,
            departments(name),
            manager:manager_id(first_name, last_name)
          ),
          period:evaluation_periods(*)
        `)
        .eq('id', evaluationId)
        .single();

      if (evalError) throw evalError;

      setEvaluation(evalData);
      setEmployee(evalData.employee);
      setPeriod(evalData.period);

      setReviewDate(evalData.review_date || '');
      setManagerComments(evalData.review_manager_comments || '');
      setEmployeeComments(evalData.review_employee_comments || '');
      setReviewStatus(evalData.review_status || 'not_started');

      if (evalData.review_signed_document_url) {
        setSignedDocUrl(evalData.review_signed_document_url);
        setSignedDocFilename(evalData.review_signed_document_filename);
        setSignedDocMimeType(evalData.review_signed_document_mime_type);
        setSignedDocUploadedAt(evalData.review_signed_document_uploaded_at);
      }

      const { data: goalsData } = await supabase
        .from('evaluation_individual_goals')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('goal_number');

      const { data: goalReviewsData } = await supabase
        .from('evaluation_goal_reviews')
        .select('*')
        .in('goal_id', (goalsData || []).map((g: any) => g.id));

      const mergedGoals: GoalReview[] = (goalsData || []).map((g: any) => {
        const review = (goalReviewsData || []).find((r: any) => r.goal_id === g.id);
        return {
          goal_id: g.id,
          goal_number: g.goal_number,
          goal_description: g.goal_description || '',
          measurement_and_expected_results: g.measurement_and_expected_results || '',
          review_id: review?.id || null,
          results_description: review?.results_description || '',
          rating: review?.rating || null,
        };
      });

      if (mergedGoals.length === 0) {
        setGoalReviews(
          Array.from({ length: 5 }, (_, i) => ({
            goal_id: '',
            goal_number: i + 1,
            goal_description: '',
            measurement_and_expected_results: '',
            review_id: null,
            results_description: '',
            rating: null,
          }))
        );
      } else {
        setGoalReviews(mergedGoals);
      }

      const { data: compsData } = await supabase
        .from('evaluation_competencies')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('competency_number');

      const { data: compReviewsData } = await supabase
        .from('evaluation_competency_reviews')
        .select('*')
        .in('competency_id', (compsData || []).map((c: any) => c.id));

      const mergedComps: CompetencyReview[] = (compsData || []).map((c: any) => {
        const review = (compReviewsData || []).find((r: any) => r.competency_id === c.id);
        return {
          competency_id: c.id,
          competency_number: c.competency_number,
          competency_description: c.competency_description || '',
          review_id: review?.id || null,
          rating: review?.rating || null,
        };
      });

      if (mergedComps.length === 0) {
        setCompetencyReviews(
          Array.from({ length: 5 }, (_, i) => ({
            competency_id: '',
            competency_number: i + 1,
            competency_description: '',
            review_id: null,
            rating: null,
          }))
        );
      } else {
        setCompetencyReviews(mergedComps);
      }
    } catch (error) {
      console.error('Error loading review data:', error);
      setToast({ message: 'Error al cargar los datos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoalRatingChange = (index: number, rating: Rating) => {
    const updated = [...goalReviews];
    updated[index] = { ...updated[index], rating: updated[index].rating === rating ? null : rating };
    setGoalReviews(updated);
  };

  const handleGoalResultsChange = (index: number, value: string) => {
    const updated = [...goalReviews];
    updated[index] = { ...updated[index], results_description: value };
    setGoalReviews(updated);
  };

  const handleCompetencyRatingChange = (index: number, rating: Rating) => {
    const updated = [...competencyReviews];
    updated[index] = { ...updated[index], rating: updated[index].rating === rating ? null : rating };
    setCompetencyReviews(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('administrative_evaluations')
        .update({
          review_date: reviewDate || null,
          review_manager_comments: managerComments,
          review_employee_comments: employeeComments,
          review_status: reviewStatus === 'not_started' ? 'draft' : reviewStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', evaluationId);

      for (const goal of goalReviews) {
        if (!goal.goal_id) continue;
        if (goal.review_id) {
          await supabase
            .from('evaluation_goal_reviews')
            .update({ results_description: goal.results_description, rating: goal.rating })
            .eq('id', goal.review_id);
        } else {
          const { data: newReview } = await supabase
            .from('evaluation_goal_reviews')
            .insert({ goal_id: goal.goal_id, results_description: goal.results_description, rating: goal.rating })
            .select()
            .single();
          if (newReview) {
            const updated = [...goalReviews];
            const idx = updated.findIndex(g => g.goal_id === goal.goal_id);
            if (idx >= 0) updated[idx].review_id = newReview.id;
            setGoalReviews(updated);
          }
        }
      }

      for (const comp of competencyReviews) {
        if (!comp.competency_id) continue;
        if (comp.review_id) {
          await supabase
            .from('evaluation_competency_reviews')
            .update({ rating: comp.rating })
            .eq('id', comp.review_id);
        } else {
          const { data: newReview } = await supabase
            .from('evaluation_competency_reviews')
            .insert({ competency_id: comp.competency_id, rating: comp.rating })
            .select()
            .single();
          if (newReview) {
            const updated = [...competencyReviews];
            const idx = updated.findIndex(c => c.competency_id === comp.competency_id);
            if (idx >= 0) updated[idx].review_id = newReview.id;
            setCompetencyReviews(updated);
          }
        }
      }

      if (reviewStatus === 'not_started') setReviewStatus('draft');
      setToast({ message: 'Revision guardada correctamente', type: 'success' });
      onSaved?.();
    } catch (error) {
      console.error('Error saving review:', error);
      setToast({ message: 'Error al guardar la revision', type: 'error' });
    } finally {
      setSaving(false);
    }
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

  const handleUploadSignedDocument = async () => {
    if (!selectedFile) return;
    setUploadingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `review_${evaluationId}_${Date.now()}.${fileExt}`;
      const filePath = `administrative-reviews/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('goal-signed-documents')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('goal-signed-documents')
        .getPublicUrl(filePath);

      const now = new Date().toISOString();
      await supabase
        .from('administrative_evaluations')
        .update({
          review_signed_document_url: publicUrl,
          review_signed_document_filename: selectedFile.name,
          review_signed_document_mime_type: selectedFile.type,
          review_signed_document_uploaded_at: now,
          review_signed_document_uploaded_by: user.id,
          review_status: 'pending_signature',
        })
        .eq('id', evaluationId);

      setSignedDocUrl(publicUrl);
      setSignedDocFilename(selectedFile.name);
      setSignedDocMimeType(selectedFile.type);
      setSignedDocUploadedAt(now);
      setSelectedFile(null);
      setReviewStatus('pending_signature');
      setToast({ message: 'Documento firmado subido correctamente', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Error al subir el documento', type: 'error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleFinalize = async () => {
    if (!signedDocUrl) {
      setToast({ message: 'Debe subir el documento firmado antes de finalizar', type: 'error' });
      return;
    }
    setCompleting(true);
    try {
      await supabase
        .from('administrative_evaluations')
        .update({ review_status: 'completed', review_completed_at: new Date().toISOString() })
        .eq('id', evaluationId);
      setReviewStatus('completed');
      setToast({ message: 'Revision finalizada exitosamente', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al finalizar la revision', type: 'error' });
    } finally {
      setCompleting(false);
    }
  };

  const generateOriginalPdfUrl = async (): Promise<string | null> => {
    if (!formRef.current) return null;
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
      return URL.createObjectURL(pdf.output('blob'));
    } catch { return null; }
  };

  const handleDownloadPDF = async () => {
    if (!formRef.current || !employee) return;
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
      pdf.save(`Revision_Junio_${employee.first_name}_${employee.last_name}_${reviewDate || 'borrador'}.pdf`);
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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!evaluation || !employee) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">No se encontro la evaluacion</p>
        </div>
      </div>
    );
  }

  const isReadOnly = reviewStatus === 'completed';
  const empName = `${employee.first_name} ${employee.last_name}`;
  const managerName = employee.manager
    ? `${employee.manager.first_name} ${employee.manager.last_name}`
    : (evaluation.department || '');
  const hireDate = employee.hire_date
    ? new Date(employee.hire_date + 'T00:00:00').toLocaleDateString('es-HN')
    : '';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {onCancel && (
        <div className="mb-4 flex items-center justify-between">
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
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </div>
      )}

      {reviewStatus === 'completed' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-lg">Revision Completada</p>
            <p className="text-green-700 text-sm">Esta revision ha sido finalizada y firmada correctamente.</p>
          </div>
        </div>
      )}

      <div ref={formRef} className="bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm">
        <div className="border-b-2 border-slate-300">
          <div className="grid grid-cols-12">
            <div className="col-span-3 border-r-2 border-slate-300 p-4 flex items-center justify-center">
              <img
                src="/Logo_PLIHSA_BLUE.png"
                alt="PLIHSA"
                className="w-full h-auto max-w-[160px] object-contain"
              />
            </div>
            <div className="col-span-6 border-r-2 border-slate-300 p-4 flex items-center justify-center">
              <h1 className="text-base font-bold text-slate-800 text-center leading-tight">
                Definicion de Factores y Revision del Desempeno Administrativo
              </h1>
            </div>
            <div className="col-span-3 p-2 text-xs">
              <div className="border-b border-slate-300 px-2 py-1">
                <span className="font-semibold">Codigo:</span> {period?.form_code || 'PL-RH-P-002-F01'}
              </div>
              <div className="border-b border-slate-300 px-2 py-1">
                <span className="font-semibold">Version:</span> {period?.form_version || '01'}
              </div>
              <div className="px-2 py-1">
                <span className="font-semibold">Fecha de Revision:</span> 09/07/2025
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-12 border border-slate-300">
            <div className="col-span-12 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm">
              Nombre del Colaborador:
            </div>
            <div className="col-span-12 bg-slate-50 px-4 py-2 text-sm border-t border-slate-300">
              {empName}
            </div>
          </div>

          <div className="grid grid-cols-12 border border-slate-300 border-t-0">
            <div className="col-span-12 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm">
              Posicion del Colaborador:
            </div>
            <div className="col-span-12 bg-slate-50 px-4 py-2 text-sm border-t border-slate-300">
              {employee.position || ''}
            </div>
          </div>

          <div className="grid grid-cols-2 border border-slate-300 border-t-0">
            <div className="border-r border-slate-300">
              <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm">Departamento:</div>
              <div className="bg-slate-50 px-4 py-2 text-sm border-t border-slate-300">
                {employee.departments?.name || evaluation.department || ''}
              </div>
            </div>
            <div>
              <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm">Sub-departamento:</div>
              <div className="bg-slate-50 px-4 py-2 text-sm border-t border-slate-300">
                {evaluation.sub_department || ''}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border border-slate-300 border-t-0">
            <div className="border-r border-slate-300">
              <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm">Fecha de Ingreso:</div>
              <div className="bg-slate-50 px-4 py-2 text-sm border-t border-slate-300">{hireDate}</div>
            </div>
            <div>
              <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm">Jefe Inmediato:</div>
              <div className="bg-slate-50 px-4 py-2 text-sm border-t border-slate-300">{managerName}</div>
            </div>
          </div>

          <div className="mt-6 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm text-center">
            REVISION DE METAS INDIVIDUALES
          </div>

          <div className="grid grid-cols-2 border border-slate-300 border-t-0">
            <div className="bg-[#1e5a96] text-white px-4 py-2 font-semibold text-sm border-r border-slate-300">
              Fecha de Revision:
            </div>
            <div className="bg-slate-50 px-2 py-1 border-t-0">
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-transparent border-0 outline-none text-sm disabled:text-slate-600 px-2 py-1"
              />
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-300 border-t-0">
            <thead>
              <tr className="bg-[#1e5a96] text-white">
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold text-center w-10" rowSpan={2}>No.</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold text-center w-1/3" rowSpan={2}>
                  Metas Individuales/Resultados
                </th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold text-center" colSpan={4}>
                  Calificacion (Marque una X en la opcion que corresponda)
                </th>
              </tr>
              <tr className="bg-[#1e5a96] text-white">
                {RATING_COLS.map((r) => (
                  <th key={r} className="border border-slate-300 px-2 py-2 text-xs font-semibold text-center w-[11%]">
                    {RATING_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goalReviews.map((goal, index) => (
                <>
                  <tr key={`goal-${index}`} className="bg-white">
                    <td className="border border-slate-300 px-3 py-3 text-center font-semibold text-sm" rowSpan={2}>
                      {goal.goal_number}
                    </td>
                    <td className="border border-slate-300 px-3 py-3 text-sm align-top">
                      {goal.goal_description || <span className="text-slate-400 italic">Sin descripcion</span>}
                    </td>
                    {RATING_COLS.map((r) => (
                      <td key={r} className="border border-slate-300 px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => !isReadOnly && handleGoalRatingChange(index, r)}
                          disabled={isReadOnly}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition-all
                            ${goal.rating === r
                              ? 'bg-[#1e5a96] border-[#1e5a96] text-white'
                              : 'border-slate-400 hover:border-[#1e5a96]'
                            } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {goal.rating === r && <span className="text-xs font-bold">X</span>}
                        </button>
                      </td>
                    ))}
                  </tr>
                  <tr key={`goal-results-${index}`} className="bg-slate-50">
                    <td className="border border-slate-300 px-3 py-2 text-xs text-slate-600 font-medium" colSpan={5}>
                      <span className="font-semibold">Resultados a la fecha de revision:</span>
                      <textarea
                        value={goal.results_description}
                        onChange={(e) => handleGoalResultsChange(index, e.target.value)}
                        disabled={isReadOnly}
                        className="w-full mt-1 bg-transparent border-0 outline-none resize-none text-sm text-slate-700 disabled:text-slate-600 min-h-[40px]"
                        rows={2}
                        placeholder=""
                      />
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>

          <div className="mt-6 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm text-center">
            REVISION DE FACTORES CONDUCTUALES Y HABILIDADES TECNICAS
          </div>

          <table className="w-full border-collapse border border-slate-300 border-t-0">
            <thead>
              <tr className="bg-[#1e5a96] text-white">
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold text-center w-10" rowSpan={2}>No.</th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold text-center w-1/3" rowSpan={2}>
                  Conductas y Habilidades Tecnicas<br />
                  <span className="text-xs font-normal">(Evaluar las 5 Definidas)</span>
                </th>
                <th className="border border-slate-300 px-3 py-2 text-sm font-bold text-center" colSpan={4}>
                  Calificacion (Marque una X en la opcion que corresponda)
                </th>
              </tr>
              <tr className="bg-[#1e5a96] text-white">
                {RATING_COLS.map((r) => (
                  <th key={r} className="border border-slate-300 px-2 py-2 text-xs font-semibold text-center w-[11%]">
                    {RATING_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competencyReviews.map((comp, index) => (
                <tr key={`comp-${index}`} className="bg-white">
                  <td className="border border-slate-300 px-3 py-3 text-center font-semibold text-sm">
                    {comp.competency_number}
                  </td>
                  <td className="border border-slate-300 px-3 py-3 text-sm">
                    {comp.competency_description || <span className="text-slate-400 italic">Sin descripcion</span>}
                  </td>
                  {RATING_COLS.map((r) => (
                    <td key={r} className="border border-slate-300 px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => !isReadOnly && handleCompetencyRatingChange(index, r)}
                        disabled={isReadOnly}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition-all
                          ${comp.rating === r
                            ? 'bg-[#1e5a96] border-[#1e5a96] text-white'
                            : 'border-slate-400 hover:border-[#1e5a96]'
                          } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {comp.rating === r && <span className="text-xs font-bold">X</span>}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 border border-slate-300">
            <div className="bg-[#2c5282] text-white px-4 py-3 font-bold text-sm">
              Comentarios Jefe Inmediato
            </div>
            <div className="bg-white px-4 py-3 min-h-[80px]">
              <textarea
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-transparent border-0 outline-none resize-none text-sm disabled:text-slate-600 min-h-[70px]"
                placeholder=""
              />
            </div>
          </div>

          <div className="mt-4 border border-slate-300">
            <div className="bg-[#2c5282] text-white px-4 py-3 font-bold text-sm">
              Comentarios del Colaborador
            </div>
            <div className="bg-white px-4 py-3 min-h-[80px]">
              <textarea
                value={employeeComments}
                onChange={(e) => setEmployeeComments(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-transparent border-0 outline-none resize-none text-sm disabled:text-slate-600 min-h-[70px]"
                placeholder=""
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-12 px-8 py-8 mt-8">
            <div className="text-center">
              <div className="border-t-2 border-slate-800 pt-2 mt-16">
                <p className="text-sm font-semibold text-slate-800">Firma Colaborador</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-slate-800 pt-2 mt-16">
                <p className="text-sm font-semibold text-slate-800">Firma Jefe Inmediato</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-slate-800 pt-2 mt-16">
                <p className="text-sm font-semibold text-slate-800">Firma RRHH</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Paso Final: Subir Documento Firmado
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            Descarga el PDF, fírmalo a mano, escanealo o tomale una foto y subelo aqui para finalizar la revision.
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
                onClick={async () => {
                  const url = await generateOriginalPdfUrl();
                  setOriginalPdfUrl(url);
                  setShowDocViewer(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Ver Documentos
              </button>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition mb-5">
            <input
              type="file"
              id="review-signed-doc-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="review-signed-doc-upload" className="cursor-pointer flex flex-col items-center gap-3">
              {selectedFile ? (
                <>
                  <FileText className="w-10 h-10 text-blue-600" />
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
                onClick={handleUploadSignedDocument}
                disabled={uploadingDoc}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
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

      {reviewStatus === 'completed' && signedDocUrl && (
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
              onClick={async () => {
                const url = await generateOriginalPdfUrl();
                setOriginalPdfUrl(url);
                setShowDocViewer(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Ver Documentos
            </button>
          </div>
        </div>
      )}

      {showDocViewer && signedDocUrl && (
        <ReviewDocViewerModal
          documentUrl={signedDocUrl}
          filename={signedDocFilename || 'documento_firmado'}
          mimeType={signedDocMimeType || 'application/pdf'}
          uploadedAt={signedDocUploadedAt || undefined}
          originalDocumentUrl={originalPdfUrl || undefined}
          onClose={() => {
            setShowDocViewer(false);
            if (originalPdfUrl) { URL.revokeObjectURL(originalPdfUrl); setOriginalPdfUrl(null); }
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ReviewDocViewerModal({
  documentUrl, filename, mimeType, uploadedAt, originalDocumentUrl, onClose
}: {
  documentUrl: string;
  filename: string;
  mimeType: string;
  uploadedAt?: string;
  originalDocumentUrl?: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'both' | 'original' | 'signed'>(originalDocumentUrl ? 'both' : 'signed');
  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.includes('image');

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="bg-[#1e5a96] text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Visualizador de Documentos</h2>
              <p className="text-sm text-blue-100">{filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(documentUrl, filename)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#1e5a96] rounded-lg hover:bg-blue-50 transition font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Descargar Firmado
            </button>
            <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {uploadedAt && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-800">
            <span className="font-medium">Fecha de subida:</span>{' '}
            {new Date(uploadedAt).toLocaleString('es-HN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {originalDocumentUrl && (
          <div className="border-b border-slate-200 px-6">
            <div className="flex gap-2">
              {(['both', 'original', 'signed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                    activeTab === tab ? 'border-[#1e5a96] text-[#1e5a96]' : 'border-transparent text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {tab === 'both' ? 'Ver Ambos' : tab === 'original' ? 'Original' : 'Firmado'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 bg-slate-100 p-4 overflow-hidden">
          {activeTab === 'both' && originalDocumentUrl && (
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 px-2">Documento Original</h3>
                <iframe src={originalDocumentUrl} className="flex-1 w-full rounded-lg border-2 border-slate-300 bg-white" title="Original" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 px-2">Documento Firmado</h3>
                {isPDF ? (
                  <iframe src={documentUrl} className="flex-1 w-full rounded-lg border-2 border-slate-300 bg-white" title="Firmado" />
                ) : isImage ? (
                  <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-slate-300">
                    <img src={documentUrl} alt="Firmado" className="max-w-full max-h-full rounded-lg" />
                  </div>
                ) : null}
              </div>
            </div>
          )}
          {activeTab === 'original' && originalDocumentUrl && (
            <iframe src={originalDocumentUrl} className="w-full h-full rounded-lg border-2 border-slate-300 bg-white" title="Original" />
          )}
          {(activeTab === 'signed' || !originalDocumentUrl) && (
            isPDF ? (
              <iframe src={documentUrl} className="w-full h-full rounded-lg border-2 border-slate-300 bg-white" title="Firmado" />
            ) : isImage ? (
              <div className="flex items-center justify-center h-full">
                <img src={documentUrl} alt="Firmado" className="max-w-full max-h-full rounded-lg shadow-lg border-2 border-slate-300" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-white rounded-lg p-8 shadow-md">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-700 mb-4">No se puede previsualizar este tipo de archivo</p>
                  <button onClick={() => handleDownload(documentUrl, filename)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium mx-auto">
                    <Download className="w-5 h-5" />
                    Descargar
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">Tipo: {mimeType.includes('pdf') ? 'PDF' : 'Imagen'}</span>
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition font-medium">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
