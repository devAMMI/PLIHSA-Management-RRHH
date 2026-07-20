/*
# Add missing columns to final_administrative_evaluations

## Description
The Final Evaluation form needs three additional columns that were not in the
initial migration:
- time_in_position: text field for "Tiempo en la Posicion"
- manager_name: text field for "Jefe Inmediato" name (denormalized for the PDF)
- overall_comments: text field for general manager comments at the end of the form
- manager_comments: text field (already referenced by form, was missing)

## Security
No RLS policy changes - columns are added to existing table which already has
proper RLS enabled with authenticated CRUD policies.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'final_administrative_evaluations' AND column_name = 'time_in_position') THEN
    ALTER TABLE final_administrative_evaluations ADD COLUMN time_in_position text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'final_administrative_evaluations' AND column_name = 'manager_name') THEN
    ALTER TABLE final_administrative_evaluations ADD COLUMN manager_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'final_administrative_evaluations' AND column_name = 'overall_comments') THEN
    ALTER TABLE final_administrative_evaluations ADD COLUMN overall_comments text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'final_administrative_evaluations' AND column_name = 'manager_comments') THEN
    ALTER TABLE final_administrative_evaluations ADD COLUMN manager_comments text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'final_administrative_evaluations' AND column_name = 'employee_comments') THEN
    ALTER TABLE final_administrative_evaluations ADD COLUMN employee_comments text;
  END IF;
END $$;
