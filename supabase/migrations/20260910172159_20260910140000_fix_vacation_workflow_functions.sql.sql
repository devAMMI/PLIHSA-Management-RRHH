/*
# Fix vacation request workflow: policies, functions, and balance deduction

1. Security Changes
- SELECT policy on vacation_requests: any reviewer role (superadmin, admin, rrhh, manager, jefe) can see ALL requests in their company, not just their direct subordinates. Employees see only their own.
- This lets the approval panel show pending requests at every stage.

2. Function Changes
- advance_vacation_request: superadmin can approve at ANY stage (override). Other approvers are validated by stage as before.
- On final HR approval, the employee's vacation_balances.used_days are incremented by the request days, distributed across the most recent available balance years.
- New cancel_vacation_request function: employees can cancel their own pending requests.

3. Important Notes
- No existing data is deleted or modified.
- The balance deduction only happens on final approval (pending_hr -> approved), not on intermediate stages.
- If there are not enough total available days across all balance years, the approval still succeeds but deducts what it can.
*/ 

-- Fix SELECT policy: let all reviewer roles see requests in their company
DROP POLICY IF EXISTS "Vacation users view permitted requests" ON public.vacation_requests;
CREATE POLICY "Vacation users view permitted requests" ON public.vacation_requests FOR SELECT TO authenticated
USING (
  employee_id IN (SELECT su.employee_id FROM public.system_users su WHERE su.user_id = auth.uid() AND su.is_active = true)
  OR EXISTS (SELECT 1 FROM public.system_users actor WHERE actor.user_id = auth.uid() AND actor.is_active = true AND actor.role = 'superadmin')
  OR EXISTS (
    SELECT 1 FROM public.system_users actor
    JOIN public.employees requested_employee ON requested_employee.id = vacation_requests.employee_id
    WHERE actor.user_id = auth.uid() AND actor.is_active = true
      AND actor.company_id = requested_employee.company_id
      AND actor.role IN ('admin', 'rrhh', 'manager', 'jefe')
  )
);

-- Fix advance_vacation_request: superadmin override + balance deduction on final approval
CREATE OR REPLACE FUNCTION public.advance_vacation_request(p_request_id uuid, p_decision text, p_notes text DEFAULT NULL)
RETURNS public.vacation_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor public.system_users;
  v_request public.vacation_requests;
  v_employee public.employees;
  v_actor_email text;
  v_remaining_days integer;
  v_balance public.vacation_balances;
  v_days_to_deduct integer;
BEGIN
  SELECT * INTO v_actor FROM public.system_users WHERE user_id = auth.uid() AND is_active = true;
  SELECT * INTO v_request FROM public.vacation_requests WHERE id = p_request_id AND status = 'pending' FOR UPDATE;
  SELECT * INTO v_employee FROM public.employees WHERE id = v_request.employee_id;
  SELECT lower(coalesce(email, '')) INTO v_actor_email FROM public.employees WHERE id = v_actor.employee_id;

  IF v_actor.id IS NULL OR v_request.id IS NULL OR v_employee.id IS NULL THEN
    RAISE EXCEPTION 'Vacation request not available';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid vacation decision';
  END IF;

  -- Superadmin can approve/reject at any stage
  IF v_actor.role <> 'superadmin' THEN
    IF v_request.workflow_stage = 'pending_manager' AND (v_actor.employee_id IS NULL OR v_actor.employee_id <> v_employee.manager_id) THEN
      RAISE EXCEPTION 'Only the direct manager can approve this request';
    END IF;
    IF v_request.workflow_stage = 'pending_general_manager' AND v_actor_email <> 'info@plihsa.com' THEN
      RAISE EXCEPTION 'Only the general manager can approve this request';
    END IF;
    IF v_request.workflow_stage = 'pending_hr' AND v_actor_email NOT IN ('karla.sagastume@plihsa.com', 'jessica.lopez@plihsa.com') THEN
      RAISE EXCEPTION 'Only RRHH can approve this request';
    END IF;
  END IF;

  IF p_decision = 'rejected' THEN
    UPDATE public.vacation_requests
    SET status = 'rejected', workflow_stage = 'rejected', reviewed_by = v_actor.id, reviewed_at = now(),
        review_notes = NULLIF(trim(p_notes), ''), updated_at = now()
    WHERE id = p_request_id RETURNING * INTO v_request;
  ELSIF v_request.workflow_stage = 'pending_manager' THEN
    UPDATE public.vacation_requests
    SET workflow_stage = 'pending_general_manager', manager_approved_by = v_actor.id, manager_approved_at = now(),
        review_notes = NULLIF(trim(p_notes), ''), updated_at = now()
    WHERE id = p_request_id RETURNING * INTO v_request;
  ELSIF v_request.workflow_stage = 'pending_general_manager' THEN
    UPDATE public.vacation_requests
    SET workflow_stage = 'pending_hr', general_manager_approved_by = v_actor.id, general_manager_approved_at = now(),
        review_notes = NULLIF(trim(p_notes), ''), updated_at = now()
    WHERE id = p_request_id RETURNING * INTO v_request;
  ELSE
    -- Final HR approval
    UPDATE public.vacation_requests
    SET status = 'approved', workflow_stage = 'approved', reviewed_by = v_actor.id, reviewed_at = now(),
        hr_approved_by = v_actor.id, hr_approved_at = now(),
        review_notes = NULLIF(trim(p_notes), ''), updated_at = now()
    WHERE id = p_request_id RETURNING * INTO v_request;

    -- Deduct days from vacation_balances, starting from the most recent year with available days
    v_remaining_days := v_request.days;
    FOR v_balance IN
      SELECT * FROM public.vacation_balances
      WHERE employee_id = v_request.employee_id
        AND (total_days - used_days) > 0
      ORDER BY year DESC
    LOOP
      v_days_to_deduct := LEAST(v_remaining_days, v_balance.total_days - v_balance.used_days);
      UPDATE public.vacation_balances
      SET used_days = used_days + v_days_to_deduct, updated_at = now()
      WHERE id = v_balance.id;
      v_remaining_days := v_remaining_days - v_days_to_deduct;
      EXIT WHEN v_remaining_days <= 0;
    END LOOP;
  END IF;

  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_vacation_request(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.advance_vacation_request(uuid, text, text) TO authenticated;

-- New function: employees can cancel their own pending requests
CREATE OR REPLACE FUNCTION public.cancel_vacation_request(p_request_id uuid)
RETURNS public.vacation_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor public.system_users;
  v_request public.vacation_requests;
BEGIN
  SELECT * INTO v_actor FROM public.system_users WHERE user_id = auth.uid() AND is_active = true;
  SELECT * INTO v_request FROM public.vacation_requests
  WHERE id = p_request_id AND status = 'pending' AND employee_id = v_actor.employee_id FOR UPDATE;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Vacation request not available or already processed';
  END IF;

  UPDATE public.vacation_requests
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_request_id RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_vacation_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_vacation_request(uuid) TO authenticated;