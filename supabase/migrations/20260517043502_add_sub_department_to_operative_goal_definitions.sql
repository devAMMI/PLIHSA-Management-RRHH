/*
  # Add sub_department column to operative_goal_definitions

  - Adds a free-text sub_department column to operative_goal_definitions
    to match the same field already present in goal_definitions (administrative)
  - Nullable, no default, so existing rows remain unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operative_goal_definitions' AND column_name = 'sub_department'
  ) THEN
    ALTER TABLE operative_goal_definitions ADD COLUMN sub_department text;
  END IF;
END $$;
