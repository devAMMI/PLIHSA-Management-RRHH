/*
# Add staged vacation approvals

1. New Columns on vacation_requests
- `requested_by`: system user who submitted the request.
- `workflow_stage`: pending_manager, pending_general_manager, pending_hr, approved, or rejected.
- `manager_approved_by`, `manager_approved_at`: direct manager decision audit.
- `general_manager_approved_by`, `general_manager_approved_at`: Roberto Moya decision audit.
- `hr_approved_by`, `hr_approved_at`: Karla Sagastume or Jessica Lopez decision audit.

2. New Secure Functions
- `create_vacation_request`: records the requester from the authenticated session.
- `advance_vacation_request`: enforces the order: direct manager, Roberto Moya, then RRHH.

3. Security
- Direct inserts and updates are revoked from authenticated clients.
- Employees can submit only for their own employee record through the secure function.
- Each approver is checked server-side by employee relationship or approved HR identity.
- Existing vacation data is preserved; pending legacy rows are placed at the manager stage.

4. Important Notes
- A rejection can happen at the current stage and records the responsible approver.
- Final approval records the RRHH approver and completion timestamp.
*/

ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES public.system_users(id) ON DELETE SET NULL;
ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS workflow_stage text NOT NULL DEFAULT 'pending_manager';
ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS manager_approved_by uuid REFERENCES public.system_users(id) ON DELETE SET NULL;
ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS manager_approved_at timestamptz;
ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS general_manager_approved_by uuid REFERENCES public.system_users(id) ON DELETE SET NULL;
ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS general_manager_approved_at timestamptz;
ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS hr_approved_by uuid REFERENCES public.system_users(id) ON DELETE SET NULL;
ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS hr_approved_at timestamptz;

ALTER TABLE public.vacation_requests DROP CONSTRAINT IF EXISTS vacation_requests_workflow_stage_check;
ALTER TABLE public.vacation_requests ADD CONSTRAINT vacation_requests_workflow_stage_check CHECK (workflow_stage IN ('pending_manager', 'pending_general_manager', 'pending_hr', 'approved', 'rejected'));

UPDATE public.vacation_requests SET workflow_stage = CASE WHEN status = 'approved' THEN 'approved' WHEN status IN ('rejected', 'cancelled') THEN 'rejected' ELSE 'pending_manager' END WHERE workflow_stage IS NULL OR workflow_stage = '';

DROP POLICY IF EXISTS "Vacation users view permitted requests" ON public.vacation_requests;
CREATE POLICY "Vacation users view permitted requests" ON public.vacation_requests FOR SELECT TO authenticated
USING (
  employee_id IN (SELECT su.employee_id FROM public.system_users su WHERE su.user_id = auth.uid() AND su.is_active = true)
  OR EXISTS (SELECT 1 FROM public.system_users actor WHERE actor.user_id = auth.uid() AND actor.is_active = true AND actor.role = 'superadmin')
  OR EXISTS (
    SELECT 1 FROM public.system_users actor
    JOIN public.employees requested_employee ON requested_employee.id = vacation_requests.employee_id
    WHERE actor.user_id = auth.uid() AND actor.is_active = true AND actor.company_id = requested_employee.company_id
      AND (actor.employee_id = requested_employee.manager_id OR lower(coalesce((SELECT email FROM public.employees WHERE id = actor.employee_id), '')) = 'info@plihsa.com' OR lower(coalesce((SELECT email FROM public.employees WHERE id = actor.employee_id), '')) IN ('karla.sagastume@plihsa.com', 'jessica.lopez@plihsa.com'))
  )
);

DROP POLICY IF EXISTS "Employees insert own vacation requests" ON public.vacation_requests;
CREATE POLICY "Employees insert own vacation requests" ON public.vacation_requests FOR INSERT TO authenticated WITH CHECK (false);
REVOKE INSERT, UPDATE ON public.vacation_requests FROM authenticated;

CREATE OR REPLACE FUNCTION public.create_vacation_request(p_start_date date, p_end_date date, p_days integer, p_reason text DEFAULT NULL)
RETURNS public.vacation_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_actor public.system_users; v_request public.vacation_requests;
BEGIN
  SELECT * INTO v_actor FROM public.system_users WHERE user_id = auth.uid() AND is_active = true;
  IF v_actor.id IS NULL OR v_actor.employee_id IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date < p_start_date OR p_days <> (p_end_date - p_start_date + 1) OR p_days < 1 OR p_days > 365 THEN RAISE EXCEPTION 'Invalid vacation period'; END IF;
  INSERT INTO public.vacation_requests (employee_id, requested_by, start_date, end_date, days, reason, status, workflow_stage)
  VALUES (v_actor.employee_id, v_actor.id, p_start_date, p_end_date, p_days, NULLIF(trim(p_reason), ''), 'pending', 'pending_manager')
  RETURNING * INTO v_request;
  RETURN v_request;
END;
$$;

CREATE OR REPLACE FUNCTION public.advance_vacation_request(p_request_id uuid, p_decision text, p_notes text DEFAULT NULL)
RETURNS public.vacation_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_actor public.system_users; v_request public.vacation_requests; v_employee public.employees; v_actor_email text;
BEGIN
  SELECT * INTO v_actor FROM public.system_users WHERE user_id = auth.uid() AND is_active = true;
  SELECT * INTO v_request FROM public.vacation_requests WHERE id = p_request_id AND status = 'pending' FOR UPDATE;
  SELECT * INTO v_employee FROM public.employees WHERE id = v_request.employee_id;
  SELECT lower(coalesce(email, '')) INTO v_actor_email FROM public.employees WHERE id = v_actor.employee_id;
  IF v_actor.id IS NULL OR v_request.id IS NULL OR v_employee.id IS NULL THEN RAISE EXCEPTION 'Vacation request not available'; END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid vacation decision'; END IF;
  IF v_request.workflow_stage = 'pending_manager' AND (v_actor.employee_id IS NULL OR v_actor.employee_id <> v_employee.manager_id) THEN RAISE EXCEPTION 'Only the direct manager can approve this request'; END IF;
  IF v_request.workflow_stage = 'pending_general_manager' AND v_actor_email <> 'info@plihsa.com' THEN RAISE EXCEPTION 'Only the general manager can approve this request'; END IF;
  IF v_request.workflow_stage = 'pending_hr' AND v_actor_email NOT IN ('karla.sagastume@plihsa.com', 'jessica.lopez@plihsa.com') THEN RAISE EXCEPTION 'Only RRHH can approve this request'; END IF;

  IF p_decision = 'rejected' THEN
    UPDATE public.vacation_requests SET status = 'rejected', workflow_stage = 'rejected', reviewed_by = v_actor.id, reviewed_at = now(), review_notes = NULLIF(trim(p_notes), ''), updated_at = now() WHERE id = p_request_id RETURNING * INTO v_request;
  ELSIF v_request.workflow_stage = 'pending_manager' THEN
    UPDATE public.vacation_requests SET workflow_stage = 'pending_general_manager', manager_approved_by = v_actor.id, manager_approved_at = now(), review_notes = NULLIF(trim(p_notes), ''), updated_at = now() WHERE id = p_request_id RETURNING * INTO v_request;
  ELSIF v_request.workflow_stage = 'pending_general_manager' THEN
    UPDATE public.vacation_requests SET workflow_stage = 'pending_hr', general_manager_approved_by = v_actor.id, general_manager_approved_at = now(), review_notes = NULLIF(trim(p_notes), ''), updated_at = now() WHERE id = p_request_id RETURNING * INTO v_request;
  ELSE
    UPDATE public.vacation_requests SET status = 'approved', workflow_stage = 'approved', reviewed_by = v_actor.id, reviewed_at = now(), hr_approved_by = v_actor.id, hr_approved_at = now(), review_notes = NULLIF(trim(p_notes), ''), updated_at = now() WHERE id = p_request_id RETURNING * INTO v_request;
  END IF;
  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.create_vacation_request(date, date, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.advance_vacation_request(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_vacation_request(date, date, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_vacation_request(uuid, text, text) TO authenticated;
