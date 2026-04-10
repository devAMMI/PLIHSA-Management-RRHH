/*
  # Crear tabla june_reviews - Proceso de Revision Junio 2026

  ## Descripcion
  Tabla independiente para el proceso de "Revision" (2da Evaluacion - Junio).
  Es un proceso completamente separado de la Definicion de Metas.
  
  ## Tablas nuevas
  - `june_reviews` - Revision principal por empleado (cabecera)
    - Fecha de revision, comentarios jefe, comentarios colaborador, estado, documento firmado
  - `june_review_goals` - 5 metas individuales a revisar con calificacion y resultados
  - `june_review_competencies` - 5 conductas/habilidades tecnicas con calificacion

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Acceso solo a usuarios autenticados con roles administrativos
*/

CREATE TABLE IF NOT EXISTS june_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  review_code text,
  review_date date,
  department text,
  position text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status = ANY (ARRAY['draft', 'pending_signature', 'completed'])),
  manager_comments text DEFAULT '',
  employee_comments text DEFAULT '',
  signed_document_url text,
  signed_document_filename text,
  signed_document_mime_type text,
  signed_document_uploaded_at timestamptz,
  signed_document_uploaded_by uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS june_review_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES june_reviews(id) ON DELETE CASCADE,
  goal_number integer NOT NULL CHECK (goal_number >= 1 AND goal_number <= 5),
  goal_description text DEFAULT '',
  results_description text DEFAULT '',
  rating text CHECK (rating = ANY (ARRAY['below_expectations', 'needs_improvement', 'meets_expectations', 'exceeds_expectations'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(review_id, goal_number)
);

CREATE TABLE IF NOT EXISTS june_review_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES june_reviews(id) ON DELETE CASCADE,
  competency_number integer NOT NULL CHECK (competency_number >= 1 AND competency_number <= 5),
  competency_description text DEFAULT '',
  rating text CHECK (rating = ANY (ARRAY['below_expectations', 'needs_improvement', 'meets_expectations', 'exceeds_expectations'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(review_id, competency_number)
);

ALTER TABLE june_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE june_review_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE june_review_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select june_reviews"
  ON june_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert june_reviews"
  ON june_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update june_reviews"
  ON june_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can select june_review_goals"
  ON june_review_goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert june_review_goals"
  ON june_review_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update june_review_goals"
  ON june_review_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete june_review_goals"
  ON june_review_goals FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can select june_review_competencies"
  ON june_review_competencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert june_review_competencies"
  ON june_review_competencies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update june_review_competencies"
  ON june_review_competencies FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete june_review_competencies"
  ON june_review_competencies FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_june_reviews_employee_id ON june_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_june_reviews_status ON june_reviews(status);
CREATE INDEX IF NOT EXISTS idx_june_review_goals_review_id ON june_review_goals(review_id);
CREATE INDEX IF NOT EXISTS idx_june_review_competencies_review_id ON june_review_competencies(review_id);
