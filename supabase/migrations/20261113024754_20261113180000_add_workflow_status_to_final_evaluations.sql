ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'draft';
