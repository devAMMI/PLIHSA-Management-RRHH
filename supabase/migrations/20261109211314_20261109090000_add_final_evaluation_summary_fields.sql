/*
# Add final evaluation summary and development-plan fields

1. Purpose
- Extend final evaluation forms with the third-page performance summary, development plan, and signature information.

2. New or completed fields
- `employee_summary`, `manager_summary`: performance summaries.
- `development_need_1` through `development_need_3`: development needs.
- `development_action_1` through `development_action_3`: development actions.
- `development_period_1` through `development_period_3`: time periods.
- `development_followup_1` through `development_followup_3`: follow-up details.
- `manager_signature`, `manager_signature_date`: immediate manager signature.
- `employee_signature`, `employee_signature_date`: collaborator signature.
- `hr_signature`, `hr_signature_date`: Human Resources signature.

3. Modified tables
- `final_administrative_evaluations` and `operative_evaluations` receive any fields that were not already present.
- Existing operative signature date fields are preserved and reused where available.

4. Security
- No new tables or policies are created. Existing RLS, grants, and policies continue to protect both evaluation tables.

5. Data safety
- Every addition is nullable and uses `IF NOT EXISTS`. Existing records and existing columns are preserved.
*/

ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS employee_summary text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS manager_summary text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_need_1 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_action_1 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_period_1 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_followup_1 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_need_2 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_action_2 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_period_2 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_followup_2 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_need_3 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_action_3 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_period_3 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS development_followup_3 text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS manager_signature text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS manager_signature_date date;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS employee_signature text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS employee_signature_date date;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS hr_signature text;
ALTER TABLE public.final_administrative_evaluations ADD COLUMN IF NOT EXISTS hr_signature_date date;

ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS employee_summary text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS manager_summary text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_need_1 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_action_1 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_period_1 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_followup_1 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_need_2 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_action_2 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_period_2 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_followup_2 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_need_3 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_action_3 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_period_3 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS development_followup_3 text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS manager_signature text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS employee_signature text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS hr_signature text;
ALTER TABLE public.operative_evaluations ADD COLUMN IF NOT EXISTS hr_signature_date date;