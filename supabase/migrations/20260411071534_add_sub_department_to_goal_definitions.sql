/*
  # Add sub_department column to goal_definitions

  ## Changes
  - Adds `sub_department` (text, nullable) column to the `goal_definitions` table

  ## Purpose
  Allows storing the sub-department name at the time a goal definition is created,
  since not all employees have a sub-department assigned, but when they do (or when
  it's entered manually), the value must be persisted with the record.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_definitions' AND column_name = 'sub_department'
  ) THEN
    ALTER TABLE goal_definitions ADD COLUMN sub_department text;
  END IF;
END $$;
