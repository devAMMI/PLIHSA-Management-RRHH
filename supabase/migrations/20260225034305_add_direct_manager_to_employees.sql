/*
  # Add Direct Manager to Employees

  1. Changes
    - Add `manager_id` column to `employees` table
    - This creates a self-referential foreign key (employee -> their manager)
    - Allows null for top-level managers (directors, executives)
    - Enables organizational hierarchy tracking

  2. Security
    - No RLS changes needed (inherits from employees table)

  3. Notes
    - Creates a hierarchical structure where each employee reports to one manager
    - Top-level positions (CEO, Directors) will have NULL manager_id
    - Enables queries like "who reports to this manager" and "who is this employee's manager"
*/

-- Add manager_id column to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN manager_id uuid REFERENCES employees(id) ON DELETE SET NULL;
    
    -- Create index for faster manager queries
    CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
    
    -- Add helpful comment
    COMMENT ON COLUMN employees.manager_id IS 'UUID of the direct manager/supervisor. NULL for top-level executives.';
  END IF;
END $$;
