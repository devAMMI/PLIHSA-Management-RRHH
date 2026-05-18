/**
 * Central utility for Supabase Storage path construction and URL rewriting.
 *
 * Storage bucket: goal-signed-documents
 *
 * Path convention:
 *   {empresa}/{tipo_doc}/{tipo_empleado}/{año}/{codigo_empleado}_{Apellido}/{filename}
 *
 * Examples:
 *   PLIHSA/definicion-metas/administrativo/2026/01000014_Orellana/01000014_Orellana_definicion_metas_2026.pdf
 *   PLIHSA/definicion-metas/operativo/2026/01000181_Fernandez/01000181_Fernandez_definicion_metas_2026.pdf
 *   PLIHSA/evaluacion/administrativo/2026/01000014_Orellana/01000014_Orellana_evaluacion_2026.pdf
 *   PLIHSA/revision-junio/administrativo/2026/01000014_Orellana/01000014_Orellana_revision_junio_2026.pdf
 *
 * URL rewriting (Opcion A):
 *   Raw Supabase URL  → https://{project}.supabase.co/storage/v1/object/public/goal-signed-documents/{path}
 *   Clean proxy URL   → /docs/{path}   (proxied via vercel.json rewrite to Supabase)
 *   Production URL    → https://rrhh.plihsa.com/docs/{path}
 */

const BUCKET = 'goal-signed-documents';
const COMPANY_SLUG = 'PLIHSA';

export type DocKind = 'definicion-metas' | 'evaluacion' | 'revision-junio';
export type EmpType = 'administrativo' | 'operativo';

interface EmployeeSlug {
  employee_code: string;
  last_name: string;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');
}

function employeeFolder(emp: EmployeeSlug): string {
  const lastName = slugify(emp.last_name.split(' ')[0]);
  return `${emp.employee_code}_${lastName}`;
}

/**
 * Builds the storage path (key) for a document in goal-signed-documents.
 */
export function buildStoragePath(params: {
  docKind: DocKind;
  empType: EmpType;
  year: number;
  employee: EmployeeSlug;
  fileExt: string;
}): string {
  const { docKind, empType, year, employee, fileExt } = params;
  const folder = employeeFolder(employee);
  const lastName = slugify(employee.last_name.split(' ')[0]);
  const docSlug = docKind.replace(/-/g, '_');
  const filename = `${employee.employee_code}_${lastName}_${docSlug}_${year}.${fileExt}`;
  return `${COMPANY_SLUG}/${docKind}/${empType}/${year}/${folder}/${filename}`;
}

/**
 * Returns the clean proxy URL for display/links (hides Supabase origin).
 * In production this resolves to https://rrhh.plihsa.com/docs/{storagePath}
 * In local dev the vercel rewrite isn't available, so we fall back to the
 * direct Supabase public URL.
 */
export function toProxyUrl(supabasePublicUrl: string): string {
  const marker = `/${BUCKET}/`;
  const idx = supabasePublicUrl.indexOf(marker);
  if (idx === -1) return supabasePublicUrl;
  const storagePath = supabasePublicUrl.slice(idx + marker.length);
  // In local dev the Vercel rewrite doesn't run, so use the direct Supabase URL.
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalDev) return supabasePublicUrl;
  return `/docs/${storagePath}`;
}

/**
 * Converts a storage path directly to the clean proxy URL.
 */
export function storagePathToProxyUrl(storagePath: string): string {
  return `/docs/${storagePath}`;
}

/**
 * Returns the raw Supabase public URL from a storage path.
 * Used internally when we need to call Supabase Storage API.
 */
export function storagePathToSupabaseUrl(storagePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

export { BUCKET };
