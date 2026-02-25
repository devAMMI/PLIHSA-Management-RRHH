/*
  # Sistema RRHH Grupo AMMI - Estructura Core

  ## Tablas Principales
  
  ### 1. companies
  - Empresas del grupo AMMI (AMMI, PLIHSA, PTM, MillFoods)
  - Campos: id, nombre, logo_url, código
  
  ### 2. plants
  - Plantas físicas (Corona, Inyección)
  - Relación con companies
  
  ### 3. departments
  - Departamentos por empresa (IT, RRHH, Producción, etc.)
  - Relación con companies
  
  ### 4. employees
  - Información completa de empleados
  - Datos personales, laborales, familiares
  - Relación con companies, plants, departments
  - Clasificación: operativo/administrativo
  
  ### 5. system_users
  - Usuarios con acceso al sistema
  - Relación con auth.users de Supabase
  - Roles y permisos
  
  ### 6. evaluation_types
  - Tipos de evaluación (Definición, Revisión, Final)
  
  ### 7. evaluations
  - Evaluaciones realizadas a empleados
  - Estado de firmas (empleado, jefe, RRHH)
  
  ### 8. evaluation_goals
  - Metas específicas por evaluación
  
  ## Seguridad
  - RLS habilitado en todas las tablas
  - Políticas restrictivas por defecto
*/

-- Tabla de empresas del grupo
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de plantas físicas
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view plants"
  ON plants FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de departamentos
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text NOT NULL UNIQUE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  plant_id uuid REFERENCES plants(id) ON DELETE SET NULL,
  
  -- Datos personales
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  photo_url text,
  gender text,
  
  -- Datos laborales
  employee_type text NOT NULL CHECK (employee_type IN ('operativo', 'administrativo')),
  position text NOT NULL,
  hire_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Contacto
  email text,
  phone text,
  address text,
  city text,
  state text,
  
  -- Educación
  education_level text,
  university text,
  degree text,
  
  -- Información familiar
  marital_status text,
  emergency_contact_name text,
  emergency_contact_phone text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para employees, las actualizaremos después
CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de familiares de empleados
CREATE TABLE IF NOT EXISTS employee_family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  relationship text NOT NULL CHECK (relationship IN ('padre', 'madre', 'hijo', 'hija', 'conyuge', 'otro')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view family members"
  ON employee_family_members FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS system_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'rrhh', 'manager', 'employee', 'viewer')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON system_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all users"
  ON system_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role = 'admin'
    )
  );

-- Ahora agregar política de UPDATE para employees
CREATE POLICY "HR and managers can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "HR and managers can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh')
    )
  );

-- Tabla de tipos de evaluación
CREATE TABLE IF NOT EXISTS evaluation_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  description text,
  period text NOT NULL,
  requires_employee_signature boolean DEFAULT true,
  requires_manager_signature boolean DEFAULT true,
  requires_hr_signature boolean DEFAULT false,
  has_scoring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evaluation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evaluation types"
  ON evaluation_types FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de evaluaciones
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluation_type_id uuid NOT NULL REFERENCES evaluation_types(id) ON DELETE CASCADE,
  year integer NOT NULL,
  
  -- Estado
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_employee', 'pending_manager', 'pending_hr', 'completed', 'cancelled')),
  
  -- Firmas
  employee_signed_at timestamptz,
  employee_signed_by uuid REFERENCES auth.users(id),
  manager_signed_at timestamptz,
  manager_signed_by uuid REFERENCES auth.users(id),
  hr_signed_at timestamptz,
  hr_signed_by uuid REFERENCES auth.users(id),
  
  -- Puntuación (si aplica)
  score numeric(5,2),
  comments text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(employee_id, evaluation_type_id, year)
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      JOIN employees e ON e.id = su.employee_id
      WHERE su.user_id = auth.uid()
      AND e.id = evaluations.employee_id
    )
    OR
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "HR and managers can manage evaluations"
  ON evaluations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
    )
  );

-- Tabla de metas por evaluación
CREATE TABLE IF NOT EXISTS evaluation_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  goal_number integer NOT NULL,
  description text NOT NULL,
  target text,
  weight numeric(5,2),
  achieved_result text,
  score numeric(5,2),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_id, goal_number)
);

ALTER TABLE evaluation_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goals based on evaluation access"
  ON evaluation_goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      JOIN system_users su ON su.employee_id = (SELECT employee_id FROM evaluations WHERE id = e.id)
      WHERE e.id = evaluation_goals.evaluation_id
      AND su.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "HR and managers can manage goals"
  ON evaluation_goals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
    )
  );

-- Insertar datos iniciales de empresas
INSERT INTO companies (name, code, logo_url) VALUES
  ('AMMI', 'AMMI', 'https://i.imgur.com/F0RKq8C.png'),
  ('PLIHSA', 'PLIHSA', 'https://plihsa.com/wp-content/uploads/2023/02/Plihsa_Logo_Azul.svg'),
  ('PTM', 'PTM', 'https://i.imgur.com/FpiAvCx.png'),
  ('MillFoods', 'MILLFOODS', 'https://i.imgur.com/kAzFS5n.png')
ON CONFLICT (code) DO NOTHING;

-- Insertar plantas de PLIHSA
INSERT INTO plants (company_id, name, location)
SELECT 
  (SELECT id FROM companies WHERE code = 'PLIHSA'),
  'Planta Corona',
  'Corona'
WHERE NOT EXISTS (
  SELECT 1 FROM plants WHERE name = 'Planta Corona'
);

INSERT INTO plants (company_id, name, location)
SELECT 
  (SELECT id FROM companies WHERE code = 'PLIHSA'),
  'Planta Inyección',
  'Inyección'
WHERE NOT EXISTS (
  SELECT 1 FROM plants WHERE name = 'Planta Inyección'
);

-- Insertar tipos de evaluación
INSERT INTO evaluation_types (name, code, description, period, requires_hr_signature, has_scoring) VALUES
  ('Definición de Metas', 'DEF_METAS', 'Definición de metas anuales', 'Enero - Febrero', false, false),
  ('Revisión de Metas', 'REV_METAS', 'Revisión intermedia de metas', 'Junio - Julio', true, true),
  ('Evaluación Final', 'EVAL_FINAL', 'Evaluación anual final', 'Diciembre', true, true)
ON CONFLICT (code) DO NOTHING;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_plant ON employees(plant_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_year ON evaluations(year);
CREATE INDEX IF NOT EXISTS idx_system_users_user_id ON system_users(user_id);
CREATE INDEX IF NOT EXISTS idx_system_users_employee_id ON system_users(employee_id);